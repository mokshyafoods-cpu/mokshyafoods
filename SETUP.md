# Mokshya Foods E-Commerce Setup Guide

## Project Overview
Mokshya Foods is a full-stack MERN e-commerce application for premium organic dried fruits from Nepal. The project consists of:
- **Backend**: Node.js/Express REST API with MongoDB
- **Frontend**: Next.js 16 React application
- **Database**: MongoDB Atlas
- **Storage**: Cloudinary for image management
- **Payments**: eSewa, Khalti, Fonepay integration

## Prerequisites
- Node.js 18+ and pnpm
- MongoDB Atlas account
- Cloudinary account
- Payment gateway accounts (eSewa, Khalti, Fonepay)

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
pnpm install
```

### 2. Configure Environment Variables
Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mokshya_foods
JWT_SECRET=your_jwt_secret_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

ESEWA_MERCHANT_CODE=your_esewa_code
KHALTI_PUBLIC_KEY=your_khalti_public_key
KHALTI_SECRET_KEY=your_khalti_secret_key
FONEPAY_MERCHANT_ID=your_fonepay_id

FRONTEND_URL=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_password
```

### 3. Start the Backend Server
```bash
pnpm dev
```
Server runs on http://localhost:5000

## Frontend Setup

### 1. Install Dependencies
```bash
cd frontend
pnpm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the frontend directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_APP_NAME=Mokshya Foods
```

### 3. Start the Frontend Application
```bash
pnpm dev
```
Application runs on http://localhost:3000

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Products Endpoints
- `GET /api/products` - Get all products (with pagination, filtering)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Orders Endpoints
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id` - Update order status (Admin)

### Payments Endpoints
- `POST /api/payments/initiate` - Initiate payment
- `POST /api/payments/verify` - Verify payment
- `POST /api/payments/webhook` - Payment webhook

### Categories Endpoints
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category (Admin)
- `PUT /api/categories/:id` - Update category (Admin)
- `DELETE /api/categories/:id` - Delete category (Admin)

## Admin Features
- Product management with image upload
- Category management
- Order tracking and management
- Customer management
- POS system for offline sales
- Analytics dashboard
- Review moderation
- Blog management
- Coupon management

## User Features
- Browse products
- Product filtering and search
- Add to cart and checkout
- Order tracking
- User profile management
- Address management
- Product reviews
- Wishlist

## Deployment

### Backend (Render/Railway/AWS)
1. Push code to GitHub
2. Connect to deployment platform
3. Set environment variables
4. Deploy

### Frontend (Vercel)
1. Push code to GitHub
2. Import project to Vercel
3. Set environment variables
4. Auto-deploy on push

## Database Schema

### User
- name, email, phone, password
- address (street, city, state, postalCode, country)
- role (user/admin)
- timestamps

### Product
- name, sku, description
- category reference
- price, quantity, weight
- images array (Cloudinary URLs)
- tags, specifications
- SEO fields
- timestamps

### Order
- orderNumber, status
- user reference
- items array (product, quantity, price)
- shippingAddress
- paymentMethod, paymentStatus
- totalPrice, discount
- timestamps

### Review
- product reference
- user reference
- rating, title, content
- isApproved
- timestamps

## Troubleshooting

### MongoDB Connection Issues
- Verify connection string format
- Check IP whitelist in MongoDB Atlas
- Ensure database exists

### Cloudinary Upload Issues
- Verify API credentials
- Check file size limits (5MB)
- Ensure folder exists in Cloudinary

### Payment Issues
- Verify merchant codes/keys
- Check success/failure URLs
- Test with sandbox credentials first

## Security Best Practices
- Use environment variables for sensitive data
- Implement CORS properly
- Validate all inputs
- Use HTTPS in production
- Regular security updates
- Rate limiting on API endpoints
- CSRF protection

## Support
For issues or questions, please contact the development team or check the documentation.
