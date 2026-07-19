import express from 'express';
import { getDashboardStats, getSalesAnalytics, getLowStockProducts, updateStock } from '../controllers/admin';
import { adminMiddleware } from '../middleware/auth';
import { updateStockValidator, validateRequest } from '../middleware/validation';

const router = express.Router();

router.get('/dashboard', adminMiddleware, getDashboardStats);
router.get('/analytics', adminMiddleware, getSalesAnalytics);
router.get('/low-stock', adminMiddleware, getLowStockProducts);
router.put('/stock/:productId', adminMiddleware, updateStockValidator, validateRequest, updateStock);

export default router;
