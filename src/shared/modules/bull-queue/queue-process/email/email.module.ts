import { Module } from '@nestjs/common';
import { MailModuleCustom } from '@shared/modules/send-mail/send-mail.module';
import { EmailProcessor } from './email.processor';

@Module({
  providers: [EmailProcessor],
  exports: [EmailProcessor],
  imports: [MailModuleCustom]
})
export class EmailModule {}
