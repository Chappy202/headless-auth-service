import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuthService } from './auth.service';

@Injectable()
export class CleanupService {
  constructor(private authService: AuthService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCleanupTasks() {
    const cleanedTokens = await this.authService.cleanupExpiredTokens();
    console.log(
      `Cleanup task completed. Removed ${cleanedTokens} expired tokens.`,
    );
  }
}
