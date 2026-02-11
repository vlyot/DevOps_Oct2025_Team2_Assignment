import nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

type CRUDAction = 'create' | 'read' | 'update' | 'delete';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.EMAIL_ENABLED === 'true';

    if (this.enabled) {
      this.initializeTransporter();
    }
  }

  private initializeTransporter() {
    const config = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };

    this.transporter = nodemailer.createTransport(config);
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.enabled || !this.transporter) {
      console.log('[Email] Service disabled or not configured');
      return false;
    }

    try {
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'DevSecOps Platform'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('[Email] Sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('[Email] Failed to send:', error);
      return false;
    }
  }

  async sendUserCreatedEmail(email: string, role: string): Promise<boolean> {
    const template = this.loadTemplate('userCreated.html');
    const html = template
      .replace('{{email}}', email)
      .replace('{{role}}', role)
      .replace('{{action}}', 'CREATE');

    return this.sendEmail({
      to: process.env.ADMIN_NOTIFICATION_EMAIL || email,
      subject: 'User Account Created - DevSecOps Platform',
      html,
    });
  }

  async sendUserReadEmail(email: string): Promise<boolean> {
    const template = this.loadTemplate('userRead.html');
    const html = template
      .replace('{{email}}', email)
      .replace('{{action}}', 'READ');

    return this.sendEmail({
      to: process.env.ADMIN_NOTIFICATION_EMAIL || email,
      subject: 'User Account Accessed - DevSecOps Platform',
      html,
    });
  }

  async sendUserUpdatedEmail(email: string, oldRole: string, newRole: string): Promise<boolean> {
    const template = this.loadTemplate('userUpdated.html');
    const html = template
      .replace(/{{email}}/g, email)
      .replace('{{oldRole}}', oldRole)
      .replace('{{newRole}}', newRole)
      .replace('{{action}}', 'UPDATE');

    return this.sendEmail({
      to: process.env.ADMIN_NOTIFICATION_EMAIL || email,
      subject: 'User Account Updated - DevSecOps Platform',
      html,
    });
  }

  async sendUserDeletedEmail(email: string): Promise<boolean> {
    const template = this.loadTemplate('userDeleted.html');
    const html = template
      .replace('{{email}}', email)
      .replace('{{action}}', 'DELETE');

    return this.sendEmail({
      to: process.env.ADMIN_NOTIFICATION_EMAIL || email,
      subject: 'User Account Deleted - DevSecOps Platform',
      html,
    });
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

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) return false;

    try {
      await this.transporter.verify();
      console.log('[Email] SMTP connection verified');
      return true;
    } catch (error) {
      console.error('[Email] SMTP verification failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
