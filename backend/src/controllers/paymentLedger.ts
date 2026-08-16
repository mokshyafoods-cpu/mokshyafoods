import { Request, Response } from 'express';
import mongoose from 'mongoose';

type AuthenticatedRequest = Request & { userId?: string; userRole?: string };

const normalizeString = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (value == null) return '';
  return String(value).trim();
};

const normalizeLedgerPaymentMethod = (value: unknown): string => {
  const raw = normalizeString(value || 'cash').toLowerCase();
  if (!raw || raw === 'cash4' || raw === 'cash') return 'cash';
  if (raw.includes('phonepay')) return 'phonepay';
  if (raw === 'cod') return 'cod';
  return raw;
};

const buildAddressString = (shippingAddress: any): string => {
  if (!shippingAddress || typeof shippingAddress !== 'object') return '';
  return [
    shippingAddress.street || shippingAddress.address || '',
    shippingAddress.city || '',
    shippingAddress.state || '',
    shippingAddress.country || '',
    shippingAddress.postalCode || shippingAddress.zipCode || '',
  ].filter(Boolean).join(', ');
};

const buildOrderLedgerEntry = (order: any) => {
  const shipping = order.shippingAddress || {};
  const customerName = normalizeString(shipping.name || order.user?.name || order.customerName || 'Walk-in Customer');
  const customerPhone = normalizeString(shipping.phone || order.user?.phone || order.customerPhone || '');
  const address = buildAddressString(shipping);
  const soldBy = normalizeString(order.soldBy || '');
  const orderNotes = normalizeString(order.notes || '');
  const remarks = soldBy ? (orderNotes ? `${soldBy} - ${orderNotes}` : soldBy) : (orderNotes || '');
  const items = Array.isArray(order.items) ? order.items : [];
  const productSummary = items.map((item: any) => {
    const itemName = normalizeString(item.name || 'Product');
    const qty = Number(item.quantity || 0);
    return `${itemName} x${qty}`;
  });

  return {
    _id: order._id,
    orderId: String(order._id || order.orderId || ''),
    orderNumber: normalizeString(order.orderNumber || order.invoiceNumber || ''),
    customerName,
    customerContact: customerPhone,
    address,
    products: productSummary.join(', '),
    amount: Number(order.total || order.amount || 0),
    paymentMethod: normalizeLedgerPaymentMethod(order.paymentMethod || order.paymentStatus || 'cash'),
    paymentDate: normalizeString(order.createdAt ? new Date(order.createdAt).toISOString().slice(0, 10) : order.paymentDate || ''),
    notes: remarks,
    soldBy,
    items,
    createdAt: order.createdAt || new Date(),
    shippingAddress: shipping,
    user: order.user || null,
  };
};

export const getAllPaymentLedger = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search ? normalizeString(req.query.search) : '';
    const fromDate = req.query.fromDate ? normalizeString(req.query.fromDate) : '';
    const toDate = req.query.toDate ? normalizeString(req.query.toDate) : '';

    const ordersColl = mongoose.connection.collection('orders');
    const filter: Record<string, any> = {
      isDeleted: { $ne: true },
      $or: [
        { status: { $nin: ['cancelled', 'failed', 'returned'] } },
        { orderStatus: { $nin: ['cancelled', 'failed', 'returned'] } },
      ],
      $nor: [
        { paymentStatus: 'cancelled' },
        { paymentStatus: 'failed' },
        { status: 'cancelled' },
        { orderStatus: 'cancelled' },
      ],
    };

    if (fromDate || toDate) {
      const dateFilter: Record<string, any> = {};
      if (fromDate) dateFilter.$gte = new Date(`${fromDate}T00:00:00.000Z`);
      if (toDate) dateFilter.$lte = new Date(`${toDate}T23:59:59.999Z`);
      filter.createdAt = dateFilter;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$and = [
        {
          $or: [
            { orderNumber: regex },
            { 'shippingAddress.name': regex },
            { 'user.name': regex },
            { 'shippingAddress.phone': regex },
            { soldBy: regex },
            { notes: regex },
          ],
        },
      ];
    }

    const total = await ordersColl.countDocuments(filter);
    const orderRows = await ordersColl.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();
    const entries = orderRows.map(buildOrderLedgerEntry);

    return res.json({
      success: true,
      message: 'Payment ledger entries loaded',
      data: entries,
      pagination: { page, limit, total },
    });
  } catch (error: any) {
    console.error('getAllPaymentLedger error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to load payment ledger' });
  }
};

