import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { HttpModule } from '@nestjs/axios';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { RedisModule } from 'src/redis/redis.module';
import { DrizzleHealthIndicator } from './indicators/drizzle.indicator';
import { RedisHealthIndicator } from './indicators/redis.indicator';

@Module({
  imports: [TerminusModule, HttpModule, DrizzleModule, RedisModule],
  controllers: [HealthController],
  providers: [DrizzleHealthIndicator, RedisHealthIndicator],
})
export class HealthModule {}
