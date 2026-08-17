import { Router } from 'express';
import { searchJobs, getJobById } from '../controllers/jobsController.js';

export const jobsRouter = Router();

/**
 * @route   GET /api/jobs/search
 * @desc    Search jobs dynamically via Adzuna API
 * @access  Public
 */
jobsRouter.get('/search', searchJobs);

/**
 * @route   GET /api/jobs/:id
 * @desc    Get detailed information for a specific job
 * @access  Public
 */
jobsRouter.get('/:id', getJobById);
