import mongoose, { Document, Model, Schema } from 'mongoose';

export type BusinessEntryType = 'machinery' | 'utility' | 'maintenance' | 'operational_purchase' | 'other_expense';

export interface IBusinessEntry extends Document {
  type: BusinessEntryType;
  name: string;
  category: string;
  supplier?: string;
  date: Date;
  billingPeriod?: string;
  billNumber?: string;
  dueDate?: Date;
  paidDate?: Date;
  quantity?: number;
  unitPrice?: number;
  amount: number;
  paymentMethod?: string;
  paymentStatus?: string;
  warranty?: string;
  usefulLifeMonths?: number;
  notes?: string;
  attachmentUrl?: string;
}

const businessEntrySchema = new Schema<IBusinessEntry>({
  type: { type: String, enum: ['machinery', 'utility', 'maintenance', 'operational_purchase', 'other_expense'], required: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  supplier: { type: String, trim: true },
  date: { type: Date, required: true, default: Date.now },
  billingPeriod: { type: String, trim: true },
  billNumber: { type: String, trim: true },
  dueDate: { type: Date },
  paidDate: { type: Date },
  quantity: { type: Number, min: 0 },
  unitPrice: { type: Number, min: 0 },
  amount: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, trim: true },
  paymentStatus: { type: String, trim: true, default: 'paid' },
  warranty: { type: String, trim: true },
  usefulLifeMonths: { type: Number, min: 0 },
  notes: { type: String, trim: true },
  attachmentUrl: { type: String, trim: true },
}, { timestamps: true });

businessEntrySchema.index({ date: -1, type: 1 });

const BusinessEntry: Model<IBusinessEntry> = mongoose.models.BusinessEntry || mongoose.model<IBusinessEntry>('BusinessEntry', businessEntrySchema);
export default BusinessEntry;
