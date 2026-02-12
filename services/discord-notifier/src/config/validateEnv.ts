export function validateEnv(): void {
  // Webhook URLs are hardcoded, only token validation needed
  if (!process.env.WEBHOOK_TOKEN) {
    console.warn('⚠️  Warning: WEBHOOK_TOKEN not set, authentication will be weak');
  }

  console.log('✅ Environment variables validated');
  console.log('📡 Discord webhooks: hardcoded (QA, Dev, Stakeholder)');
}
