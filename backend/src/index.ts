import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { connectDB } from './db/mongodb.js';
import { errorHandler } from './middleware/error-handler.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { jobsRouter } from './routes/jobs.js';
import { resumeRouter } from './routes/resume.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount API Routers
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/resume', resumeRouter);

// Root Endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'AI Job Portal API (Node.js + Express)',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    },
  });
});

// Centralized Error Handler
app.use(errorHandler);

// Start Server & Connect Database
const PORT = config.port;

app.listen(PORT, async () => {
  console.log(`🚀 Express server running locally on http://localhost:${PORT}`);
  await connectDB();
});

export default app;
