export function validateEnv(): void {
  const required = ['WEBHOOK_TOKEN'];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (process.env.DISCORD_ENABLED === 'true') {
    const webhooks = [
      'DISCORD_WEBHOOK_ADMIN',
      'DISCORD_WEBHOOK_DEVELOPER',
      'DISCORD_WEBHOOK_STAKEHOLDER'
    ];

    const missingWebhooks = webhooks.filter(key => !process.env[key]);

    if (missingWebhooks.length > 0) {
      console.warn(`⚠️  Warning: Discord enabled but missing webhooks: ${missingWebhooks.join(', ')}`);
    }
  }

  console.log('✅ Environment variables validated');
}
