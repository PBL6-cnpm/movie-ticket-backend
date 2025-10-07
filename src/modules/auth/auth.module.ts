import { GOOGLE, JWT } from '@configs/env.config';
import { AccountRoleModule } from '@modules/account-role/account-role.module';
import { AccountModule } from '@modules/accounts/account.module';
import { PermissionModule } from '@modules/permissions/permission.module';
import { RoleModule } from '@modules/roles/role.module';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { OAuth2Client } from 'google-auth-library';
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
    RoleModule,
    AccountRoleModule,
    PermissionModule
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    {
      provide: OAuth2Client,
      useFactory: (): OAuth2Client => new OAuth2Client(GOOGLE.clientID)
    }
  ],
  exports: [AuthService, JwtModule, RoleModule, PermissionModule]
})
export class AuthModule {}
