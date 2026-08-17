import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { connectDB } from './db/mongodb.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { jobsRouter } from './routes/jobs.js';
import { savedJobsRouter } from './routes/savedJobs.js';
import { applicationsRouter } from './routes/applications.js';
import { resumeRouter } from './routes/resume.js';
import { aiRouter } from './routes/ai.js';
import { errorHandler } from './middleware/error-handler.js';

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());

// API Route Mounts
app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api', jobsRouter);
app.use('/api', savedJobsRouter);
app.use('/api', applicationsRouter);
app.use('/api/resume', resumeRouter);
app.use('/api/ai', aiRouter);

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start Express Local Server
const PORT = config.port;

const startServer = async () => {
  try {
    await connectDB();
  } catch (error) {
    console.warn('⚠️ MongoDB connection could not be established on startup. Backend endpoints requiring database will handle connection lazily.');
  }

  app.listen(PORT, () => {
    console.log(`🚀 Express server running locally on http://localhost:${PORT}`);
  });
};

startServer();

export default app;
