import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { buildBrandEmailTemplate, sendEmail } from '../utils/email';
import { getEffectiveProductPrice } from '../utils/pricing';

const resolveProductLookup = async (productId: string): Promise<any> => {
  const productsColl = mongoose.connection.collection('products');
  const normalizedProductId = mongoose.Types.ObjectId.isValid(String(productId))
    ? new mongoose.Types.ObjectId(String(productId))
    : String(productId);
  return productsColl.findOne({ _id: normalizedProductId } as any).catch(() => null);
};

const normalizeOrderItem = async (item: any): Promise<any> => {
  const quantity = Number(item.quantity || 1);
  const price = Number(item.price || 0);
  const rawProductId = item.product || item.productId;

  if (!rawProductId) {
    return {
      product: '',
      productId: '',
      quantity,
      price,
      subtotal: quantity * price,
      name: item.name || 'Product',
    };
  }

  const product = await resolveProductLookup(rawProductId);
  if (!product) {
    return {
      product: String(rawProductId),
      productId: String(rawProductId),
      quantity,
      price,
      subtotal: quantity * price,
      name: item.name || 'Product',
    };
  }

  const resolvedPrice = getEffectiveProductPrice({
    price: product.price,
    discountPrice: product.discountPrice,
    onSale: product.onSale,
    saleStart: product.saleStart,
    saleEnd: product.saleEnd,
  });
  return {
    product: String(rawProductId),
    productId: String(rawProductId),
    quantity,
    price: resolvedPrice,
    subtotal: quantity * resolvedPrice,
    name: product.name || item.name || 'Product',
    productData: {
      _id: product._id?.toString?.() || product._id,
      name: product.name,
      description: product.description,
      thumbnail: product.thumbnail || product.image || product.images?.[0]?.url || '/placeholder.jpg',
      images: Array.isArray(product.images) ? product.images : [],
      sku: product.sku,
      price: product.price,
      discountPrice: product.discountPrice,
    },
  };
};

type AuthenticatedRequest = Request & { userId?: string; userRole?: string };

export const shouldRestoreCancelledStock = (order: any): boolean => {
  if (!order || order.isDeleted) return false;
  const status = String(order.status || order.orderStatus || '').toLowerCase();
  return status !== 'cancelled';
};

export const restoreOrderStock = async (orderItems: any[] = []): Promise<void> => {
  const productsColl = mongoose.connection.collection('products');
  await Promise.all(
    (orderItems || []).map(async (item: any) => {
      if (!item?.productId || Number(item.quantity || 0) <= 0) return;
      const productId = String(item.productId);
      const filter = mongoose.Types.ObjectId.isValid(productId)
        ? { _id: new mongoose.Types.ObjectId(productId) }
        : { _id: productId };
      await productsColl.updateOne(filter as any, { $inc: { quantity: Number(item.quantity || 0) } });
    })
  );
};

