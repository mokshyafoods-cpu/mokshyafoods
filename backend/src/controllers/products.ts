import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product';

export const getAllProducts = async (req: Request, res: Response): Promise<Response> => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const includeInactive = typeof req.query.includeInactive === 'string' && req.query.includeInactive === 'true';
    const query: Record<string, any> = {};

    if (!includeInactive) {
      query.isActive = { $ne: false };
    }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { sku: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
        { packaging: { $regex: escaped, $options: 'i' } },
        { tags: { $elemMatch: { $regex: escaped, $options: 'i' } } },
        { seoKeywords: { $elemMatch: { $regex: escaped, $options: 'i' } } },
      ];
    }

    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.category = new mongoose.Types.ObjectId(category);
      }
    }

    const products = await Product.find(query).sort({ createdAt: -1 }).lean().limit(100).exec();
    res.set('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300');
    return res.json({ success: true, message: 'Products loaded', data: products || [] });
  } catch (error: any) {
    console.error('getAllProducts error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to load products' });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<Response> => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const includeInactive = typeof req.query.includeInactive === 'string' && req.query.includeInactive === 'true';
  try {
    const byId = mongoose.Types.ObjectId.isValid(id) ? await Product.findById(id).lean().exec() : null;
    if (byId) {
      if (!includeInactive && byId.isActive === false) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      return res.json({ success: true, message: 'Product retrieved', data: byId });
    }

    const byCustomId = await Product.findOne({ id }).lean().exec();
    if (byCustomId) {
      if (!includeInactive && byCustomId.isActive === false) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      return res.json({ success: true, message: 'Product retrieved', data: byCustomId });
    }

    return res.status(404).json({ success: false, message: 'Product not found' });
  } catch (error: any) {
    console.error('getProductById error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to load product' });
  }
};

