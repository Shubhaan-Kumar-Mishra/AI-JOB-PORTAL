import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
  getDashboardStats,
} from '../controllers/applicationsController.js';

export const applicationsRouter = Router();

// Application Tracking Routes (All protected)
applicationsRouter.post('/applications', authMiddleware, createApplication);
applicationsRouter.get('/applications', authMiddleware, getApplications);
applicationsRouter.get('/applications/:id', authMiddleware, getApplicationById);
applicationsRouter.patch('/applications/:id', authMiddleware, updateApplication);
applicationsRouter.delete('/applications/:id', authMiddleware, deleteApplication);

// Candidate Dashboard Statistics Aggregation
applicationsRouter.get('/users/dashboard-stats', authMiddleware, getDashboardStats);
