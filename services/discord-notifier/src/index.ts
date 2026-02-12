import express, { Request, Response } from 'express';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { validateEnv } from './config/validateEnv';
import { validateWebhookToken } from './middleware/authMiddleware';
import discordService from './services/discordService';
import { PipelineNotification } from './models/PipelineNotification';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'discord-notifier',
    timestamp: new Date().toISOString()
  });
});

app.post('/notify/pipeline', validateWebhookToken, async (req: Request, res: Response) => {
  try {
    const data: PipelineNotification = req.body;

    if (!data.status || !data.workflowName || !data.branch || !data.runUrl) {
      res.status(400).json({
        error: 'Missing required fields: status, workflowName, branch, runUrl'
      });
      return;
    }

    if (data.status !== 'success' && data.status !== 'failure') {
      res.status(400).json({
        error: 'Invalid status: must be "success" or "failure"'
      });
      return;
    }

    const notificationsSent = await discordService.sendPipelineNotification(data);

    res.status(200).json({
      message: 'Pipeline notification processed',
      status: data.status,
      notificationsSent
    });
  } catch (error: any) {
    console.error('[Pipeline] Notification error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Discord Notifier service running on port ${PORT}`);

  try {
    validateEnv();
  } catch (error: any) {
    console.error('❌ Environment validation failed:', error.message);
    process.exit(1);
  }
});

export default app;
