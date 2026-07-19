import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { buildBrandEmailTemplate, sendEmail } from '../utils/email';

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

  const resolvedPrice = Number(item.price ?? product.discountPrice ?? product.price ?? 0);
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
      <p style="margin-top:16px;font-weight:700;">Total: Rs. ${Number(order.total || 0).toFixed(2)}</p>
      <p style="margin-top:12px;">Payment method: ${order.paymentMethod || 'N/A'}</p>
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
    `Total: Rs. ${Number(order.total || 0).toFixed(2)}`,
    `Payment method: ${order.paymentMethod || 'N/A'}`,
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
      [process.env.ADMIN_EMAIL, process.env.EMAIL_USER, process.env.EMAIL_FROM].filter((value): value is string => Boolean(value))
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
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const body = req.body || {};
    const items = Array.isArray(body.items) ? body.items : [];
    const shippingAddress = body.shippingAddress;

    if (!items.length) {
      return res.status(400).json({ success: false, message: 'Items are required' });
    }

    if (!shippingAddress || typeof shippingAddress !== 'object') {
      return res.status(400).json({ success: false, message: 'Shipping address is required' });
    }

    if (!body.paymentMethod) {
      return res.status(400).json({ success: false, message: 'Payment method is required' });
    }

    const ordersColl = mongoose.connection.collection('orders');

    const normalizedItems = await Promise.all(items.map((item: any) => normalizeOrderItem(item)));

    const total = normalizedItems.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
    const orderNumber = buildOrderNumber();

    const orderDoc = {
      orderNumber,
      userId,
      user: {
        _id: userId,
        id: userId,
        name: shippingAddress.name || '',
        email: shippingAddress.email || '',
        phone: shippingAddress.phone || '',
      },
      items: normalizedItems,
      shippingAddress,
      paymentMethod: body.paymentMethod,
      couponCode: body.couponCode || '',
      notes: body.notes || '',
      channel: body.channel || 'web',
      status: 'pending',
      paymentStatus: 'pending',
      total,
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
    const search = req.query.search ? String(req.query.search).trim() : undefined;

    const ordersColl = mongoose.connection.collection('orders');
    const filter: any = {};
    if (status && status !== 'all') filter.$or = [{ status }, { orderStatus: status }];
    if (search) {
      const s = new RegExp(search, 'i');
      filter.$or = [
        ...(filter.$or || []),
        { orderNumber: { $regex: s } },
        { 'shippingAddress.name': { $regex: s } },
        { 'shippingAddress.phone': { $regex: s } },
        { 'user.email': { $regex: s } },
      ];
    }

    const total = await ordersColl.countDocuments(filter);
    const orders = await ordersColl.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();

    return res.json({ success: true, message: 'Orders loaded', data: orders, pagination: { page, limit, total } });
  } catch (error: any) {
    console.error('getAllOrders error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to load orders' });
  }
};

export const getUserOrders = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const userId = String(req.userId || req.params.id || req.query.userId || '');
    const ordersColl = mongoose.connection.collection('orders');

    if (!userId) {
      return res.json({ success: true, message: 'User orders loaded', data: [] });
    }

    const orders = await ordersColl
      .find({
        $or: [{ 'user._id': userId }, { 'user.id': userId }, { userId }, { user: userId }],
      })
      .sort({ createdAt: -1 })
      .toArray();

    return res.json({ success: true, message: 'User orders loaded', data: orders });
  } catch (error: any) {
    console.error('getUserOrders error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to load user orders' });
  }
};

export const getOrderById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) return res.status(400).json({ success: false, message: 'Order id required' });
    const ordersColl = mongoose.connection.collection('orders');
    const order = await ordersColl.findOne({ _id: new mongoose.Types.ObjectId(id) });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
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

export const updateOrderStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const update = req.body || {};
    if (!id) return res.status(400).json({ success: false, message: 'Order id required' });
    const ordersColl = mongoose.connection.collection('orders');
    const existingOrder = await ordersColl.findOne({ _id: new mongoose.Types.ObjectId(id) });
    if (!existingOrder) return res.status(404).json({ success: false, message: 'Order not found' });

    const previousStatus = String(existingOrder.orderStatus || existingOrder.status || 'pending').toLowerCase();
    const nextStatusInput = update.orderStatus || update.status;
    const nextStatus = nextStatusInput ? String(nextStatusInput).toLowerCase() : previousStatus;
    const updatePayload: Record<string, any> = { ...update, updatedAt: new Date() };
    if (nextStatusInput) {
      updatePayload.orderStatus = nextStatus;
      updatePayload.status = nextStatus;
    }

    const result = await ordersColl.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: updatePayload },
      { returnDocument: 'after' as any }
    );
    const updatedOrder = (result as any)?.value ?? result;
    if (!updatedOrder) return res.status(404).json({ success: false, message: 'Order not found' });

    try {
      await sendOrderStatusNotification(updatedOrder, previousStatus, nextStatus);
    } catch (emailError: any) {
      console.error('Order status notification email failed:', emailError?.message || emailError);
    }

    return res.json({ success: true, message: 'Order updated', data: updatedOrder });
  } catch (error: any) {
    console.error('updateOrderStatus error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update order' });
  }
};

export default {
  createOrder,
  getAllOrders,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
};
