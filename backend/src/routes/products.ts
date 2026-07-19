import express from 'express';
import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/products';
import { adminMiddleware } from '../middleware/auth';
import { upload } from '../config/cloudinary';

const router = express.Router();

router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', adminMiddleware, upload.array('images', 5), createProduct);
router.put('/:id', adminMiddleware, upload.array('images', 5), updateProduct);
router.delete('/:id', adminMiddleware, deleteProduct);

export default router;
