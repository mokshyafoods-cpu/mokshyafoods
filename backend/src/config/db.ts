import mongoose from 'mongoose';

const connectDB = async (): Promise<typeof mongoose> => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || '', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as mongoose.ConnectOptions);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    console.error(`Error: ${message}`);
    process.exit(1);
  }
};

export default connectDB;
