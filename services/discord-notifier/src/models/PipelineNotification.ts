export interface PipelineNotification {
  status: 'success' | 'failure';
  workflowName: string;
  branch: string;
  commit: string;
  actor: string;
  duration?: string;
  runUrl: string;
  timestamp: string;
  failedServices?: string[];
  securityFindings?: {
    critical?: number;
    high?: number;
    medium?: number;
    low?: number;
  };
}

export interface DiscordEmbed {
  title: string;
  description: string;
  color: number;
  fields: DiscordEmbedField[];
  timestamp: string;
  footer?: {
    text: string;
  };
}

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordWebhookPayload {
  embeds: DiscordEmbed[];
}
