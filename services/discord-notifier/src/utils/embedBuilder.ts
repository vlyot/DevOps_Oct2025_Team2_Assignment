import { PipelineNotification, DiscordEmbed, DiscordEmbedField } from '../models/PipelineNotification';

const COLORS = {
  SUCCESS: 0x00ff00, // Green
  FAILURE: 0xff0000, // Red
};

export class EmbedBuilder {
  static buildPipelineSuccessEmbed(data: PipelineNotification): DiscordEmbed {
    const fields: DiscordEmbedField[] = [
      {
        name: '🌿 Branch',
        value: data.branch,
        inline: true
      },
      {
        name: '📝 Commit',
        value: data.commit.substring(0, 7),
        inline: true
      },
      {
        name: '👤 Actor',
        value: data.actor,
        inline: true
      }
    ];

    if (data.duration) {
      fields.push({
        name: '⏱️ Duration',
        value: data.duration,
        inline: true
      });
    }

    fields.push({
      name: '🔗 Run URL',
      value: `[View Details](${data.runUrl})`,
      inline: false
    });

    return {
      title: `✅ ${data.workflowName} - Success`,
      description: `Pipeline completed successfully on \`${data.branch}\``,
      color: COLORS.SUCCESS,
      fields,
      timestamp: data.timestamp,
      footer: {
        text: 'DevOps Pipeline Notification'
      }
    };
  }

  static buildPipelineFailureEmbed(data: PipelineNotification): DiscordEmbed {
    const fields: DiscordEmbedField[] = [
      {
        name: '🌿 Branch',
        value: data.branch,
        inline: true
      },
      {
        name: '📝 Commit',
        value: data.commit.substring(0, 7),
        inline: true
      },
      {
        name: '👤 Actor',
        value: data.actor,
        inline: true
      }
    ];

    if (data.duration) {
      fields.push({
        name: '⏱️ Duration',
        value: data.duration,
        inline: true
      });
    }

    if (data.failedServices && data.failedServices.length > 0) {
      fields.push({
        name: '❌ Failed Services',
        value: data.failedServices.join(', '),
        inline: false
      });
    }

    if (data.securityFindings) {
      const findings = data.securityFindings;
      const findingsText = [
        findings.critical ? `🔴 Critical: ${findings.critical}` : null,
        findings.high ? `🟠 High: ${findings.high}` : null,
        findings.medium ? `🟡 Medium: ${findings.medium}` : null,
        findings.low ? `🟢 Low: ${findings.low}` : null
      ].filter(Boolean).join('\n');

      if (findingsText) {
        fields.push({
          name: '🔒 Security Findings',
          value: findingsText,
          inline: false
        });
      }
    }

    fields.push({
      name: '🔗 Run URL',
      value: `[View Details](${data.runUrl})`,
      inline: false
    });

    return {
      title: `❌ ${data.workflowName} - Failure`,
      description: `Pipeline failed on \`${data.branch}\``,
      color: COLORS.FAILURE,
      fields,
      timestamp: data.timestamp,
      footer: {
        text: 'DevOps Pipeline Notification'
      }
    };
  }
}
