import { AccountModule } from '@modules/accounts/account.module';
import { AuthModule } from '@modules/auth/auth.module';
import { JwtGuard } from '@modules/auth/guards/jwt.guard';
import { RoleModule } from '@modules/roles/role.module';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { HealthController } from 'health.controller';
import { EmailModule } from 'shared/modules/bull-queue/queue-process/email/email.module';
import { RedisModuleCustom } from 'shared/modules/redis/redis.module';
import { AppController } from './app.controller';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { DatabaseModule } from './databases/database.module';
import { MailModuleCustom } from './shared/modules/mail/mail.module';
import { BullQueueModule } from 'shared/modules/bull-queue/bull-queue.module';

@Module({
  imports: [
    DatabaseModule,

    MailModuleCustom,

    RedisModuleCustom,

    EmailModule,

    BullQueueModule,

    AccountModule,
    AuthModule,
    RoleModule
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
