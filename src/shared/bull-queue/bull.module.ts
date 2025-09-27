import { BULL_OPTS, QUEUE_KEY } from '@common/constants/queue.constant';
import { BullModule } from '@nestjs/bull';
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUE_KEY.sendEmail,
      defaultJobOptions: BULL_OPTS
    })
  ],
  providers: [],
  exports: [BullModule]
})
export class BullQueueModule {}
