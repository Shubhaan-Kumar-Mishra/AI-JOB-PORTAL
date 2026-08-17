import { Router, Request, Response } from 'express';

export const jobsRouter = Router();

jobsRouter.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Jobs search & recommendation service initialized (Node.js + Express Foundation Stage)',
  });
});
