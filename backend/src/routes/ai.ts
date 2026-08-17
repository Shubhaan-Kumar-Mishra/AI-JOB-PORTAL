import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { analyzeJobMatchHandler } from '../controllers/aiController.js';

export const aiRouter = Router();

/**
 * @route   POST /api/ai/job-match/:jobId
 * @desc    Analyze match score and compatibility between candidate resume and job position
 * @access  Protected
 */
aiRouter.post('/job-match/:jobId', authMiddleware, analyzeJobMatchHandler);