const buildOrderNumber = (): string => {
  const timestamp = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

const buildOrderEmailContent = (order: any, variant: 'customer' | 'admin' = 'customer'): { html: string; text: string } => {
  const shipping = order.shippingAddress || {};
  const customerName = shipping.name || order.user?.name || 'Customer';
  const customerEmail = shipping.email || order.user?.email || '';
  const customerPhone = shipping.phone || order.user?.phone || '';
  const addressLine = [shipping.address || shipping.street || '', [shipping.city, shipping.state, shipping.postalCode || shipping.zipCode, shipping.country].filter(Boolean).join(', ')].filter(Boolean).join('<br/>');

  const itemRows = (order.items || [])
    .map((item: any) => {
      const quantity = Number(item.quantity || 1);
      const price = Number(item.price || 0);
      const subtotal = Number(item.subtotal || quantity * price);
      const sku = item.sku || item.product?.sku || '';
      const productId = item.productId || item.product || '';
      return `<li style="margin-bottom:12px;padding:10px 12px;border:1px solid #e5e7eb;border-radius:10px;background:#fafafa;"><div><strong>${item.name || 'Product'}</strong></div><div>Qty: ${quantity} &nbsp;•&nbsp; Price: Rs. ${price.toFixed(2)} &nbsp;•&nbsp; Subtotal: Rs. ${subtotal.toFixed(2)}</div>${sku ? `<div>SKU: ${sku}</div>` : ''}${productId ? `<div>Product ID: ${productId}</div>` : ''}</li>`;
    })
    .join('');

  const bodyHtml = `
    <div style="font-size:15px;line-height:1.7;color:#374151;">
      <p><strong>Order number:</strong> ${order.orderNumber}</p>
      <p><strong>Customer name:</strong> ${customerName}</p>
      <p><strong>Email:</strong> ${customerEmail}</p>
      <p><strong>Phone:</strong> ${customerPhone}</p>
      <div style="margin:16px 0;padding:12px 14px;border:1px solid #e5e7eb;border-radius:10px;background:#f9fafb;">
        <strong>Shipping address</strong><br/>
        ${addressLine || 'Not provided'}
      </div>
      <div style="margin-top:16px;">
        <strong>Ordered items</strong>
        <ul style="padding-left:18px;margin:8px 0 0;">${itemRows}</ul>
      </div>
      <p style="margin-top:16px;font-weight:700;">Subtotal: Rs. ${Number(order.subtotal || 0).toFixed(2)}</p>
      <p>Delivery charge: Rs. ${Number(order.deliveryCharge || order.shippingCost || 0).toFixed(2)}</p>
      <p style="font-weight:700;">Total: Rs. ${Number(order.total || 0).toFixed(2)}</p>
      <p style="margin-top:12px;">Payment method: Cash on Delivery</p>
      <p>Please pay in cash when your order is delivered.</p>
      <p style="margin-top:12px;">Order channel: ${order.channel || 'web'}</p>
      ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
    </div>`;

  const bodyText = [
    `Order number: ${order.orderNumber}`,
    `Customer name: ${customerName}`,
    `Email: ${customerEmail}`,
    `Phone: ${customerPhone}`,
    `Shipping address: ${addressLine || 'Not provided'}`,
    'Ordered items:',
    ...(order.items || []).map((item: any) => {
      const quantity = Number(item.quantity || 1);
      const price = Number(item.price || 0);
      const subtotal = Number(item.subtotal || quantity * price);
      const sku = item.sku || item.product?.sku || '';
      const productId = item.productId || item.product || '';
      return [
        `${item.name || 'Product'} x${quantity}`,
        `Price: Rs. ${price.toFixed(2)}`,
        `Subtotal: Rs. ${subtotal.toFixed(2)}`,
        sku ? `SKU: ${sku}` : '',
        productId ? `Product ID: ${productId}` : '',
      ].filter(Boolean).join(' | ');
    }),
    `Subtotal: Rs. ${Number(order.subtotal || 0).toFixed(2)}`,
    `Delivery charge: Rs. ${Number(order.deliveryCharge || order.shippingCost || 0).toFixed(2)}`,
    `Total: Rs. ${Number(order.total || 0).toFixed(2)}`,
    'Payment method: Cash on Delivery',
    'Please pay in cash when your order is delivered.',
    `Order channel: ${order.channel || 'web'}`,
    order.notes ? `Notes: ${order.notes}` : '',
  ].filter(Boolean).join('\n');

  const isAdmin = variant === 'admin';

  return buildBrandEmailTemplate({
    title: isAdmin ? `New Order Received - ${order.orderNumber}` : `Order Confirmed - ${order.orderNumber}`,
    greeting: isAdmin ? 'Hello Admin,' : `Hello ${customerName},`,
    intro: isAdmin
      ? `We have received a new order from ${customerName}. Please review the details below and contact the customer if needed.`
      : 'We have received your order and it is being processed.',
    bodyHtml,
    bodyText,
    footerNote: isAdmin
      ? 'Please follow up with the customer and update the order status in the admin panel as needed.'
      : 'Thanks for choosing Mokshya Foods. We will keep you updated on your order status.',
  });
};

const sendOrderNotifications = async (order: any): Promise<void> => {
  const adminRecipients = Array.from(
    new Set(
      [process.env.ADMIN_EMAIL, process.env.EMAIL_USER, process.env.EMAIL_FROM, 'mokshyafoods@gmail.com'].filter((value): value is string => Boolean(value))
    )
  );
  const customerRecipients = Array.from(
    new Set(
      [order.user?.email, order.shippingAddress?.email].filter((value): value is string => Boolean(value))
    )
  );

  const replyTo = process.env.REPLY_TO || process.env.EMAIL_FROM || process.env.EMAIL_USER || 'support@mokshyafoods.com';
  const adminEmailContent = buildOrderEmailContent(order, 'admin');
  const customerEmailContent = buildOrderEmailContent(order, 'customer');

  if (adminRecipients.length) {
    await sendEmail({
      to: adminRecipients,
      subject: `New Order Received - ${order.orderNumber}`,
      html: adminEmailContent.html,
      text: adminEmailContent.text,
      replyTo,
    });
  }

  if (customerRecipients.length) {
    await sendEmail({
      to: customerRecipients,
      subject: `Order Confirmation - ${order.orderNumber}`,
      html: customerEmailContent.html,
      text: customerEmailContent.text,
      replyTo,
    });
  }
};

const buildOrderStatusEmailContent = (order: any, previousStatus: string, nextStatus: string): { html: string; text: string } => {
  const shipping = order.shippingAddress || {};
  const customerName = shipping.name || order.user?.name || 'Customer';
  const customerEmail = shipping.email || order.user?.email || '';
  const statusLabel = String(nextStatus || 'Pending').replace(/\b\w/g, (char) => char.toUpperCase());
  const previousLabel = String(previousStatus || 'Pending').replace(/\b\w/g, (char) => char.toUpperCase());
  const bodyHtml = `
    <div style="font-size:15px;line-height:1.7;color:#374151;">
      <p><strong>Order number:</strong> ${order.orderNumber}</p>
      <p><strong>Customer:</strong> ${customerName}</p>
      <p><strong>Email:</strong> ${customerEmail}</p>
      <p style="margin-top:12px;">Your order status has been updated from <strong>${previousLabel}</strong> to <strong>${statusLabel}</strong>.</p>
      <p style="margin-top:12px;">You can continue to track your order in your account dashboard.</p>
    </div>`;
  const bodyText = `Order number: ${order.orderNumber}\nCustomer: ${customerName}\nEmail: ${customerEmail}\nYour order status has been updated from ${previousLabel} to ${statusLabel}. You can continue to track your order in your account dashboard.`;

  return buildBrandEmailTemplate({
    title: `Order Update - ${order.orderNumber}`,
    greeting: `Hello ${customerName},`,
    intro: `Your order status has been updated from ${previousLabel} to ${statusLabel}.`,
    bodyHtml,
    bodyText,
    footerNote: 'Thanks for shopping with Mokshya Foods. We will keep you updated on your order progress.',
  });
};

const sendOrderStatusNotification = async (order: any, previousStatus: string, nextStatus: string): Promise<void> => {
  const customerRecipients = Array.from(
    new Set([order.user?.email, order.shippingAddress?.email].filter((value): value is string => Boolean(value)))
  );
  const replyTo = process.env.REPLY_TO || process.env.EMAIL_FROM || process.env.EMAIL_USER || 'support@mokshyafoods.com';
  const content = buildOrderStatusEmailContent(order, previousStatus, nextStatus);

  if (customerRecipients.length) {
    await sendEmail({
      to: customerRecipients,
      subject: `Order Update - ${order.orderNumber}`,
      html: content.html,
      text: content.text,
      replyTo,
    });
  }
};

export const createOrder = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const userId = req.userId;
    const body = req.body || {};
    const items = Array.isArray(body.items) ? body.items : [];
    const shippingAddress = body.shippingAddress || {};
    const deliveryZone = String(body.deliveryZone || shippingAddress.deliveryZone || shippingAddress.location || 'inside-butwal').trim().toLowerCase();
    const shippingCharge = Number(body.deliveryCharge ?? body.shippingCost ?? (deliveryZone === 'outside-butwal' ? 100 : 0));

    if (!items.length) {
      return res.status(400).json({ success: false, message: 'Items are required' });
    }

    if (!shippingAddress || typeof shippingAddress !== 'object') {
      return res.status(400).json({ success: false, message: 'Shipping address is required' });
    }

    if (!shippingAddress.name || !shippingAddress.phone || !(shippingAddress.street || shippingAddress.address)) {
      return res.status(400).json({ success: false, message: 'Please provide your full name, phone number, and delivery address' });
    }

    const normalizedPaymentMethod = String(body.paymentMethod || 'cod').trim().toLowerCase();
    if (!['cod', 'cash'].includes(normalizedPaymentMethod)) {
      return res.status(400).json({ success: false, message: 'Only cash on delivery is available' });
    }

    const ordersColl = mongoose.connection.collection('orders');
    const productsColl = mongoose.connection.collection('products');
    const normalizedItems = await Promise.all(items.map((item: any) => normalizeOrderItem(item)));

    const productIds = normalizedItems
      .map((item) => item.productId)
      .filter(Boolean)
      .filter((id, index, arr) => arr.indexOf(id) === index)
      .map((id) => (mongoose.Types.ObjectId.isValid(String(id)) ? new mongoose.Types.ObjectId(String(id)) : null))
      .filter(Boolean) as mongoose.Types.ObjectId[];

    const productMap = new Map<string, any>();
    if (productIds.length) {
      const products = await productsColl.find({ _id: { $in: productIds }, isActive: { $ne: false } }).toArray();
      products.forEach((product: any) => productMap.set(product._id.toString(), product));
    }

    const trustedItems: any[] = [];
    for (const item of normalizedItems) {
      if (!item.productId) {
        return res.status(400).json({ success: false, message: 'Each item must include a valid product reference' });
      }

      const product = productMap.get(String(item.productId));
      if (!product) {
        return res.status(400).json({ success: false, message: `Product not found: ${item.name || item.productId}` });
      }

      const requestedQuantity = Number(item.quantity || 0);
      const availableQuantity = Number(product.quantity || 0);
      if (requestedQuantity < 1) {
        return res.status(400).json({ success: false, message: `Quantity must be at least 1 for ${item.name || product.name}` });
      }
      if (requestedQuantity > availableQuantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${item.name || product.name}: requested ${requestedQuantity}, available ${availableQuantity}` });
      }

      const trustedPrice = getEffectiveProductPrice({
        price: product.price,
        discountPrice: product.discountPrice,
        onSale: product.onSale,
        saleStart: product.saleStart,
        saleEnd: product.saleEnd,
      });
      const trustedSubtotal = requestedQuantity * trustedPrice;
      trustedItems.push({
        ...item,
        price: trustedPrice,
        subtotal: trustedSubtotal,
        name: product.name || item.name || 'Product',
        productData: {
          _id: product._id?.toString?.() || product._id,
          name: product.name,
          description: product.description,
          thumbnail: product.thumbnail || product.image || product.images?.[0]?.url || '/placeholder.jpg',
          images: Array.isArray(product.images) ? product.images : [],
          sku: product.sku,
          price: product.price,
          discountPrice: product.discountPrice,
        },
      });
    }

    const subtotal = trustedItems.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
    const deliveryCharge = Number.isFinite(shippingCharge) ? shippingCharge : (deliveryZone === 'outside-butwal' ? 100 : 0);
    const total = subtotal + deliveryCharge;
    const orderNumber = buildOrderNumber();
    const getZoneName = (zone: string) => (zone === 'outside-butwal' ? 'Outside Butwal' : 'Inside Butwal');
    const guestShippingAddress = {
      ...shippingAddress,
      name: shippingAddress.name || '',
      email: shippingAddress.email || '',
      phone: shippingAddress.phone || '',
      street: shippingAddress.street || shippingAddress.address || '',
      address: shippingAddress.address || shippingAddress.street || '',
      city: shippingAddress.city || getZoneName(deliveryZone),
      state: shippingAddress.state || getZoneName(deliveryZone),
      country: shippingAddress.country || 'Nepal',
      location: deliveryZone,
      deliveryZone,
    };

    const orderDoc = {
      orderNumber,
      customer: userId || null,
      userId: userId || null,
      user: {
        _id: userId || null,
        id: userId || null,
        name: shippingAddress.name || '',
        email: shippingAddress.email || '',
        phone: shippingAddress.phone || '',
      },
      items: trustedItems,
      shippingAddress: guestShippingAddress,
      paymentMethod: normalizedPaymentMethod,
      paymentStatus: 'pending',
      couponCode: body.couponCode || '',
      notes: body.notes || '',
      channel: body.channel || 'web',
      subtotal,
      deliveryCharge,
      shippingCost: deliveryCharge,
      deliveryZone,
      total,
      status: 'pending',
      orderStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await ordersColl.insertOne(orderDoc);
    const persistedOrder = { ...orderDoc, _id: result.insertedId };

    try {
      await sendOrderNotifications(persistedOrder);
    } catch (emailError: any) {
      console.error('Order notification email failed:', emailError?.message || emailError);
    }

    try {
      await Promise.all(
        trustedItems.map(async (item) => {
          if (!item.productId || item.quantity <= 0) return;
          const filter = mongoose.Types.ObjectId.isValid(item.productId)
            ? { _id: new mongoose.Types.ObjectId(item.productId) }
            : { _id: item.productId };
          await productsColl.updateOne(filter as any, { $inc: { quantity: -item.quantity } });
        })
      );
    } catch (decrErr: any) {
      console.error('Failed to decrement product stock after order creation:', decrErr?.message || decrErr);
    }

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: persistedOrder,
    });
  } catch (error: any) {
    console.error('createOrder error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Failed to create order' });
  }
};

export const getAllOrders = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const status = req.query.status ? String(req.query.status).toLowerCase() : undefined;
    const transactionType = req.query.transactionType ? String(req.query.transactionType).trim() : undefined;
    const soldBy = req.query.soldBy ? String(req.query.soldBy).trim() : undefined;
    const search = req.query.search ? String(req.query.search).trim() : undefined;

    const ordersColl = mongoose.connection.collection('orders');
    const filter: any = { isDeleted: { $ne: true } };
    if (status && status !== 'all') filter.$or = [{ status }, { orderStatus: status }];
    if (transactionType && transactionType !== 'all') {
      if (transactionType === 'customer_sale') {
        filter.$or = [
          ...(filter.$or || []),
          { transactionType: 'customer_sale' },
          { transactionType: { $exists: false } },
        ];
      } else {
        filter.transactionType = transactionType;
      }
    }
    if (soldBy && soldBy !== 'all') filter.soldBy = soldBy;
    if (search) {
      const s = new RegExp(search, 'i');
      filter.$or = [
        ...(filter.$or || []),
        { orderNumber: { $regex: s } },
        { 'shippingAddress.name': { $regex: s } },
        { 'shippingAddress.phone': { $regex: s } },
        { 'user.email': { $regex: s } },
        { soldBy: { $regex: s } },
        { transactionType: { $regex: s } },
      ];
    }

    const total = await ordersColl.countDocuments(filter);
    const orders = await ordersColl.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).allowDiskUse(true).toArray();

    return res.json({ success: true, message: 'Orders loaded', data: orders, pagination: { page, limit, total } });
  } catch (error: any) {
    console.error('getAllOrders error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to load orders' });
  }
};

export const getUserOrders = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const userId = String(req.userId || '');
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const ordersColl = mongoose.connection.collection('orders');

    const orders = await ordersColl
      .find({
        isDeleted: { $ne: true },
        $or: [{ 'user._id': userId }, { 'user.id': userId }, { userId }, { user: userId }],
      })
      .sort({ createdAt: -1 })
      .allowDiskUse(true)
      .toArray();

    return res.json({ success: true, message: 'User orders loaded', data: orders });
  } catch (error: any) {
    console.error('getUserOrders error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to load user orders' });
  }
};

export const getOrderById = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) return res.status(400).json({ success: false, message: 'Order id required' });
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }
    const userId = req.userId;
    const userRole = String(req.userRole || '').trim().toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'superadmin' || userRole === 'administrator' || userRole.includes('admin');
    const ordersColl = mongoose.connection.collection('orders');
    const order = await ordersColl.findOne({ _id: new mongoose.Types.ObjectId(id) });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const orderOwnerId = order.userId || order.user?.id || order.user?._id || '';
    const isOwner = Boolean(userId && (orderOwnerId === userId || order.user?._id === userId || order.user?.id === userId));

    if (!isAdmin && !isOwner && userId) {
      return res.status(403).json({ success: false, message: 'You do not have access to this order' });
    }

    if (Array.isArray(order.items)) {
      const hydratedItems = await Promise.all(order.items.map((item: any) => normalizeOrderItem(item)));
      order.items = hydratedItems;
    }
    return res.json({ success: true, message: 'Order loaded', data: order });
  } catch (error: any) {
    console.error('getOrderById error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to load order' });
  }
};

export const deleteOrder = async (req: Request & { userId?: string; userRole?: string }, res: Response): Promise<Response> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) return res.status(400).json({ success: false, message: 'Order id required' });
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }

    const userRole = String(req.userRole || '').trim().toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'superadmin' || userRole === 'administrator' || userRole.includes('admin');
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'You do not have permission to delete this order' });
    }

    const ordersColl = mongoose.connection.collection('orders');
    const existingOrder = await ordersColl.findOne({ _id: new mongoose.Types.ObjectId(id) });
    if (!existingOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const shouldRestoreStock = shouldRestoreCancelledStock(existingOrder);
    if (shouldRestoreStock) {
      await restoreOrderStock(Array.isArray(existingOrder.items) ? existingOrder.items : []);
    }

    const softDeleted = await ordersColl.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          status: 'cancelled',
          orderStatus: 'cancelled',
          updatedAt: new Date(),
        },
      }
    );

    if (softDeleted.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    return res.json({ success: true, message: 'Order deleted successfully', data: { id } });
  } catch (error: any) {
    console.error('deleteOrder error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete order' });
  }
};

export const updateOrderStatus = async (req: Request & { userId?: string; userRole?: string }, res: Response): Promise<Response> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const update = req.body || {};
    if (!id) return res.status(400).json({ success: false, message: 'Order id required' });

    const ordersColl = mongoose.connection.collection('orders');
    const existingOrder = await ordersColl.findOne({ _id: new mongoose.Types.ObjectId(id) });
    if (!existingOrder) return res.status(404).json({ success: false, message: 'Order not found' });

    const userId = req.userId;
    const userRole = String(req.userRole || '').trim().toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'superadmin' || userRole === 'administrator' || userRole.includes('admin');
    const orderOwnerId = String(existingOrder.userId || existingOrder.user?.id || existingOrder.user?._id || '');
    const isOwner = Boolean(userId && orderOwnerId && orderOwnerId === userId);

    const requestedStatus = update.orderStatus || update.status;
    const normalizedRequestedStatus = requestedStatus ? String(requestedStatus).toLowerCase() : undefined;

    if (!isAdmin) {
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'You do not have permission to update this order' });
      }
      if (normalizedRequestedStatus !== 'cancelled') {
        return res.status(403).json({ success: false, message: 'Only admin can update order status other than cancellation' });
      }
    }

    const previousStatus = String(existingOrder.orderStatus || existingOrder.status || 'pending').toLowerCase();
    const nextStatus = normalizedRequestedStatus ? normalizedRequestedStatus : previousStatus;
    const wasAlreadyCancelled = previousStatus === 'cancelled' || existingOrder.isDeleted;
    const updatePayload: Record<string, any> = { updatedAt: new Date() };

    if (nextStatus === 'cancelled' && !wasAlreadyCancelled) {
      await restoreOrderStock(Array.isArray(existingOrder.items) ? existingOrder.items : []);
    }

    if (isAdmin) {
      const allowedAdminFields = ['orderStatus', 'status', 'paymentStatus', 'trackingInfo', 'soldBy', 'staffNote', 'cancelReason', 'isCashCollected'];
      for (const key of allowedAdminFields) {
        if (key in update) {
          updatePayload[key] = update[key];
        }
      }
      if (normalizedRequestedStatus) {
        updatePayload.orderStatus = nextStatus;
        updatePayload.status = nextStatus;
      }
      if (nextStatus === 'cancelled') {
        updatePayload.cancelReason = String(update.cancelReason || update.reason || 'Cancelled by user');
        updatePayload.cancelledAt = new Date();
      }
    } else {
      if (normalizedRequestedStatus === 'cancelled') {
        updatePayload.orderStatus = 'cancelled';
        updatePayload.status = 'cancelled';
        updatePayload.cancelReason = String(update.cancelReason || update.reason || 'Cancelled by user');
        updatePayload.cancelledAt = new Date();
        updatePayload.paymentStatus = 'cancelled';
      }
    }

    const result = await ordersColl.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: updatePayload },
      { returnDocument: 'after' as any }
    );
    const updatedOrder = (result as any)?.value ?? result;
    if (!updatedOrder) return res.status(404).json({ success: false, message: 'Order not found' });

    try {
      if (nextStatus === 'cancelled') {
        await sendOrderCancellationNotificationToAdmin(updatedOrder, updatePayload.cancelReason);
      } else {
        await sendOrderStatusNotification(updatedOrder, previousStatus, nextStatus);
      }
    } catch (emailError: any) {
      console.error('Order email notification failed:', emailError?.message || emailError);
    }

    return res.json({ success: true, message: 'Order updated', data: updatedOrder });
  } catch (error: any) {
    console.error('updateOrderStatus error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update order' });
  }
};

const sendOrderCancellationNotificationToAdmin = async (order: any, cancelReason: string): Promise<void> => {
  const adminRecipients = Array.from(
    new Set(
      [process.env.ADMIN_EMAIL, process.env.EMAIL_USER, process.env.EMAIL_FROM].filter((value): value is string => Boolean(value))
    )
  );
  if (!adminRecipients.length) return;

  const subject = `Order Cancelled - ${order.orderNumber}`;
  const customerName = order.shippingAddress?.name || order.user?.name || 'Customer';
  const customerEmail = order.shippingAddress?.email || order.user?.email || 'N/A';
  const itemsHtml = Array.isArray(order.items)
    ? order.items.map((item: any) => `<li>${item.name || 'Product'} x${item.quantity || 1} - Rs. ${Number(item.price || 0).toFixed(2)}</li>`).join('')
    : '';

  const { html, text } = buildBrandEmailTemplate({
    title: `Order Cancelled - ${order.orderNumber}`,
    greeting: 'Hello Admin,',
    intro: `Order ${order.orderNumber} has been cancelled by the customer.`,
    bodyHtml: `
      <div style="font-size:15px;line-height:1.7;color:#374151;">
        <p><strong>Order number:</strong> ${order.orderNumber}</p>
        <p><strong>Customer:</strong> ${customerName}</p>
        <p><strong>Customer email:</strong> ${customerEmail}</p>
        <p><strong>Cancellation reason:</strong> ${cancelReason}</p>
        <p><strong>Order total:</strong> Rs. ${Number(order.total || 0).toFixed(2)}</p>
        <p><strong>Payment status:</strong> ${order.paymentStatus || 'pending'}</p>
        <div><strong>Items:</strong><ul>${itemsHtml}</ul></div>
      </div>
    `,
    bodyText: `Order ${order.orderNumber} has been cancelled by the customer.
Order total: Rs. ${Number(order.total || 0).toFixed(2)}
Payment status: ${order.paymentStatus || 'pending'}
Cancellation reason: ${cancelReason}`,
    footerNote: 'Please review the cancelled order and follow up with the customer if needed.',
  });

  await sendEmail({
    to: adminRecipients,
    subject,
    html,
    text,
    replyTo: process.env.REPLY_TO || process.env.EMAIL_FROM || process.env.EMAIL_USER || 'support@mokshyafoods.com',
  });
};

export default {
  createOrder,
  getAllOrders,
  getUserOrders,
  getOrderById,
  deleteOrder,
  updateOrderStatus,
};
