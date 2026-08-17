import { Router, Request, Response } from 'express';

export const resumeRouter = Router();

resumeRouter.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'AI Resume Analysis service initialized (Node.js + Express Foundation Stage)',
  });
});
