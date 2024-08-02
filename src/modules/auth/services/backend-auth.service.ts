import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eq, isNull, lte, or, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { DrizzleService } from '@/infrastructure/database/drizzle.service';
import { apiKeys } from '@/infrastructure/database/schema';
import { AuthService } from './auth.service';
@Injectable()
export class BackendAuthService {
  constructor(
    private drizzle: DrizzleService,
    private jwtService: JwtService,
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  async introspectToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      const isBlacklisted = await this.authService.isTokenBlacklisted(token);
      return {
        active: !isBlacklisted,
        ...payload,
      };
    } catch (error) {
      console.error(error);
      return { active: false };
    }
  }

  async createApiKey(name: string, expiresAt?: Date): Promise<string> {
    const key = uuidv4();
    await this.drizzle.db.insert(apiKeys).values({
      name,
      key,
      expiresAt: expiresAt || null,
    });
    return key;
  }

  async validateApiKey(key: string): Promise<boolean> {
    const [apiKey] = await this.drizzle.db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.key, key),
          or(isNull(apiKeys.expiresAt), lte(apiKeys.expiresAt, new Date())),
        ),
      )
      .limit(1);

    if (apiKey) {
      await this.drizzle.db
        .update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.id, apiKey.id));
      return true;
    }
    return false;
  }

  async listApiKeys() {
    return this.drizzle.db.select().from(apiKeys);
  }

  async revokeApiKey(id: number) {
    await this.drizzle.db.delete(apiKeys).where(eq(apiKeys.id, id));
  }
}
