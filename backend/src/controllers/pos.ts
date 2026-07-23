import { Request, Response } from 'express';
import mongoose from 'mongoose';
import InvoiceCounter from '../models/InvoiceCounter';

type AuthenticatedRequest = Request & { userId?: string; userRole?: string };

const buildOrderNumber = (): string => {
  const timestamp = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `POS-${timestamp}-${random}`;
};

const resolveProductLookup = async (productId: string): Promise<any> => {
  const productsColl = mongoose.connection.collection('products');
  const normalizedProductId = mongoose.Types.ObjectId.isValid(String(productId))
    ? new mongoose.Types.ObjectId(String(productId))
    : String(productId);
  return productsColl.findOne({ _id: normalizedProductId } as any).catch(() => null);
};

const normalizeHeldSaleItems = async (items: any[] = []) => {
  return Promise.all(
    items.map(async (item: any) => {
      const productId = item.product || item.productId;
      const quantity = Number(item.quantity || 1);
      const price = Number(item.price || 0);
      const product = productId ? await resolveProductLookup(productId) : null;
      const productName = product?.name || item.name || 'Product';
      const productSku = product?.sku || item.sku || '';
      return {
        productId: String(productId || ''),
        product: productId ? String(productId) : '',
        quantity,
        price,
        subtotal: Number(item.subtotal || quantity * price),
        name: productName,
        productData: product
          ? {
              _id: product._id?.toString?.() || product._id,
              name: product.name,
              sku: product.sku,
              quantity: product.quantity,
              price: product.price,
              discountPrice: product.discountPrice,
              thumbnail: product.thumbnail || product.image || product.images?.[0]?.url || '/placeholder.jpg',
            }
          : undefined,
        sku: productSku,
      };
    })
  );
};

