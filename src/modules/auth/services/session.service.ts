// src/modules/auth/services/session.service.ts

import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@/infrastructure/database/drizzle.service';
import { sessions } from '@/infrastructure/database/schema';
import { eq, and, lt, desc, isNull } from 'drizzle-orm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SessionService {
  private readonly sessionLimit: number;

  constructor(
    private drizzle: DrizzleService,
    private configService: ConfigService,
  ) {
    this.sessionLimit = this.configService.get<number>('SESSION_LIMIT') || 5;
  }

  async getActiveSessions(
    userId: number,
  ): Promise<(typeof sessions.$inferSelect)[]> {
    await this.cleanupInactiveSessions(userId);

    const activeSessions = await this.drizzle.db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(desc(sessions.lastUsedAt))
      .limit(this.sessionLimit);

    return activeSessions;
  }

  async findSessionByToken(
    token: string,
  ): Promise<typeof sessions.$inferSelect | null> {
    const [session] = await this.drizzle.db
      .select()
      .from(sessions)
      .where(eq(sessions.token, token))
      .limit(1);

    return session || null;
  }

  async createSession(
    userId: number,
    token: string,
    expiresAt: Date,
    ipAddress: string,
    userAgent: string,
  ): Promise<void> {
    await this.cleanupInactiveSessions(userId);

    const activeSessions = await this.getActiveSessions(userId);

    if (activeSessions.length >= this.sessionLimit) {
      // Remove the oldest session
      const oldestSession = activeSessions[activeSessions.length - 1];
      await this.deleteSession(oldestSession.id);
    }

    await this.drizzle.db.insert(sessions).values({
      userId,
      token,
      expiresAt,
      lastUsedAt: new Date(),
      ipAddress,
      userAgent,
    });
  }

  async updateSessionLastUsed(sessionId: number): Promise<void> {
    await this.drizzle.db
      .update(sessions)
      .set({ lastUsedAt: new Date() })
      .where(eq(sessions.id, sessionId));
  }

  async deleteSession(sessionId: number): Promise<void> {
    await this.drizzle.db.delete(sessions).where(eq(sessions.id, sessionId));
  }

  async terminateAllUserSessions(userId: number): Promise<void> {
    await this.drizzle.db.delete(sessions).where(eq(sessions.userId, userId));
  }

  async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();
    await this.drizzle.db.delete(sessions).where(lt(sessions.expiresAt, now));
  }

  private async cleanupInactiveSessions(userId: number): Promise<void> {
    const now = new Date();
    await this.drizzle.db
      .delete(sessions)
      .where(and(eq(sessions.userId, userId), lt(sessions.expiresAt, now)));
  }
}
