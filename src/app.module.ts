import { AccountModule } from '@modules/accounts/account.module';
import { AuthModule } from '@modules/auth/auth.module';
import { JwtGuard } from '@modules/auth/guards/jwt.guard';
import { RoleModule } from '@modules/roles/role.module';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { HealthController } from 'health.controller';
import { RedisConfigModule } from 'shared/modules/redis/redis.module';
import { AppController } from './app.controller';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { DatabaseModule } from './databases/database.module';
import { MailModule } from './shared/modules/mail/mail.module';

@Module({
  imports: [
    // Config Module
    ConfigModule.forRoot({
      isGlobal: true
    }),

    // Database Module
    DatabaseModule,

    // Mail Module
    MailModule,

    // Redis Module
    RedisConfigModule,

    // Event Module

    // Feature Modules
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
