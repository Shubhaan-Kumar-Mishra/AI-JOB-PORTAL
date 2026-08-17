import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';

/**
 * Centralized Error Handling Middleware for Express
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error(`[API Error] ${req.method} ${req.originalUrl}:`, err);

  const status = typeof err.status === 'number' ? err.status : 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    error: {
      message,
      ...(config.nodeEnv === 'development' ? { stack: err.stack } : {}),
    },
  });
}
