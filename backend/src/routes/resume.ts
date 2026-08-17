import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  uploadResume,
  getResume,
  deleteResume,
  getResumeStatus,
} from '../controllers/resumeController.js';

// Configure Multer with Memory Storage (no persistent disk files created)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB maximum file size limit
  },
});

export const resumeRouter = Router();

// Resume Routes (All Protected)
resumeRouter.post('/', authMiddleware, upload.single('resume'), uploadResume);
resumeRouter.get('/', authMiddleware, getResume);
resumeRouter.delete('/', authMiddleware, deleteResume);
resumeRouter.get('/status', authMiddleware, getResumeStatus);
