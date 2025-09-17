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
import { DataSource } from 'typeorm';
import { Account } from 'shared/db/entities/account.entity';
import { Actor } from 'shared/db/entities/actor.entity';
import { BookRefreshments } from 'shared/db/entities/book-refreshments.entity';
import { BookSeat } from 'shared/db/entities/book-seat.entity';
import { Booking } from 'shared/db/entities/booking.entity';
import { Branch } from 'shared/db/entities/branch.entity';
import { MovieActor } from 'shared/db/entities/movie-actor.entity';
import { Movie } from 'shared/db/entities/movie.entity';
import { Permission } from 'shared/db/entities/permission.entity';
import { Refreshments } from 'shared/db/entities/refreshments.entity';
import { Reviews } from 'shared/db/entities/reviews.entity';
import { RolePermission } from 'shared/db/entities/role-permission.entity';
import { Role } from 'shared/db/entities/role.entity';
import { Room } from 'shared/db/entities/room.entity';
import { Seat } from 'shared/db/entities/seat.entity';
import { ShowTime } from 'shared/db/entities/show-time.entity';
import { SpecialDay } from 'shared/db/entities/special-day.entity';
import { TypeDay } from 'shared/db/entities/type-day.entity';
import { TypeSeat } from 'shared/db/entities/type-seat.entity';
import { Voucher } from 'shared/db/entities/voucher.enity';

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
