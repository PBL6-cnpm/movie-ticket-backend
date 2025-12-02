import { Module } from '@nestjs/common';
import { AwsModule } from '@shared/modules/aws-service/aws-ses.service';
import { EmailProcessor } from './email.processor';

@Module({
  providers: [EmailProcessor],
  exports: [EmailProcessor],
  imports: [AwsModule]
})
export class EmailModule {}
