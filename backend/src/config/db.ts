import mongoose from 'mongoose';

const ensureOrdersIndexes = async (): Promise<void> => {
  try {
    const ordersColl = mongoose.connection.collection('orders');

    await ordersColl.createIndex({ isDeleted: 1, createdAt: -1 }, { name: 'orders_isDeleted_createdAt_idx' });
    await ordersColl.createIndex({ status: 1, createdAt: -1 }, { name: 'orders_status_createdAt_idx' });
    await ordersColl.createIndex({ orderStatus: 1, createdAt: -1 }, { name: 'orders_orderStatus_createdAt_idx' });
    await ordersColl.createIndex({ transactionType: 1, createdAt: -1 }, { name: 'orders_transactionType_createdAt_idx' });
    await ordersColl.createIndex({ soldBy: 1, createdAt: -1 }, { name: 'orders_soldBy_createdAt_idx' });
    await ordersColl.createIndex({ userId: 1, createdAt: -1 }, { name: 'orders_userId_createdAt_idx' });
  } catch (error: unknown) {
    console.warn('Failed to ensure order indexes:', error instanceof Error ? error.message : error);
  }
};

const connectDB = async (): Promise<typeof mongoose> => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || '', {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    } as mongoose.ConnectOptions);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await ensureOrdersIndexes();
    return conn;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    console.error(`Error: ${message}`);
    process.exit(1);
  }
};

export default connectDB;
