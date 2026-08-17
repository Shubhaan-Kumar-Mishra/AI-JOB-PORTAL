import { Hono } from 'hono';
import { Bindings } from '../config/env.js';

export const jobsRouter = new Hono<{ Bindings: Bindings }>();

jobsRouter.get('/status', (c) => {
  return c.json({
    success: true,
    message: 'Jobs search & recommendation service initialized (Foundation Stage)',
  });
});
