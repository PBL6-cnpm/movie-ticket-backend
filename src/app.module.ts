import { DatabaseModule } from '@databases/database.module';
import { SeederModule } from '@databases/seeders/seeder.module';
import { AccountModule } from '@modules/accounts/account.module';
import { AuthModule } from '@modules/auth/auth.module';
import { MovieModule } from '@modules/movies/movie.module';
import { PermissionModule } from '@modules/permissions/permission.module';
import { RolePermissionModule } from '@modules/role-permission/role-permission.module';
import { RoleModule } from '@modules/roles/role.module';
import { TestModule } from '@modules/test/test.module';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { HealthController } from 'health.controller';
import { BullQueueModule } from 'shared/modules/bull-queue/bull-queue.module';
import { EmailModule } from 'shared/modules/bull-queue/queue-process/email/email.module';
import { RedisModuleCustom } from 'shared/modules/redis/redis.module';
import { AppController } from './app.controller';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';

@Module({
  imports: [
    DatabaseModule,
    RedisModuleCustom,
    EmailModule,
    BullQueueModule,
    AccountModule,
    AuthModule,
    RoleModule,

    //Movie Feature
    MovieModule,
    TestModule,
    SeederModule,
    PermissionModule,
    RolePermissionModule
  ],
  controllers: [AppController, HealthController]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
