import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: string;
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'No authorization token provided',
      });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({
        success: false,
        message: 'Server configuration error: JWT_SECRET is required',
      });
      return;
    }

    const decoded = jwt.verify(token, secret) as JwtPayload & {
      id?: string;
      userId?: string;
      _id?: string;
      role?: string;
      userRole?: string;
      roles?: string[];
    };

    const normalizedRole = [decoded.role, decoded.userRole, Array.isArray(decoded.roles) ? decoded.roles[0] : undefined]
      .find((value): value is string => Boolean(value)) || '';
    const normalizedUserId = decoded.id || decoded.userId || decoded._id || '';

    req.userId = normalizedUserId;
    req.userRole = normalizedRole;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

export const adminMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  authMiddleware(req, res, () => {
    const normalizedRole = String(req.userRole || '').trim().toLowerCase();
    const isAdmin = normalizedRole === 'admin' || normalizedRole === 'superadmin' || normalizedRole === 'administrator' || normalizedRole.includes('admin');

    if (!isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
      return;
    }
    next();
  });
};

export const posMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  authMiddleware(req, res, () => {
    if (!['admin', 'cashier'].includes(req.userRole || '')) {
      res.status(403).json({
        success: false,
        message: 'POS access required',
      });
      return;
    }
    next();
  });
};
