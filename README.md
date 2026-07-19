# Mokshya Foods - Premium Organic Dried Fruits E-Commerce Platform

A modern, production-ready full-stack e-commerce application built with the MERN stack for selling premium organic dried fruits from Nepal.

## 🌟 Features

### For Customers
- ✅ Product browsing with advanced filtering and search
- ✅ Secure user authentication (registration/login)
- ✅ Shopping cart with quantity management
- ✅ Multiple payment options (Cash on Delivery, eSewa, Khalti, Fonepay)
- ✅ Order management and tracking
- ✅ User profile and address management
- ✅ Product reviews and ratings
- ✅ Responsive design (mobile-first)
- ✅ Newsletter subscription
- ✅ Blog and content management

### For Administrators
- ✅ Product management with Cloudinary image uploads
- ✅ Category management
- ✅ Order management and status tracking
- ✅ Customer management
- ✅ POS system for offline sales
- ✅ Analytics dashboard
- ✅ Review moderation
- ✅ Blog management
- ✅ Coupon/discount management
- ✅ Inventory tracking

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB Atlas
- **Authentication**: JWT
- **File Storage**: Cloudinary
- **Image Processing**: Multer + Cloudinary
- **Payment**: eSewa, Khalti, Fonepay APIs

### Frontend
- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios + SWR
- **UI Components**: shadcn/ui
- **Notifications**: React Hot Toast
- **Image Upload**: next-cloudinary

## 📁 Project Structure

```
mokshya-foods/
├── backend/
│   ├── src/
│   │   ├── config/          # Database & Cloudinary config
│   │   ├── controllers/     # Route handlers
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Auth & error handling
│   │   ├── utils/           # Helpers
│   │   ├── app.js          # Express app
│   │   └── server.js       # Entry point
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/         # Authentication pages
│   │   ├── admin/          # Admin dashboard
│   │   ├── products/       # Product pages
│   │   ├── checkout/       # Checkout flow
│   │   ├── cart/           # Shopping cart
│   │   ├── orders/         # Order history
│   │   ├── blog/           # Blog pages
│   │   └── page.tsx        # Homepage
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── context/        # Context providers
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom hooks
│   │   └── utils/          # Utilities
│   ├── public/             # Static files
│   └── package.json
│
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- MongoDB Atlas account
- Cloudinary account

### Installation

1. **Clone and Setup**
```bash
cd /vercel/share/v0-project
```

2. **Backend Setup**
```bash
cd backend
pnpm install
# Create .env file with your credentials
pnpm dev
```

3. **Frontend Setup** (in new terminal)
```bash
cd frontend
pnpm install
# Create .env.local file
pnpm dev
```

4. **Access Application**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- API Docs: http://localhost:5000/api

## 📝 Environment Variables

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
ESEWA_MERCHANT_CODE=...
KHALTI_PUBLIC_KEY=...
KHALTI_SECRET_KEY=...
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
```

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- CORS protection
- Input validation and sanitization
- Environment variable protection
- Role-based access control (Admin/User)

## 📊 API Response Format

All API endpoints return consistent JSON responses:

```json
{
  "success": true,
  "message": "Success message",
  "data": {},
  "pagination": {
    "total": 100,
    "page": 1,
    "pages": 10
  }
}
```

## 💳 Payment Integration

### Supported Methods
1. **Cash on Delivery** - No integration needed
2. **eSewa** - Nepali payment gateway
3. **Khalti** - Mobile wallet
4. **Fonepay** - Mobile payment

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Tested on iOS and Android
- Progressive enhancement

## 🎨 Design System

### Color Palette
- Primary: #2c2416 (Deep Navy)
- Secondary: #d4a574 (Warm Beige)
- Accent: #c89968 (Gold)
- Background: #f5f0e8 (Off-white)

### Typography
- Headings: Geist Sans Bold
- Body: Geist Sans Regular
- Code: Geist Mono

## 📈 Performance

- Optimized images with Cloudinary
- Lazy loading components
- Code splitting with Next.js
- Database indexing
- Caching strategies

## 🧪 Testing

```bash
# Backend tests
cd backend
pnpm test

# Frontend tests
cd frontend
pnpm test
```

## 🚢 Deployment

### Backend Options
- Render, Railway, AWS EC2, Digital Ocean

### Frontend Options
- Vercel (recommended), Netlify, AWS S3 + CloudFront

See [SETUP.md](./SETUP.md) for detailed deployment instructions.

## 📚 Documentation

- [Setup Guide](./SETUP.md) - Installation and configuration
- API Documentation available at `/api/docs` (when deployed)
- Component documentation in each component file

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Error**
- Check connection string format
- Verify IP whitelist in MongoDB Atlas

**Cloudinary Upload Fails**
- Verify API credentials
- Check file size (max 5MB)
- Ensure folder exists

**Payment Not Working**
- Verify merchant codes in .env
- Use test credentials first
- Check callback URLs

See [SETUP.md](./SETUP.md) for more troubleshooting.

## 📞 Support

For issues, questions, or contributions, please:
1. Check documentation
2. Create an issue on GitHub
3. Contact the development team

## 📄 License

This project is private and proprietary to Mokshya Foods.

## 🙏 Credits

Built with modern technologies and best practices for e-commerce platforms.

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Status**: Production Ready
