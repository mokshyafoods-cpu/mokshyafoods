import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';

type AuthenticatedRequest = Request & { userId?: string; userRole?: string };

export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  if (!req.userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const user = await User.findById(req.userId).select('-password -otpHash').lean().exec();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, message: 'Profile loaded', data: user });
  } catch (error: any) {
    console.error('getProfile error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to load profile' });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const id = req.userId || (req.body as any)?._id;
    if (!id) return res.status(400).json({ success: false, message: 'User id missing' });

    const update: any = {};
    const body = req.body || {};

    if (typeof body === 'object' && body !== null) {
      if (body.name) update.name = body.name;
      if (body.phone) update.phone = body.phone;
      if (body.address) {
        try {
          update.address = typeof body.address === 'string' ? JSON.parse(body.address) : body.address;
        } catch {
          update.address = body.address;
        }
      }
      if (body.currentPassword || body.newPassword) {
        if (!body.currentPassword || !body.newPassword) {
          return res.status(400).json({ success: false, message: 'Current password and new password are required to change your password.' });
        }
        const currentUser = await User.findById(id).select('+password');
        if (!currentUser) return res.status(404).json({ success: false, message: 'User not found' });
        const isMatch = await currentUser.comparePassword(body.currentPassword);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
        if (String(body.newPassword).length < 6) {
          return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
        }
        update.password = await bcrypt.hash(String(body.newPassword), 10);
      }
      if (body.notifications && typeof body.notifications === 'object') {
        update.notifications = {
          orderUpdates: body.notifications.orderUpdates ?? true,
          promotions: body.notifications.promotions ?? false,
        };
      }
    }

    if ((req as any).file?.path) {
      update.avatar = (req as any).file.path;
    }

    const updated = await User.findByIdAndUpdate(id, update, { new: true, runValidators: true }).select('-password -otpHash').lean().exec();
    if (!updated) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, message: 'Profile updated', data: updated });
  } catch (error: any) {
    console.error('updateProfile error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update profile' });
  }
};

export const getWishlist = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  if (!req.userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const user = await User.findById(req.userId).populate('wishlist').lean().exec();
    const wishlist = Array.isArray((user as any)?.wishlist) ? (user as any).wishlist : [];
    return res.json({ success: true, message: 'Wishlist loaded', data: wishlist });
  } catch (error: any) {
    console.error('getWishlist error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to load wishlist' });
  }
};

export const addToWishlist = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  if (!req.userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const { productId } = req.body || {};
    if (!productId) return res.status(400).json({ success: false, message: 'Product id is required' });
    const user = await User.findByIdAndUpdate(req.userId, { $addToSet: { wishlist: productId } }, { new: true }).populate('wishlist').lean().exec();
    return res.status(201).json({ success: true, message: 'Added to wishlist', data: (user as any)?.wishlist || [] });
  } catch (error: any) {
    console.error('addToWishlist error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to add to wishlist' });
  }
};

export const removeFromWishlist = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  if (!req.userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const { productId } = req.params;
    const user = await User.findByIdAndUpdate(req.userId, { $pull: { wishlist: productId } }, { new: true }).populate('wishlist').lean().exec();
    return res.json({ success: true, message: 'Removed from wishlist', data: (user as any)?.wishlist || [] });
  } catch (error: any) {
    console.error('removeFromWishlist error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to remove from wishlist' });
  }
};

export const getAllUsers = async (req: Request, res: Response): Promise<Response> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (req.query.search) {
      const term = String(req.query.search).trim();
      query.$or = [
        { name: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
        { phone: { $regex: term, $options: 'i' } },
      ];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(query).exec(),
      User.find(query).select('-password -otpHash').sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
    ]);

    return res.json({
      success: true,
      message: 'Users loaded',
      data: users,
      pagination: { page, limit, total },
    });
  } catch (error: any) {
    console.error('getAllUsers error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to load users' });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: 'User id missing' });
    const deleted = await User.findByIdAndDelete(id).select('-password -otpHash').lean().exec();
    if (!deleted) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, message: 'User deleted', data: deleted });
  } catch (error: any) {
    console.error('deleteUser error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete user' });
  }
};

export const updateUserRole = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = req.params.id;
    const role = req.body.role;
    if (!id || !role) return res.status(400).json({ success: false, message: 'Missing id or role' });
    const updated = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-password -otpHash').lean().exec();
    if (!updated) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, message: 'User role updated', data: updated });
  } catch (error: any) {
    console.error('updateUserRole error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update user role' });
  }
};

export const searchUsersByPhone = async (req: Request, res: Response): Promise<Response> => {
  try {
    const phone = String(req.query.phone || '').trim();
    if (!phone) return res.json({ success: true, message: 'Users search completed', data: [] });
    const users = await User.find({ phone: { $regex: phone, $options: 'i' } }).select('-password -otpHash').lean().exec();
    return res.json({ success: true, message: 'Users search completed', data: users });
  } catch (error: any) {
    console.error('searchUsersByPhone error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to search users' });
  }
};

export default {
  getProfile,
  updateProfile,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getAllUsers,
  deleteUser,
  updateUserRole,
  searchUsersByPhone,
};
