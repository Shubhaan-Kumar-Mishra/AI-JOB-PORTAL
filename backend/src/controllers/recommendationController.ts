import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import {
  getPersonalizedRecommendations,
  NoResumeError,
} from '../services/recommendation.service.js';
import {
  GeminiAuthError,
  GeminiRateLimitError,
  GeminiModelError,
  GeminiValidationError,
  GeminiTimeoutError,
} from '../services/gemini.service.js';

/**
 * GET /api/ai/recommendations
 * Protected endpoint: Returns personalized AI-powered job recommendations for candidate dashboard.
 *
 * Query parameters:
 * - refresh=true (optional): bypasses short-lived in-memory recommendation cache
 */
export async function getRecommendationsHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Identity derived exclusively from JWT (req.user.id)
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required to access personalized job recommendations.' },
      });
      return;
    }

    const forceRefresh = req.query.refresh === 'true';

    const recommendations = await getPersonalizedRecommendations(userId, {
      forceRefresh,
    });

    res.status(200).json({
      success: true,
      data: {
        recommendations,
        count: recommendations.length,
      },
    });
  } catch (error: any) {
    // 1. Missing resume -> HTTP 400 with strict user message
    if (error instanceof NoResumeError) {
      res.status(400).json({
        success: false,
        message: 'Please upload a resume to receive personalized job recommendations.',
        error: {
          message:
            'No resume document found for your profile. Please upload a PDF or DOCX resume on the Resume page first.',
        },
      });
      return;
    }

    // 2. Granular Gemini Error Mapping
    if (error instanceof GeminiAuthError) {
      res.status(500).json({
        success: false,
        error: { message: 'AI service configuration error. Please contact support.' },
      });
      return;
    }

    if (error instanceof GeminiRateLimitError) {
      res.status(429).json({
        success: false,
        error: { message: 'AI service is temporarily busy. Please wait a moment and try again.' },
      });
      return;
    }

    if (error instanceof GeminiModelError) {
      res.status(500).json({
        success: false,
        error: { message: 'AI service model configuration error. Please contact support.' },
      });
      return;
    }

    if (error instanceof GeminiValidationError) {
      res.status(502).json({
        success: false,
        error: { message: 'AI service returned an unexpected response format. Please try again.' },
      });
      return;
    }

    if (error instanceof GeminiTimeoutError) {
      res.status(504).json({
        success: false,
        error: { message: 'AI recommendation request timed out. Please try again.' },
      });
      return;
    }

    // Duplicate concurrent request throttling
    if (error?.statusCode === 429 || error?.message?.includes('already in progress')) {
      res.status(429).json({
        success: false,
        error: { message: error.message || 'A recommendation request is already in progress.' },
      });
      return;
    }

    // Centralized error handler fallback
    next(error);
  }
}
