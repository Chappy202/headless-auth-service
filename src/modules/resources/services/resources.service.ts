import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '@/infrastructure/database/drizzle.service';
import { resources, permissions } from '@/infrastructure/database/schema';
import { eq } from 'drizzle-orm';
import { CreateResourceDto } from '../dto/create-resource.dto';
import { ResourceResponseDto } from '../dto/resource-response.dto';
import { PermissionResponseDto } from '@/modules/permissions/dto/permission-response.dto';
import { PermissionListResponseDto } from '@/modules/permissions/dto/permission-list-response.dto';

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

  async getResourcePermissions(
    resourceId: number,
  ): Promise<PermissionListResponseDto[]> {
    const permissionList = await this.drizzle.db
      .select()
      .from(permissions)
      .where(eq(permissions.resourceId, resourceId));

    return permissionList.map(this.mapToPermissionResponseDto);
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

  private mapToPermissionResponseDto(
    permission: typeof permissions.$inferSelect,
  ): PermissionListResponseDto {
    return {
      id: permission.id,
      name: permission.name,
      type: permission.type,
      resourceId: permission.resourceId,
    };
  }
}
