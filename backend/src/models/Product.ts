import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IImage {
  url: string;
  cloudinaryId?: string;
}

export interface IProduct extends Document {
  name: string;
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
  url: { type: String, required: true },
  cloudinaryId: { type: String },
});

const productSchema = new Schema<IProduct>({
  name: { type: String, required: true },
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

const Product: Model<IProduct> = mongoose.models.Product as Model<IProduct> || mongoose.model<IProduct>('Product', productSchema);

export default Product;
