import { Hono } from 'hono';
import { Bindings } from '../config/env.js';

export const resumeRouter = new Hono<{ Bindings: Bindings }>();

resumeRouter.get('/status', (c) => {
  return c.json({
    success: true,
    message: 'AI Resume Analysis service initialized (Foundation Stage)',
  });
});
