import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@/infrastructure/database/drizzle.service';
import { apiKeys } from '@/infrastructure/database/schema';
import { and, eq, or, isNull, lte } from 'drizzle-orm';

@Injectable()
export class ApiKeyValidationService {
  constructor(private drizzle: DrizzleService) {}

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
}
