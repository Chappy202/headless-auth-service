import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DevtoolsModule } from '@nestjs/devtools-integration';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisModule } from './infrastructure/cache/redis.module';
import { DrizzleModule } from './infrastructure/database/drizzle.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/users/user.module';
import { AdminModule } from './modules/admin/admin.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { ResourcesModule } from './modules/resources/resources.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { HealthModule } from './modules/health/health.module';
import { EmailModule } from './modules/email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    DrizzleModule,
    RedisModule,
    CommonModule,
    DevtoolsModule.register({
      http: process.env.NODE_ENV !== 'production',
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UserModule,
    AdminModule,
    PermissionsModule,
    ResourcesModule,
    ApiKeysModule,
    HealthModule,
    EmailModule,
  ],
})
export class AppModule {}
