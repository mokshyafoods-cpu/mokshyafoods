import express from 'express';
import { register, login, logout, verifyEmail, resendOtp } from '../controllers/auth';
import { authMiddleware } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';
import { authRegisterValidator, authLoginValidator, authVerifyOtpValidator, validateRequest } from '../middleware/validation';

const router = express.Router();

router.post('/register', authLimiter, authRegisterValidator, validateRequest, register);
router.post('/login', authLimiter, authLoginValidator, validateRequest, login);
router.post('/verify-email', authMiddleware, authLimiter, authVerifyOtpValidator, validateRequest, verifyEmail);
router.post('/resend-otp', authMiddleware, authLimiter, resendOtp);
router.post('/logout', authMiddleware, logout);

export default router;
