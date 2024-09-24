import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DrizzleService } from '@/infrastructure/database/drizzle.service';
import {
  permissions,
  userPermissions,
  rolePermissions,
  resources,
} from '@/infrastructure/database/schema';
import { eq, and } from 'drizzle-orm';
import {
  CreatePermissionDto,
  UpdatePermissionDto,
  PermissionResponseDto,
  PermissionDetailResponseDto,
  AssignmentResponseDto,
} from '../dto/permission-management.dto';

@Injectable()
export class PermissionManagementService {
  private readonly logger = new Logger(PermissionManagementService.name);
  constructor(private drizzle: DrizzleService) {}

  async createPermission(
    createPermissionDto: CreatePermissionDto,
  ): Promise<PermissionResponseDto> {
    try {
      const [permission] = await this.drizzle.db
        .insert(permissions)
        .values(createPermissionDto)
        .returning();
      return this.mapToPermissionResponseDto(permission);
    } catch (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        throw new ConflictException(
          `Permission with name "${createPermissionDto.name}" already exists`,
        );
      }
      throw error;
    }
  }

  async getAllPermissions(): Promise<PermissionResponseDto[]> {
    const permissionList = await this.drizzle.db.select().from(permissions);
    return permissionList.map(this.mapToPermissionResponseDto);
  }

  async getPermissionDetails(id: number): Promise<PermissionDetailResponseDto> {
    const [permissionWithResource] = await this.drizzle.db
      .select({
        permission: permissions,
        resource: resources,
      })
      .from(permissions)
      .leftJoin(resources, eq(permissions.resourceId, resources.id))
      .where(eq(permissions.id, id))
      .limit(1);

    if (!permissionWithResource) {
      throw new NotFoundException('Permission not found');
    }

    return this.mapToPermissionDetailResponseDto(permissionWithResource);
  }

  async assignPermissionsToUser(
    userId: number,
    permissionIds: number[],
  ): Promise<AssignmentResponseDto> {
    return this.drizzle.db.transaction(async (tx) => {
      let added = 0;
      let ignored = 0;

      for (const permissionId of permissionIds) {
        const [existing] = await tx
          .select()
          .from(userPermissions)
          .where(
            and(
              eq(userPermissions.userId, userId),
              eq(userPermissions.permissionId, permissionId),
            ),
          )
          .limit(1);

        if (!existing) {
          await tx.insert(userPermissions).values({ userId, permissionId });
          added++;
        } else {
          ignored++;
        }
      }

      this.logger.log(
        `Permissions assigned to user ${userId}: ${permissionIds.join(', ')}`,
      );

      return {
        added,
        ignored,
        description: `${added} added, ${ignored} ignored because already present`,
      };
    });
  }

  async assignPermissionsToRole(
    roleId: number,
    permissionIds: number[],
  ): Promise<AssignmentResponseDto> {
    return this.drizzle.db.transaction(async (tx) => {
      let added = 0;
      let ignored = 0;

      for (const permissionId of permissionIds) {
        const [existing] = await tx
          .select()
          .from(rolePermissions)
          .where(
            and(
              eq(rolePermissions.roleId, roleId),
              eq(rolePermissions.permissionId, permissionId),
            ),
          )
          .limit(1);

        if (!existing) {
          await tx.insert(rolePermissions).values({ roleId, permissionId });
          added++;
        } else {
          ignored++;
        }
      }

      return {
        added,
        ignored,
        description: `${added} added, ${ignored} ignored because already present`,
      };
    });
  }

  async deletePermission(id: number): Promise<PermissionResponseDto> {
    return this.drizzle.db.transaction(async (tx) => {
      // Remove references in userPermissions and rolePermissions
      await tx
        .delete(userPermissions)
        .where(eq(userPermissions.permissionId, id));
      await tx
        .delete(rolePermissions)
        .where(eq(rolePermissions.permissionId, id));

      // Delete the permission
      const [deletedPermission] = await tx
        .delete(permissions)
        .where(eq(permissions.id, id))
        .returning();

      if (!deletedPermission) {
        throw new NotFoundException('Permission not found');
      }

      return this.mapToPermissionResponseDto(deletedPermission);
    });
  }

  async updatePermission(
    id: number,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<PermissionResponseDto> {
    try {
      const [updatedPermission] = await this.drizzle.db
        .update(permissions)
        .set(updatePermissionDto)
        .where(eq(permissions.id, id))
        .returning();

      if (!updatedPermission) {
        throw new NotFoundException('Permission not found');
      }

      return this.mapToPermissionResponseDto(updatedPermission);
    } catch (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        throw new ConflictException(
          `Permission with name "${updatePermissionDto.name}" already exists`,
        );
      }
      throw error;
    }
  }

  private mapToPermissionResponseDto(
    permission: typeof permissions.$inferSelect,
  ): PermissionResponseDto {
    return {
      id: permission.id,
      name: permission.name,
      type: permission.type,
      resourceId: permission.resourceId,
    };
  }

  private mapToPermissionDetailResponseDto(permissionWithResource: {
    permission: typeof permissions.$inferSelect;
    resource: typeof resources.$inferSelect | null;
  }): PermissionDetailResponseDto {
    return {
      id: permissionWithResource.permission.id,
      name: permissionWithResource.permission.name,
      type: permissionWithResource.permission.type,
      resourceId: permissionWithResource.permission.resourceId,
      resource: permissionWithResource.resource
        ? {
            id: permissionWithResource.resource.id,
            name: permissionWithResource.resource.name,
            description: permissionWithResource.resource.description,
          }
        : null,
    };
  }
}
