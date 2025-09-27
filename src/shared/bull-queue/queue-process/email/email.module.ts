import { Global, Module } from '@nestjs/common';

import { MailModule } from 'shared/modules/send-mail/send-mail.module';
import { EmailService } from './email.service';

@Global()
@Module({
  providers: [EmailService],
  exports: [EmailService],
  imports: [MailModule]
})
export class EmailModule {}
