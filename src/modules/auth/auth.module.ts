import { JWT } from '@configs/env.config';
import { AccountModule } from '@modules/accounts/account.module';
import { RoleModule } from '@modules/roles/role.module';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: JWT.secret,
        signOptions: {
          expiresIn: JWT.accessTokenTtl
        }
      })
    }),
    AccountModule,
    RoleModule
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy],
  exports: [AuthService]
})
export class AuthModule {}
