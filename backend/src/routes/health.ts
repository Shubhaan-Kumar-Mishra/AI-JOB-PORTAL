import { Hono } from 'hono';
import { Bindings } from '../config/env.js';

export const healthRouter = new Hono<{ Bindings: Bindings }>();

healthRouter.get('/', (c) => {
  return c.json({
    success: true,
    message: 'AI Job Portal API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});
