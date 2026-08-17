import { Router, Request, Response } from 'express';
import { checkDBHealth } from '../db/mongodb.js';

export const healthRouter = Router();

/**
 * GET /api/health
 * Returns API application health status.
 */
healthRouter.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'AI Job Portal API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

/**
 * GET /api/health/db
 * Actually tests MongoDB Atlas database connectivity.
 */
healthRouter.get('/db', async (req: Request, res: Response) => {
  const dbStatus = await checkDBHealth();

  if (dbStatus.connected) {
    res.json({
      success: true,
      message: 'MongoDB Atlas is connected and healthy',
      database: dbStatus.details,
    });
  } else {
    res.status(503).json({
      success: false,
      error: dbStatus.message,
    });
  }
});
