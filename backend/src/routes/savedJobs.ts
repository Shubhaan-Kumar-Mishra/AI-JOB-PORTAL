import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  saveJob,
  removeSavedJob,
  getSavedJobs,
  checkJobSaved,
} from '../controllers/savedJobsController.js';

export const savedJobsRouter = Router();

// Saved Job Routes (All protected)
savedJobsRouter.post('/jobs/:id/save', authMiddleware, saveJob);
savedJobsRouter.delete('/jobs/:id/save', authMiddleware, removeSavedJob);
savedJobsRouter.get('/jobs/:id/saved', authMiddleware, checkJobSaved);
savedJobsRouter.get('/users/saved-jobs', authMiddleware, getSavedJobs);
