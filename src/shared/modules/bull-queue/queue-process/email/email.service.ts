import { QUEUE_KEY } from '@common/constants/queue.constant';
import { IEmailQueue } from '@common/interfaces/email.interface';
import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { MailService } from 'shared/modules/mail/mail.service';

@Injectable()
@Processor(QUEUE_KEY.sendEmail)
export class EmailService {
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
