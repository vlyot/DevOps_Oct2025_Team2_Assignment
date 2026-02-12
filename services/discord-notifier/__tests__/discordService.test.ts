import axios from 'axios';
import { DiscordService } from '../src/services/discordService';
import { PipelineNotification } from '../src/models/PipelineNotification';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('DiscordService', () => {
  let service: DiscordService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DISCORD_ENABLED = 'true';
    process.env.SEND_PIPELINE_SUCCESS = 'true';
    process.env.SEND_PIPELINE_FAILURE = 'true';
    process.env.DISCORD_WEBHOOK_ADMIN = 'https://discord.com/api/webhooks/admin';
    process.env.DISCORD_WEBHOOK_DEVELOPER = 'https://discord.com/api/webhooks/developer';
    process.env.DISCORD_WEBHOOK_STAKEHOLDER = 'https://discord.com/api/webhooks/stakeholder';
    service = new DiscordService();
  });

  describe('sendPipelineNotification', () => {
    it('should send success notification to admin and stakeholder webhooks', async () => {
      const data: PipelineNotification = {
        status: 'success',
        workflowName: 'CI Pipeline',
        branch: 'main',
        commit: 'abc1234567',
        actor: 'testuser',
        duration: '2m 30s',
        runUrl: 'https://github.com/test/repo/actions/runs/123',
        timestamp: new Date().toISOString()
      };

      mockedAxios.post.mockResolvedValue({ data: {} });

      const result = await service.sendPipelineNotification(data);

      expect(result).toBe(2);
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });

    it('should send failure notification to admin and developer webhooks', async () => {
      const data: PipelineNotification = {
        status: 'failure',
        workflowName: 'CI Pipeline',
        branch: 'develop',
        commit: 'xyz9876543',
        actor: 'testuser',
        duration: '1m 15s',
        runUrl: 'https://github.com/test/repo/actions/runs/456',
        timestamp: new Date().toISOString(),
        failedServices: ['auth', 'frontend'],
        securityFindings: {
          critical: 2,
          high: 5,
          medium: 10,
          low: 3
        }
      };

      mockedAxios.post.mockResolvedValue({ data: {} });

      const result = await service.sendPipelineNotification(data);

      expect(result).toBe(2);
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });

    it('should return 0 when Discord is disabled', async () => {
      process.env.DISCORD_ENABLED = 'false';
      service = new DiscordService();

      const data: PipelineNotification = {
        status: 'success',
        workflowName: 'CI Pipeline',
        branch: 'main',
        commit: 'abc1234567',
        actor: 'testuser',
        runUrl: 'https://github.com/test/repo/actions/runs/123',
        timestamp: new Date().toISOString()
      };

      const result = await service.sendPipelineNotification(data);

      expect(result).toBe(0);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should skip notification when feature flag is disabled', async () => {
      process.env.SEND_PIPELINE_SUCCESS = 'false';
      service = new DiscordService();

      const data: PipelineNotification = {
        status: 'success',
        workflowName: 'CI Pipeline',
        branch: 'main',
        commit: 'abc1234567',
        actor: 'testuser',
        runUrl: 'https://github.com/test/repo/actions/runs/123',
        timestamp: new Date().toISOString()
      };

      const result = await service.sendPipelineNotification(data);

      expect(result).toBe(0);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should handle webhook failures gracefully', async () => {
      const data: PipelineNotification = {
        status: 'success',
        workflowName: 'CI Pipeline',
        branch: 'main',
        commit: 'abc1234567',
        actor: 'testuser',
        runUrl: 'https://github.com/test/repo/actions/runs/123',
        timestamp: new Date().toISOString()
      };

      mockedAxios.post
        .mockRejectedValueOnce(new Error('Webhook failed'))
        .mockResolvedValueOnce({ data: {} });

      const result = await service.sendPipelineNotification(data);

      expect(result).toBe(1);
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });

    it('should return 0 when no webhooks are configured', async () => {
      process.env.DISCORD_WEBHOOK_ADMIN = '';
      process.env.DISCORD_WEBHOOK_DEVELOPER = '';
      process.env.DISCORD_WEBHOOK_STAKEHOLDER = '';
      service = new DiscordService();

      const data: PipelineNotification = {
        status: 'success',
        workflowName: 'CI Pipeline',
        branch: 'main',
        commit: 'abc1234567',
        actor: 'testuser',
        runUrl: 'https://github.com/test/repo/actions/runs/123',
        timestamp: new Date().toISOString()
      };

      const result = await service.sendPipelineNotification(data);

      expect(result).toBe(0);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });
});
