import { Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { DrizzleService } from 'src/drizzle/drizzle.service';
import { users } from 'src/drizzle/schema';

@Injectable()
export class DrizzleHealthIndicator extends HealthIndicator {
  constructor(private drizzleClient: DrizzleService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.drizzleClient.db.select().from(users).limit(1);
      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError('Drizzle health check failed', error);
    }
  }
}
