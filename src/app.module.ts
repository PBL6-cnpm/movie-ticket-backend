import { DatabaseModule } from '@databases/database.module';
import { SeederModule } from '@databases/seeders/seeder.module';
import { AccountRoleModule } from '@modules/account-role/account-role.module';
import { AccountModule } from '@modules/accounts/account.module';
import { ActorModule } from '@modules/actors/actor.module';
import { AuthModule } from '@modules/auth/auth.module';
import { JwtGuard } from '@modules/auth/guards/jwt.guard';
import { BranchModule } from '@modules/branch/branch.module';
import { MovieModule } from '@modules/movies/movie.module';
import { PermissionModule } from '@modules/permissions/permission.module';
import { RolePermissionModule } from '@modules/role-permission/role-permission.module';
import { RoleModule } from '@modules/roles/role.module';
import { RoomModule } from '@modules/room/room.module';
import { SeatModule } from '@modules/seat/seat.module';
import { ShowTimeModule } from '@modules/show-time/show-time.module';
import { TestModule } from '@modules/test/test.module';
import { TypeSeatModule } from '@modules/type-seat/typeSeat.module';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullQueueModule } from '@shared/modules/bull-queue/bull-queue.module';
import { EmailModule } from '@shared/modules/bull-queue/queue-process/email/email.module';
import { RedisModuleCustom } from '@shared/modules/redis/redis.module';
import { AppController } from './app.controller';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { HealthController } from './health.controller';

@Module({
  imports: [
    DatabaseModule,
    RedisModuleCustom,
    EmailModule,
    BullQueueModule,
    ThrottlerModule.forRoot([{ limit: 10, ttl: 60000 }]), // 10 requests per minute

    //Movie Feature
    AccountModule,
    AccountRoleModule,
    AuthModule,
    RoleModule,
    BranchModule,
    RoomModule,
    MovieModule,
    ActorModule,
    TestModule,
    SeederModule,
    PermissionModule,
    RolePermissionModule,
    TypeSeatModule,
    ShowTimeModule,
    SeatModule
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
