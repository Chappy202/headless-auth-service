import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DrizzleService } from '@/infrastructure/database/drizzle.service';
import {
  resources,
  permissions,
  rolePermissions,
  userPermissions,
} from '@/infrastructure/database/schema';
import { eq, sql } from 'drizzle-orm';
import {
  CreateResourceDto,
  UpdateResourceDto,
  ResourceResponseDto,
  ResourceDetailsResponseDto,
} from '../dto/resource-management.dto';

@Injectable()
export class ResourceManagementService {
  constructor(private drizzle: DrizzleService) {}

  async createResource(
    createResourceDto: CreateResourceDto,
  ): Promise<ResourceResponseDto> {
    const lowerCaseName = createResourceDto.name.toLowerCase();

    const existingResource = await this.drizzle.db
      .select()
      .from(resources)
      .where(eq(resources.name, lowerCaseName))
      .limit(1);

    if (existingResource.length > 0) {
      throw new ConflictException(
        `Resource with name "${lowerCaseName}" already exists`,
      );
    }

    const [newResource] = await this.drizzle.db
      .insert(resources)
      .values({
        ...createResourceDto,
        name: sql`lower(${lowerCaseName})`,
      })
      .returning();

    return this.mapToResourceResponseDto(newResource);
  }

  async getAllResources(): Promise<ResourceResponseDto[]> {
    const allResources = await this.drizzle.db.select().from(resources);
    return allResources.map(this.mapToResourceResponseDto);
  }

  async getResourceDetails(id: number): Promise<ResourceDetailsResponseDto> {
    const [resource] = await this.drizzle.db
      .select()
      .from(resources)
      .where(eq(resources.id, id))
      .limit(1);

    if (!resource) {
      throw new NotFoundException(`Resource with id ${id} not found`);
    }

    const resourcePermissions = await this.drizzle.db
      .select()
      .from(permissions)
      .where(eq(permissions.resourceId, id));

    return {
      ...this.mapToResourceResponseDto(resource),
      permissions: resourcePermissions.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
      })),
    };
  }

  async updateResource(
    id: number,
    updateResourceDto: UpdateResourceDto,
  ): Promise<ResourceResponseDto> {
    return this.drizzle.db.transaction(async (tx) => {
      const [existingResource] = await tx
        .select()
        .from(resources)
        .where(eq(resources.id, id))
        .limit(1);

      if (!existingResource) {
        throw new NotFoundException(`Resource with id ${id} not found`);
      }

      let updatedName = existingResource.name;

      if (updateResourceDto.name) {
        updatedName = updateResourceDto.name.toLowerCase();

        if (updatedName !== existingResource.name) {
          const [duplicateResource] = await tx
            .select()
            .from(resources)
            .where(eq(resources.name, updatedName))
            .limit(1);

          if (duplicateResource) {
            throw new ConflictException(
              `Resource with name "${updatedName}" already exists`,
            );
          }

          // Update permissions names if resource name changes
          await tx
            .update(permissions)
            .set({
              name: sql`${permissions.type} || ':' || ${updatedName}`,
            })
            .where(eq(permissions.resourceId, id));
        }
      }

      const [updatedResource] = await tx
        .update(resources)
        .set({
          ...updateResourceDto,
          name: sql`lower(${updatedName})`,
        })
        .where(eq(resources.id, id))
        .returning();

      return this.mapToResourceResponseDto(updatedResource);
    });
  }

  async deleteResource(id: number): Promise<void> {
    await this.drizzle.db.transaction(async (tx) => {
      // Check if resource exists
      const [resource] = await tx
        .select()
        .from(resources)
        .where(eq(resources.id, id))
        .limit(1);

      if (!resource) {
        throw new NotFoundException(`Resource with id ${id} not found`);
      }

      // Get all permissions for this resource
      const resourcePermissions = await tx
        .select()
        .from(permissions)
        .where(eq(permissions.resourceId, id));

      // Delete user permissions
      for (const permission of resourcePermissions) {
        await tx
          .delete(userPermissions)
          .where(eq(userPermissions.permissionId, permission.id));
      }

      // Delete role permissions
      for (const permission of resourcePermissions) {
        await tx
          .delete(rolePermissions)
          .where(eq(rolePermissions.permissionId, permission.id));
      }

      // Delete permissions
      await tx.delete(permissions).where(eq(permissions.resourceId, id));

      // Finally, delete the resource
      await tx.delete(resources).where(eq(resources.id, id));
    });
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
