import { Request, Response, NextFunction } from 'express';

export function validateWebhookToken(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-webhook-token'];
  const expectedToken = process.env.WEBHOOK_TOKEN;

  if (!token || token !== expectedToken) {
    res.status(401).json({ error: 'Unauthorized: Invalid webhook token' });
    return;
  }

  next();
}
