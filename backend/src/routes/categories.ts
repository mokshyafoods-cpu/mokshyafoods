import express from 'express';
import { getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory } from '../controllers/categories';
import { adminMiddleware } from '../middleware/auth';
import { createCategoryValidator, updateCategoryValidator, validateRequest } from '../middleware/validation';

const router = express.Router();

router.get('/', getAllCategories);
router.get('/:id', getCategoryById);
router.post('/', adminMiddleware, createCategoryValidator, validateRequest, createCategory);
router.put('/:id', adminMiddleware, updateCategoryValidator, validateRequest, updateCategory);
router.delete('/:id', adminMiddleware, deleteCategory);

export default router;
