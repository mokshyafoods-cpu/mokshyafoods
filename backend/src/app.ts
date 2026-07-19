import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import orderRoutes from './routes/orders';
import userRoutes from './routes/users';
import reviewRoutes from './routes/reviews';
import blogRoutes from './routes/blog';
import contactRoutes from './routes/contact';
import couponRoutes from './routes/coupons';
import adminRoutes from './routes/admin';
import devRoutes from './routes/dev';
import paymentRoutes from './routes/payments';
import posRoutes from './routes/pos';

dotenv.config();

const app = express();

app.use(helmet());

const allowedOrigin = process.env.FRONTEND_URL;
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/admin', adminRoutes);
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/dev', devRoutes);
}
app.use('/api/payments', paymentRoutes);
app.use('/api/pos', posRoutes);

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};

app.use(errorHandler);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

export default app;
