import express from 'express';
import { authMiddleware, adminMiddleware, posMiddleware } from '../middleware/auth';
import { upload } from '../config/cloudinary';
import mobileUploadBlocker from '../middleware/mobileUploadBlocker';
import { getProfile, updateProfile, getWishlist, addToWishlist, removeFromWishlist, getAllUsers, deleteUser, updateUserRole, searchUsersByPhone } from '../controllers/users';
import { profileUpdateValidator, wishlistValidator, searchUsersByPhoneValidator, updateUserRoleValidator, validateRequest } from '../middleware/validation';

const router = express.Router();

router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, mobileUploadBlocker, upload.single('avatar'), profileUpdateValidator, validateRequest, updateProfile);
router.get('/wishlist', authMiddleware, getWishlist);
router.post('/wishlist', authMiddleware, wishlistValidator, validateRequest, addToWishlist);
router.delete('/wishlist/:productId', authMiddleware, removeFromWishlist);
router.get('/search', posMiddleware, searchUsersByPhoneValidator, validateRequest, searchUsersByPhone);
router.get('/', adminMiddleware, getAllUsers);
router.delete('/:id', adminMiddleware, deleteUser);
router.put('/:id/role', adminMiddleware, updateUserRoleValidator, validateRequest, updateUserRole);

export default router;
