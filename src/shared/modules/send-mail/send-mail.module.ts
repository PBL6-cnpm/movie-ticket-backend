import { APP, EMAIL } from '@configs/env.config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Global, Module } from '@nestjs/common';
import { join } from 'path';
import { MailService } from './send-mail.service';

const isProd = APP.nodeEnv === 'production';
const templateDir = isProd
  ? join(process.cwd(), 'dist', 'common', 'templates')
  : join(process.cwd(), 'src', 'common', 'templates');

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          host: EMAIL.smtpHost,
          port: EMAIL.smtpPort,
          secure: false,
          auth: {
            user: EMAIL.smtpUser,
            pass: EMAIL.smtpPassword
          }
        },
        template: {
          dir: templateDir,
          adapter: new HandlebarsAdapter(),
          options: { strict: true }
        }
      })
    })
  ],
  providers: [MailService],
  exports: [MailService]
})
export class MailModuleCustom {}
