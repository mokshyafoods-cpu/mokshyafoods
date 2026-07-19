import { Request, Response } from 'express';
import mongoose from 'mongoose';

type AuthenticatedRequest = Request & { userId?: string; userRole?: string };

const normalizeString = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (value == null) return '';
  return String(value).trim();
};

export const getAllPaymentLedger = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search ? normalizeString(req.query.search) : '';

    const ledgerColl = mongoose.connection.collection('paymentLedger');
    const filter: Record<string, any> = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { orderNumber: regex },
        { customerName: regex },
        { customerContact: regex },
        { products: regex },
        { paymentMethod: regex },
        { notes: regex },
      ];
    }

    const total = await ledgerColl.countDocuments(filter);
    const entries = await ledgerColl.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();

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

    const ledgerColl = mongoose.connection.collection('paymentLedger');
    const entry = await ledgerColl.findOne({ orderId });
    return res.json({ success: true, message: 'Payment ledger entry loaded', data: entry });
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
      paymentMethod: normalizeString(payload.paymentMethod || 'cash'),
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

    const doc = {
      ...baseDoc,
      createdAt: new Date(),
    };
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
      paymentMethod: normalizeString(payload.paymentMethod ?? (existingEntry.paymentMethod || 'cash')),
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

export default {
  getAllPaymentLedger,
  getPaymentLedgerByOrderId,
  createOrUpdatePaymentLedger,
  updatePaymentLedger,
};
