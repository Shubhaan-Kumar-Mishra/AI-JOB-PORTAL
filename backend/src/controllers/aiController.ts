import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { Resume } from '../models/Resume.js';
import { fetchAdzunaJobById } from '../services/adzuna.service.js';
import {
  analyzeResumeJobMatch,
  ControlledJobPayload,
  ControlledResumePayload,
  GeminiAuthError,
  GeminiRateLimitError,
  GeminiModelError,
  GeminiValidationError,
  GeminiTimeoutError,
} from '../services/gemini.service.js';

/**
 * POST /api/ai/job-match/:jobId
 * Protected endpoint: AI compatibility analysis between candidate resume and a specific job position.
 *
 * Security properties:
 * - userId derived exclusively from JWT (req.user.id) — never from request body or params.
 * - Job data is fetched by the backend from the Adzuna service — frontend supplies only jobId.
 * - Resume data is fetched by the backend from MongoDB using the authenticated userId.
 * - Response contains only job summary and AI analysis — never API keys, prompts, or raw resume text.
 */
export async function analyzeJobMatchHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // ── Identity entirely from JWT ─────────────────────────────────────────────
    const userId: string | undefined = req.user?.id || req.user?._id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required to perform AI job match analysis.' },
      });
      return;
    }

    // ── Job ID validation ──────────────────────────────────────────────────────
    const { jobId } = req.params;
    if (!jobId || typeof jobId !== 'string' || jobId.trim() === '') {
      res.status(400).json({
        success: false,
        error: { message: 'A valid job ID parameter is required.' },
      });
      return;
    }

    // ── Resume ownership: fetch by authenticated userId only ───────────────────
    // The authenticated user can never specify or override which resume is used.
    // resumeId from request body/query is intentionally NOT accepted.
    const resumeDoc = await Resume.findOne({ userId }).lean();
    if (!resumeDoc || !resumeDoc.parsedData) {
      res.status(400).json({
        success: false,
        message: 'Please upload a resume before analyzing your job match.',
        error: {
          message:
            'No resume document found for your profile. Please upload a PDF or DOCX resume on the Resume page first.',
        },
      });
      return;
    }

    // ── Job data: fetched by backend from Adzuna — NOT from frontend ───────────
    let jobDetail;
    try {
      jobDetail = await fetchAdzunaJobById(jobId.trim());
    } catch {
      res.status(404).json({
        success: false,
        error: { message: `Job position '${jobId}' could not be retrieved. It may have expired or been removed.` },
      });
      return;
    }

    // ── Construct sanitized controlled job payload ──────────────────────────────
    const controlledJob: ControlledJobPayload = {
      id: jobDetail.id,
      title: jobDetail.title,
      company: jobDetail.company?.name || 'Company',
      location: jobDetail.location?.displayName || 'Location Not Specified',
      description: jobDetail.description || 'No detailed description provided.',
      category: jobDetail.category || 'General',
      contractType: jobDetail.contractType || null,
      contractTime: jobDetail.contractTime || null,
    };

    // ── Construct sanitized controlled resume payload ───────────────────────────
    // Only job-relevant structured fields are passed — no passwords, JWT, MongoDB URI,
    // API keys, phone numbers, emails, raw resume text, or sensitive personal data.
    const parsed = resumeDoc.parsedData;
    const controlledResume: ControlledResumePayload = {
      summary: parsed.summary || null,
      skills: parsed.skills || [],
      education: (parsed.education || []).map((e) => ({
        institution: e.institution || null,
        degree: e.degree || null,
        field: e.field || null,
        startDate: e.startDate || null,
        endDate: e.endDate || null,
      })),
      experience: (parsed.experience || []).map((e) => ({
        company: e.company || null,
        position: e.position || null,
        startDate: e.startDate || null,
        endDate: e.endDate || null,
        description: e.description || null,
      })),
      projects: (parsed.projects || []).map((p) => ({
        name: p.name || null,
        description: p.description || null,
        technologies: p.technologies || [],
      })),
    };

    // ── Invoke Gemini AI service with userId for dedup lock ────────────────────
    const analysis = await analyzeResumeJobMatch(controlledResume, controlledJob, userId);

    // ── Controlled response: only job summary + AI analysis ───────────────────
    // Never includes: API keys, prompts, MongoDB data, raw resume text, or server internals.
    res.status(200).json({
      success: true,
      data: {
        job: {
          id: controlledJob.id,
          title: controlledJob.title,
          company: controlledJob.company,
        },
        analysis,
      },
    });
  } catch (error: any) {
    // ── Granular Gemini error → HTTP status mapping ────────────────────────────
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
        error: { message: 'AI analysis timed out. Please try again.' },
      });
      return;
    }

    // Duplicate / in-progress request
    if (error?.statusCode === 429 || error?.message?.includes('already in progress')) {
      res.status(429).json({
        success: false,
        error: { message: error.message || 'A request for this job is already being processed.' },
      });
      return;
    }

    // Unknown errors: delegate to centralized error handler
    // Stack trace is never exposed to client — error handler only emits a generic 500 message.
    next(error);
  }
}
