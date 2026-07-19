import express from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { createOrUpdatePaymentLedger, getAllPaymentLedger, getPaymentLedgerByOrderId, updatePaymentLedger } from '../controllers/paymentLedger';

const router = express.Router();

router.get('/', adminMiddleware, getAllPaymentLedger);
router.get('/order/:orderId', adminMiddleware, getPaymentLedgerByOrderId);
router.post('/', adminMiddleware, createOrUpdatePaymentLedger);
router.put('/:id', adminMiddleware, updatePaymentLedger);

export default router;
