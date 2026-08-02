import { Request, Response } from 'express';
import mongoose from 'mongoose';

const paymentsCollectionName = 'payments';
const ordersCollectionName = 'orders';

const getPaymentsCollection = () => mongoose.connection.collection(paymentsCollectionName);
const getOrdersCollection = () => mongoose.connection.collection(ordersCollectionName);

const buildPaymentRecord = async (orderId: string, method: string, amount: number, metadata: any = {}) => {
  const now = new Date();
  const record = {
    orderId,
    method,
    amount,
    status: 'pending',
    metadata,
    createdAt: now,
    updatedAt: now,
  };
  const result = await getPaymentsCollection().insertOne(record);
  return { ...record, _id: result.insertedId };
};

const findPaymentByTransactionId = async (transactionId: string) => {
  if (mongoose.Types.ObjectId.isValid(transactionId)) {
    return getPaymentsCollection().findOne({ _id: new mongoose.Types.ObjectId(transactionId) });
  }
  return getPaymentsCollection().findOne({ transactionId });
};

const respondToPaymentInitiation = async (res: Response, record: any): Promise<Response> => {
  return res.status(201).json({
    success: true,
    message: 'Payment initiated',
    data: {
      paymentId: record._id,
      orderId: record.orderId,
      method: record.method,
      amount: record.amount,
      status: record.status,
      transactionId: record._id,
    },
  });
};

export const initiateGenericPayment = async (req: Request, res: Response): Promise<Response> => {
  try {
    const orderId = String(req.body.orderId || '').trim();
    const method = String(req.body.method || 'cod').trim().toLowerCase();
    const amount = Number(req.body.amount || 0);

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: 'Valid order ID is required' });
    }

    const order = await getOrdersCollection().findOne({ _id: new mongoose.Types.ObjectId(orderId) });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const paymentAmount = amount > 0 ? amount : Number(order.total || 0);
    const record = await buildPaymentRecord(orderId, method, paymentAmount, { initiatedBy: req.ip });
    return respondToPaymentInitiation(res, record);
  } catch (error: any) {
    console.error('initiateGenericPayment error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to initiate payment' });
  }
};

export const verifyGenericPayment = async (req: Request, res: Response): Promise<Response> => {
  try {
    const transactionId = String(req.body.transactionId || '').trim();
    const orderId = String(req.body.orderId || '').trim();

    if (!transactionId) {
      return res.status(400).json({ success: false, message: 'Transaction ID is required' });
    }

    const payment = await findPaymentByTransactionId(transactionId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    if (payment.status === 'verified') {
      return res.json({ success: true, message: 'Payment already verified', data: { transactionId, status: payment.status } });
    }

    const update: any = {
      status: 'verified',
      verifiedAt: new Date(),
      updatedAt: new Date(),
    };

    if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
      update.orderId = orderId;
    }

    await getPaymentsCollection().updateOne(
      { _id: payment._id },
      { $set: update }
    );

    if (payment.orderId && mongoose.Types.ObjectId.isValid(String(payment.orderId))) {
      await getOrdersCollection().updateOne(
        { _id: new mongoose.Types.ObjectId(String(payment.orderId)) },
        { $set: { paymentStatus: 'paid', status: 'processing', updatedAt: new Date() } }
      );
    }

    return res.json({ success: true, message: 'Payment verified', data: { transactionId, status: 'verified' } });
  } catch (error: any) {
    console.error('verifyGenericPayment error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to verify payment' });
  }
};

export const initiateESewaPayment = async (req: Request, res: Response): Promise<Response> => {
  req.body.method = 'esewa';
  return initiateGenericPayment(req, res);
};

export const verifyESewaPayment = async (req: Request, res: Response): Promise<Response> => {
  try {
    const orderId = String(req.query.oid || '').trim();
    const payment = await getPaymentsCollection().findOne({ orderId, method: 'esewa' });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    if (payment.status === 'verified') {
      return res.json({ success: true, message: 'Payment already verified', data: { status: payment.status } });
    }

    await getPaymentsCollection().updateOne(
      { _id: payment._id },
      { $set: { status: 'verified', verifiedAt: new Date(), updatedAt: new Date() } }
    );

    if (mongoose.Types.ObjectId.isValid(String(orderId))) {
      await getOrdersCollection().updateOne(
        { _id: new mongoose.Types.ObjectId(orderId) },
        { $set: { paymentStatus: 'paid', status: 'processing', updatedAt: new Date() } }
      );
    }

    return res.json({ success: true, message: 'eSewa payment verified', data: { status: 'verified' } });
  } catch (error: any) {
    console.error('verifyESewaPayment error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to verify eSewa payment' });
  }
};

export const initiateKhaltiPayment = async (req: Request, res: Response): Promise<Response> => {
  req.body.method = 'khalti';
  return initiateGenericPayment(req, res);
};

export const verifyKhaltiPayment = async (req: Request, res: Response): Promise<Response> => {
  try {
    const body = req.body || {};
    const payment = await findPaymentByTransactionId(String(body.token || ''));
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    if (payment.status === 'verified') {
      return res.json({ success: true, message: 'Payment already verified', data: { status: payment.status } });
    }

    await getPaymentsCollection().updateOne(
      { _id: payment._id },
      { $set: { status: 'verified', verifiedAt: new Date(), updatedAt: new Date() } }
    );

    if (payment.orderId && mongoose.Types.ObjectId.isValid(String(payment.orderId))) {
      await getOrdersCollection().updateOne(
        { _id: new mongoose.Types.ObjectId(String(payment.orderId)) },
        { $set: { paymentStatus: 'paid', status: 'processing', updatedAt: new Date() } }
      );
    }

    return res.json({ success: true, message: 'Khalti payment verified', data: { status: 'verified' } });
  } catch (error: any) {
    console.error('verifyKhaltiPayment error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to verify Khalti payment' });
  }
};

export const initiateFonepayPayment = async (req: Request, res: Response): Promise<Response> => {
  req.body.method = 'fonepay';
  return initiateGenericPayment(req, res);
};

export default {
  initiateESewaPayment,
  verifyESewaPayment,
  initiateKhaltiPayment,
  verifyKhaltiPayment,
  initiateFonepayPayment,
  initiateGenericPayment,
  verifyGenericPayment,
};
