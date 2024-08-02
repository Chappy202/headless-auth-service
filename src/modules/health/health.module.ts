import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './controllers/health.controller';
import { HttpModule } from '@nestjs/axios';
import { DrizzleHealthIndicator } from './indicators/drizzle.indicator';
import { RedisHealthIndicator } from './indicators/redis.indicator';
import { RedisModule } from 'src/infrastructure/cache/redis.module';
import { DrizzleModule } from 'src/infrastructure/database/drizzle.module';

@Module({
  imports: [TerminusModule, HttpModule, DrizzleModule, RedisModule],
  controllers: [HealthController],
  providers: [DrizzleHealthIndicator, RedisHealthIndicator],
})
export class HealthModule {}
