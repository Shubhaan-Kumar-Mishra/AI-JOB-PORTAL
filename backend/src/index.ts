import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Bindings } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { jobsRouter } from './routes/jobs.js';
import { resumeRouter } from './routes/resume.js';

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for frontend client
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// Register centralized error handler
app.onError(errorHandler);

// Mount API routes
app.route('/api/health', healthRouter);
app.route('/api/auth', authRouter);
app.route('/api/jobs', jobsRouter);
app.route('/api/resume', resumeRouter);

// Root route
app.get('/', (c) => {
  return c.json({
    name: 'AI Job Portal API',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// 404 Handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        message: `Route not found: ${c.req.method} ${c.req.url}`,
      },
    },
    404
  );
});

export default app;
