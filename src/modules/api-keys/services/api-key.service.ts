import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '@/infrastructure/database/drizzle.service';
import { apiKeys } from '@/infrastructure/database/schema';
import { eq, isNull, lte, or, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';

@Injectable()
export class ApiKeyService {
  constructor(private drizzle: DrizzleService) {}

  async createApiKey(createApiKeyDto: CreateApiKeyDto) {
    const key = uuidv4();
    const [newApiKey] = await this.drizzle.db
      .insert(apiKeys)
      .values({
        name: createApiKeyDto.name,
        key,
        expiresAt: createApiKeyDto.expiresAt
          ? new Date(createApiKeyDto.expiresAt)
          : null,
      })
      .returning();
    return { ...newApiKey, key }; // Include the key in the response
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
    const [revokedKey] = await this.drizzle.db
      .delete(apiKeys)
      .where(eq(apiKeys.id, id))
      .returning();

    if (!revokedKey) {
      throw new NotFoundException('API key not found');
    }

    return { message: 'API key revoked successfully' };
  }
}
