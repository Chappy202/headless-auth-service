import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SessionService } from '../services/session.service';

@Injectable()
export class SessionCleanupTask {
  constructor(private sessionService: SessionService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleSessionCleanup() {
    await this.sessionService.cleanupExpiredSessions();
  }
}
