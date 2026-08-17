import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { analyzeJobMatchHandler } from '../controllers/aiController.js';
import { getRecommendationsHandler } from '../controllers/recommendationController.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

export const aiRouter = Router();

/**
 * Per-user AI rate limiter.
 *
 * Limits each user to 10 AI requests per 15-minute sliding window.
 * Suitable for local development. In production, replace with a distributed
 * rate-limiting solution (e.g., Redis-backed) to coordinate across server instances.
 */
const aiRateLimiter = createRateLimiter({
  max: 10,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message:
    'Too many AI requests. You may make up to 10 requests per 15 minutes. Please wait and try again.',
});

/**
 * @route   POST /api/ai/job-match/:jobId
 * @desc    Analyze AI compatibility match between candidate resume and job listing
 * @access  Protected (JWT)
 */
aiRouter.post('/job-match/:jobId', authMiddleware, aiRateLimiter, analyzeJobMatchHandler);

/**
 * @route   GET /api/ai/recommendations
 * @desc    Get personalized AI-powered job recommendations for candidate dashboard
 * @access  Protected (JWT)
 */
aiRouter.get('/recommendations', authMiddleware, aiRateLimiter, getRecommendationsHandler);
