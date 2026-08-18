import express from 'express';
import { register, login, logout, verifyEmail, resendOtp, forgotPassword, resetPassword, googleLogin } from '../controllers/auth';
import { authMiddleware } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';
import { authRegisterValidator, authLoginValidator, authVerifyOtpValidator, forgotPasswordValidator, resetPasswordValidator, googleLoginValidator, validateRequest } from '../middleware/validation';

const router = express.Router();

router.post('/register', authLimiter, authRegisterValidator, validateRequest, register);
router.post('/login', authLimiter, authLoginValidator, validateRequest, login);
router.post('/google-login', authLimiter, googleLoginValidator, validateRequest, googleLogin);
router.post('/verify-email', authMiddleware, authLimiter, authVerifyOtpValidator, validateRequest, verifyEmail);
router.post('/resend-otp', authMiddleware, authLimiter, resendOtp);
router.post('/forgot-password', authLimiter, forgotPasswordValidator, validateRequest, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPasswordValidator, validateRequest, resetPassword);
router.post('/logout', authMiddleware, logout);

export default router;
