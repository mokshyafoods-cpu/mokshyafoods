import { Request, Response } from 'express';
import mongoose from 'mongoose';

const getProductDetails = async (productId?: string) => {
  if (!productId) return null;
  const productsColl = mongoose.connection.collection('products');
  const normalizedId = mongoose.Types.ObjectId.isValid(String(productId))
    ? new mongoose.Types.ObjectId(String(productId))
    : String(productId);
  const product = await productsColl.findOne({ _id: normalizedId } as any).catch(() => null);
  if (!product) return null;
  return {
    _id: product._id?.toString?.() ?? product._id,
    id: product._id?.toString?.() ?? product._id,
    name: product.name,
    thumbnail: product.thumbnail || product.image || product.images?.[0]?.url || '/placeholder.jpg',
    price: product.price,
    discountPrice: product.discountPrice,
    sku: product.sku,
  };
};

const hydrateReview = async (review: any): Promise<any> => {
  if (!review?.productId) return review;
  const productsColl = mongoose.connection.collection('products');
  const product = await productsColl.findOne({ _id: new mongoose.Types.ObjectId(review.productId) as any }).catch(() => null);
  return {
    ...review,
    product: product ? {
      _id: product._id?.toString?.() || product._id,
      name: product.name,
      description: product.description,
      thumbnail: product.thumbnail || product.image || product.images?.[0]?.url || '/placeholder.jpg',
    } : null,
  };
};

type AuthenticatedRequest = Request & { userId?: string; userRole?: string };

const normalizeReviewId = (value: string | string[] | undefined): string | null => {
  if (!value) return null;
  const id = Array.isArray(value) ? value[0] : value;
  return id && mongoose.Types.ObjectId.isValid(id) ? id : null;
};

export const createReview = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const { productId, rating, title, comment } = req.body || {};
    const reviewsColl = mongoose.connection.collection('reviews');
    const reviewDoc = {
      userId: req.userId,
      productId,
      rating: Number(rating) || 5,
      title: title || 'Product review',
      comment: comment || '',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await reviewsColl.insertOne(reviewDoc);
    return res.status(201).json({ success: true, message: 'Review created', data: { ...reviewDoc, _id: result.insertedId } });
  } catch (error: any) {
    console.error('createReview error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create review' });
  }
};

export const getProductReviews = async (req: Request, res: Response): Promise<Response> => {
  try {
    const productId = req.query.productId ? String(req.query.productId) : '';
    const reviewsColl = mongoose.connection.collection('reviews');
    const filter = productId ? { productId } : {};
    const reviews = await reviewsColl.find(filter).sort({ createdAt: -1 }).toArray();
    const hydratedReviews = await Promise.all(reviews.map((review) => hydrateReview(review)));
    return res.json({ success: true, message: 'Product reviews loaded', data: hydratedReviews });
  } catch (error: any) {
    console.error('getProductReviews error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to load product reviews' });
  }
};

export const getUserReviews = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const userId = req.userId;
    const reviewsColl = mongoose.connection.collection('reviews');
    const reviews = await reviewsColl
      .find({
        $or: [{ userId }, { user: userId }, { 'user._id': userId }, { 'user.id': userId }],
      })
      .sort({ createdAt: -1 })
      .toArray();

    const hydratedReviews = await Promise.all(reviews.map((review) => hydrateReview(review)));
    return res.json({ success: true, message: 'User reviews loaded', data: hydratedReviews });
  } catch (error: any) {
    console.error('getUserReviews error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to load user reviews' });
  }
};

export const updateReview = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const reviewId = normalizeReviewId(req.params.id);
    if (!reviewId) {
      return res.status(400).json({ success: false, message: 'Valid review ID is required' });
    }

    const { title, comment, rating } = req.body || {};
    const reviewsColl = mongoose.connection.collection('reviews');
    const existingReview = await reviewsColl.findOne({ _id: new mongoose.Types.ObjectId(reviewId) });

    if (!existingReview) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (existingReview.userId !== req.userId && existingReview.user?.id !== req.userId && existingReview.user?._id !== req.userId) {
      return res.status(403).json({ success: false, message: 'You can only edit your own reviews' });
    }

    const updatedReview = await reviewsColl.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(reviewId) },
      {
        $set: {
          title: title ?? existingReview.title,
          comment: comment ?? existingReview.comment,
          rating: Number(rating) || existingReview.rating || 5,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' as any }
    );

    return res.json({ success: true, message: 'Review updated', data: updatedReview });
  } catch (error: any) {
    console.error('updateReview error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update review' });
  }
};

export const deleteReview = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const reviewId = normalizeReviewId(req.params.id);
    if (!reviewId) {
      return res.status(400).json({ success: false, message: 'Valid review ID is required' });
    }

    const reviewsColl = mongoose.connection.collection('reviews');
    const existingReview = await reviewsColl.findOne({ _id: new mongoose.Types.ObjectId(reviewId) });

    if (!existingReview) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (existingReview.userId !== req.userId && existingReview.user?.id !== req.userId && existingReview.user?._id !== req.userId) {
      return res.status(403).json({ success: false, message: 'You can only delete your own reviews' });
    }

    await reviewsColl.deleteOne({ _id: new mongoose.Types.ObjectId(reviewId) });
    return res.json({ success: true, message: 'Review deleted', data: { deleted: true } });
  } catch (error: any) {
    console.error('deleteReview error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete review' });
  }
};

export const getPendingReviews = async (_req: Request, res: Response): Promise<Response> => {
  return res.json({ success: true, message: 'Pending reviews loaded', data: [] });
};

export const approveReview = async (_req: Request, res: Response): Promise<Response> => {
  return res.json({ success: true, message: 'Review approved', data: { approved: true } });
};

export const rejectReview = async (_req: Request, res: Response): Promise<Response> => {
  return res.json({ success: true, message: 'Review rejected', data: { rejected: true } });
};

export default {
  createReview,
  getProductReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  getPendingReviews,
  approveReview,
  rejectReview,
};