export const createProduct = async (req: Request, res: Response): Promise<Response> => {
  try {
    const raw = req.body || {};
    const body: any = { ...raw };
    const uploadedFiles = Array.isArray((req as any).files) ? (req as any).files : [];
    const normalizedImages = uploadedFiles
      .map((file: any) => {
        if (file?.buffer && Buffer.isBuffer(file.buffer)) {
          const mimeType = file.mimetype || 'image/png';
          const base64 = file.buffer.toString('base64');
          return {
            url: `data:${mimeType};base64,${base64}`,
            cloudinaryId: undefined,
          };
        }

        return {
          url: file?.path || file?.secure_url || file?.url || '',
          cloudinaryId: file?.filename || file?.public_id || undefined,
        };
      })
      .filter((image: any) => image.url);
    const normalizeCategory = (value: any) => {
      if (value === undefined || value === null || value === '') return undefined;
      if (typeof value === 'string') return value;
      if (typeof value === 'object') {
        return value._id || value.id || value.slug || value.name || value.value || value.key || undefined;
      }
      return String(value);
    };

    if (body.category !== undefined) {
      const normalizedCategory = normalizeCategory(body.category);
      if (normalizedCategory !== undefined) {
        body.category = normalizedCategory;
      } else {
        delete body.category;
      }
    }

    // normalize incoming types from multipart/form-data (strings)
    if (body.isActive !== undefined) body.isActive = body.isActive === 'true' || body.isActive === true;
    if (body.onSale !== undefined) body.onSale = body.onSale === 'true' || body.onSale === true;
    if (body.price !== undefined) body.price = Number(body.price);
    if (body.discountPrice !== undefined && body.discountPrice !== '') body.discountPrice = Number(body.discountPrice);
    if (body.saleStart) body.saleStart = new Date(body.saleStart);
    if (body.saleEnd) body.saleEnd = new Date(body.saleEnd);
    if (body.quantity !== undefined) body.quantity = Number(body.quantity);
    if (body.weight !== undefined) body.weight = Number(body.weight);
    if (body.packagesInStock !== undefined) body.packagesInStock = Number(body.packagesInStock);
    if (body.tags !== undefined && typeof body.tags === 'string') {
      try { body.tags = JSON.parse(body.tags); } catch { body.tags = [body.tags]; }
    }
    if (normalizedImages.length > 0) {
      body.images = normalizedImages;
    } else if (body.images !== undefined && typeof body.images === 'string') {
      try { body.images = JSON.parse(body.images); } catch { body.images = []; }
    } else {
      body.images = [];
    }

    const created = await Product.create(body);
    return res.status(201).json({ success: true, message: 'Product created', data: created });
  } catch (error: any) {
    console.error('createProduct error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create product' });
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const raw = req.body || {};
    const update: any = { ...raw };
    const uploadedFiles = Array.isArray((req as any).files) ? (req as any).files : [];
    const normalizedImages = uploadedFiles
      .map((file: any) => {
        if (file?.buffer && Buffer.isBuffer(file.buffer)) {
          const mimeType = file.mimetype || 'image/png';
          const base64 = file.buffer.toString('base64');
          return {
            url: `data:${mimeType};base64,${base64}`,
            cloudinaryId: undefined,
          };
        }

        return {
          url: file?.path || file?.secure_url || file?.url || '',
          cloudinaryId: file?.filename || file?.public_id || undefined,
        };
      })
      .filter((image: any) => image.url);
    const normalizeCategory = (value: any) => {
      if (value === undefined || value === null || value === '') return undefined;
      if (typeof value === 'string') return value;
      if (typeof value === 'object') {
        return value._id || value.id || value.slug || value.name || value.value || value.key || undefined;
      }
      return String(value);
    };

    if (update.category !== undefined) {
      const normalizedCategory = normalizeCategory(update.category);
      if (normalizedCategory !== undefined) {
        update.category = normalizedCategory;
      } else {
        delete update.category;
      }
    }

    if (update.isActive !== undefined) update.isActive = update.isActive === 'true' || update.isActive === true;
    if (update.onSale !== undefined) update.onSale = update.onSale === 'true' || update.onSale === true;
    if (update.price !== undefined) update.price = Number(update.price);
    if (update.discountPrice !== undefined && update.discountPrice !== '') update.discountPrice = Number(update.discountPrice);
    if (update.saleStart) update.saleStart = new Date(update.saleStart);
    if (update.saleEnd) update.saleEnd = new Date(update.saleEnd);
    if (update.quantity !== undefined) update.quantity = Number(update.quantity);
    if (update.weight !== undefined) update.weight = Number(update.weight);
    if (update.packagesInStock !== undefined) update.packagesInStock = Number(update.packagesInStock);
    if (update.tags !== undefined && typeof update.tags === 'string') {
      try { update.tags = JSON.parse(update.tags); } catch { update.tags = [update.tags]; }
    }
    if (normalizedImages.length > 0) {
      update.images = normalizedImages;
    } else if (update.images !== undefined && typeof update.images === 'string') {
      try { update.images = JSON.parse(update.images); } catch { update.images = []; }
    } else if (update.images === undefined) {
      update.images = [];
    }
    const filter = mongoose.Types.ObjectId.isValid(id) ? { _id: new mongoose.Types.ObjectId(id) } : { id };
    const updated = await Product.findOneAndUpdate(filter, update, { new: true }).lean().exec();
    if (!updated) return res.status(404).json({ success: false, message: 'Product not found' });
    return res.json({ success: true, message: 'Product updated', data: updated });
  } catch (error: any) {
    console.error('updateProduct error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update product' });
  }
};

export const deleteProduct = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const id = Array.isArray(_req.params.id) ? _req.params.id[0] : _req.params.id;
    const filter = mongoose.Types.ObjectId.isValid(id) ? { _id: new mongoose.Types.ObjectId(id) } : { id };
    const deleted = await Product.findOneAndDelete(filter).lean().exec();
    if (!deleted) return res.status(404).json({ success: false, message: 'Product not found' });
    return res.json({ success: true, message: 'Product deleted' });
  } catch (error: any) {
    console.error('deleteProduct error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete product' });
  }
};

export default {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
