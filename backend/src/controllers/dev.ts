import { Request, Response } from 'express';
import User from '../models/User';
import { generateToken } from '../utils/jwt';

export const getAdminToken = async (_req: Request, res: Response): Promise<Response> => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'Not allowed in production' });
  }

  try {
    let admin = await User.findOne({ role: 'admin' }).exec();
    if (!admin) {
      // create a dev admin user
      admin = await User.create({
        name: 'Dev Admin',
        email: process.env.DEV_ADMIN_EMAIL || 'dev-admin@example.com',
        phone: process.env.DEV_ADMIN_PHONE || '0000000000',
        password: process.env.DEV_ADMIN_PASSWORD || 'adminpass',
        role: 'admin',
        isVerified: true,
      });
    }

    const token = generateToken(admin._id.toString(), 'admin');
    return res.json({ success: true, token, user: { id: admin._id, email: admin.email, name: admin.name, role: admin.role } });
  } catch (error: any) {
    console.error('getAdminToken error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to generate admin token' });
  }
};

export default { getAdminToken };
