import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '@/infrastructure/database/drizzle.service';
import { apiKeys } from '@/infrastructure/database/schema';
import { eq, isNull, lte, or, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';
import { ApiKeyResponseDto } from '../dto/api-key-response.dto';

@Injectable()
export class ApiKeyService {
  constructor(private drizzle: DrizzleService) {}

  async createApiKey(
    createApiKeyDto: CreateApiKeyDto,
  ): Promise<ApiKeyResponseDto> {
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
    return this.mapToApiKeyResponseDto(newApiKey);
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

  async listApiKeys(): Promise<ApiKeyResponseDto[]> {
    const apiKeyList = await this.drizzle.db.select().from(apiKeys);
    return apiKeyList.map(this.mapToApiKeyResponseDto);
  }

  async revokeApiKey(id: number): Promise<ApiKeyResponseDto> {
    const [revokedKey] = await this.drizzle.db
      .delete(apiKeys)
      .where(eq(apiKeys.id, id))
      .returning();

    if (!revokedKey) {
      throw new NotFoundException('API key not found');
    }

    return this.mapToApiKeyResponseDto(revokedKey);
  }

  private mapToApiKeyResponseDto(
    apiKey: typeof apiKeys.$inferSelect,
  ): ApiKeyResponseDto {
    return {
      id: apiKey.id,
      name: apiKey.name,
      key: apiKey.key,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
      lastUsedAt: apiKey.lastUsedAt,
    };
  }
}
