import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { Application } from '../models/Application.js';
import { SavedJob } from '../models/SavedJob.js';
import { createApplicationSchema, updateApplicationSchema } from '../validators/applicationValidators.js';
import { fetchAdzunaJobs } from '../services/adzuna.service.js';
import { ZodError } from 'zod';

/**
 * POST /api/applications
 * Protected endpoint to record a job application.
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
      } catch (err) {
        jobTitle = jobTitle || 'Job Position';
        companyName = companyName || 'Company Not Specified';
        location = location || 'India';
        jobUrl = jobUrl || 'https://www.adzuna.in';
      }
    }

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

    res.status(201).json({
      success: true,
      message: 'Application recorded successfully',
      data: { application },
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
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
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

    res.status(200).json({
      success: true,
      data: { application },
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
 * PATCH /api/applications/:id
 * Protected endpoint to update status or notes of an application.
 * Strictly enforces ownership & prevents modification of immutable fields.
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

    const updateFields: any = {};
    if (validatedBody.status !== undefined) updateFields.status = validatedBody.status;
    if (validatedBody.notes !== undefined) updateFields.notes = validatedBody.notes;

    const updated = await Application.findOneAndUpdate({ _id: applicationId, userId }, updateFields, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) {
      res.status(404).json({
        success: false,
        error: { message: 'Application record not found or access denied' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Application updated successfully',
      data: { application: updated },
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
 * Strictly verifies ownership.
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
      data: {
        savedJobsCount,
        applicationsCount,
        interviewsCount,
        offersCount,
      },
    });
  } catch (error) {
    next(error);
  }
}
