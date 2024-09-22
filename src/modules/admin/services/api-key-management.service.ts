import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '@/infrastructure/database/drizzle.service';
import { apiKeys } from '@/infrastructure/database/schema';
import { eq } from 'drizzle-orm';
import {
  CreateApiKeyDto,
  ApiKeyResponseDto,
} from '../dto/api-key-management.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ApiKeyManagementService {
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

  async getAllApiKeys(): Promise<ApiKeyResponseDto[]> {
    const apiKeyList = await this.drizzle.db.select().from(apiKeys);
    return apiKeyList.map(this.mapToApiKeyResponseDto);
  }

  async deleteApiKey(id: number): Promise<ApiKeyResponseDto> {
    const [deletedApiKey] = await this.drizzle.db
      .delete(apiKeys)
      .where(eq(apiKeys.id, id))
      .returning();

    if (!deletedApiKey) {
      throw new NotFoundException('API key not found');
    }

    return this.mapToApiKeyResponseDto(deletedApiKey);
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
