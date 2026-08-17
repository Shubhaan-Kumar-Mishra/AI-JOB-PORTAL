import { ErrorHandler } from 'hono';
import { Bindings } from '../config/env.js';

/**
 * Centralized Error Handler Middleware for Hono
 * Ensures consistent JSON error responses across all API endpoints.
 */
export const errorHandler: ErrorHandler<{ Bindings: Bindings }> = (err, c) => {
  console.error(`[API Error] ${c.req.method} ${c.req.url}:`, err);

  const status = 'status' in err && typeof err.status === 'number' ? err.status : 500;
  const message = err.message || 'Internal Server Error';

  return c.json(
    {
      success: false,
      error: {
        message,
        ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
      },
    },
    status as any
  );
};
