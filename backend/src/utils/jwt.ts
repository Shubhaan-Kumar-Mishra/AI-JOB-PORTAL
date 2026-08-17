import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export interface TokenPayload {
  userId: string;
  role: string;
}

const getJwtSecret = (): string => {
  const secret = config.jwtSecret;
  if (!secret) {
    if (config.nodeEnv === 'production') {
      throw new Error('JWT_SECRET environment variable is missing in production.');
    }
    return 'default_dev_jwt_secret_do_not_use_in_prod';
  }
  return secret;
};

/**
 * Signs a JWT token for a given user ID and role.
 */
export function generateToken(userId: string, role: string): string {
  const secret = getJwtSecret();
  return jwt.sign({ userId, role }, secret, {
    expiresIn: '7d',
  });
}

/**
 * Verifies a JWT token and returns its payload.
 */
export function verifyToken(token: string): TokenPayload {
  const secret = getJwtSecret();
  return jwt.verify(token, secret) as TokenPayload;
}
