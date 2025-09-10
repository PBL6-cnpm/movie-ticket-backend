import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { CustomLogger } from './common/modules/logger/custom-logger.service';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { MailModule } from './common/modules/mail/mail.module';
import { DatabaseModule } from './databases/database.module';
import { EventModule } from './common/modules/events/event.module';
import { UserModule } from '@modules/users/user.module';
import { AuthModule } from '@modules/auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@modules/auth/guards/jwtAuth.guard';

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

    // Event Module
    EventModule,

    // Feature Modules
    UserModule,
    AuthModule
  ],
  controllers: [AppController],
  providers: [
    CustomLogger,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    }
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
