import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { Application, ApplicationStatus } from '../models/Application.js';
import { SavedJob } from '../models/SavedJob.js';
import { User } from '../models/User.js';
import { createApplicationSchema, updateApplicationSchema } from '../validators/applicationValidators.js';
import { fetchAdzunaJobs } from '../services/adzuna.service.js';
import {
  sendApplicationConfirmationEmail,
  sendApplicationStatusEmail,
} from '../services/email.service.js';
import { ZodError } from 'zod';

/**
 * POST /api/applications
 * Protected endpoint to record a job application.
 *
 * Order of operations:
 * 1. Authenticate user (from JWT only)
 * 2. Validate request
 * 3. Check duplicate
 * 4. Optionally enrich job metadata from Adzuna
 * 5. Create application in MongoDB — this is the primary operation
 * 6. Attempt to send confirmation email — failure MUST NOT roll back the application
 */
export async function createApplication(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, error: { message: 'Authentication required' } });
      return;
    }

    const validatedBody = createApplicationSchema.parse(req.body);
    const { jobId, notes } = validatedBody;

    // Check duplicate application
    const existing = await Application.findOne({ userId, jobId });
    if (existing) {
      res.status(409).json({
        success: false,
        error: { message: 'You have already submitted an application for this job position' },
        data: { application: existing },
      });
      return;
    }

    let jobTitle = validatedBody.jobTitle;
    let companyName = validatedBody.companyName;
    let location = validatedBody.location;
    let jobUrl = validatedBody.jobUrl;

    // Fetch snapshot from Adzuna if job metadata missing
    if (!jobTitle || jobTitle === 'Job Position' || !companyName || companyName === 'Company Not Specified') {
      try {
        const adzunaRes = await fetchAdzunaJobs({
          keyword: jobId,
          location: '',
          page: 1,
          resultsPerPage: 1,
          sortBy: 'relevance',
        });
        const matchedJob = adzunaRes.data.jobs.find((j) => j.id === jobId) || adzunaRes.data.jobs[0];
        if (matchedJob) {
          jobTitle = matchedJob.title;
          companyName = matchedJob.company.name;
          location = matchedJob.location.displayName;
          jobUrl = matchedJob.url;
        }
      } catch {
        jobTitle = jobTitle || 'Job Position';
        companyName = companyName || 'Company Not Specified';
        location = location || 'India';
        jobUrl = jobUrl || 'https://www.adzuna.in';
      }
    }

    // ── PRIMARY OPERATION: Save application to MongoDB ─────────────────────────
    const application = await Application.create({
      userId,
      jobId,
      jobTitle,
      companyName,
      location,
      jobUrl,
      status: 'applied',
      notes: notes || '',
      appliedAt: new Date(),
    });

    // ── SECONDARY OPERATION: Send confirmation email (fire-and-forget safe) ────
    // Email failure MUST NOT affect the already-saved application response.
    // Recipient is fetched from MongoDB using the authenticated userId — NEVER from request body.
    let emailNotification: { sent: boolean; reason?: string } = { sent: false, reason: 'not_attempted' };
    try {
      const userDoc = await User.findById(userId).select('name email').lean();
      if (userDoc?.email) {
        emailNotification = await sendApplicationConfirmationEmail({
          recipientEmail: userDoc.email,
          candidateName: userDoc.name || 'Candidate',
          applicationId: (application._id as any).toString(),
          jobTitle: application.jobTitle,
          companyName: application.companyName,
          location: application.location,
          appliedAt: application.appliedAt,
        });
      } else {
        emailNotification = { sent: false, reason: 'no_user_email' };
      }
    } catch (emailErr: any) {
      // Safe log — no credentials or user data content logged
      console.warn('[ApplicationController] Confirmation email exception:', emailErr?.message || 'unknown');
      emailNotification = { sent: false, reason: 'email_exception' };
    }

    res.status(201).json({
      success: true,
      message: 'Application recorded successfully',
      data: {
        application,
        emailNotification: { sent: emailNotification.sent },
      },
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid application request payload',
          details: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
        },
      });
      return;
    }
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        error: { message: 'Application already tracked for this job position' },
      });
      return;
    }
    next(error);
  }
}

/**
 * GET /api/applications
 * Protected endpoint to list candidate's tracked job applications.
 * No email is sent on read operations.
 */
