import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SentMessageInfo, Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: Transporter<SentMessageInfo>;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: port || 587,
        secure: port === 465, // true for 465, false for other ports
        auth: {
          user,
          pass,
        },
      });
      this.logger.log('Mail transporter initialized successfully.');
    } else {
      this.logger.warn(
        'SMTP credentials not fully configured. Emails will not be sent.',
      );
    }
  }

  async sendMail(to: string, subject: string, text: string, html?: string) {
    if (!this.transporter) {
      this.logger.warn(`Cannot send email to ${to}: SMTP not configured.`);
      throw new InternalServerErrorException('SMTP not configured.');
    }

    try {
      const from =
        this.configService.get<string>('SMTP_FROM') || 'amshisp@gmail.com';
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const info: { messageId: string } = await this.transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });
      this.logger.log(`Message sent: ${String(info?.messageId)}`);
    } catch (error) {
      this.logger.error(`Error sending email to ${to}:`, error);
      throw new InternalServerErrorException('Failed to send email. Please check your SMTP configuration.');
    }
  }
}
