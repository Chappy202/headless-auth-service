import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MfaService } from 'src/mfa/mfa.service';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { EmailModule } from 'src/email/email.module';
import { ApiKeyStrategy } from './strategies/api-key.strategy';
import { ApiKeyController } from './controllers/api-key.controller';
import { MFAAuthService } from './services/mfa-auth.service';
import { BackendAuthService } from './services/backend-auth.service';
import { BackendAuthController } from './controllers/backend-auth.controller';
import { MFAController } from './controllers/mfa.controller';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRATION || '15m' },
    }),
    DrizzleModule,
    EmailModule,
  ],
  providers: [
    AuthService,
    MFAAuthService,
    BackendAuthService,
    LocalStrategy,
    JwtStrategy,
    MfaService,
    ApiKeyStrategy,
  ],
  controllers: [
    AuthController,
    ApiKeyController,
    BackendAuthController,
    MFAController,
  ],
  exports: [AuthService],
})
export class AuthModule {}
