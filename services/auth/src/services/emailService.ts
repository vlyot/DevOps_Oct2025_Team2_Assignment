import { Resend } from 'resend';
import * as fs from 'fs';
import * as path from 'path';
import { subscriberRepository } from '../repositories/subscriberRepository';
import { PipelineData } from '../models/PipelineData';

type CRUDAction = 'create' | 'read' | 'update' | 'delete';

class EmailService {
  private resend: Resend | null = null;
  private enabled: boolean;
  private fromEmail: string;

  constructor() {
    this.enabled = process.env.EMAIL_ENABLED === 'true';
    this.fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';

    if (this.enabled && process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
      console.log('[Email] Resend initialized');
    } else if (this.enabled) {
      console.warn('[Email] EMAIL_ENABLED is true but RESEND_API_KEY is missing');
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.enabled || !this.resend) {
      console.log('[Email] Service disabled or not configured');
      return false;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: to,
        subject: subject,
        html: html,
      });

      if (error) {
        console.error('[Email] Failed to send:', error);
        return false;
      }

      console.log('[Email] Sent successfully:', data?.id);
      return true;
    } catch (error) {
      console.error('[Email] Exception during send:', error);
      return false;
    }
  }

  /**
   * Send email to all active subscribers
   */
  async sendToAllSubscribers(subject: string, html: string): Promise<number> {
    const subscribers = await subscriberRepository.getActiveSubscribers();

    if (subscribers.length === 0) {
      console.log('[Email] No active subscribers');
      return 0;
    }

    console.log(`[Email] Sending to ${subscribers.length} subscribers...`);

    let successCount = 0;
    for (const email of subscribers) {
      const success = await this.sendEmail(email, subject, html);
      if (success) successCount++;
    }

    console.log(`[Email] Sent ${successCount}/${subscribers.length} emails successfully`);
    return successCount;
  }

  async sendUserCreatedEmail(email: string, role: string): Promise<number> {
    const template = this.loadTemplate('userCreated.html');
    const html = template
      .replace('{{email}}', email)
      .replace('{{role}}', role)
      .replace('{{action}}', 'CREATE');

    return this.sendToAllSubscribers(
      'User Account Created - DevSecOps Platform',
      html
    );
  }

  async sendUserReadEmail(email: string): Promise<number> {
    const template = this.loadTemplate('userRead.html');
    const html = template
      .replace('{{email}}', email)
      .replace('{{action}}', 'READ');

    return this.sendToAllSubscribers(
      'User Account Accessed - DevSecOps Platform',
      html
    );
  }

  async sendUserUpdatedEmail(email: string, oldRole: string, newRole: string): Promise<number> {
    const template = this.loadTemplate('userUpdated.html');
    const html = template
      .replace(/{{email}}/g, email)
      .replace('{{oldRole}}', oldRole)
      .replace('{{newRole}}', newRole)
      .replace('{{action}}', 'UPDATE');

    return this.sendToAllSubscribers(
      'User Account Updated - DevSecOps Platform',
      html
    );
  }

  async sendUserDeletedEmail(email: string): Promise<number> {
    const template = this.loadTemplate('userDeleted.html');
    const html = template
      .replace('{{email}}', email)
      .replace('{{action}}', 'DELETE');

    return this.sendToAllSubscribers(
      'User Account Deleted - DevSecOps Platform',
      html
    );
  }

  private loadTemplate(templateName: string): string {
    const templatePath = path.join(__dirname, '../templates', templateName);
    try {
      return fs.readFileSync(templatePath, 'utf-8');
    } catch (error) {
      console.error(`[Email] Failed to load template ${templateName}:`, error);
      return this.getDefaultTemplate();
    }
  }

  private getDefaultTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><title>Notification</title></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
          <h1 style="color: #333;">User Action Notification</h1>
          <p>A user action has been performed on the DevSecOps Platform.</p>
        </div>
      </body>
      </html>
    `;
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.resend) {
      return false;
    }

    // Resend doesn't have a verify method, but we can check if the API key is set
    return !!process.env.RESEND_API_KEY;
  }

  /**
   * Send email to subscribers based on their roles
   */
  async sendToSubscribersByRole(subject: string, html: string, roles: string[]): Promise<number> {
    const subscribers = await subscriberRepository.getActiveSubscribersByRole(roles);

    if (subscribers.length === 0) {
      console.log(`[Email] No active subscribers for roles: ${roles.join(', ')}`);
      return 0;
    }

    console.log(`[Email] Sending to ${subscribers.length} subscribers (roles: ${roles.join(', ')})...`);

    let successCount = 0;
    for (const email of subscribers) {
      const success = await this.sendEmail(email, subject, html);
      if (success) successCount++;
    }

    console.log(`[Email] Sent ${successCount}/${subscribers.length} emails successfully`);
    return successCount;
  }

  async sendPipelineSuccessEmail(pipelineData: PipelineData): Promise<number> {
    const template = this.loadTemplate('pipelineSuccess.html');
    const html = template
      .replace('{{branch}}', pipelineData.branch)
      .replace('{{commit}}', pipelineData.commit.substring(0, 7))
      .replace('{{actor}}', pipelineData.actor)
      .replace('{{duration}}', pipelineData.duration || 'N/A')
      .replace('{{timestamp}}', pipelineData.timestamp)
      .replace('{{runUrl}}', pipelineData.runUrl);

    const roles = pipelineData.notifyRoles || ['admin', 'stakeholder'];
    return this.sendToSubscribersByRole(
      `✅ Pipeline Success - ${pipelineData.branch}`,
      html,
      roles
    );
  }

  async sendPipelineFailureEmail(pipelineData: PipelineData): Promise<number> {
    const template = this.loadTemplate('pipelineFailure.html');

    let failedServicesHtml = '';
    if (pipelineData.failedServices) {
      const services = pipelineData.failedServices.split(',').filter(s => s.trim());
      if (services.length > 0) {
        failedServicesHtml = `
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3 style="margin-top: 0; color: #856404;">⚠️ Failed Services</h3>
          <ul style="margin: 10px 0; padding-left: 20px;">
            ${services.map(s => `<li style="color: #856404;"><strong>${s}</strong></li>`).join('')}
          </ul>
        </div>
      `;
      }
    }

    let securityHtml = '';
    if (pipelineData.securityFindings &&
        (pipelineData.securityFindings.critical > 0 || pipelineData.securityFindings.high > 0)) {
      securityHtml = `
      <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
        <h3 style="margin-top: 0; color: #721c24;">🔒 Security Findings</h3>
        <p style="margin: 5px 0;"><strong>Critical:</strong> <span style="color: #dc3545;">${pipelineData.securityFindings.critical}</span></p>
        <p style="margin: 5px 0;"><strong>High:</strong> <span style="color: #dc3545;">${pipelineData.securityFindings.high}</span></p>
        <p style="margin: 5px 0;"><strong>Medium:</strong> ${pipelineData.securityFindings.medium}</p>
        <p style="margin: 5px 0;"><strong>Low:</strong> ${pipelineData.securityFindings.low}</p>
      </div>
    `;
    }

    const html = template
      .replace('{{branch}}', pipelineData.branch)
      .replace('{{commit}}', pipelineData.commit.substring(0, 7))
      .replace('{{actor}}', pipelineData.actor)
      .replace('{{duration}}', pipelineData.duration || 'N/A')
      .replace('{{timestamp}}', pipelineData.timestamp)
      .replace('{{runUrl}}', pipelineData.runUrl)
      .replace('{{failedServices}}', failedServicesHtml)
      .replace('{{securityFindings}}', securityHtml);

    const roles = pipelineData.notifyRoles || ['admin', 'developer'];
    return this.sendToSubscribersByRole(
      `❌ Pipeline Failed - ${pipelineData.branch}`,
      html,
      roles
    );
  }
}

export const emailService = new EmailService();
