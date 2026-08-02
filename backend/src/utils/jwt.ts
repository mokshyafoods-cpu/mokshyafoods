import jwt, { JwtPayload } from 'jsonwebtoken';

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is required');
  }
  return secret;
};

export const generateToken = (userId: string, role: string): string => {
  return jwt.sign(
    { id: userId, role },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
};

export const verifyToken = (token: string): JwtPayload | string | null => {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
};
