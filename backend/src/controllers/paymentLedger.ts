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
  if (raw.includes('fonepay') || raw.includes('phonepay')) return 'fonepay';
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

const findExistingLedgerEntry = async (ledgerColl: any, orderId: string) => {
  const normalizedOrderId = normalizeString(orderId);
  const candidates = [normalizedOrderId];
  if (normalizedOrderId) {
    candidates.push(String(normalizedOrderId).replace(/^ObjectId\("|"\)$/g, ''));
  }

  const filters = [
    { orderId: normalizedOrderId },
    { orderId: { $in: candidates } },
    { $or: [{ orderId: normalizedOrderId }, { orderId: { $in: candidates } }] },
  ];

  for (const filter of filters) {
    const existingEntry = await ledgerColl.findOne(filter);
    if (existingEntry) return existingEntry;
  }

  return null;
};

const buildLedgerLookupFilters = (id: string) => {
  const normalized = normalizeString(id);
  if (!normalized) {
    return { _id: new mongoose.Types.ObjectId('000000000000000000000000') };
  }

  const objectId = mongoose.Types.ObjectId.isValid(normalized) ? new mongoose.Types.ObjectId(normalized) : null;
  return {
    $or: [
      ...(objectId ? [{ _id: objectId }] : []),
      { orderId: normalized },
      { orderId: { $in: [normalized, objectId?.toString()] } },
    ],
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

    const ledgerColl = mongoose.connection.collection('paymentLedger');
    const filter: Record<string, any> = {};

    if (fromDate || toDate) {
      const dateFilter: Record<string, any> = {};
      if (fromDate) dateFilter.$gte = new Date(`${fromDate}T00:00:00.000Z`);
      if (toDate) dateFilter.$lte = new Date(`${toDate}T23:59:59.999Z`);
      filter.paymentDate = dateFilter;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { orderNumber: regex },
        { customerName: regex },
        { customerContact: regex },
        { products: regex },
        { notes: regex },
      ];
    }

    const total = await ledgerColl.countDocuments(filter);
    const ledgerRows = await ledgerColl.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();

    return res.json({
      success: true,
      message: 'Payment ledger entries loaded',
      data: ledgerRows,
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

    const ledgerColl = mongoose.connection.collection('paymentLedger');
    const savedEntry = await ledgerColl.findOne(buildLedgerLookupFilters(orderId));
    if (!savedEntry) {
      return res.status(404).json({ success: false, message: 'Ledger entry not found' });
    }

    return res.json({ success: true, message: 'Payment ledger entry loaded', data: savedEntry });
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
    const items = Array.isArray(payload.items) ? payload.items : Array.isArray(payload.order?.items) ? payload.order.items : [];
    const productSummary = Array.isArray(items)
      ? items
          .map((item: any) => {
            const itemName = normalizeString(item?.name || item?.productData?.name || item?.productName || 'Product');
            const qty = Number(item?.quantity || 0);
            return qty > 0 ? `${itemName} x${qty}` : itemName;
          })
          .filter(Boolean)
          .join(', ')
      : normalizeString(payload.products);

    const baseDoc = {
      orderId,
      orderNumber: normalizeString(payload.orderNumber),
      customerName: normalizeString(payload.customerName),
      customerContact: normalizeString(payload.customerContact),
      address: normalizeString(payload.address),
      products: normalizeString(productSummary || payload.products),
      amount: Number(payload.amount || 0),
      paymentMethod: normalizeLedgerPaymentMethod(payload.paymentMethod || 'cash'),
      paymentDate: normalizeString(payload.paymentDate || new Date().toISOString().slice(0, 10)),
      notes: normalizeString(payload.notes),
      soldBy: normalizeString(payload.soldBy),
      items,
      updatedAt: new Date(),
    };

    const existingEntry = await findExistingLedgerEntry(ledgerColl, orderId);

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
    const existingEntry = await ledgerColl.findOne(buildLedgerLookupFilters(id));
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
    const existingEntry = await ledgerColl.findOne(buildLedgerLookupFilters(id));
    if (!existingEntry) {
      return res.json({ success: true, message: 'Ledger entry already deleted or not found' });
    }

    const result = await ledgerColl.deleteOne({ _id: existingEntry._id });
    if (result.deletedCount === 0) {
      return res.json({ success: true, message: 'Ledger entry already deleted or not found' });
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
