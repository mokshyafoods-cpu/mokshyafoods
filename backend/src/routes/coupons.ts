import express from 'express';
import { validateCoupon, getAllCoupons, createCoupon, updateCoupon, deleteCoupon } from '../controllers/coupons';
import { adminMiddleware } from '../middleware/auth';
import { validateCouponValidator, createCouponValidator, updateCouponValidator, validateRequest } from '../middleware/validation';

const router = express.Router();

router.post('/validate', validateCouponValidator, validateRequest, validateCoupon);
router.get('/', adminMiddleware, getAllCoupons);
router.post('/', adminMiddleware, createCouponValidator, validateRequest, createCoupon);
router.put('/:id', adminMiddleware, updateCouponValidator, validateRequest, updateCoupon);
router.delete('/:id', adminMiddleware, deleteCoupon);

export default router;
