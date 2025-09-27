import { REDIS } from '@configs/env.config';
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
          host: REDIS.host,
          port: REDIS.port,
          password: REDIS.password,
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
export class RedisModuleCustom {}
