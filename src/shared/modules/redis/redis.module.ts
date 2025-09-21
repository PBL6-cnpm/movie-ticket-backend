import { RedisModule } from '@nestjs-modules/ioredis';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisController } from './redis.controller';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'single',
        options: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
          password: configService.get<string>('REDIS_PASSWORD'),
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
