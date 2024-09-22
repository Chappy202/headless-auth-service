import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserModule } from '@/modules/users/user.module';
import { DrizzleModule } from '@/infrastructure/database/drizzle.module';
import { RedisModule } from '@/infrastructure/cache/redis.module';
import { ApiKeyStrategy } from './strategies/api-key.strategy';
import { ApiKeyValidationService } from './services/api-key-validation.service';
import { AuthorizationService } from './services/authorization.service';
import { EmailModule } from '../email/email.module';
import { FeatureToggleService } from '@/common/services/feature-toggle.service';
import { AppModule } from '@/app.module';

@Module({
  imports: [
    UserModule,
    PassportModule,
    DrizzleModule,
    RedisModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRATION') },
      }),
      inject: [ConfigService],
    }),
    EmailModule,
  ],
  providers: [
    AuthService,
    ApiKeyValidationService,
    LocalStrategy,
    JwtStrategy,
    ApiKeyStrategy,
    AuthorizationService,
    FeatureToggleService,
  ],
  controllers: [AuthController],
  exports: [AuthService, AuthorizationService],
})
export class AuthModule {}
