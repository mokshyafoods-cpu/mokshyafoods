import express from 'express';
import {
  createPOSOrder,
  getDailySalesReport,
  getSalesSummary,
  createHeldSale,
  getHeldSales,
  getHeldSale,
  deleteHeldSale,
  startTillSession,
  closeTillSession,
  getTillHistory,
} from '../controllers/pos';
import { adminMiddleware, posMiddleware } from '../middleware/auth';
import { posOrderValidator, holdSaleValidator, startTillValidator, closeTillValidator, validateRequest } from '../middleware/validation';

const router = express.Router();

router.post('/orders', posMiddleware, posOrderValidator, validateRequest, createPOSOrder);
router.post('/held-sales', posMiddleware, holdSaleValidator, validateRequest, createHeldSale);
router.get('/held-sales', posMiddleware, getHeldSales);
router.get('/held-sales/:id', posMiddleware, getHeldSale);
router.delete('/held-sales/:id', posMiddleware, deleteHeldSale);
router.post('/tills/start', posMiddleware, startTillValidator, validateRequest, startTillSession);
router.put('/tills/:id/close', posMiddleware, closeTillValidator, validateRequest, closeTillSession);
router.get('/tills', posMiddleware, getTillHistory);
router.get('/daily-report', adminMiddleware, getDailySalesReport);
router.get('/summary', adminMiddleware, getSalesSummary);

export default router;
