import axios from 'axios';
import { PipelineNotification, DiscordEmbed, DiscordWebhookPayload } from '../models/PipelineNotification';
import { EmbedBuilder } from '../utils/embedBuilder';

export class DiscordService {
  private webhookUrls: {
    qa: string;
    developer: string;
    stakeholder: string;
  };

  constructor() {
    // Hardcoded Discord webhook URLs
    this.webhookUrls = {
      qa: 'https://discord.com/api/webhooks/1471463573413826713/Y0kYWtnwt-VthxI69NhZBW7yOn_4iOyjcqw4RX8aBc7i_870qc5lA83rOliRY5trx8Sc',
      developer: 'https://discord.com/api/webhooks/1471463992626249781/BG1Oj_POf-aPi-__qoyLCF002yRjtZdDrnXc2S6cXm65M-y2VKf-9iDD3CsfVIkQdDqI',
      stakeholder: 'https://discord.com/api/webhooks/1471463797607895233/-MibfyL-AGysGl5YkdSwFEL1tdXajabBu3Vn2oaZFi5yCDrk2y99jJqhh-0TIt3wqOnf'
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

    // QA: Always gets notifications (success and failure)
    if (this.webhookUrls.qa) webhooks.push(this.webhookUrls.qa);

    // Developers: Always gets notifications (success and failure)
    if (this.webhookUrls.developer) webhooks.push(this.webhookUrls.developer);

    // Stakeholders: Only gets success notifications
    if (status === 'success' && this.webhookUrls.stakeholder) {
      webhooks.push(this.webhookUrls.stakeholder);
    }

    return webhooks;
  }
}

export default new DiscordService();
