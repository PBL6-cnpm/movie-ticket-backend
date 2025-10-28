import { QUEUE_KEY } from '@common/constants';
import { IEmailQueue } from '@common/interfaces/email.interface';
import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { MailService } from '@shared/modules/send-mail/send-mail.service';
import { Job } from 'bull';

@Injectable()
@Processor(QUEUE_KEY.sendEmail)
export class EmailProcessor {
  constructor(private readonly mailerService: MailService) {}
  @Process()
  async transcode(job: Job<unknown>) {
    const { data } = job.data as IEmailQueue;
    try {
      await this.mailerService.sendEmail(data);
    } catch (error) {
      console.log(error);
    }
  }
}
