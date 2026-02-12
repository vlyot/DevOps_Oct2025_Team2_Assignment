// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock nodemailer
jest.mock('nodemailer');

import nodemailer from 'nodemailer';
import * as fs from 'fs';

describe('Email Service', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    jest.resetModules();
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Service Initialization', () => {
    it('should initialize when EMAIL_ENABLED is true', async () => {
      process.env.EMAIL_ENABLED = 'true';
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'test@example.com';
      process.env.SMTP_PASS = 'password';

      const mockTransporter = {
        sendMail: jest.fn(),
        verify: jest.fn().mockResolvedValue(true),
      };

      (nodemailer.createTransport as any).mockReturnValue(mockTransporter);

      const { emailService } = await import('../services/emailService');

      expect(nodemailer.createTransport).toHaveBeenCalled();
    });

    it('should not initialize when EMAIL_ENABLED is false', async () => {
      process.env.EMAIL_ENABLED = 'false';

      (nodemailer.createTransport as any).mockClear();

      const { emailService } = await import('../services/emailService');

      expect(nodemailer.createTransport).not.toHaveBeenCalled();
    });
  });

  describe('Send Email', () => {
    it('should send email successfully', async () => {
      process.env.EMAIL_ENABLED = 'true';
      process.env.EMAIL_FROM = 'noreply@example.com';
      process.env.EMAIL_FROM_NAME = 'Test Platform';
      process.env.SMTP_HOST = 'smtp.gmail.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'test@example.com';
      process.env.SMTP_PASS = 'password';

      const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
      const mockTransporter = {
        sendMail: mockSendMail,
        verify: jest.fn().mockResolvedValue(true),
      };

      (nodemailer.createTransport as any).mockReturnValue(mockTransporter);

      const { emailService } = await import('../services/emailService');

      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test</p>',
      });

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Test Subject',
        })
      );
    });

    it('should return false when email service is disabled', async () => {
      process.env.EMAIL_ENABLED = 'false';

      const { emailService } = await import('../services/emailService');

      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result).toBe(false);
    });

    it('should handle send failures gracefully', async () => {
      process.env.EMAIL_ENABLED = 'true';
      process.env.SMTP_HOST = 'smtp.gmail.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'test@example.com';
      process.env.SMTP_PASS = 'password';

      const mockSendMail = jest.fn().mockRejectedValue(new Error('SMTP Error'));
      const mockTransporter = {
        sendMail: mockSendMail,
        verify: jest.fn().mockResolvedValue(true),
      };

      (nodemailer.createTransport as any).mockReturnValue(mockTransporter);

      const { emailService } = await import('../services/emailService');

      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result).toBe(false);
    });
  });

  describe('CRUD Email Notifications', () => {
    beforeEach(() => {
      process.env.EMAIL_ENABLED = 'true';
      process.env.ADMIN_NOTIFICATION_EMAIL = 's10259894A@connect.np.edu.sg';
      process.env.SMTP_HOST = 'smtp.gmail.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'test@example.com';
      process.env.SMTP_PASS = 'password';
    });

    it('should send user created email (CREATE)', async () => {
      const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
      const mockTransporter = {
        sendMail: mockSendMail,
        verify: jest.fn().mockResolvedValue(true),
      };

      (nodemailer.createTransport as any).mockReturnValue(mockTransporter);

      // Mock template file reading
      jest.spyOn(fs, 'readFileSync').mockReturnValue(
        '<p>User {{email}} created with role {{role}}. Action: {{action}}</p>'
      );

      const { emailService } = await import('../services/emailService');

      await emailService.sendUserCreatedEmail('test@example.com', 'user');

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'User Account Created - DevSecOps Platform',
          to: 's10259894A@connect.np.edu.sg',
        })
      );
    });

    it('should send user read email (READ)', async () => {
      const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
      const mockTransporter = {
        sendMail: mockSendMail,
        verify: jest.fn().mockResolvedValue(true),
      };

      (nodemailer.createTransport as any).mockReturnValue(mockTransporter);

      jest.spyOn(fs, 'readFileSync').mockReturnValue(
        '<p>User {{email}} accessed. Action: {{action}}</p>'
      );

      const { emailService } = await import('../services/emailService');

      await emailService.sendUserReadEmail('test@example.com');

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'User Account Accessed - DevSecOps Platform',
          to: 's10259894A@connect.np.edu.sg',
        })
      );
    });

    it('should send user updated email (UPDATE)', async () => {
      const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
      const mockTransporter = {
        sendMail: mockSendMail,
        verify: jest.fn().mockResolvedValue(true),
      };

      (nodemailer.createTransport as any).mockReturnValue(mockTransporter);

      jest.spyOn(fs, 'readFileSync').mockReturnValue(
        '<p>User {{email}} updated from {{oldRole}} to {{newRole}}. Action: {{action}}</p>'
      );

      const { emailService } = await import('../services/emailService');

      await emailService.sendUserUpdatedEmail('test@example.com', 'user', 'admin');

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'User Account Updated - DevSecOps Platform',
          to: 's10259894A@connect.np.edu.sg',
        })
      );
    });

    it('should send user deleted email (DELETE)', async () => {
      const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
      const mockTransporter = {
        sendMail: mockSendMail,
        verify: jest.fn().mockResolvedValue(true),
      };

      (nodemailer.createTransport as any).mockReturnValue(mockTransporter);

      jest.spyOn(fs, 'readFileSync').mockReturnValue(
        '<p>User {{email}} deleted. Action: {{action}}</p>'
      );

      const { emailService } = await import('../services/emailService');

      await emailService.sendUserDeletedEmail('test@example.com');

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'User Account Deleted - DevSecOps Platform',
          to: 's10259894A@connect.np.edu.sg',
        })
      );
    });
  });

  describe('Connection Verification', () => {
    it('should verify SMTP connection successfully', async () => {
      process.env.EMAIL_ENABLED = 'true';
      process.env.SMTP_HOST = 'smtp.gmail.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'test@example.com';
      process.env.SMTP_PASS = 'password';

      const mockVerify = jest.fn().mockResolvedValue(true);
      const mockTransporter = {
        sendMail: jest.fn(),
        verify: mockVerify,
      };

      (nodemailer.createTransport as any).mockReturnValue(mockTransporter);

      const { emailService } = await import('../services/emailService');

      const result = await emailService.verifyConnection();

      expect(result).toBe(true);
      expect(mockVerify).toHaveBeenCalled();
    });

    it('should handle verification failure', async () => {
      process.env.EMAIL_ENABLED = 'true';
      process.env.SMTP_HOST = 'smtp.gmail.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'test@example.com';
      process.env.SMTP_PASS = 'password';

      const mockVerify = jest.fn().mockRejectedValue(new Error('Connection failed'));
      const mockTransporter = {
        sendMail: jest.fn(),
        verify: mockVerify,
      };

      (nodemailer.createTransport as any).mockReturnValue(mockTransporter);

      const { emailService } = await import('../services/emailService');

      const result = await emailService.verifyConnection();

      expect(result).toBe(false);
    });

    it('should return false when transporter is not initialized', async () => {
      process.env.EMAIL_ENABLED = 'false';

      const { emailService } = await import('../services/emailService');

      const result = await emailService.verifyConnection();

      expect(result).toBe(false);
    });
  });

  describe('Template Loading', () => {
    it('should use default template when file loading fails', async () => {
      process.env.EMAIL_ENABLED = 'true';
      process.env.SMTP_HOST = 'smtp.gmail.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'test@example.com';
      process.env.SMTP_PASS = 'password';

      const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
      const mockTransporter = {
        sendMail: mockSendMail,
        verify: jest.fn().mockResolvedValue(true),
      };

      (nodemailer.createTransport as any).mockReturnValue(mockTransporter);

      // Mock template file reading to throw error
      jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
        throw new Error('File not found');
      });

      const { emailService } = await import('../services/emailService');

      const result = await emailService.sendUserCreatedEmail('test@example.com', 'user');

      // Should still send email with default template
      expect(mockSendMail).toHaveBeenCalled();
    });
  });
});
