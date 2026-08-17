import { Request, Response, NextFunction } from 'express';
import { fetchAdzunaJobs } from '../services/adzuna.service.js';
import { jobSearchQuerySchema } from '../validators/jobValidators.js';
import { ZodError } from 'zod';

/**
 * GET /api/jobs/search
 * Public endpoint to search live jobs via Adzuna API.
 */
export async function searchJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validatedParams = jobSearchQuerySchema.parse(req.query);
    const result = await fetchAdzunaJobs(validatedParams);
    res.status(200).json(result);
  } catch (error: any) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid query parameters',
          details: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
        },
      });
      return;
    }

    if (error.message?.includes('credentials')) {
      res.status(503).json({
        success: false,
        error: {
          message: error.message,
        },
      });
      return;
    }

    if (error.message?.includes('rate limit')) {
      res.status(429).json({
        success: false,
        error: {
          message: error.message,
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to search jobs from Adzuna API',
      },
    });
  }
}

/**
 * GET /api/jobs/:id
 * Public endpoint to fetch specific job details.
 */
export async function getJobById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, error: { message: 'Job ID is required' } });
      return;
    }

    // Search Adzuna with the job ID
    const result = await fetchAdzunaJobs({
      keyword: id,
      location: '',
      page: 1,
      resultsPerPage: 1,
      sortBy: 'relevance',
    });
    const job = result.data.jobs.find((j) => j.id === id) || result.data.jobs[0];

    if (!job) {
      res.status(404).json({
        success: false,
        error: { message: 'Job position not found or no longer available' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        job,
        attribution: {
          text: 'Jobs by Adzuna',
          link: 'https://www.adzuna.in',
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to retrieve job details',
      },
    });
  }
}
