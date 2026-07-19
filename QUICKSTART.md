# Mokshya Foods - Quick Start Guide

Get up and running in 5 minutes! ⚡

## Prerequisites
- Node.js 18+ and pnpm
- MongoDB Atlas account
- Cloudinary account

## 🚀 5-Minute Setup

### Step 1: Backend Setup (1 min)
```bash
cd backend
pnpm install

# Create .env file with these essential variables:
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_random_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Step 2: Frontend Setup (1 min)
```bash
cd frontend
pnpm install

# Create .env.local file:
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

### Step 3: Seed Database (1 min)
```bash
cd backend
node src/seeds/seed.js
```

### Step 4: Start Servers (1 min)
```bash
# Terminal 1: Backend
cd backend
pnpm dev

# Terminal 2: Frontend
cd frontend
pnpm dev
```

### Step 5: Access Application (1 min)
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## 🔑 Test Credentials

After running the seed script, use these credentials:

**Admin Account**
- Email: admin@mokshya.com
- Password: admin123
- Access: /admin

**Regular User Account**
- Email: user@mokshya.com
- Password: user1234
- Access: All customer features

## 📁 Project Structure at a Glance

```
backend/                    Frontend/
├── src/                    ├── app/
│   ├── models/            │   ├── (auth)/
│   ├── controllers/       │   ├── admin/
│   ├── routes/            │   ├── products/
│   ├── middleware/        │   ├── checkout/
│   └── config/            │   └── page.tsx
├── package.json           ├── src/
└── .env                   │   ├── components/
                          │   ├── services/
                          │   └── context/
                          ├── package.json
                          └── .env.local
```

## 🎯 Common Tasks

### Add a New Product (Admin)
1. Go to http://localhost:3000/admin
2. Login with admin credentials
3. Click "New Product"
4. Upload images via Cloudinary
5. Fill form and submit

### Make a Purchase (User)
1. Go to http://localhost:3000/products
2. Browse and select product
3. Add to cart
4. Go to checkout
5. Choose payment method (Cash on Delivery recommended for testing)
6. Complete order

### View Orders (Admin)
1. Go to /admin
2. Check "Orders" section
3. View order details and update status

## 🧪 API Testing

### Create Product
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Test Product" \
  -F "sku=TEST-001" \
  -F "price=500" \
  -F "images=@image.jpg"
```

### Get All Products
```bash
curl http://localhost:5000/api/products
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mokshya.com","password":"admin123"}'
```

## 🔧 Environment Variables

### Backend (.env)
```env
# Server
PORT=5000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mokshya_foods

# Authentication
JWT_SECRET=your_jwt_secret_key

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Payment Gateways
ESEWA_MERCHANT_CODE=your_code
KHALTI_PUBLIC_KEY=your_public_key
KHALTI_SECRET_KEY=your_secret_key
FONEPAY_MERCHANT_ID=your_merchant_id

# URLs
FRONTEND_URL=http://localhost:3000

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_password
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_APP_NAME=Mokshya Foods
```

## ❓ Troubleshooting

### Port Already in Use
```bash
# Change port in backend .env
PORT=5001

# Change API URL in frontend .env.local
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

### MongoDB Connection Error
- Check connection string format
- Verify IP whitelist in MongoDB Atlas (add 0.0.0.0/0 for development)

### Cloudinary Upload Fails
- Verify API credentials
- Check file size (max 5MB)
- Ensure allowed formats (jpg, png, gif, webp)

### Port 3000/5000 Already in Use
```bash
# Find and kill process using port
lsof -i :3000
kill -9 <PID>

# Or use different port
PORT=5001 pnpm dev
```

## 📚 Documentation

- **Complete Setup**: See [SETUP.md](./SETUP.md)
- **Development**: See [DEVELOPMENT.md](./DEVELOPMENT.md)
- **Features**: See [README.md](./README.md)
- **Completion**: See [PROJECT_COMPLETION.md](./PROJECT_COMPLETION.md)

## 🚀 Deploy to Production

### Backend Options
- **Render**: [render.com](https://render.com)
- **Railway**: [railway.app](https://railway.app)
- **AWS**: EC2, Elastic Beanstalk
- **DigitalOcean**: [digitalocean.com](https://digitalocean.com)

### Frontend Options
- **Vercel** (Recommended): [vercel.com](https://vercel.com)
- **Netlify**: [netlify.com](https://netlify.com)
- **AWS**: S3 + CloudFront

## 💡 Pro Tips

1. **Use MongoDB Atlas Free Tier**: 512MB storage, perfect for development
2. **Use Cloudinary Free Tier**: 25GB storage, unlimited transformations
3. **Test Payments**: Use sandbox/test credentials first
4. **Enable Auto-Save**: Configure git commits for auto-deployments
5. **Monitor Logs**: Check backend console for errors

## 🔐 Security Note

⚠️ **Never commit .env files to git!** They contain sensitive credentials.

The `.gitignore` already excludes:
- `.env`
- `.env.local`
- `node_modules/`

## 📊 Database Seeding

To reset database with fresh data:
```bash
cd backend
node src/seeds/seed.js
```

This creates:
- 3 Product Categories
- 4 Sample Products
- 1 Admin User
- 1 Regular User

## ✅ Checklist Before Going Live

- [ ] MongoDB Atlas configured
- [ ] Cloudinary account setup
- [ ] All environment variables set
- [ ] Payments tested in sandbox
- [ ] Email notifications configured
- [ ] HTTPS/SSL enabled
- [ ] Monitoring/logging setup
- [ ] Backup strategy in place
- [ ] CDN configured
- [ ] Performance tested

## 🆘 Getting Help

1. Check documentation files
2. Review error messages carefully
3. Check browser console for frontend errors
4. Check server terminal for backend errors
5. Create GitHub issue with details

## 🎉 You're Ready!

Your Mokshya Foods e-commerce platform is now running! 

**Next Steps:**
1. Explore the admin dashboard
2. Create some test products
3. Test checkout flow
4. Configure payment gateways
5. Deploy to production

Happy selling! 🍊📦

---

**Need More Help?**
- See [SETUP.md](./SETUP.md) for detailed installation
- See [DEVELOPMENT.md](./DEVELOPMENT.md) for development workflow
- See [README.md](./README.md) for complete feature overview