export async function getApplications(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, error: { message: 'Authentication required' } });
      return;
    }

    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '10', 10);
    const status = req.query.status as string | undefined;
    const skip = (page - 1) * limit;

    const filter: any = { userId };
    if (status) {
      filter.status = status;
    }

    const [applications, total] = await Promise.all([
      Application.find(filter).sort({ appliedAt: -1 }).skip(skip).limit(limit).lean(),
      Application.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    res.status(200).json({
      success: true,
      data: {
        applications,
        pagination: { page, limit, total, totalPages },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/applications/:id
 * Protected endpoint to retrieve single application details.
 * Strictly verifies ownership so User A cannot access User B's application.
 * No email is sent on read operations.
 */
export async function getApplicationById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id || req.user?._id;
    const applicationId = req.params.id;

    if (!userId) {
      res.status(401).json({ success: false, error: { message: 'Authentication required' } });
      return;
    }

    const application = await Application.findOne({ _id: applicationId, userId }).lean();

    if (!application) {
      res.status(404).json({
        success: false,
        error: { message: 'Application record not found or access denied' },
      });
      return;
    }

    res.status(200).json({ success: true, data: { application } });
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json({ success: false, error: { message: 'Invalid application ID format' } });
      return;
    }
    next(error);
  }
}

/**
 * PATCH /api/applications/:id
 * Protected endpoint to update status or notes of an application.
 *
 * Email behavior:
 * - Status changes (oldStatus !== newStatus) → send status update email.
 * - Notes-only changes → NO email sent.
 * - Email failure MUST NOT prevent a successful update response.
 */
export async function updateApplication(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id || req.user?._id;
    const applicationId = req.params.id;

    if (!userId) {
      res.status(401).json({ success: false, error: { message: 'Authentication required' } });
      return;
    }

    const validatedBody = updateApplicationSchema.parse(req.body);

    // ── Capture oldStatus BEFORE the update ────────────────────────────────────
    const existingApp = await Application.findOne({ _id: applicationId, userId }).lean();
    if (!existingApp) {
      res.status(404).json({
        success: false,
        error: { message: 'Application record not found or access denied' },
      });
      return;
    }
    const oldStatus = existingApp.status as ApplicationStatus;

    const updateFields: any = {};
    if (validatedBody.status !== undefined) updateFields.status = validatedBody.status;
    if (validatedBody.notes !== undefined) updateFields.notes = validatedBody.notes;

    // ── PRIMARY OPERATION: Update application in MongoDB ───────────────────────
    const updated = await Application.findOneAndUpdate(
      { _id: applicationId, userId },
      updateFields,
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      res.status(404).json({
        success: false,
        error: { message: 'Application record not found or access denied' },
      });
      return;
    }

    const newStatus = updated.status as ApplicationStatus;
    const statusChanged = validatedBody.status !== undefined && oldStatus !== newStatus;

    // ── SECONDARY OPERATION: Send status change email only if status actually changed ──
    let emailNotification: { sent: boolean } = { sent: false };
    if (statusChanged) {
      try {
        // Recipient fetched from MongoDB using JWT userId — NEVER from request body
        const userDoc = await User.findById(userId).select('name email').lean();
        if (userDoc?.email) {
          const emailResult = await sendApplicationStatusEmail({
            recipientEmail: userDoc.email,
            candidateName: userDoc.name || 'Candidate',
            applicationId: applicationId,
            jobTitle: updated.jobTitle,
            companyName: updated.companyName,
            oldStatus,
            newStatus,
            updatedAt: updated.updatedAt,
          });
          emailNotification = { sent: emailResult.sent };
        }
      } catch (emailErr: any) {
        console.warn('[ApplicationController] Status email exception:', emailErr?.message || 'unknown');
      }
    }

    res.status(200).json({
      success: true,
      message: 'Application updated successfully',
      data: {
        application: updated,
        ...(statusChanged ? { emailNotification } : {}),
      },
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid update payload',
          details: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
        },
      });
      return;
    }
    if (error.name === 'CastError') {
      res.status(400).json({ success: false, error: { message: 'Invalid application ID format' } });
      return;
    }
    next(error);
  }
}

/**
 * DELETE /api/applications/:id
 * Protected endpoint to delete an application record.
 * No email is sent on deletion.
 */
export async function deleteApplication(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id || req.user?._id;
    const applicationId = req.params.id;

    if (!userId) {
      res.status(401).json({ success: false, error: { message: 'Authentication required' } });
      return;
    }

    const deleted = await Application.findOneAndDelete({ _id: applicationId, userId });

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: { message: 'Application record not found or access denied' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Application record deleted successfully',
      data: { id: applicationId },
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json({ success: false, error: { message: 'Invalid application ID format' } });
      return;
    }
    next(error);
  }
}

/**
 * GET /api/users/dashboard-stats
 * Protected endpoint to compute live counts for Candidate Dashboard.
 * No email is sent.
 */
export async function getDashboardStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, error: { message: 'Authentication required' } });
      return;
    }

    const [savedJobsCount, applicationsCount, interviewsCount, offersCount] = await Promise.all([
      SavedJob.countDocuments({ userId }),
      Application.countDocuments({ userId }),
      Application.countDocuments({ userId, status: 'interview' }),
      Application.countDocuments({ userId, status: 'offer' }),
    ]);

    res.status(200).json({
      success: true,
      data: { savedJobsCount, applicationsCount, interviewsCount, offersCount },
    });
  } catch (error) {
    next(error);
  }
}