export const createPOSOrder = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const body = req.body || {};
    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) {
      return res.status(400).json({ success: false, message: 'Items are required' });
    }

    const ordersColl = mongoose.connection.collection('orders');
    const productsColl = mongoose.connection.collection('products');
    const normalizedItems = await normalizeHeldSaleItems(items);

    const productIds = normalizedItems
      .map((item) => item.productId)
      .filter(Boolean)
      .filter((id, index, arr) => arr.indexOf(id) === index)
      .map((id) => (mongoose.Types.ObjectId.isValid(String(id)) ? new mongoose.Types.ObjectId(String(id)) : null))
      .filter(Boolean) as mongoose.Types.ObjectId[];

    if (productIds.length) {
      const products = await productsColl.find({ _id: { $in: productIds } }).toArray();
      const productMap = new Map(products.map((product: any) => [product._id.toString(), product]));

      for (const item of normalizedItems) {
        if (!item.productId) continue;
        const product = productMap.get(String(item.productId));
        if (!product) {
          return res.status(400).json({ success: false, message: `Product not found: ${item.name || item.productId}` });
        }
        if (item.quantity > Number(product.quantity || 0)) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${item.name || product.name}: requested ${item.quantity}, available ${product.quantity}`,
          });
        }
      }
    }

    const subtotal = normalizedItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
    const discountAmount = Number(body.discountAmount || 0);
    const total = Math.max(0, subtotal - discountAmount);
    const paymentMethod = String(body.paymentMethod || 'cash').toLowerCase();
    const tenderedAmount = paymentMethod === 'cash' ? Number(body.tenderedAmount || 0) : 0;
    const changeDue = Math.max(0, tenderedAmount - total);
    const orderNumber = buildOrderNumber();
    const counterDoc = await InvoiceCounter.findOneAndUpdate(
      { key: 'pos-bills' },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );
    const sequenceValue = Number(counterDoc?.value || 1);
    const invoiceNumber = `BILL-${String(sequenceValue).padStart(4, '0')}`;

    const orderDoc = {
      orderNumber,
      invoiceNumber,
      userId,
      user: {
        _id: body.customerId || userId,
        id: body.customerId || userId,
        name: String(body.customerName || 'Walk-in Customer'),
        email: body.customerEmail || '',
        phone: String(body.customerPhone || ''),
      },
      items: normalizedItems,
      subtotal,
      discountAmount,
      taxAmount: 0,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === 'cash' ? 'paid' : 'pending',
      orderStatus: 'completed',
      status: 'completed',
      tenderedAmount,
      changeDue,
      channel: 'pos',
      notes: body.notes || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await ordersColl.insertOne(orderDoc as any);

    const productsColl = mongoose.connection.collection('products');
    await Promise.all(
      normalizedItems.map(async (item) => {
        if (!item.productId || item.quantity <= 0) return;
        const filter = mongoose.Types.ObjectId.isValid(item.productId)
          ? { _id: new mongoose.Types.ObjectId(item.productId) }
          : { _id: item.productId };
        await productsColl.updateOne(filter as any, { $inc: { quantity: -item.quantity } });
      })
    );

    return res.status(201).json({ success: true, message: 'POS order created successfully', data: { ...orderDoc, _id: result.insertedId } });
  } catch (error: any) {
    console.error('createPOSOrder error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Failed to create POS order' });
  }
};

export const getDailySalesReport = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const ordersColl = mongoose.connection.collection('orders');
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const [orders, totalRevenue] = await Promise.all([
      ordersColl.find({ createdAt: { $gte: startOfDay } }).toArray(),
      ordersColl.aggregate([{ $match: { createdAt: { $gte: startOfDay } } }, { $group: { _id: null, total: { $sum: '$total' } } }]).toArray(),
    ]);
    return res.status(200).json({ success: true, data: { orders: orders.length, totalRevenue: Number(totalRevenue[0]?.total || 0) } });
  } catch (error: any) {
    console.error('getDailySalesReport error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to load daily sales report' });
  }
};

export const getSalesSummary = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const ordersColl = mongoose.connection.collection('orders');
    const [overview] = await ordersColl.aggregate([
      { $group: { _id: null, count: { $sum: 1 }, totalSales: { $sum: '$total' } } },
    ]).toArray();
    return res.status(200).json({ success: true, data: { count: overview?.count || 0, totalSales: Number(overview?.totalSales || 0) } });
  } catch (error: any) {
    console.error('getSalesSummary error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to load sales summary' });
  }
};

export const createHeldSale = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const body = req.body || {};
    const heldSalesColl = mongoose.connection.collection('heldsales');
    const normalizedItems = await normalizeHeldSaleItems(Array.isArray(body.items) ? body.items : []);
    const saleDoc = {
      label: body.label || `Held Sale - ${new Date().toLocaleTimeString()}`,
      items: normalizedItems,
      subtotal: Number(body.subtotal || 0),
      discountAmount: Number(body.discountAmount || 0),
      total: Math.max(0, Number(body.subtotal || 0) - Number(body.discountAmount || 0)),
      customerName: body.customerName || 'Walk-in',
      customerId: body.customerId || '',
      notes: body.notes || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await heldSalesColl.insertOne(saleDoc as any);
    return res.status(201).json({ success: true, message: 'Held sale saved', data: { ...saleDoc, _id: result.insertedId } });
  } catch (error: any) {
    console.error('createHeldSale error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Failed to save held sale' });
  }
};

export const getHeldSales = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const heldSalesColl = mongoose.connection.collection('heldsales');
    const heldSales = await heldSalesColl.find({}).sort({ createdAt: -1 }).toArray();
    return res.status(200).json({ success: true, data: heldSales });
  } catch (error: any) {
    console.error('getHeldSales error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to load held sales' });
  }
};

export const getHeldSale = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const heldSalesColl = mongoose.connection.collection('heldsales');
    const heldSale = await heldSalesColl.findOne({ _id: new mongoose.Types.ObjectId(String(id)) } as any);
    if (!heldSale) {
      return res.status(404).json({ success: false, message: 'Held sale not found' });
    }
    return res.status(200).json({ success: true, data: heldSale });
  } catch (error: any) {
    console.error('getHeldSale error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to load held sale' });
  }
};

export const deleteHeldSale = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const heldSalesColl = mongoose.connection.collection('heldsales');
    await heldSalesColl.deleteOne({ _id: new mongoose.Types.ObjectId(String(id)) } as any);
    return res.status(200).json({ success: true, message: 'Held sale removed' });
  } catch (error: any) {
    console.error('deleteHeldSale error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete held sale' });
  }
};

export const startTillSession = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const tillsColl = mongoose.connection.collection('tills');
    const doc = {
      userId: req.userId,
      startingCash: Number(req.body?.startingCash || 0),
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await tillsColl.insertOne(doc as any);
    return res.status(201).json({ success: true, message: 'Till session started', data: { ...doc, _id: result.insertedId } });
  } catch (error: any) {
    console.error('startTillSession error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Failed to start till session' });
  }
};

export const closeTillSession = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const tillsColl = mongoose.connection.collection('tills');
    const result = await tillsColl.updateOne({ _id: new mongoose.Types.ObjectId(String(id)) } as any, { $set: { countedCash: Number(req.body?.countedCash || 0), status: 'closed', updatedAt: new Date() } });
    if (!result.modifiedCount) {
      return res.status(404).json({ success: false, message: 'Till session not found' });
    }
    return res.status(200).json({ success: true, message: 'Till session closed' });
  } catch (error: any) {
    console.error('closeTillSession error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to close till session' });
  }
};

export const getTillHistory = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const tillsColl = mongoose.connection.collection('tills');
    const tills = await tillsColl.find({}).sort({ createdAt: -1 }).toArray();
    return res.status(200).json({ success: true, data: tills });
  } catch (error: any) {
    console.error('getTillHistory error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to load till history' });
  }
};

export default {
  createPOSOrder,
  getDailySalesReport,
  getSalesSummary,
  createHeldSale,
  getHeldSales,
  getHeldSale,
  deleteHeldSale,
  startTillSession,
  closeTillSession,
  getTillHistory,
};
