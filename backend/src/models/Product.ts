import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IImage {
  url: string;
  cloudinaryId?: string;
}

export interface IProduct extends Document {
  name: string;
  slug?: string;
  sku?: string;
  description?: string;
  category?: Types.ObjectId | string | null;
  price: number;
  discountPrice?: number;
  onSale?: boolean; // Added onSale field
  saleStart?: Date; // Added saleStart field
  saleEnd?: Date; // Added saleEnd field
  quantity: number;
  packagesInStock?: number;
  packaging?: string;
  images: IImage[];
  thumbnail?: string;
  weight?: number;
  rating?: number;
  reviewCount?: number;
  featured?: boolean;
  isActive?: boolean;
  tags?: string[];
  seoKeywords?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const imageSchema = new Schema<IImage>({
  url: {
    type: String,
    required: true,
    validate: {
      validator: (value: string) => /^https?:\/\//i.test(value),
      message: 'Image URL must use http or https',
    },
  },
  cloudinaryId: { type: String },
});

const productSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  slug: { type: String, trim: true, unique: true, sparse: true },
  sku: { type: String },
  description: { type: String },
  category: { type: Schema.Types.Mixed, default: null },
  price: { type: Number, required: true, default: 0 },
  discountPrice: { type: Number },
  onSale: { type: Boolean, default: false }, // Added onSale field
  saleStart: { type: Date }, // Added saleStart field
  saleEnd: { type: Date }, // Added saleEnd field
  quantity: { type: Number, required: true, default: 0 },
  packagesInStock: { type: Number },
  packaging: { type: String },
  images: { type: [imageSchema], default: [] },
  thumbnail: { type: String },
  weight: { type: Number },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  tags: { type: [String], default: [] },
  seoKeywords: { type: [String], default: [] },
}, { timestamps: true });

productSchema.index({ isActive: 1, createdAt: -1 }, { background: true });
productSchema.index({ isActive: 1, featured: 1, createdAt: -1 }, { background: true });
productSchema.index({ isActive: 1, category: 1, createdAt: -1 }, { background: true });
productSchema.index({ isActive: 1, price: 1 }, { background: true });
productSchema.index({ isActive: 1, rating: -1, reviewCount: -1, createdAt: -1 }, { background: true });
productSchema.index({ isActive: 1, slug: 1 }, { background: true, unique: true, sparse: true });
productSchema.index({ featured: 1, createdAt: -1 }, { background: true });
productSchema.index({ price: 1 }, { background: true });
productSchema.index({ rating: -1, reviewCount: -1, createdAt: -1 }, { background: true });
productSchema.index({ category: 1 }, { background: true });
productSchema.index({ categorySlug: 1 }, { background: true });
productSchema.index({ tags: 1 }, { background: true });
productSchema.index({ seoKeywords: 1 }, { background: true });
productSchema.index(
  {
    name: 'text',
    sku: 'text',
    description: 'text',
    packaging: 'text',
    tags: 'text',
    seoKeywords: 'text',
    categoryName: 'text',
    categorySlug: 'text',
  },
  { background: true, name: 'ProductTextSearch' },
);

const Product: Model<IProduct> = mongoose.models.Product as Model<IProduct> || mongoose.model<IProduct>('Product', productSchema);

export default Product;
