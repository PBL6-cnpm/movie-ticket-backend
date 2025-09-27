import { AccountModule } from '@modules/accounts/account.module';
import { AuthModule } from '@modules/auth/auth.module';
import { JwtGuard } from '@modules/auth/guards/jwt.guard';
import { RoleModule } from '@modules/roles/role.module';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { redis } from '@config/index';
import { BullModule } from '@nestjs/bull';
import { HealthController } from 'health.controller';
import { BullQueueModule } from 'shared/bull-queue/bull.module';
import { EmailModule } from 'shared/bull-queue/queue-process/email/email.module';
import { RedisConfigModule } from 'shared/modules/redis/redis.module';
import { AppController } from './app.controller';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { DatabaseModule } from './databases/database.module';
import { MailModule } from './shared/modules/mail/mail.module';

@Module({
  imports: [
    DatabaseModule,

    MailModule,

    RedisConfigModule,

    AccountModule,
    BullModule.forRoot({
      redis: {
        host: redis.host,
        port: redis.port,
        password: redis.password,
        db: redis.db
      }
    }),
    AuthModule,
    RoleModule,
    EmailModule,
    BullQueueModule
  ],
  controllers: [AppController, HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtGuard
    }
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
