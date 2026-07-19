import express, { Request, Response, NextFunction } from 'express';
import { createOrder, getAllOrders, getUserOrders, getOrderById, updateOrderStatus } from '../controllers/orders';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { createOrderValidator, updateOrderValidator, validateRequest } from '../middleware/validation';

interface AuthenticatedRequest extends Request {
  userRole?: string;
}

const router = express.Router();

router.post('/', authMiddleware, createOrderValidator, validateRequest, createOrder);
router.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (req.userRole === 'admin') {
    return getAllOrders(req, res);
  }

  return getUserOrders(req, res);
});
router.get('/:id', authMiddleware, getOrderById);
router.put('/:id', adminMiddleware, updateOrderValidator, validateRequest, updateOrderStatus);

export default router;
