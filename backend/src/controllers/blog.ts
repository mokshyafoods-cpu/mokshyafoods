import { Request, Response } from 'express';
import mongoose from 'mongoose';

const collectionName = 'blogPosts';

const normalizeSlug = (value: string): string =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const getBlogCollection = () => mongoose.connection.collection(collectionName);

export const getAllPosts = async (req: Request, res: Response): Promise<Response> => {
  try {
    const category = req.query.category ? String(req.query.category).trim() : undefined;
    const search = req.query.search ? String(req.query.search).trim() : undefined;
    const isAdmin = req.query.admin === 'true';

    const filter: any = {};
    if (!isAdmin) {
      filter.isPublished = true;
    }
    if (category) {
      filter.category = category;
    }
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ title: regex }, { excerpt: regex }, { content: regex }, { tags: regex }];
    }

    const posts = await getBlogCollection()
      .find(filter)
      .sort({ publishedAt: -1, createdAt: -1 })
      .toArray();

    return res.json({ success: true, message: 'Blog posts loaded', data: posts });
  } catch (error: any) {
    console.error('getAllPosts error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to load blog posts' });
  }
};

export const getPostBySlug = async (req: Request, res: Response): Promise<Response> => {
  try {
    const slug = String(req.params.slug || '').trim();
    if (!slug) {
      return res.status(400).json({ success: false, message: 'Blog post slug is required' });
    }

    const post = await getBlogCollection().findOne({ slug, isPublished: true });
    if (!post) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }

    return res.json({ success: true, message: 'Blog post loaded', data: post });
  } catch (error: any) {
    console.error('getPostBySlug error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to load blog post' });
  }
};

export const createPost = async (req: Request, res: Response): Promise<Response> => {
  try {
    const body = req.body || {};
    const title = String(body.title || '').trim();
    const content = String(body.content || '').trim();
    const slug = normalizeSlug(body.slug || title);

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    if (!slug) {
      return res.status(400).json({ success: false, message: 'Valid slug is required' });
    }

    const existing = await getBlogCollection().findOne({ slug });
    if (existing) {
      return res.status(409).json({ success: false, message: 'A blog post with this slug already exists' });
    }

    const now = new Date();
    const post = {
      title,
      content,
      slug,
      category: String(body.category || '').trim(),
      excerpt: String(body.excerpt || '').trim(),
      tags: Array.isArray(body.tags) ? body.tags : typeof body.tags === 'string' ? body.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [],
      featuredImage: String(body.featuredImage || '').trim(),
      seoTitle: String(body.seoTitle || '').trim(),
      seoDescription: String(body.seoDescription || '').trim(),
      isPublished: false,
      createdAt: now,
      updatedAt: now,
    };

    const result = await getBlogCollection().insertOne(post);
    return res.status(201).json({ success: true, message: 'Blog post created', data: { ...post, _id: result.insertedId } });
  } catch (error: any) {
    console.error('createPost error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create blog post' });
  }
};

export const updatePost = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = String(req.params.id || '').trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Valid blog post ID is required' });
    }

    const body = req.body || {};
    const update: any = {};
    if (body.title) update.title = String(body.title).trim();
    if (body.content) update.content = String(body.content).trim();
    if (body.slug) update.slug = normalizeSlug(String(body.slug));
    if (body.category) update.category = String(body.category).trim();
    if (body.excerpt) update.excerpt = String(body.excerpt).trim();
    if (body.tags) update.tags = Array.isArray(body.tags) ? body.tags : typeof body.tags === 'string' ? body.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [];
    if (body.featuredImage) update.featuredImage = String(body.featuredImage).trim();
    if (body.seoTitle) update.seoTitle = String(body.seoTitle).trim();
    if (body.seoDescription) update.seoDescription = String(body.seoDescription).trim();

    if (update.slug) {
      const existing = await getBlogCollection().findOne({ slug: update.slug, _id: { $ne: new mongoose.Types.ObjectId(id) } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'A blog post with this slug already exists' });
      }
    }

    update.updatedAt = new Date();

    const result = await getBlogCollection().findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: update },
      { returnDocument: 'after' as any }
    );

    const updatedPost = (result as any)?.value;
    if (!updatedPost) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }

    return res.json({ success: true, message: 'Blog post updated', data: updatedPost });
  } catch (error: any) {
    console.error('updatePost error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update blog post' });
  }
};

export const publishPost = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = String(req.params.id || '').trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Valid blog post ID is required' });
    }

    const result = await getBlogCollection().findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: { isPublished: true, publishedAt: new Date(), updatedAt: new Date() } },
      { returnDocument: 'after' as any }
    );

    const updatedPost = (result as any)?.value;
    if (!updatedPost) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }

    return res.json({ success: true, message: 'Blog post published', data: updatedPost });
  } catch (error: any) {
    console.error('publishPost error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to publish blog post' });
  }
};

export const deletePost = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = String(req.params.id || '').trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Valid blog post ID is required' });
    }

    const result = await getBlogCollection().deleteOne({ _id: new mongoose.Types.ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }

    return res.json({ success: true, message: 'Blog post deleted' });
  } catch (error: any) {
    console.error('deletePost error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete blog post' });
  }
};

export default {
  getAllPosts,
  getPostBySlug,
  createPost,
  updatePost,
  publishPost,
  deletePost,
};
