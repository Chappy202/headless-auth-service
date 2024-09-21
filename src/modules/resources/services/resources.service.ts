import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '@/infrastructure/database/drizzle.service';
import { resources, permissions } from '@/infrastructure/database/schema';
import { eq } from 'drizzle-orm';
import { CreateResourceDto } from '../dto/create-resource.dto';
import { ResourceResponseDto } from '../dto/resource-response.dto';

@Injectable()
export class ResourcesService {
  constructor(private drizzle: DrizzleService) {}

  async createResource(
    createResourceDto: CreateResourceDto,
  ): Promise<ResourceResponseDto> {
    const [resource] = await this.drizzle.db
      .insert(resources)
      .values(createResourceDto)
      .returning();
    return this.mapToResourceResponseDto(resource);
  }

  async getResources(): Promise<ResourceResponseDto[]> {
    const resourceList = await this.drizzle.db.select().from(resources);
    return resourceList.map(this.mapToResourceResponseDto);
  }

  async getResourceById(id: number): Promise<ResourceResponseDto> {
    const [resource] = await this.drizzle.db
      .select()
      .from(resources)
      .where(eq(resources.id, id))
      .limit(1);

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    return this.mapToResourceResponseDto(resource);
  }

  private mapToResourceResponseDto(
    resource: typeof resources.$inferSelect,
  ): ResourceResponseDto {
    return {
      id: resource.id,
      name: resource.name,
      description: resource.description,
    };
  }
}
