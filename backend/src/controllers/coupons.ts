import { Request, Response } from 'express';
import mongoose from 'mongoose';

const collectionName = 'coupons';
const getCouponsCollection = () => mongoose.connection.collection(collectionName);

const normalizeCode = (code: string): string => String(code || '').trim().toUpperCase();

export const validateCoupon = async (req: Request, res: Response): Promise<Response> => {
  try {
    const code = normalizeCode(String(req.body.code || ''));
    const orderTotal = Number(req.body.orderTotal || 0);

    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const coupon = await getCouponsCollection().findOne({ code, isActive: { $ne: false } });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found or inactive' });
    }

    const now = new Date();
    if (coupon.expiryDate && new Date(coupon.expiryDate) < now) {
      return res.status(400).json({ success: false, message: 'Coupon has expired' });
    }

    if (coupon.minOrderAmount && orderTotal < Number(coupon.minOrderAmount || 0)) {
      return res.status(400).json({ success: false, message: `Coupon requires a minimum order total of Rs. ${Number(coupon.minOrderAmount).toFixed(2)}` });
    }

    const discountValue = Number(coupon.discountValue || 0);
    const discountType = String(coupon.discountType || 'fixed');
    const subtotal = Number(orderTotal || 0);
    let discountAmount = 0;

    if (discountType === 'percentage') {
      discountAmount = Math.min((subtotal * discountValue) / 100, Number(coupon.maxDiscount || subtotal));
    } else {
      discountAmount = discountValue;
    }
    discountAmount = Math.max(0, discountAmount);

    return res.json({
      success: true,
      message: 'Coupon is valid',
      data: {
        code: coupon.code,
        discountType,
        discountValue,
        maxDiscount: Number(coupon.maxDiscount || 0),
        discountAmount,
        expiryDate: coupon.expiryDate,
        minOrderAmount: coupon.minOrderAmount,
      },
    });
  } catch (error: any) {
    console.error('validateCoupon error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to validate coupon' });
  }
};

export const getAllCoupons = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const coupons = await getCouponsCollection().find({}).sort({ createdAt: -1 }).toArray();
    return res.json({ success: true, message: 'Coupons loaded', data: coupons });
  } catch (error: any) {
    console.error('getAllCoupons error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to load coupons' });
  }
};

export const createCoupon = async (req: Request, res: Response): Promise<Response> => {
  try {
    const body = req.body || {};
    const code = normalizeCode(String(body.code || ''));
    const discountType = String(body.discountType || 'fixed').toLowerCase();
    const discountValue = Number(body.discountValue || 0);

    if (!code || !discountType || Number.isNaN(discountValue)) {
      return res.status(400).json({ success: false, message: 'Coupon code, discount type, and discount value are required' });
    }

    const existing = await getCouponsCollection().findOne({ code });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Coupon code already exists' });
    }

    const now = new Date();
    const coupon = {
      code,
      discountType,
      discountValue,
      minOrderAmount: body.minOrderAmount != null ? Number(body.minOrderAmount) : 0,
      maxDiscount: body.maxDiscount != null ? Number(body.maxDiscount) : 0,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
      isActive: body.isActive !== false,
      createdAt: now,
      updatedAt: now,
    };

    const result = await getCouponsCollection().insertOne(coupon);
    return res.status(201).json({ success: true, message: 'Coupon created', data: { ...coupon, _id: result.insertedId } });
  } catch (error: any) {
    console.error('createCoupon error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create coupon' });
  }
};

export const updateCoupon = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = String(req.params.id || '').trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Valid coupon ID is required' });
    }

    const body = req.body || {};
    const update: any = {};
    if (body.code) update.code = normalizeCode(String(body.code));
    if (body.discountType) update.discountType = String(body.discountType).toLowerCase();
    if (body.discountValue !== undefined) update.discountValue = Number(body.discountValue);
    if (body.minOrderAmount !== undefined) update.minOrderAmount = Number(body.minOrderAmount);
    if (body.maxDiscount !== undefined) update.maxDiscount = Number(body.maxDiscount);
    if (body.expiryDate !== undefined) update.expiryDate = body.expiryDate ? new Date(body.expiryDate) : undefined;
    if (body.isActive !== undefined) update.isActive = Boolean(body.isActive);

    update.updatedAt = new Date();

    const result = await getCouponsCollection().findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: update },
      { returnDocument: 'after' as any }
    );

    const updatedCoupon = (result as any)?.value;
    if (!updatedCoupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    return res.json({ success: true, message: 'Coupon updated', data: updatedCoupon });
  } catch (error: any) {
    console.error('updateCoupon error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update coupon' });
  }
};

export const deleteCoupon = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = String(req.params.id || '').trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Valid coupon ID is required' });
    }

    const result = await getCouponsCollection().deleteOne({ _id: new mongoose.Types.ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    return res.json({ success: true, message: 'Coupon deleted' });
  } catch (error: any) {
    console.error('deleteCoupon error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete coupon' });
  }
};

export default {
  validateCoupon,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};
