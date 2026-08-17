import { Request, Response, NextFunction } from 'express';

/**
 * Centralized Error Handling Middleware for Express.
 * Strictly prevents stack traces, internal paths, or credentials from leaking in API responses.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error(`[API Error] ${req.method} ${req.originalUrl}:`, err.message || err);

  // Handle Multer upload errors (e.g., file size limit exceeded)
  if (err.name === 'MulterError' || err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({
      success: false,
      error: {
        message: 'File size exceeds maximum allowed limit of 10 MB.',
      },
    });
    return;
  }

  const status = typeof err.status === 'number' ? err.status : typeof err.statusCode === 'number' ? err.statusCode : 500;
  const message = status === 500 ? 'An unexpected server error occurred. Please try again.' : (err.message || 'Internal Server Error');

  res.status(status).json({
    success: false,
    error: {
      message,
    },
  });
}
