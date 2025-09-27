import { config, email } from '@config/index';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Global, Module } from '@nestjs/common';
import { join } from 'path';
import { MailService } from './mail.service';

const isProd = config.nodeEnv === 'production';
const templateDir = isProd
  ? join(process.cwd(), 'dist', 'common', 'templates')
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
          options: { strict: true }
        }
      })
    })
  ],
  providers: [MailService],
  exports: [MailService]
})
export class MailModule {}
