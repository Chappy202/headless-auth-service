import { DrizzleModule } from '@/infrastructure/database/drizzle.module';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { ApiKeyController } from '../api-keys/controllers/api-key.controller';
import { EmailModule } from '../email/email.module';
import { AuthController } from './controllers/auth.controller';
import { BackendAuthController } from './controllers/backend-auth.controller';
import { MFAController } from './controllers/mfa.controller';
import { PermissionController } from './controllers/permission.controller';
import { AuthService } from './services/auth.service';
import { BackendAuthService } from './services/backend-auth.service';
import { MfaService } from './services/mfa.service';
import { PermissionService } from './services/permission.service';
import { ApiKeyStrategy } from './strategies/api-key.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRATION || '15m' },
    }),
    DrizzleModule,
    EmailModule,
    ApiKeysModule,
  ],
  providers: [
    AuthService,
    BackendAuthService,
    LocalStrategy,
    JwtStrategy,
    MfaService,
    ApiKeyStrategy,
    PermissionService,
    MfaService,
  ],
  controllers: [
    AuthController,
    ApiKeyController,
    BackendAuthController,
    MFAController,
    PermissionController,
  ],
  exports: [AuthService],
})
export class AuthModule {}
