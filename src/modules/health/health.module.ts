import { RedisModule } from '@/infrastructure/cache/redis.module';
import { DrizzleModule } from '@/infrastructure/database/drizzle.module';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './controllers/health.controller';
import { DrizzleHealthIndicator } from './indicators/drizzle.indicator';
import { RedisHealthIndicator } from './indicators/redis.indicator';

@Module({
  imports: [TerminusModule, HttpModule, DrizzleModule, RedisModule],
  controllers: [HealthController],
  providers: [DrizzleHealthIndicator, RedisHealthIndicator],
})
export class HealthModule {}
