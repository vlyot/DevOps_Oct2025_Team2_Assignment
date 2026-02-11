import { Resend } from 'resend';
import * as fs from 'fs';
import * as path from 'path';
import { subscriberRepository } from '../repositories/subscriberRepository';

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
}

export const emailService = new EmailService();
