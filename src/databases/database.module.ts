import { DB } from '@configs/env.config';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountRole } from '@shared/db/entities/account-role.entity';
import { Account } from '@shared/db/entities/account.entity';
import { Actor } from '@shared/db/entities/actor.entity';
import { BookRefreshments } from '@shared/db/entities/book-refreshments.entity';
import { BookSeat } from '@shared/db/entities/book-seat.entity';
import { Booking } from '@shared/db/entities/booking.entity';
import { Branch } from '@shared/db/entities/branch.entity';
import { Genre } from '@shared/db/entities/genre.entity';
import { MovieActor } from '@shared/db/entities/movie-actor.entity';
import { Movie } from '@shared/db/entities/movie.entity';
import { MovieGenre } from '@shared/db/entities/movie_genre.entity';
import { Permission } from '@shared/db/entities/permission.entity';
import { Refreshments } from '@shared/db/entities/refreshments.entity';
import { Review } from '@shared/db/entities/review.entity';
import { RolePermission } from '@shared/db/entities/role-permission.entity';
import { Role } from '@shared/db/entities/role.entity';
import { Room } from '@shared/db/entities/room.entity';
import { Seat } from '@shared/db/entities/seat.entity';
import { ShowTime } from '@shared/db/entities/show-time.entity';
import { SpecialDate } from '@shared/db/entities/special-day.entity';
import { TypeDay } from '@shared/db/entities/type-day.entity';
import { TypeSeat } from '@shared/db/entities/type-seat.entity';
import { Voucher } from '@shared/db/entities/voucher.entity';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';

const entities = [
  Account,
  AccountRole,
  Actor,
  BookRefreshments,
  BookSeat,
  Booking,
  Branch,
  Genre,
  MovieGenre,
  MovieActor,
  Movie,
  Permission,
  Refreshments,
  Review,
  RolePermission,
  Role,
  Room,
  Seat,
  ShowTime,
  SpecialDate,
  TypeDay,
  TypeSeat,
  Voucher,
  MovieGenre,
  AccountRole
];

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        type: 'mysql',
        host: DB.host,
        port: DB.port,
        username: DB.username,
        password: DB.password,
        database: DB.database,
        entities: entities,
        logging: true,
        timezone: 'Z'
        // synchronize: true
      }),
      inject: [ConfigService],
      dataSourceFactory: async (options) => {
        const dataSource = new DataSource(options);
        await dataSource.initialize();
        addTransactionalDataSource(dataSource);
        return dataSource;
      }
    }),
    TypeOrmModule.forFeature(entities)
  ],
  exports: [TypeOrmModule]
})
export class DatabaseModule {}
