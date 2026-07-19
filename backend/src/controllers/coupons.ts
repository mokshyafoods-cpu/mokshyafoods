import { Request, Response } from 'express';

export const validateCoupon = async (_req: Request, res: Response): Promise<Response> => {
  return res.status(501).json({ success: false, message: 'Coupon validation is not implemented yet' });
};

export const getAllCoupons = async (_req: Request, res: Response): Promise<Response> => {
  return res.status(501).json({ success: false, message: 'Coupons listing is not implemented yet' });
};

export const createCoupon = async (_req: Request, res: Response): Promise<Response> => {
  return res.status(501).json({ success: false, message: 'Coupon creation is not implemented yet' });
};

export const updateCoupon = async (_req: Request, res: Response): Promise<Response> => {
  return res.status(501).json({ success: false, message: 'Coupon update is not implemented yet' });
};

export const deleteCoupon = async (_req: Request, res: Response): Promise<Response> => {
  return res.status(501).json({ success: false, message: 'Coupon deletion is not implemented yet' });
};

export default {
  validateCoupon,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};
