import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: any;

  constructor(private config: ConfigService) {
    const user = config.get('EMAIL_ADDRESS') || '';
    const pass = config.get('EMAIL_PASSWORD') || '';

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host: config.get('EMAIL_SMTP_SERVER') || 'smtp.gmail.com',
        port: parseInt(config.get('EMAIL_SMTP_PORT') || '587'),
        secure: false,
        auth: { user, pass },
      });
    }
  }

  async sendReply(to: string, text: string, subject = 'Re: Your enquiry'): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('Email not configured');
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: this.config.get('EMAIL_ADDRESS'),
        to,
        subject,
        text,
      });
      this.logger.log(`Email reply sent to ${to}`);
      return true;
    } catch (err: any) {
      this.logger.error(`Failed to send email to ${to}: ${err.message}`);
      return false;
    }
  }
}
