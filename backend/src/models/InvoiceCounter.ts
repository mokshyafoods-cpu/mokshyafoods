import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IInvoiceCounter extends Document {
  key: string;
  value: number;
  updatedAt: Date;
}

const invoiceCounterSchema = new Schema<IInvoiceCounter>({
  key: { type: String, required: true, unique: true },
  value: { type: Number, required: true, default: 0 },
}, { timestamps: true });

const InvoiceCounter: Model<IInvoiceCounter> = mongoose.models.InvoiceCounter as Model<IInvoiceCounter> || mongoose.model<IInvoiceCounter>('InvoiceCounter', invoiceCounterSchema);

export default InvoiceCounter;
