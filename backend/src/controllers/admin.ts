import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product';
import RawMaterial from '../models/RawMaterial';
import ProductionBatch from '../models/ProductionBatch';

const getMonthRange = (month?: string) => {
  const target = month ? new Date(`${month}-01T00:00:00`) : new Date();
  const start = new Date(target.getFullYear(), target.getMonth(), 1);
  const end = new Date(target.getFullYear(), target.getMonth() + 1, 1);
  return { start, end };
};

const getReportRange = (month?: string, startDate?: string, endDate?: string) => {
  const normalizeDate = (value?: string): Date | null => {
    if (!value) return null;
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);

  if (start && end) {
    const inclusiveEnd = new Date(end);
    inclusiveEnd.setHours(23, 59, 59, 999);
    return { start, end: inclusiveEnd };
  }

  if (start && !end) {
    const inclusiveEnd = new Date(start);
    inclusiveEnd.setHours(23, 59, 59, 999);
    return { start, end: inclusiveEnd };
  }

  if (!start && end) {
    const normalizedStart = new Date(end);
    normalizedStart.setHours(0, 0, 0, 0);
    return { start: normalizedStart, end: new Date(end.setHours(23, 59, 59, 999)) };
  }

  return getMonthRange(month);
};

export const shouldIncludeOrderInRevenue = (order: any): boolean => {
  if (!order || order.isDeleted) return false;
  const status = String(order.status || order.orderStatus || '').toLowerCase();
  const paymentStatus = String(order.paymentStatus || '').toLowerCase();
  return status !== 'cancelled' && paymentStatus !== 'cancelled';
};

