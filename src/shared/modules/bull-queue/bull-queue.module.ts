import { BULL_OPTS, QUEUE_KEY } from '@common/constants';
import { REDIS } from '@configs/env.config';
import { BullModule } from '@nestjs/bull';
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: REDIS.host,
        port: REDIS.port,
        password: REDIS.password,
        db: REDIS.db
      }
    }),

    BullModule.registerQueue(
      {
        name: QUEUE_KEY.sendEmail,
        defaultJobOptions: BULL_OPTS
      },
      {
        name: QUEUE_KEY.cancelExpiredPayment,
        defaultJobOptions: BULL_OPTS
      }
    )
  ],
  providers: [],
  exports: [BullModule]
})
export class BullQueueModule {}
