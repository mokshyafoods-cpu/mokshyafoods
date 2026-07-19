import express from 'express';
import {
  initiateESewaPayment,
  verifyESewaPayment,
  initiateKhaltiPayment,
  verifyKhaltiPayment,
  initiateFonepayPayment,
} from '../controllers/payments';
import { authMiddleware } from '../middleware/auth';
import {
  paymentInitiateValidator,
  eSewaVerifyValidator,
  paymentVerifyKhaltiValidator,
  validateRequest,
} from '../middleware/validation';

const router = express.Router();

router.post('/esewa/initiate', authMiddleware, paymentInitiateValidator, validateRequest, initiateESewaPayment);
router.get('/esewa/verify', eSewaVerifyValidator, validateRequest, verifyESewaPayment);
router.post('/khalti/initiate', authMiddleware, paymentInitiateValidator, validateRequest, initiateKhaltiPayment);
router.post('/khalti/verify', paymentVerifyKhaltiValidator, validateRequest, verifyKhaltiPayment);
router.post('/fonepay/initiate', authMiddleware, paymentInitiateValidator, validateRequest, initiateFonepayPayment);

export default router;
