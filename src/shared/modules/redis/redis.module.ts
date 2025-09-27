import { redis } from '@config/index';
import { RedisModule } from '@nestjs-modules/ioredis';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { RedisController } from './redis.controller';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [
    RedisModule.forRootAsync({
      useFactory: () => ({
        type: 'single',
        options: {
          host: redis.host,
          port: redis.port,
          password: redis.password,
          retryDelayOnFailover: 1000,
          maxRetriesPerRequest: 5
        }
      })
    })
  ] as DynamicModule[],
  controllers: [RedisController],
  providers: [RedisService],
  exports: [RedisModule, RedisService]
})
export class RedisConfigModule {}
