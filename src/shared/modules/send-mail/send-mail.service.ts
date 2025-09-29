import { IEmail } from '@common/interfaces/email.interface';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private logger: Logger = new Logger(MailService.name);

  constructor(private mailerService: MailerService) {}

  async sendEmail(data: IEmail) {
    const { toAddress, fromAddress, subject, template, options } = data;
    this.logger.log(`Sending mail now with template=${template}`);
    const mailOptions = {
      subject,
      from: fromAddress,
      to: toAddress,
      template: `./${template}`,
      context: options?.context,
      attachments: options?.attachments
    };

    this.logger.log('Sending mail now');

    const sent = await this.mailerService.sendMail(mailOptions);

    this.logger.log('Returning mail response');
    return { messageId: sent.messageId };
  }
}
