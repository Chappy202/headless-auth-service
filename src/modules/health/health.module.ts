import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './controllers/health.controller';
import { DrizzleHealthIndicator } from './indicators/drizzle.indicator';
import { RedisHealthIndicator } from './indicators/redis.indicator';
import { DrizzleModule } from '@/infrastructure/database/drizzle.module';
import { RedisModule } from '@/infrastructure/cache/redis.module';

@Module({
  imports: [TerminusModule, HttpModule, DrizzleModule, RedisModule],
  controllers: [HealthController],
  providers: [DrizzleHealthIndicator, RedisHealthIndicator],
})
export class HealthModule {}
