import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { SavedJob } from '../models/SavedJob.js';
import { fetchAdzunaJobs } from '../services/adzuna.service.js';

/**
 * POST /api/jobs/:id/save
 * Protected endpoint to save a job to user's profile.
 */
export async function saveJob(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id || req.user?._id;
    const jobId = req.params.id;

    if (!userId) {
      res.status(401).json({ success: false, error: { message: 'Authentication required' } });
      return;
    }

    if (!jobId) {
      res.status(400).json({ success: false, error: { message: 'Job ID parameter is required' } });
      return;
    }

    // Check for duplicate save
    const existing = await SavedJob.findOne({ userId, jobId });
    if (existing) {
      res.status(409).json({
        success: false,
        error: { message: 'Job is already saved to your profile' },
        data: { savedJob: existing },
      });
      return;
    }

    let title = req.body?.title;
    let companyName = req.body?.companyName;
    let location = req.body?.location;
    let jobUrl = req.body?.jobUrl;
    let salary = req.body?.salary;

    // Fetch snapshot from Adzuna if metadata was not supplied in body
    if (!title || !companyName || !location || !jobUrl) {
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
          title = title || matchedJob.title;
          companyName = companyName || matchedJob.company.name;
          location = location || matchedJob.location.displayName;
          jobUrl = jobUrl || matchedJob.url;
          salary = salary || matchedJob.salary;
        }
      } catch (err) {
        title = title || 'Job Position';
        companyName = companyName || 'Company Not Specified';
        location = location || 'India';
        jobUrl = jobUrl || 'https://www.adzuna.in';
      }
    }

    const savedJob = await SavedJob.create({
      userId,
      jobId,
      title,
      companyName,
      location,
      jobUrl,
      salary: salary || { min: null, max: null, isPredicted: false },
      savedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Job saved successfully',
      data: { savedJob },
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        error: { message: 'Job is already saved to your profile' },
      });
      return;
    }
    next(error);
  }
}

/**
 * DELETE /api/jobs/:id/save
 * Protected endpoint to remove a saved job.
 */
export async function removeSavedJob(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id || req.user?._id;
    const jobId = req.params.id;

    if (!userId) {
      res.status(401).json({ success: false, error: { message: 'Authentication required' } });
      return;
    }

    const deleted = await SavedJob.findOneAndDelete({ userId, jobId });

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: { message: 'Saved job not found in your profile' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Job removed from saved list',
      data: { jobId },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/users/saved-jobs
 * Protected endpoint to retrieve authenticated candidate's saved jobs.
 */
export async function getSavedJobs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, error: { message: 'Authentication required' } });
      return;
    }

    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const skip = (page - 1) * limit;

    const [savedJobs, total] = await Promise.all([
      SavedJob.find({ userId }).sort({ savedAt: -1 }).skip(skip).limit(limit).lean(),
      SavedJob.countDocuments({ userId }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    res.status(200).json({
      success: true,
      data: {
        savedJobs,
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
 * GET /api/jobs/:id/saved
 * Protected endpoint to check if specific job is saved by current candidate.
 */
export async function checkJobSaved(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id || req.user?._id;
    const jobId = req.params.id;

    if (!userId) {
      res.status(401).json({ success: false, error: { message: 'Authentication required' } });
      return;
    }

    const existing = await SavedJob.findOne({ userId, jobId }).lean();

    res.status(200).json({
      success: true,
      data: {
        saved: !!existing,
        savedJobId: existing?._id || null,
      },
    });
  } catch (error) {
    next(error);
  }
}
