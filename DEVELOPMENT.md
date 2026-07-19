# Mokshya Foods - Development Guide

This guide covers development setup, coding standards, and common workflows.

## 🚀 Getting Started

### 1. Clone and Install
```bash
# Install backend dependencies
cd backend
pnpm install

# Install frontend dependencies
cd ../frontend
pnpm install
```

### 2. Environment Setup
```bash
# Backend - Create backend/.env
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend - Create frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

### 3. Seed Demo Data
```bash
cd backend
node src/seeds/seed.js
```

### 4. Start Development Servers
```bash
# Terminal 1 - Backend
cd backend
pnpm dev

# Terminal 2 - Frontend
cd frontend
pnpm dev
```

## 📝 Coding Standards

### Backend (Node.js/Express)

#### File Structure
```
src/
├── models/          # MongoDB schemas
├── controllers/     # Route handlers
├── routes/          # API routes
├── middleware/      # Auth, error handling
├── config/          # Database, Cloudinary config
└── utils/           # Helper functions
```

#### Naming Conventions
- Controllers: `camelCase.js` (e.g., `products.js`)
- Models: `PascalCase.js` (e.g., `Product.js`)
- Routes: `camelCase.js` (e.g., `products.js`)
- Methods: `camelCase` (e.g., `getAllProducts`)

#### API Response Format
```javascript
// Success Response
res.json({
  success: true,
  message: 'Operation successful',
  data: { /* data */ },
  pagination: { total: 100, page: 1, pages: 10 } // optional
});

// Error Response
res.status(400).json({
  success: false,
  message: 'Error description'
});
```

#### Error Handling
```javascript
try {
  // your code
} catch (error) {
  console.error('Context:', error);
  res.status(500).json({
    success: false,
    message: error.message || 'Internal server error'
  });
}
```

### Frontend (React/Next.js)

#### File Structure
```
app/
├── (routes)/        # Route groups
├── layout.tsx       # Root layout
└── page.tsx         # Pages

src/
├── components/      # React components
├── context/         # Context providers
├── services/        # API services
├── hooks/           # Custom hooks
└── utils/           # Utilities
```

#### Component Naming
```typescript
// Use PascalCase for components
// Use 'use' prefix for hooks
// Use Filename.tsx = export default Component

// Good
export default function ProductCard() { }
export const useProducts = () => { }

// Bad
export default function product_card() { }
export const ProductCard = () => { }
```

#### TypeScript Interfaces
```typescript
// Define interfaces at top of file
interface Product {
  id: string;
  name: string;
  price: number;
}

// Props interfaces
interface ProductCardProps {
  product: Product;
  onSelect?: (product: Product) => void;
}
```

## 🔄 Common Workflows

### Adding a New API Endpoint

1. **Create Controller**
   ```javascript
   // controllers/newFeature.js
   exports.getFeature = async (req, res) => {
     try {
       // implementation
     } catch (error) {
       res.status(500).json({ success: false, message: error.message });
     }
   };
   ```

2. **Create Route**
   ```javascript
   // routes/newFeature.js
   const express = require('express');
   const router = express.Router();
   const { getFeature } = require('../controllers/newFeature');
   const { authMiddleware } = require('../middleware/auth');

   router.get('/', authMiddleware, getFeature);
   module.exports = router;
   ```

3. **Register Route in app.js**
   ```javascript
   app.use('/api/feature', require('./routes/newFeature'));
   ```

### Adding a New Frontend Page

1. **Create Page Component**
   ```typescript
   // app/feature/page.tsx
   'use client';
   
   export default function FeaturePage() {
     return (
       <div className="...">
         {/* content */}
       </div>
     );
   }
   ```

2. **Create Service if Needed**
   ```typescript
   // src/services/feature.ts
   import { api } from './api';
   
   export const featureService = {
     get: () => api.get('/feature'),
     create: (data) => api.post('/feature', data),
   };
   ```

3. **Use in Component**
   ```typescript
   import { featureService } from '@/services/feature';
   import useSWR from 'swr';
   
   const { data, error, isLoading } = useSWR('/api/feature', 
     () => featureService.get()
   );
   ```

### Adding Authentication to a Route

1. **Backend Route Protection**
   ```javascript
   router.post('/admin-only', adminMiddleware, createProduct);
   ```

2. **Frontend Page Protection**
   ```typescript
   'use client';
   
   import { useAuth } from '@/context/AuthContext';
   import { useRouter } from 'next/navigation';
   
   export default function AdminPage() {
     const { isAuthenticated, user } = useAuth();
     const router = useRouter();
   
     if (!isAuthenticated || user?.role !== 'admin') {
       router.push('/auth/login');
       return null;
     }
   
     return <div>{/* content */}</div>;
   }
   ```

## 📊 Database Operations

### Creating a Model
```javascript
const mongoose = require('mongoose');

const featureSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Feature', featureSchema);
```

### Common Mongoose Operations
```javascript
// Create
const doc = await Model.create(data);

// Read
const doc = await Model.findById(id);
const docs = await Model.find(query);

// Update
const doc = await Model.findByIdAndUpdate(id, updates, { new: true });

// Delete
await Model.findByIdAndDelete(id);

// Pagination
const docs = await Model.find()
  .limit(10)
  .skip((page - 1) * 10);
```

## 🎨 Styling Guidelines

### Tailwind CSS
- Use utility-first approach
- Prefer built-in colors (bg-primary, text-foreground)
- Use responsive prefixes (md:, lg:, etc.)

### Color Usage
```css
/* Primary actions */
.btn-primary { @apply bg-primary text-white; }

/* Secondary actions */
.btn-secondary { @apply bg-secondary text-white; }

/* Borders and dividers */
.border { @apply border-border; }

/* Background */
.bg { @apply bg-background; }
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
pnpm test
```

### Frontend Tests
```bash
cd frontend
pnpm test
```

## 🚢 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database backed up
- [ ] API endpoints tested
- [ ] Frontend builds without errors
- [ ] Images optimized
- [ ] CORS configured properly
- [ ] SSL certificates installed
- [ ] Rate limiting enabled
- [ ] Error logging configured
- [ ] Monitoring setup

## 🐛 Debugging Tips

### Backend
```javascript
// Use console.log for debugging
console.log('[v0] Variable name:', variableName);

// Use try-catch with detailed messages
try {
  // code
} catch (error) {
  console.error('[v0] Operation failed:', error.message);
}
```

### Frontend
```typescript
// Use React DevTools
// Use Network tab for API debugging
console.log('[v0] State:', state);

// Debug in browser DevTools
debugger;
```

## 📚 Useful Commands

### Backend
```bash
pnpm dev           # Start development server
pnpm seed          # Seed database
pnpm test          # Run tests
pnpm build         # Build for production
```

### Frontend
```bash
pnpm dev           # Start development server
pnpm build         # Build for production
pnpm start         # Start production server
pnpm lint          # Run ESLint
```

## 🔒 Security Checklist

- [ ] No sensitive data in code
- [ ] Environment variables used
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] CSRF tokens implemented
- [ ] XSS protection enabled
- [ ] CORS properly configured
- [ ] Rate limiting active
- [ ] HTTPS enforced in production
- [ ] Regular security updates

## 📞 Getting Help

1. Check existing code for examples
2. Review API documentation
3. Check error logs
4. Ask team members
5. Create detailed issue report

## 🎯 Next Steps

- Review SETUP.md for deployment
- Check README.md for features
- Explore component library in src/components/
- Read API documentation in backend/

---

Happy coding! 🚀
