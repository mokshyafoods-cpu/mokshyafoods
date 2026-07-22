import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IProductionMaterialUsed {
  materialId?: Types.ObjectId | string;
  materialName: string;
  quantityUsed: number;
  unit: string;
}

export interface IProductionBatch extends Document {
  batchNumber: string;
  product: Types.ObjectId | string | null;
  productName: string;
  rawMaterialsUsed: IProductionMaterialUsed[];
  quantityProduced: number;
  productionDate: Date;
  staffInCharge?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const productionMaterialUsedSchema = new Schema<IProductionMaterialUsed>({
  materialId: { type: Schema.Types.Mixed, default: null },
  materialName: { type: String, required: true, trim: true },
  quantityUsed: { type: Number, required: true, default: 0 },
  unit: { type: String, trim: true, default: 'kg' },
});

const productionBatchSchema = new Schema<IProductionBatch>({
  batchNumber: { type: String, required: true, trim: true, unique: true },
  product: { type: Schema.Types.Mixed, default: null },
  productName: { type: String, required: true, trim: true },
  rawMaterialsUsed: { type: [productionMaterialUsedSchema], default: [] },
  quantityProduced: { type: Number, required: true, default: 0 },
  productionDate: { type: Date, default: Date.now },
  staffInCharge: { type: String, trim: true, default: '' },
  notes: { type: String, trim: true, default: '' },
}, { timestamps: true });

const ProductionBatch: Model<IProductionBatch> = mongoose.models.ProductionBatch as Model<IProductionBatch> || mongoose.model<IProductionBatch>('ProductionBatch', productionBatchSchema);

export default ProductionBatch;