export const getPaymentLedgerByOrderId = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const orderId = normalizeString(req.params.orderId || req.query.orderId || '');
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order id required' });
    }

    const ordersColl = mongoose.connection.collection('orders');
    const order = await ordersColl.findOne({ _id: new mongoose.Types.ObjectId(orderId), isDeleted: { $ne: true } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Ledger entry not found' });
    }

    return res.json({ success: true, message: 'Payment ledger entry loaded', data: buildOrderLedgerEntry(order) });
  } catch (error: any) {
    console.error('getPaymentLedgerByOrderId error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to load payment ledger entry' });
  }
};

export const createOrUpdatePaymentLedger = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const payload = req.body || {};
    const orderId = normalizeString(payload.orderId || payload.order?.id || payload.order?._id || '');
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order id is required' });
    }

    const ledgerColl = mongoose.connection.collection('paymentLedger');
    const baseDoc = {
      orderId,
      orderNumber: normalizeString(payload.orderNumber),
      customerName: normalizeString(payload.customerName),
      customerContact: normalizeString(payload.customerContact),
      products: normalizeString(payload.products),
      amount: Number(payload.amount || 0),
      paymentMethod: normalizeLedgerPaymentMethod(payload.paymentMethod || 'cash'),
      paymentDate: normalizeString(payload.paymentDate || new Date().toISOString().slice(0, 10)),
      notes: normalizeString(payload.notes),
      updatedAt: new Date(),
    };

    const existingEntry = await ledgerColl.findOne({ orderId });

    if (existingEntry) {
      const result = await ledgerColl.findOneAndUpdate(
        { _id: existingEntry._id },
        { $set: { ...baseDoc, createdAt: existingEntry.createdAt || new Date() } },
        { returnDocument: 'after' as any }
      );
      const updatedEntry = (result as any)?.value ?? result;
      return res.status(200).json({ success: true, message: 'Payment ledger entry updated', data: updatedEntry });
    }

    const doc = { ...baseDoc, createdAt: new Date() };
    const insertResult = await ledgerColl.insertOne(doc);
    const createdEntry = await ledgerColl.findOne({ _id: insertResult.insertedId });

    return res.status(201).json({ success: true, message: 'Payment ledger entry created', data: createdEntry });
  } catch (error: any) {
    console.error('createOrUpdatePaymentLedger error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to save payment ledger entry' });
  }
};

export const updatePaymentLedger = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) return res.status(400).json({ success: false, message: 'Ledger id required' });

    const ledgerColl = mongoose.connection.collection('paymentLedger');
    const existingEntry = await ledgerColl.findOne({ _id: new mongoose.Types.ObjectId(id) });
    if (!existingEntry) return res.status(404).json({ success: false, message: 'Ledger entry not found' });

    const payload = req.body || {};
    const updateDoc = {
      orderNumber: normalizeString(payload.orderNumber ?? existingEntry.orderNumber),
      customerName: normalizeString(payload.customerName ?? existingEntry.customerName),
      customerContact: normalizeString(payload.customerContact ?? existingEntry.customerContact),
      products: normalizeString(payload.products ?? existingEntry.products),
      amount: Number(payload.amount ?? existingEntry.amount ?? 0),
      paymentMethod: normalizeLedgerPaymentMethod(payload.paymentMethod ?? (existingEntry.paymentMethod || 'cash')),
      paymentDate: normalizeString(payload.paymentDate ?? (existingEntry.paymentDate || new Date().toISOString().slice(0, 10))),
      notes: normalizeString(payload.notes ?? existingEntry.notes),
      updatedAt: new Date(),
    };

    const result = await ledgerColl.findOneAndUpdate({ _id: existingEntry._id }, { $set: updateDoc }, { returnDocument: 'after' as any });
    const updatedEntry = (result as any)?.value ?? result;

    return res.json({ success: true, message: 'Ledger entry updated', data: updatedEntry });
  } catch (error: any) {
    console.error('updatePaymentLedger error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update payment ledger entry' });
  }
};

export const deletePaymentLedger = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) return res.status(400).json({ success: false, message: 'Ledger id required' });

    const ledgerColl = mongoose.connection.collection('paymentLedger');
    const result = await ledgerColl.deleteOne({ _id: new mongoose.Types.ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Ledger entry not found' });
    }

    return res.json({ success: true, message: 'Ledger entry deleted' });
  } catch (error: any) {
    console.error('deletePaymentLedger error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete payment ledger entry' });
  }
};

export default {
  getAllPaymentLedger,
  getPaymentLedgerByOrderId,
  createOrUpdatePaymentLedger,
  updatePaymentLedger,
  deletePaymentLedger,
};
