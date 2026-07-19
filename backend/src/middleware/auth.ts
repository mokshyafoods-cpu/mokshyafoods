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

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload & { id?: string; role?: string };
    req.userId = decoded.id;
    req.userRole = decoded.role;
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
    if (req.userRole !== 'admin') {
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
