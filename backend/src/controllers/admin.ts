import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product';

export const getDashboardStats = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const productsColl = mongoose.connection.collection('products');
    const ordersColl = mongoose.connection.collection('orders');
    const usersColl = mongoose.connection.collection('users');

    const [totalProducts, totalOrders, totalCustomers, lowStockProducts, recentOrders, revenueResult] = await Promise.all([
      productsColl.countDocuments(),
      ordersColl.countDocuments(),
      usersColl.countDocuments(),
      productsColl.countDocuments({ quantity: { $lte: 10 } }),
      ordersColl.find({}).sort({ createdAt: -1 }).limit(5).toArray(),
      ordersColl.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]).toArray(),
    ]);

    const totalRevenue = revenueResult?.[0]?.total || 0;
    const recent = (recentOrders || []).map((o: any) => ({
      orderNumber: o.orderNumber || o._id?.toString() || '',
      total: o.total || 0,
      orderStatus: o.status || o.orderStatus || 'unknown',
      createdAt: o.createdAt || o.createdAt,
    }));

    return res.json({
      success: true,
      data: {
        totalOrders: totalOrders || 0,
        totalCustomers: totalCustomers || 0,
        totalProducts: totalProducts || 0,
        lowStockProducts: lowStockProducts || 0,
        totalRevenue,
        recentOrders: recent,
      },
    });
  } catch (error: any) {
    console.error('getDashboardStats error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to compute dashboard stats' });
  }
};

export const getSalesAnalytics = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const ordersColl = mongoose.connection.collection('orders');

    const [sales, topProductsAgg] = await Promise.all([
      ordersColl
        .aggregate([
          { $match: { total: { $exists: true } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              total: { $sum: '$total' },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),
      ordersColl
        .aggregate([
          { $unwind: '$items' },
          { $group: { _id: '$items.productId', quantity: { $sum: '$items.quantity' } } },
          { $sort: { quantity: -1 } },
          { $limit: 10 },
        ])
        .toArray(),
    ]);

    const salesByDate: Record<string, number> = {};
    sales.forEach((row: any) => {
      salesByDate[row._id] = row.total || 0;
    });

    const productIds = topProductsAgg.map((p: any) => p._id).filter(Boolean);
    const topProducts: Array<{ name: string; quantity: number }> = [];
    if (productIds.length > 0) {
      const prodColl = mongoose.connection.collection('products');
      const prods = await prodColl.find({ _id: { $in: productIds.map((id: any) => (mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id)) } }).toArray();
      topProductsAgg.forEach((p: any) => {
        const found = prods.find((x: any) => x._id?.toString() === p._id?.toString());
        topProducts.push({ name: found?.name || (p._id?.toString() ?? 'Unknown'), quantity: p.quantity });
      });
    }

    return res.json({ success: true, data: { salesByDate, topProducts } });
  } catch (error: any) {
    console.error('getSalesAnalytics error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to compute analytics' });
  }
};

export const getLowStockProducts = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const productsColl = mongoose.connection.collection('products');
    const rows = await productsColl.find({ quantity: { $lte: 10 } }).sort({ quantity: 1 }).toArray();
    return res.json({ success: true, data: rows });
  } catch (error: any) {
    console.error('getLowStockProducts error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch low stock products' });
  }
};

export const updateStock = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body as { quantity?: number };
    if (!productId) return res.status(400).json({ success: false, message: 'productId is required' });
    if (quantity == null) return res.status(400).json({ success: false, message: 'quantity is required' });

    const productsColl = mongoose.connection.collection('products');
    const filter = mongoose.Types.ObjectId.isValid(String(productId)) ? { _id: new mongoose.Types.ObjectId(String(productId)) } : { id: productId };
    const result = await productsColl.updateOne(filter, { $set: { quantity, updatedAt: new Date() } });
    if (result.matchedCount === 0) return res.status(404).json({ success: false, message: 'Product not found' });
    return res.json({ success: true, message: 'Stock updated' });
  } catch (error: any) {
    console.error('updateStock error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update stock' });
  }
};

export default {
  getDashboardStats,
  getSalesAnalytics,
  getLowStockProducts,
  updateStock,
};
