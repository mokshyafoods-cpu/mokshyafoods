import { Request, Response } from 'express';

export const getAllPosts = async (_req: Request, res: Response): Promise<Response> => {
  return res.status(501).json({ success: false, message: 'Blog listing is not implemented yet' });
};

export const getPostBySlug = async (_req: Request, res: Response): Promise<Response> => {
  return res.status(501).json({ success: false, message: 'Blog post lookup is not implemented yet' });
};

export const createPost = async (_req: Request, res: Response): Promise<Response> => {
  return res.status(501).json({ success: false, message: 'Blog post creation is not implemented yet' });
};

export const updatePost = async (_req: Request, res: Response): Promise<Response> => {
  return res.status(501).json({ success: false, message: 'Blog post update is not implemented yet' });
};

export const publishPost = async (_req: Request, res: Response): Promise<Response> => {
  return res.status(501).json({ success: false, message: 'Blog post publish is not implemented yet' });
};

export const deletePost = async (_req: Request, res: Response): Promise<Response> => {
  return res.status(501).json({ success: false, message: 'Blog post deletion is not implemented yet' });
};

export default {
  getAllPosts,
  getPostBySlug,
  createPost,
  updatePost,
  publishPost,
  deletePost,
};
