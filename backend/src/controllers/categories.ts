import { Request, Response } from 'express';

const sampleCategories = [
  { _id: 'category-dried-fruits', id: 'category-dried-fruits', name: 'Dried Fruits', slug: 'dried-fruits' },
  { _id: 'category-powder', id: 'category-powder', name: 'Powder', slug: 'powder' },
  { _id: 'category-pickle', id: 'category-pickle', name: 'Pickle', slug: 'pickle' },
];

export const getAllCategories = async (_req: Request, res: Response): Promise<Response> => {
  return res.json({ success: true, message: 'Categories loaded', data: sampleCategories });
};

export const getCategoryById = async (req: Request, res: Response): Promise<Response> => {
  const category = sampleCategories.find((item) => item._id === req.params.id || item.id === req.params.id) || sampleCategories[0];
  return res.json({ success: true, message: 'Category retrieved', data: category });
};

export const createCategory = async (_req: Request, res: Response): Promise<Response> => {
  return res.status(201).json({ success: true, message: 'Category created', data: sampleCategories[0] });
};

export const updateCategory = async (_req: Request, res: Response): Promise<Response> => {
  return res.json({ success: true, message: 'Category updated', data: sampleCategories[0] });
};

export const deleteCategory = async (_req: Request, res: Response): Promise<Response> => {
  return res.json({ success: true, message: 'Category deleted' });
};

export default {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
