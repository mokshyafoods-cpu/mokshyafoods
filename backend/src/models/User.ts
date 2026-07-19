import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  avatar?: string;
  wishlist: Types.ObjectId[];
  role: 'user' | 'admin' | 'cashier';
  isVerified: boolean;
  otpHash?: string;
  otpExpiresAt?: Date;
  otpAttempts: number;
  otpSentAt?: Date;
  notifications?: {
    orderUpdates?: boolean;
    promotions?: boolean;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(enteredPassword: string): Promise<boolean>;
}

interface IUserMethods {
  comparePassword(enteredPassword: string): Promise<boolean>;
}

type UserModel = Model<IUser, Record<string, never>, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email',
    ],
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false,
  },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  avatar: String,
  wishlist: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Product',
    },
  ],
  role: {
    type: String,
    enum: ['user', 'admin', 'cashier'],
    default: 'user',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  otpHash: {
    type: String,
    select: false,
  },
  otpExpiresAt: {
    type: Date,
  },
  otpAttempts: {
    type: Number,
    default: 0,
  },
  otpSentAt: {
    type: Date,
  },
  notifications: {
    orderUpdates: { type: Boolean, default: true },
    promotions: { type: Boolean, default: false },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

userSchema.methods.comparePassword = async function (this: IUser, enteredPassword: string) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model<IUser, UserModel>('User', userSchema);

export default User;
