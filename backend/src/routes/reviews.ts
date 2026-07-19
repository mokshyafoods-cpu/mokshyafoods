import express from 'express';
import { createReview, getProductReviews, getUserReviews, updateReview, deleteReview, getPendingReviews, approveReview, rejectReview } from '../controllers/reviews';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { reviewValidator, validateRequest } from '../middleware/validation';

const router = express.Router();

router.get('/', getProductReviews);
router.get('/user', authMiddleware, getUserReviews);
router.post('/', authMiddleware, reviewValidator, validateRequest, createReview);
router.put('/:id', authMiddleware, updateReview);
router.delete('/:id', authMiddleware, deleteReview);
router.get('/pending', adminMiddleware, getPendingReviews);
router.put('/:id/approve', adminMiddleware, approveReview);
router.put('/:id/reject', adminMiddleware, rejectReview);

export default router;
