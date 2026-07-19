import jwt, { JwtPayload } from 'jsonwebtoken';

export const generateToken = (userId: string, role: string): string => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'default-secret',
    { expiresIn: '7d' }
  );
};

export const verifyToken = (token: string): JwtPayload | string | null => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
  } catch {
    return null;
  }
};
