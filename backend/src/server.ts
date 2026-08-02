import app from './app';
import connectDB from './config/db';

const PORT = process.env.PORT || '5000';

const validateEnv = (): void => {
  const required = ['MONGODB_URI', 'JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

const startServer = async (): Promise<void> => {
  try {
    validateEnv();
    await connectDB();
    app.set('trust proxy', 1);
    app.listen(Number(PORT), () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

void startServer();