export const getDashboardStats = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const productsColl = mongoose.connection.collection('products');
    const ordersColl = mongoose.connection.collection('orders');
    const usersColl = mongoose.connection.collection('users');
    const activeOrderFilter = {
      isDeleted: { $ne: true },
      $and: [
        {
          $or: [
            { status: { $ne: 'cancelled' } },
            { status: { $exists: false } },
            { orderStatus: { $ne: 'cancelled' } },
            { orderStatus: { $exists: false } },
          ],
        },
        {
          $or: [
            { paymentStatus: { $ne: 'cancelled' } },
            { paymentStatus: { $exists: false } },
          ],
        },
      ],
    };

    const [totalProducts, totalOrders, totalCustomers, lowStockProducts, recentOrders, revenueResult] = await Promise.all([
      productsColl.countDocuments(),
      ordersColl.countDocuments(activeOrderFilter),
      usersColl.countDocuments(),
      productsColl.countDocuments({ quantity: { $lte: 10 } }),
      ordersColl.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).limit(5).toArray(),
      ordersColl.aggregate([{ $match: activeOrderFilter }, { $group: { _id: null, total: { $sum: '$total' } } }]).toArray(),
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

    const normalizePaymentMethod = (value: unknown): string => {
      const raw = String(value ?? 'cash').trim().toLowerCase();
      if (!raw || raw === 'cash4' || raw === 'cash') return 'cash';
      if (raw.includes('fonepay') || raw.includes('phonepay')) return 'fonepay';
      if (raw === 'cod') return 'cod';
      return raw;
    };

    const [sales, topProductsAgg, paymentBreakdownAgg, paymentProductAgg] = await Promise.all([
      ordersColl
        .aggregate([
          { $match: { total: { $exists: true }, isDeleted: { $ne: true } } },
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
          { $match: { isDeleted: { $ne: true } } },
          { $unwind: '$items' },
          { $group: { _id: '$items.productId', quantity: { $sum: '$items.quantity' } } },
          { $sort: { quantity: -1 } },
          { $limit: 10 },
        ])
        .toArray(),
      ordersColl
        .aggregate([
          { $match: { total: { $exists: true }, isDeleted: { $ne: true } } },
          {
            $project: {
              paymentMethod: { $ifNull: ['$paymentMethod', '$paymentStatus'] },
              total: { $ifNull: ['$total', 0] },
            },
          },
          {
            $group: {
              _id: '$paymentMethod',
              total: { $sum: '$total' },
              count: { $sum: 1 },
            },
          },
          { $sort: { total: -1, count: -1 } },
        ])
        .toArray(),
      ordersColl
        .aggregate([
          { $match: { isDeleted: { $ne: true } } },
          { $unwind: '$items' },
          {
            $project: {
              paymentMethod: { $ifNull: ['$paymentMethod', '$paymentStatus'] },
              product: { $ifNull: ['$items.name', '$items.productName', 'Unknown product'] },
              quantity: { $ifNull: ['$items.quantity', 0] },
              subtotal: { $ifNull: ['$items.subtotal', 0] },
            },
          },
          {
            $group: {
              _id: { paymentMethod: '$paymentMethod', product: '$product' },
              quantity: { $sum: '$quantity' },
              total: { $sum: '$subtotal' },
            },
          },
          { $sort: { total: -1, quantity: -1 } },
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

    const paymentBreakdown = paymentBreakdownAgg
      .map((row: any) => ({
        method: normalizePaymentMethod(row._id),
        total: Number(row.total || 0),
        count: Number(row.count || 0),
      }))
      .sort((a: any, b: any) => b.total - a.total);

    const productByPaymentMethod = paymentProductAgg
      .map((row: any) => ({
        method: normalizePaymentMethod(row._id?.paymentMethod),
        product: String(row._id?.product || 'Unknown product'),
        quantity: Number(row.quantity || 0),
        total: Number(row.total || 0),
      }))
      .sort((a: any, b: any) => b.total - a.total);

    return res.json({ success: true, data: { salesByDate, topProducts, paymentBreakdown, productByPaymentMethod } });
  } catch (error: any) {
    console.error('getSalesAnalytics error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to compute analytics' });
  }
};

export const getLowStockProducts = async (req: Request, res: Response): Promise<Response> => {
  try {
    const threshold = Number(req.query.threshold ?? 10);
    const safeThreshold = Number.isFinite(threshold) && threshold >= 0 ? threshold : 10;

    const productsColl = mongoose.connection.collection('products');
    const rows = await productsColl
      .find({
        isActive: { $ne: false },
        quantity: { $lte: safeThreshold },
      })
      .sort({ quantity: 1, updatedAt: -1 })
      .toArray();

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

export const getRawMaterials = async (req: Request, res: Response): Promise<Response> => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 10)));
    const search = String(req.query.search || '').trim();
    const startDate = req.query.startDate ? new Date(String(req.query.startDate)) : undefined;
    const endDate = req.query.endDate ? new Date(String(req.query.endDate)) : undefined;

    const query: Record<string, any> = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (startDate || endDate) {
      query.purchaseDate = {};
      if (startDate) query.purchaseDate.$gte = startDate;
      if (endDate) query.purchaseDate.$lte = endDate;
    }

    const [rows, total] = await Promise.all([
      RawMaterial.find(query).sort({ purchaseDate: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      RawMaterial.countDocuments(query),
    ]);

    return res.json({ success: true, data: { rows, total, page, limit } });
  } catch (error: any) {
    console.error('getRawMaterials error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch raw materials' });
  }
};

export const createRawMaterial = async (req: Request, res: Response): Promise<Response> => {
  try {
    const body = req.body || {};
    const quantity = Number(body.quantityPurchased || body.quantity || 0);
    const unitCost = Number(body.costPerUnit || body.unitCost || 0);
    const travelCost = Number(body.travelCost || 0);
    const doc = new RawMaterial({
      name: String(body.name || '').trim(),
      supplier: String(body.supplier || '').trim(),
      quantityPurchased: quantity,
      unit: String(body.unit || 'kg').trim(),
      costPerUnit: unitCost,
      travelCost,
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : new Date(),
      notes: String(body.notes || '').trim(),
    });

    if (!doc.name) {
      return res.status(400).json({ success: false, message: 'Raw material name is required' });
    }

    await doc.save();
    return res.status(201).json({ success: true, message: 'Raw material added', data: doc.toObject() });
  } catch (error: any) {
    console.error('createRawMaterial error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Failed to add raw material' });
  }
};

