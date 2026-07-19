import { Request, Response } from 'express';

export const initiateESewaPayment = async (_req: Request, res: Response): Promise<Response> => {
  return res.status(501).json({ success: false, message: 'eSewa payment initiation is not implemented yet' });
};

export const verifyESewaPayment = async (_req: Request, res: Response): Promise<Response> => {
  return res.status(501).json({ success: false, message: 'eSewa payment verification is not implemented yet' });
};

export const initiateKhaltiPayment = async (_req: Request, res: Response): Promise<Response> => {
  return res.status(501).json({ success: false, message: 'Khalti payment initiation is not implemented yet' });
};

export const verifyKhaltiPayment = async (_req: Request, res: Response): Promise<Response> => {
  return res.status(501).json({ success: false, message: 'Khalti payment verification is not implemented yet' });
};

export const initiateFonepayPayment = async (_req: Request, res: Response): Promise<Response> => {
  return res.status(501).json({ success: false, message: 'Fonepay payment initiation is not implemented yet' });
};

export default {
  initiateESewaPayment,
  verifyESewaPayment,
  initiateKhaltiPayment,
  verifyKhaltiPayment,
  initiateFonepayPayment,
};
