/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';

interface MailOptions {
  template?: string;
  context?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: string | Buffer;
  }>;
}

@Injectable()
export class MailService {
  private logger: Logger = new Logger(MailService.name);

  constructor(private mailerService: MailerService) {}

  async sendEmail(subject: string, from: string, to: string | string[], options: MailOptions = {}) {
    to = Array.isArray(to) ? to.join() : to;
    const mailOptions = {
      subject,
      from,
      to,
      template: options.template,
      context: options.context,
      attachments: options.attachments
    };

    this.logger.log('Sending mail now');

    const sent = await this.mailerService.sendMail(mailOptions);

    this.logger.log('Returning mail response');
    return { messageId: sent.messageId };
  }
}
