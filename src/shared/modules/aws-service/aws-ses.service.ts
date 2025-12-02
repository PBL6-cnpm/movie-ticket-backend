import { Global, Module } from '@nestjs/common';
import { AwsSesService } from './aws-service.module';

@Global()
@Module({
  providers: [AwsSesService],
  exports: [AwsSesService]
})
export class AwsModule {}