export const updateRawMaterial = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const quantity = Number(body.quantityPurchased ?? body.quantity ?? undefined);
    const unitCost = Number(body.costPerUnit ?? body.unitCost ?? undefined);

    const update: Record<string, any> = {};

    if (body.name != null) update.name = String(body.name).trim();
    if (body.supplier != null) update.supplier = String(body.supplier).trim();
    if (quantity != null) update.quantityPurchased = quantity;
    if (body.unit != null) update.unit = String(body.unit).trim();
    if (unitCost != null) update.costPerUnit = unitCost;
    if (body.travelCost != null) update.travelCost = Number(body.travelCost);
    if (body.purchaseDate != null) update.purchaseDate = new Date(body.purchaseDate);
    if (body.notes != null) update.notes = String(body.notes).trim();

    const result = await RawMaterial.updateOne({ _id: new mongoose.Types.ObjectId(String(id)) } as any, { $set: update });
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Raw material not found' });
    }
    return res.json({ success: true, message: 'Raw material updated' });
  } catch (error: any) {
    console.error('updateRawMaterial error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update raw material' });
  }
};

export const deleteRawMaterial = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    await RawMaterial.deleteOne({ _id: new mongoose.Types.ObjectId(String(id)) } as any);
    return res.json({ success: true, message: 'Raw material deleted' });
  } catch (error: any) {
    console.error('deleteRawMaterial error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete raw material' });
  }
};

export const getProductionBatches = async (req: Request, res: Response): Promise<Response> => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 10)));
    const search = String(req.query.search || '').trim();

    const query: Record<string, any> = {};
    if (search) {
      query.productName = { $regex: search, $options: 'i' };
    }

    const [rows, total] = await Promise.all([
      ProductionBatch.find(query).sort({ productionDate: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      ProductionBatch.countDocuments(query),
    ]);

    return res.json({ success: true, data: { rows, total, page, limit } });
  } catch (error: any) {
    console.error('getProductionBatches error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch production batches' });
  }
};

export const createProductionBatch = async (req: Request, res: Response): Promise<Response> => {
  try {
    const body = req.body || {};
    const doc = new ProductionBatch({
      batchNumber: String(body.batchNumber || `BATCH-${Date.now()}`).trim(),
      product: body.product || null,
      productName: String(body.productName || '').trim(),
      rawMaterialsUsed: Array.isArray(body.rawMaterialsUsed) ? body.rawMaterialsUsed : [],
      quantityProduced: Number(body.quantityProduced || 0),
      productionDate: body.productionDate ? new Date(body.productionDate) : new Date(),
      staffInCharge: String(body.staffInCharge || '').trim(),
      notes: String(body.notes || '').trim(),
    });

    if (!doc.productName) {
      return res.status(400).json({ success: false, message: 'Product name is required' });
    }

    await doc.save();
    return res.status(201).json({ success: true, message: 'Production batch created', data: doc.toObject() });
  } catch (error: any) {
    console.error('createProductionBatch error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Failed to create production batch' });
  }
};

export const updateProductionBatch = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const update: Record<string, any> = {};

    if (body.batchNumber != null) update.batchNumber = String(body.batchNumber).trim();
    if (body.product != null) update.product = body.product;
    if (body.productName != null) update.productName = String(body.productName).trim();
    if (body.rawMaterialsUsed != null) update.rawMaterialsUsed = Array.isArray(body.rawMaterialsUsed) ? body.rawMaterialsUsed : [];
    if (body.quantityProduced != null) update.quantityProduced = Number(body.quantityProduced || 0);
    if (body.productionDate != null) update.productionDate = new Date(body.productionDate);
    if (body.staffInCharge != null) update.staffInCharge = String(body.staffInCharge).trim();
    if (body.notes != null) update.notes = String(body.notes).trim();

    const result = await ProductionBatch.updateOne({ _id: new mongoose.Types.ObjectId(String(id)) } as any, { $set: update });
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Production batch not found' });
    }
    return res.json({ success: true, message: 'Production batch updated' });
  } catch (error: any) {
    console.error('updateProductionBatch error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update production batch' });
  }
};

