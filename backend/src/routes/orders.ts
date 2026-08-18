import express, { Request, Response } from 'express';
import { createOrder, getAllOrders, getUserOrders, getOrderById, updateOrderStatus, deleteOrder } from '../controllers/orders';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { createOrderValidator, updateOrderValidator, validateRequest } from '../middleware/validation';

interface AuthenticatedRequest extends Request {
  userRole?: string;
}

const router = express.Router();

router.post('/', createOrderValidator, validateRequest, createOrder);
router.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (req.userRole === 'admin') {
    return getAllOrders(req, res);
  }

  return getUserOrders(req, res);
});
router.get('/:id', optionalAuthMiddleware, getOrderById);
router.delete('/:id', authMiddleware, deleteOrder);
router.put('/:id', authMiddleware, updateOrderValidator, validateRequest, updateOrderStatus);

export default router;
