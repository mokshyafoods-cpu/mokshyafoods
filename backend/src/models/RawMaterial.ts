import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IRawMaterial extends Document {
  name: string;
  unit: string;
  supplier?: string;
  quantityPurchased: number;
  costPerUnit: number;
  totalCost: number;
  purchaseDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const rawMaterialSchema = new Schema<IRawMaterial>({
  name: { type: String, required: true, trim: true },
  unit: { type: String, required: true, trim: true, default: 'kg' },
  supplier: { type: String, trim: true, default: '' },
  quantityPurchased: { type: Number, required: true, default: 0 },
  costPerUnit: { type: Number, required: true, default: 0 },
  totalCost: { type: Number, required: true, default: 0 },
  purchaseDate: { type: Date, default: Date.now },
  notes: { type: String, trim: true, default: '' },
}, { timestamps: true });

rawMaterialSchema.pre('save', function(next) {
  this.totalCost = Number(this.quantityPurchased || 0) * Number(this.costPerUnit || 0);
  next();
});

rawMaterialSchema.pre(['findOneAndUpdate', 'updateOne'], function(next) {
  const update = this.getUpdate() as Record<string, any>;
  if (update?.$set) {
    const quantity = Number(update.$set.quantityPurchased ?? update.$set.quantity ?? 0);
    const cost = Number(update.$set.costPerUnit ?? 0);
    if (update.$set.quantityPurchased != null || update.$set.costPerUnit != null) {
      update.$set.totalCost = quantity * cost;
    }
  }
  next();
});

const RawMaterial: Model<IRawMaterial> = mongoose.models.RawMaterial as Model<IRawMaterial> || mongoose.model<IRawMaterial>('RawMaterial', rawMaterialSchema);

export default RawMaterial;
