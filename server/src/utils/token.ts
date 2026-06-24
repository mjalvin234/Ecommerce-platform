import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { JwtPayload } from '../middlewares/auth.middleware.js';

export const generateToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: '7d' });
};

export const generateRefreshToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: '30d' });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
};
