import express from 'express';
import {
  createProductionBatch,
  createBusinessEntry,
  deleteBusinessEntry,
  createRawMaterial,
  deleteProductionBatch,
  deleteRawMaterial,
  getDashboardStats,
  getLowStockProducts,
  getMonthlyBusinessReport,
  getProductionBatches,
  getBusinessEntries,
  getRawMaterials,
  getSalesAnalytics,
  updateProductionBatch,
  updateBusinessEntry,
  updateRawMaterial,
  updateStock,
} from '../controllers/admin';
import { adminMiddleware } from '../middleware/auth';
import { updateStockValidator, validateRequest } from '../middleware/zodValidation';

const router = express.Router();

router.get('/dashboard', adminMiddleware, getDashboardStats);
router.get('/analytics', adminMiddleware, getSalesAnalytics);
router.get('/low-stock', adminMiddleware, getLowStockProducts);
router.put('/stock/:productId', adminMiddleware, updateStockValidator, validateRequest, updateStock);

router.get('/raw-materials', adminMiddleware, getRawMaterials);
router.post('/raw-materials', adminMiddleware, createRawMaterial);
router.put('/raw-materials/:id', adminMiddleware, updateRawMaterial);
router.delete('/raw-materials/:id', adminMiddleware, deleteRawMaterial);

router.get('/production-batches', adminMiddleware, getProductionBatches);
router.post('/production-batches', adminMiddleware, createProductionBatch);
router.put('/production-batches/:id', adminMiddleware, updateProductionBatch);
router.delete('/production-batches/:id', adminMiddleware, deleteProductionBatch);

router.get('/business-entries', adminMiddleware, getBusinessEntries);
router.post('/business-entries', adminMiddleware, createBusinessEntry);
router.put('/business-entries/:id', adminMiddleware, updateBusinessEntry);
router.delete('/business-entries/:id', adminMiddleware, deleteBusinessEntry);

router.get('/monthly-report', adminMiddleware, getMonthlyBusinessReport);

export default router;
