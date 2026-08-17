import { Router, Request, Response } from 'express';

export const authRouter = Router();

authRouter.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Auth service initialized (Node.js + Express Foundation Stage)',
  });
});
