import { Hono } from 'hono';
import { Bindings } from '../config/env.js';

export const authRouter = new Hono<{ Bindings: Bindings }>();

authRouter.get('/status', (c) => {
  return c.json({
    success: true,
    message: 'Auth service initialized (Foundation Stage)',
  });
});
