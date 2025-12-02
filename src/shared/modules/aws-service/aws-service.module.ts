import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { IEmail } from '@common/interfaces/email.interface';
import { APP, AWS } from '@configs/env.config';
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import { join } from 'path';

@Injectable()
export class AwsSesService {
  private logger: Logger = new Logger(AwsSesService.name);
  private sesClient: SESClient;

  constructor() {
    this.sesClient = new SESClient({
      region: AWS.region,
      credentials: {
        accessKeyId: AWS.accessKeyId,
        secretAccessKey: AWS.secretAccessKey
      }
    });
  }

  async sendEmail(data: IEmail) {
    const { toAddress, fromAddress, subject, template, options } = data;
    this.logger.log(`Sending mail via SES SDK with template=${template}`);

    try {
      // 1. Determine template path
      const isProd = APP.nodeEnv === 'production';
      const templateDir = isProd
        ? join(process.cwd(), 'dist', 'common', 'templates')
        : join(process.cwd(), 'src', 'common', 'templates');

      const templatePath = join(templateDir, `${template}.hbs`);

      // 2. Read and compile template
      const source = fs.readFileSync(templatePath, 'utf8');
      const compiledTemplate = handlebars.compile(source);
      const html = compiledTemplate(options?.context || {});

      // 3. Create SendEmailCommand
      const command = new SendEmailCommand({
        Destination: {
          ToAddresses: [toAddress]
        },
        Message: {
          Body: {
            Html: {
              Charset: 'UTF-8',
              Data: html
            }
          },
          Subject: {
            Charset: 'UTF-8',
            Data: subject
          }
        },
        Source: fromAddress || AWS.sesFrom
      });

      // 4. Send email
      const result = await this.sesClient.send(command);

      this.logger.log(`Mail sent successfully. MessageId: ${result.MessageId}`);
      return { messageId: result.MessageId };
    } catch (error) {
      this.logger.error(`Failed to send email via SES: ${error.message}`, error.stack);
      throw error;
    }
  }
}
