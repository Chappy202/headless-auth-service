import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MfaService } from 'src/mfa/mfa.service';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { EmailModule } from 'src/email/email.module';
import { ApiKeyStrategy } from './strategies/api-key.strategy';
import { ApiKeyController } from './api-key.controller';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRATION || '15m' },
    }),
    DrizzleModule,
    EmailModule
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, MfaService, ApiKeyStrategy],
  controllers: [AuthController, ApiKeyController],
  exports: [AuthService],
})
export class AuthModule {}