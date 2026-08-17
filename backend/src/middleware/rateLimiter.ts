import { Request, Response, NextFunction } from 'express';

/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Suitable for local development. For production, replace with a distributed
 * solution (e.g., Redis-backed rate limiter) to handle multiple server instances.
 *
 * NOTE: This in-process map resets on server restart. It does not persist state
 * across deployments and cannot coordinate across horizontally scaled instances.
 */

interface RateLimitOptions {
  /** Max number of requests allowed in windowMs */
  max: number;
  /** Window duration in milliseconds */
  windowMs: number;
  /** Human-readable message to return on limit exceeded */
  message: string;
}

/**
 * Creates an in-memory rate limiter middleware keyed by authenticated userId (from JWT).
 * Falls back to IP address for unauthenticated requests.
 */
export function createRateLimiter(options: RateLimitOptions) {
  const { max, windowMs, message } = options;

  // key → array of request timestamps
  const requestLog = new Map<string, number[]>();

  // Periodically clear stale entries to prevent unbounded map growth
  setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, timestamps] of requestLog) {
      const recent = timestamps.filter((t) => t > cutoff);
      if (recent.length === 0) {
        requestLog.delete(key);
      } else {
        requestLog.set(key, recent);
      }
    }
  }, windowMs * 2);

  return function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction): void {
    // Use JWT userId when available (more accurate), fallback to IP
    const key: string =
      (req as any).user?.id ||
      (req as any).user?._id ||
      req.ip ||
      'unknown';

    const now = Date.now();
    const cutoff = now - windowMs;

    const current = (requestLog.get(key) || []).filter((t) => t > cutoff);
    current.push(now);
    requestLog.set(key, current);

    if (current.length > max) {
      res.status(429).json({
        success: false,
        error: { message },
      });
      return;
    }

    next();
  };
}