export const deleteProductionBatch = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    await ProductionBatch.deleteOne({ _id: new mongoose.Types.ObjectId(String(id)) } as any);
    return res.json({ success: true, message: 'Production batch deleted' });
  } catch (error: any) {
    console.error('deleteProductionBatch error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete production batch' });
  }
};

export const getMonthlyBusinessReport = async (req: Request, res: Response): Promise<Response> => {
  try {
    const month = String(req.query.month || '').trim();
    const startDate = String(req.query.startDate || '').trim() || undefined;
    const endDate = String(req.query.endDate || '').trim() || undefined;
    const { start, end } = getReportRange(month || undefined, startDate, endDate);
    const [rawMaterials, batches, allOrders] = await Promise.all([
      RawMaterial.find({ purchaseDate: { $gte: start, $lte: end } }).sort({ purchaseDate: -1 }).lean(),
      ProductionBatch.find({ productionDate: { $gte: start, $lte: end } }).sort({ productionDate: -1 }).lean(),
      mongoose.connection.collection('orders').find({ createdAt: { $gte: start, $lte: end } }).sort({ createdAt: -1 }).toArray(),
    ]);

    const websiteSales = allOrders.reduce((sum: number, order: any) => {
      const channel = String(order.channel || '').toLowerCase();
      const transactionType = String(order.transactionType || 'customer_sale').trim();
      if (transactionType === 'partner_product_taken') return sum;
      return channel === 'pos' ? sum : sum + Number(order.total || 0);
    }, 0);

    const posSales = allOrders.reduce((sum: number, order: any) => {
      const channel = String(order.channel || '').toLowerCase();
      const transactionType = String(order.transactionType || 'customer_sale').trim();
      return channel === 'pos' && transactionType !== 'partner_product_taken' ? sum + Number(order.total || 0) : sum;
    }, 0);

    const totalSales = websiteSales + posSales;

    const productionByProduct = batches.reduce((acc: Record<string, number>, batch: any) => {
      const key = String(batch.productName || 'Unknown').trim();
      acc[key] = (acc[key] || 0) + Number(batch.quantityProduced || 0);
      return acc;
    }, {});

    const rawMaterialSpend = rawMaterials.reduce((sum: number, row: any) => sum + Number(row.totalCost || 0), 0);
    const rawMaterialBreakdown = rawMaterials.reduce((acc: Record<string, number>, row: any) => {
      const key = String(row.name || 'Unknown').trim();
      acc[key] = (acc[key] || 0) + Number(row.totalCost || 0);
      return acc;
    }, {});

    const partnerProductsTakenCount = allOrders.reduce((count: number, order: any) => {
      const transactionType = String(order.transactionType || 'customer_sale').trim();
      return transactionType === 'partner_product_taken' ? count + 1 : count;
    }, 0);

    const partnerSalesValue = allOrders.reduce((sum: number, order: any) => {
      const transactionType = String(order.transactionType || 'customer_sale').trim();
      return transactionType === 'partner_sale' ? sum + Number(order.total || 0) : sum;
    }, 0);

    return res.json({
      success: true,
      data: {
        month: month || `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
        rawMaterialSpend,
        rawMaterialBreakdown,
        rawMaterials,
        productionBatches: batches,
        productionByProduct,
        totalSales,
        websiteSales,
        posSales,
        partnerProductsTakenCount,
        partnerSalesValue,
        ordersCount: allOrders.length,
      },
    });
  } catch (error: any) {
    console.error('getMonthlyBusinessReport error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to generate monthly business report' });
  }
};

export default {
  getDashboardStats,
  getSalesAnalytics,
  getLowStockProducts,
  updateStock,
  getRawMaterials,
  createRawMaterial,
  updateRawMaterial,
  deleteRawMaterial,
  getProductionBatches,
  createProductionBatch,
  updateProductionBatch,
  deleteProductionBatch,
  getMonthlyBusinessReport,
};
