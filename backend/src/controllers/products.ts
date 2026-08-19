import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product';
import { cloudinaryConfigured, uploadBuffer } from '../config/cloudinary';

const createSlug = (value?: string | null) => {
  if (!value) return '';
  return String(value)
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

const isHttpImageUrl = (value: unknown): value is string => {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const url = new URL(value.trim());
    return (url.protocol === 'http:' || url.protocol === 'https:') && !value.trim().startsWith('data:');
  } catch {
    return false;
  }
};

const normalizeHttpImages = (value: unknown): { url: string; cloudinaryId?: string }[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((image: any) => {
      const url = typeof image === 'string' ? image : image?.url;
      if (!isHttpImageUrl(url)) return null;
      return { url: url.trim(), ...(typeof image === 'object' && image.cloudinaryId ? { cloudinaryId: image.cloudinaryId } : {}) };
    })
    .filter((image): image is { url: string; cloudinaryId?: string } => Boolean(image));
};

export const getAllProducts = async (req: Request, res: Response): Promise<Response> => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const includeInactive = typeof req.query.includeInactive === 'string' && req.query.includeInactive === 'true';
    const minPrice = typeof req.query.minPrice === 'string' ? Number(req.query.minPrice) : null;
    const maxPrice = typeof req.query.maxPrice === 'string' ? Number(req.query.maxPrice) : null;
    const sortOption = typeof req.query.sort === 'string' ? req.query.sort : 'latest';
    const rating = typeof req.query.rating === 'string' ? Number(req.query.rating) : null;
    const discounted = typeof req.query.discounted === 'string' && req.query.discounted === 'true';
    const featured = typeof req.query.featured === 'string' && req.query.featured === 'true';
    const tags = typeof req.query.tags === 'string' ? req.query.tags : '';
    const packaging = typeof req.query.packaging === 'string' ? req.query.packaging.trim() : '';
    const origin = typeof req.query.origin === 'string' ? req.query.origin.trim() : '';
    const queryFilters: Record<string, any>[] = [];

    if (!includeInactive) {
      queryFilters.push({ isActive: { $ne: false } });
    }

    if (search) {
      const textSearch = search.replace(/[^\p{L}\p{N}\s-]/gu, ' ').trim();
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const prefixPattern = `^${escaped}`;

      queryFilters.push({
        $or: [
          ...(textSearch ? [{ $text: { $search: textSearch } }] : []),
          { name: { $regex: prefixPattern, $options: 'i' } },
          { sku: { $regex: prefixPattern, $options: 'i' } },
          { name: { $regex: escaped, $options: 'i' } },
          { sku: { $regex: escaped, $options: 'i' } },
          { description: { $regex: escaped, $options: 'i' } },
          { packaging: { $regex: escaped, $options: 'i' } },
          { tags: { $elemMatch: { $regex: escaped, $options: 'i' } } },
          { seoKeywords: { $elemMatch: { $regex: escaped, $options: 'i' } } },
        ],
      });
    }

    if (category) {
      const categoryValues = category.split(',').map((value) => value.trim()).filter(Boolean);
      if (categoryValues.length > 0) {
        const categoryConditions = categoryValues.map((value) => {
          if (mongoose.Types.ObjectId.isValid(value)) {
            return { category: new mongoose.Types.ObjectId(value) };
          }
          return {
            $or: [
              { category: value },
              { categoryName: value },
              { categorySlug: value },
            ],
          };
        });
        queryFilters.push({ $or: categoryConditions });
      }
    }

    if (minPrice !== null && !Number.isNaN(minPrice)) {
      queryFilters.push({ price: { $gte: minPrice } });
    }

    if (maxPrice !== null && !Number.isNaN(maxPrice)) {
      queryFilters.push({ price: { $lte: maxPrice } });
    }

    if (rating !== null && !Number.isNaN(rating)) {
      queryFilters.push({ rating: { $gte: rating } });
    }

    if (discounted) {
      queryFilters.push({
        $or: [
          { discountPrice: { $exists: true, $ne: null, $gt: 0 } },
          { onSale: true },
        ],
      });
    }

    if (featured) {
      queryFilters.push({ featured: true });
    }

    if (packaging) {
      queryFilters.push({ packaging: { $regex: packaging.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } });
    }

    if (origin) {
      queryFilters.push({ origin: { $regex: origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } });
    }

    if (tags) {
      const tagValues = tags.split(',').map((value) => value.trim()).filter(Boolean);
      if (tagValues.length > 0) {
        queryFilters.push({ tags: { $elemMatch: { $in: tagValues } } });
      }
    }

    const query = queryFilters.length > 0 ? { $and: queryFilters } : {};
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      'price-low': { price: 1 },
      'price-high': { price: -1 },
      rating: { rating: -1, reviewCount: -1, createdAt: -1 },
      latest: { createdAt: -1 },
    };

    const page = typeof req.query.page === 'string' ? Math.max(1, Number(req.query.page) || 1) : 1;
    const requestedLimit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
    const limit = requestedLimit && Number.isFinite(requestedLimit)
      ? Math.min(24, Math.max(1, Number(requestedLimit)))
      : 12;
    const skip = (page - 1) * limit;

    const products = await Product.find(query)
      .select('name slug sku price discountPrice onSale saleStart saleEnd thumbnail rating reviewCount category featured isActive createdAt updatedAt description tags packaging')
      .sort(sortMap[sortOption] || sortMap.latest)
      .skip(skip)
      .limit(limit)
      .maxTimeMS(5000)
      .lean()
      .exec();

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
  const normalizedId = id?.trim();
  try {
    const byId = mongoose.Types.ObjectId.isValid(normalizedId || '') ? await Product.findById(normalizedId).lean().exec() : null;
    if (byId) {
      if (!includeInactive && byId.isActive === false) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      return res.json({ success: true, message: 'Product retrieved', data: byId });
    }

    const bySlug = normalizedId
      ? await Product.findOne({ slug: normalizedId }).lean().exec()
      : null;
    if (bySlug) {
      if (!includeInactive && bySlug.isActive === false) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      return res.json({ success: true, message: 'Product retrieved', data: bySlug });
    }

    const byCustomId = normalizedId
      ? await Product.findOne({ id: normalizedId }).lean().exec()
      : null;
    if (byCustomId) {
      if (!includeInactive && byCustomId.isActive === false) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      return res.json({ success: true, message: 'Product retrieved', data: byCustomId });
    }

    const fallbackProducts = normalizedId
      ? await Product.find({}).lean().exec()
      : [];
    const fallbackMatch = fallbackProducts.find((product: any) => createSlug(product.name || product.title || '') === normalizedId);
    if (fallbackMatch) {
      if (!includeInactive && fallbackMatch.isActive === false) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      return res.json({ success: true, message: 'Product retrieved', data: fallbackMatch });
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
    if (uploadedFiles.length > 0 && !cloudinaryConfigured) {
      return res.status(503).json({ success: false, message: 'Image uploads are temporarily unavailable. Configure Cloudinary first.' });
    }
    const normalizedImages = (await Promise.all(uploadedFiles.map(async (file: any) => {
        if (file?.buffer && Buffer.isBuffer(file.buffer)) {
          return uploadBuffer(file.buffer, 'mokshya-foods/products');
        }

        return {
          url: file?.path || file?.secure_url || file?.url || '',
          cloudinaryId: file?.filename || file?.public_id || undefined,
        };
      })))
      .filter((image: any) => image.url);
    const normalizeCategory = (value: any) => {
      if (value === undefined || value === null || value === '') return undefined;
      if (typeof value === 'string') return value;
      if (typeof value === 'object') {
        return value._id || value.id || value.slug || value.name || value.value || value.key || undefined;
      }
      return String(value);
    };

    if (body.name && !body.slug) {
      body.slug = createSlug(body.name);
    } else if (body.slug) {
      body.slug = createSlug(body.slug);
    }

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
      try { body.images = normalizeHttpImages(JSON.parse(body.images)); } catch { body.images = []; }
    } else if (body.images !== undefined) {
      body.images = normalizeHttpImages(body.images);
    } else {
      body.images = [];
    }

    if (body.thumbnail !== undefined && body.thumbnail !== '' && !isHttpImageUrl(body.thumbnail)) {
      delete body.thumbnail;
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
    if (uploadedFiles.length > 0 && !cloudinaryConfigured) {
      return res.status(503).json({ success: false, message: 'Image uploads are temporarily unavailable. Configure Cloudinary first.' });
    }
    const normalizedImages = (await Promise.all(uploadedFiles.map(async (file: any) => {
        if (file?.buffer && Buffer.isBuffer(file.buffer)) {
          return uploadBuffer(file.buffer, 'mokshya-foods/products');
        }

        return {
          url: file?.path || file?.secure_url || file?.url || '',
          cloudinaryId: file?.filename || file?.public_id || undefined,
        };
      })))
      .filter((image: any) => image.url);
    const normalizeCategory = (value: any) => {
      if (value === undefined || value === null || value === '') return undefined;
      if (typeof value === 'string') return value;
      if (typeof value === 'object') {
        return value._id || value.id || value.slug || value.name || value.value || value.key || undefined;
      }
      return String(value);
    };

    if (update.name && !update.slug) {
      update.slug = createSlug(update.name);
    } else if (update.slug) {
      update.slug = createSlug(update.slug);
    }

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

    // Handle image management
    let finalImages: any[] = [];
    
    // Check if we need to preserve existing images
    if (update.keepImages !== undefined) {
      try {
        const keepImages = typeof update.keepImages === 'string' ? JSON.parse(update.keepImages) : update.keepImages;
        if (Array.isArray(keepImages)) {
          finalImages = normalizeHttpImages(keepImages);
        }
      } catch (e) {
        console.log('Failed to parse keepImages');
      }
      delete update.keepImages; // Remove from update object
    }

    // Add new uploaded images
    if (normalizedImages.length > 0) {
      finalImages = [...finalImages, ...normalizedImages];
    }

    // Set the images in the update
    update.images = finalImages;
    if (update.thumbnail !== undefined && update.thumbnail !== '' && !isHttpImageUrl(update.thumbnail)) {
      delete update.thumbnail;
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
