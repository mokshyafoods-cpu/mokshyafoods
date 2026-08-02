require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI missing');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000, maxPoolSize: 10 });
    const db = conn.connection.db;
    const coll = db.collection('products');

    const stats = await db.command({ collStats: 'products' });
    console.log('PRODUCTS_STATS', JSON.stringify({ count: stats.count, storageSize: stats.storageSize, totalIndexSize: stats.totalIndexSize, avgObjSize: stats.avgObjSize, nindexes: stats.nindexes }));

    const indexes = await coll.indexes();
    console.log('PRODUCTS_INDEXES', JSON.stringify(indexes));

    const query = {
      $and: [
        { isActive: { $ne: false } },
        {
          $or: [
            { name: { $regex: 'test', $options: 'i' } },
            { sku: { $regex: 'test', $options: 'i' } },
            { description: { $regex: 'test', $options: 'i' } },
            { packaging: { $regex: 'test', $options: 'i' } },
            { tags: { $elemMatch: { $regex: 'test', $options: 'i' } } },
            { seoKeywords: { $elemMatch: { $regex: 'test', $options: 'i' } } },
          ],
        },
      ],
    };

    const before = Date.now();
    const explain = await coll.find(query).sort({ createdAt: -1 }).limit(100).explain('executionStats');
    const after = Date.now();
    console.log('EXPLAIN_DURATION_MS', after - before);
    console.log('EXPLAIN_PLAN', JSON.stringify(explain));

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('ERROR', error);
    process.exit(1);
  }
}

main();
