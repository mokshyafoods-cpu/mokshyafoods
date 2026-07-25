import { Request, Response } from 'express';
import mongoose from 'mongoose';

const hydrateReview = async (review: any): Promise<any> => {
  let product = null;
  let user = review?.user || null;

  if (review?.productId) {
    const productsColl = mongoose.connection.collection('products');
    product = await productsColl.findOne({ _id: new mongoose.Types.ObjectId(review.productId) as any }).catch(() => null);
  }

  if (review?.userId || review?.user?.id || review?.user?._id) {
    const lookupId = review?.userId || review?.user?.id || review?.user?._id;
    const usersColl = mongoose.connection.collection('users');

    try {
      const query = mongoose.Types.ObjectId.isValid(String(lookupId))
        ? { _id: new mongoose.Types.ObjectId(String(lookupId)) }
        : { $or: [{ _id: String(lookupId) }, { email: String(lookupId) }] };

      const foundUser = await usersColl.findOne(query as any).catch(() => null);
      if (foundUser) {
        user = {
          _id: foundUser._id?.toString?.() || foundUser._id,
          name: foundUser.name || foundUser.fullName || foundUser.displayName || 'Customer',
          email: foundUser.email,
          phone: foundUser.phone,
        };
      }
    } catch (error) {
      console.warn('Failed to hydrate review user data:', error);
    }
  }

  return {
    ...review,
    user,
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

const ensureReviewIndex = async (reviewsColl: any): Promise<void> => {
  try {
    await reviewsColl.createIndex({ userId: 1, productId: 1 }, { unique: true, name: 'unique_user_product_review' });
  } catch (error: any) {
    if (!/already exists/i.test(error?.message || '')) {
      console.warn('Review index warning:', error?.message || error);
    }
  }
};

const isOwnedByUser = (review: any, userId?: string): boolean => {
  if (!review || !userId) return false;
  return review.userId === userId || review.user?.id === userId || review.user?._id === userId;
};

export const createReview = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const { productId, rating, title, comment } = req.body || {};
    if (!req.userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const reviewsColl = mongoose.connection.collection('reviews');
    await ensureReviewIndex(reviewsColl);

    const reviewDoc = {
      userId: req.userId,
      productId,
      rating: Number(rating) || 5,
      title: title || 'Product review',
      comment: comment || '',
      status: 'approved',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const existingReview = await reviewsColl.findOne({ userId: req.userId, productId });
    if (existingReview) {
      const updatedReview = await reviewsColl.findOneAndUpdate(
        { _id: existingReview._id },
        { $set: { ...reviewDoc, updatedAt: new Date() } },
        { returnDocument: 'after' as any }
      );
      return res.status(200).json({ success: true, message: 'Review updated', data: updatedReview });
    }

    const result = await reviewsColl.insertOne(reviewDoc);
    return res.status(201).json({ success: true, message: 'Review created', data: { ...reviewDoc, _id: result.insertedId } });
  } catch (error: any) {
    console.error('createReview error:', error);
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this product' });
    }
    return res.status(500).json({ success: false, message: error.message || 'Failed to create review' });
  }
};

export const getProductReviews = async (req: Request, res: Response): Promise<Response> => {
  try {
    const productId = req.query.productId ? String(req.query.productId) : '';
    const statusFilter = typeof req.query.status === 'string' ? req.query.status : '';
    const reviewsColl = mongoose.connection.collection('reviews');
    const filter: Record<string, any> = {};
    if (productId) filter.productId = productId;
    if (statusFilter) {
      filter.status = statusFilter;
    } else {
      filter.status = 'approved';
    }
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

    if (!isOwnedByUser(existingReview, req.userId)) {
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

    if (!isOwnedByUser(existingReview, req.userId)) {
      return res.status(403).json({ success: false, message: 'You can only delete your own reviews' });
    }

    await reviewsColl.deleteOne({ _id: new mongoose.Types.ObjectId(reviewId) });
    return res.json({ success: true, message: 'Review deleted', data: { deleted: true } });
  } catch (error: any) {
    console.error('deleteReview error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete review' });
  }
};

export const getAdminReviews = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const reviewsColl = mongoose.connection.collection('reviews');
    const allReviews = await reviewsColl.find({}).sort({ createdAt: -1 }).toArray();
    const hydratedReviews = await Promise.all(allReviews.map((review) => hydrateReview(review)));
    return res.json({ success: true, message: 'Reviews loaded', data: hydratedReviews });
  } catch (error: any) {
    console.error('getAdminReviews error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to load reviews' });
  }
};

export const getPendingReviews = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const reviewsColl = mongoose.connection.collection('reviews');
    const pendingReviews = await reviewsColl.find({ status: 'pending' }).sort({ createdAt: -1 }).toArray();
    const hydratedReviews = await Promise.all(pendingReviews.map((review) => hydrateReview(review)));
    return res.json({ success: true, message: 'Pending reviews loaded', data: hydratedReviews });
  } catch (error: any) {
    console.error('getPendingReviews error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to load pending reviews' });
  }
};

export const approveReview = async (req: Request, res: Response): Promise<Response> => {
  try {
    const reviewId = normalizeReviewId(req.params.id);
    if (!reviewId) {
      return res.status(400).json({ success: false, message: 'Valid review ID is required' });
    }
    const reviewsColl = mongoose.connection.collection('reviews');
    const updatedReview = await reviewsColl.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(reviewId) },
      { $set: { status: 'approved', updatedAt: new Date() } },
      { returnDocument: 'after' as any }
    );
    if (!updatedReview) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    return res.json({ success: true, message: 'Review approved', data: updatedReview });
  } catch (error: any) {
    console.error('approveReview error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to approve review' });
  }
};

export const rejectReview = async (req: Request, res: Response): Promise<Response> => {
  try {
    const reviewId = normalizeReviewId(req.params.id);
    if (!reviewId) {
      return res.status(400).json({ success: false, message: 'Valid review ID is required' });
    }
    const reviewsColl = mongoose.connection.collection('reviews');
    const updatedReview = await reviewsColl.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(reviewId) },
      { $set: { status: 'rejected', updatedAt: new Date() } },
      { returnDocument: 'after' as any }
    );
    if (!updatedReview) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    return res.json({ success: true, message: 'Review rejected', data: updatedReview });
  } catch (error: any) {
    console.error('rejectReview error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to reject review' });
  }
};

export default {
  createReview,
  getProductReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  getAdminReviews,
  getPendingReviews,
  approveReview,
  rejectReview,
};
