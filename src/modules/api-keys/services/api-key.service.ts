import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../../../infrastructure/database/drizzle.service';
import { apiKeys } from '../../../infrastructure/database/schema';
import { eq, isNull, lte, or, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ApiKeyService {
  constructor(private drizzle: DrizzleService) {}

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
