import express from 'express';
import { getAllPosts, getPostBySlug, createPost, updatePost, publishPost, deletePost } from '../controllers/blog';
import { adminMiddleware } from '../middleware/auth';
import { createPostValidator, updatePostValidator, validateRequest } from '../middleware/validation';

const router = express.Router();

router.get('/', getAllPosts);
router.get('/:slug', getPostBySlug);
router.post('/', adminMiddleware, createPostValidator, validateRequest, createPost);
router.put('/:id', adminMiddleware, updatePostValidator, validateRequest, updatePost);
router.put('/:id/publish', adminMiddleware, publishPost);
router.delete('/:id', adminMiddleware, deletePost);

export default router;
