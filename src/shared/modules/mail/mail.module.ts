import { email } from '@config/index';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Global, Module } from '@nestjs/common';
import { existsSync } from 'fs';
import { join } from 'path';
import { MailService } from './mail.service';

const templateDir = existsSync(join(process.cwd(), 'dist'))
  ? join(process.cwd(), 'dist', 'src', 'common', 'templates')
  : join(process.cwd(), 'src', 'common', 'templates');

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          host: email.smtpHost,
          port: email.smtpPort,
          secure: false,
          auth: {
            user: email.smtpUser,
            pass: email.smtpPassword
          }
        },
        template: {
          dir: templateDir,
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true
          }
        }
      })
    })
  ],
  providers: [MailService],
  exports: [MailService]
})
export class MailModule {}
