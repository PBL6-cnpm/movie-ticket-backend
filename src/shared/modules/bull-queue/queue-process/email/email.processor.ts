import { QUEUE_KEY } from '@common/constants';
import { IEmailQueue } from '@common/interfaces/email.interface';
import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { AwsSesService } from '@shared/modules/aws-service/aws-service.module';
import { Job } from 'bull';

@Injectable()
@Processor(QUEUE_KEY.sendEmail)
export class EmailProcessor {
  constructor(private readonly awsSesService: AwsSesService) {}
  @Process()
  async transcode(job: Job<unknown>) {
    const { data } = job.data as IEmailQueue;
    try {
      await this.awsSesService.sendEmail(data);
    } catch (error) {
      console.log(error);
    }
  }
}
