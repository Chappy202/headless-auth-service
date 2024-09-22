import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@/infrastructure/database/drizzle.service';
import {
  users,
  roles,
  permissions,
  resources,
  sessions,
  loginHistory,
} from '@/infrastructure/database/schema';
import { eq, gte, sql } from 'drizzle-orm';
import { AdminMetricsResponseDto } from '../dto/admin-metrics.dto';

@Injectable()
export class AdminMetricsService {
  constructor(private drizzle: DrizzleService) {}

  async getAdminMetrics(): Promise<AdminMetricsResponseDto> {
    const db = this.drizzle.db;

    const [
      userCount,
      permissionCount,
      roleCount,
      resourceCount,
      activeSessionsCount,
      loginCounts,
    ] = await Promise.all([
      db.select({ count: sql<number>`cast(count(*) as int)` }).from(users),
      db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(permissions),
      db.select({ count: sql<number>`cast(count(*) as int)` }).from(roles),
      db.select({ count: sql<number>`cast(count(*) as int)` }).from(resources),
      db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(sessions)
        .where(eq(sessions.isActive, true)),
      this.getLoginCounts(),
    ]);

    return {
      userCount: userCount[0].count,
      permissionCount: permissionCount[0].count,
      roleCount: roleCount[0].count,
      resourceCount: resourceCount[0].count,
      dailyLogins: loginCounts.daily,
      weeklyLogins: loginCounts.weekly,
      monthlyLogins: loginCounts.monthly,
      activeSessions: activeSessionsCount[0].count,
    };
  }

  private async getLoginCounts(): Promise<{
    daily: number;
    weekly: number;
    monthly: number;
  }> {
    const db = this.drizzle.db;
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - now.getDay(),
    );
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [dailyLogins, weeklyLogins, monthlyLogins] = await Promise.all([
      db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(loginHistory)
        .where(gte(loginHistory.createdAt, startOfDay)),
      db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(loginHistory)
        .where(gte(loginHistory.createdAt, startOfWeek)),
      db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(loginHistory)
        .where(gte(loginHistory.createdAt, startOfMonth)),
    ]);

    return {
      daily: dailyLogins[0].count,
      weekly: weeklyLogins[0].count,
      monthly: monthlyLogins[0].count,
    };
  }
}
