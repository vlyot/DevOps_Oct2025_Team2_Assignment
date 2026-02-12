import axios from 'axios';
import { PipelineNotification, DiscordEmbed, DiscordWebhookPayload } from '../models/PipelineNotification';
import { EmbedBuilder } from '../utils/embedBuilder';

export class DiscordService {
  private webhookUrls: {
    admin: string;
    developer: string;
    stakeholder: string;
  };

  constructor() {
    this.webhookUrls = {
      admin: process.env.DISCORD_WEBHOOK_ADMIN || '',
      developer: process.env.DISCORD_WEBHOOK_DEVELOPER || '',
      stakeholder: process.env.DISCORD_WEBHOOK_STAKEHOLDER || ''
    };
  }

  async sendPipelineNotification(data: PipelineNotification): Promise<number> {
    if (process.env.DISCORD_ENABLED !== 'true') {
      console.log('[Discord] Notifications disabled via DISCORD_ENABLED flag');
      return 0;
    }

    const shouldSendSuccess = data.status === 'success' && process.env.SEND_PIPELINE_SUCCESS === 'true';
    const shouldSendFailure = data.status === 'failure' && process.env.SEND_PIPELINE_FAILURE === 'true';

    if (!shouldSendSuccess && !shouldSendFailure) {
      console.log(`[Discord] ${data.status} notification skipped (feature flag disabled)`);
      return 0;
    }

    const embed = data.status === 'success'
      ? EmbedBuilder.buildPipelineSuccessEmbed(data)
      : EmbedBuilder.buildPipelineFailureEmbed(data);

    const webhooks = this.getRoleWebhooks(data.status);

    if (webhooks.length === 0) {
      console.warn('[Discord] No webhook URLs configured');
      return 0;
    }

    let successCount = 0;

    for (const webhookUrl of webhooks) {
      try {
        await this.sendToWebhook(webhookUrl, embed);
        successCount++;
        console.log(`[Discord] Notification sent successfully to webhook`);
      } catch (error) {
        console.error('[Discord] Failed to send notification:', error);
      }
    }

    return successCount;
  }

  private async sendToWebhook(webhookUrl: string, embed: DiscordEmbed): Promise<void> {
    if (!webhookUrl) {
      throw new Error('Webhook URL is empty');
    }

    const payload: DiscordWebhookPayload = {
      embeds: [embed]
    };

    await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
  }

  private getRoleWebhooks(status: 'success' | 'failure'): string[] {
    const webhooks: string[] = [];

    if (status === 'success') {
      if (this.webhookUrls.admin) webhooks.push(this.webhookUrls.admin);
      if (this.webhookUrls.stakeholder) webhooks.push(this.webhookUrls.stakeholder);
    } else {
      if (this.webhookUrls.admin) webhooks.push(this.webhookUrls.admin);
      if (this.webhookUrls.developer) webhooks.push(this.webhookUrls.developer);
    }

    return webhooks;
  }
}

export default new DiscordService();
