import { AuthModule } from '@modules/auth/auth.module';
import { JwtGuard } from '@modules/auth/guards/jwt.guard';
import { UserModule } from '@modules/users/user.module';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { HealthController } from 'health.controller';
import { AppController } from './app.controller';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { DatabaseModule } from './databases/database.module';
import { EventModule } from './shared/module/events/event.module';
import { MailModule } from './shared/module/mail/mail.module';
// import { DataSource } from 'typeorm';

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
    // AppDataSource.initialize();
  }
}

// export const AppDataSource = new DataSource({
//   type: 'mysql',
//   host: 'localhost',
//   port: 3306,
//   username: 'root',
//   password: 'phong123',
//   database: 'book-ticket',
//   entities: [
//     Account, Actor, BookRefreshments, BookSeat,
//     Booking, Branch, MovieActor, Movie, Permission,
//     Permission, Refreshments, Reviews, RolePermission,
//     Role, Room, Seat, ShowTime, SpecialDay,
//     TypeDay, TypeSeat, Voucher
//   ],
//   synchronize: true,
//   logging: true,
// });
