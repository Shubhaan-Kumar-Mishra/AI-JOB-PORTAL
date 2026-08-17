import { Request, Response, NextFunction } from 'express';
import { isDBConnected } from '../db/mongodb.js';

/**
 * Middleware that ensures MongoDB Atlas is connected before executing database operations.
 */
export function requireDB(req: Request, res: Response, next: NextFunction): void {
  if (!isDBConnected()) {
    res.status(503).json({
      success: false,
      error: {
        message: 'Database connection unavailable. Please set a valid MONGODB_URI in your .env file to interact with MongoDB Atlas.',
      },
    });
    return;
  }
  next();
}
