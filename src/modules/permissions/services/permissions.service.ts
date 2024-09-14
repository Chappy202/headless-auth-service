import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '@/infrastructure/database/drizzle.service';
import {
  permissions,
  rolePermissions,
  userPermissions,
  userRoles,
  roles,
  users,
  resources,
} from '@/infrastructure/database/schema';
import { and, eq } from 'drizzle-orm';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { PermissionResponseDto } from '../dto/permission-response.dto';
import { PermissionListResponseDto } from '../dto/permission-list-response.dto';

@Injectable()
export class PermissionsService {
  constructor(private drizzle: DrizzleService) {}

  async createPermission(
    createPermissionDto: CreatePermissionDto,
  ): Promise<PermissionListResponseDto> {
    const [permission] = await this.drizzle.db
      .insert(permissions)
      .values(createPermissionDto)
      .returning();
    return this.mapToPermissionListResponseDto(permission);
  }

  async getPermissions(): Promise<PermissionListResponseDto[]> {
    const permissionList = await this.drizzle.db.select().from(permissions);
    return permissionList.map(this.mapToPermissionListResponseDto);
  }

  async getPermissionById(id: number): Promise<PermissionResponseDto> {
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

    return this.mapToPermissionResponseDto(permissionWithResource);
  }

  async assignPermissionToRole(
    permissionId: number,
    roleId: number,
  ): Promise<void> {
    await this.drizzle.db.transaction(async (tx) => {
      const [existingPermission] = await tx
        .select()
        .from(permissions)
        .where(eq(permissions.id, permissionId))
        .limit(1);

      if (!existingPermission) {
        throw new NotFoundException('Permission not found');
      }

      const [existingRole] = await tx
        .select()
        .from(roles)
        .where(eq(roles.id, roleId))
        .limit(1);

      if (!existingRole) {
        throw new NotFoundException('Role not found');
      }

      await tx.insert(rolePermissions).values({ permissionId, roleId });
    });
  }

  async assignPermissionToUser(
    permissionId: number,
    userId: number,
  ): Promise<void> {
    await this.drizzle.db.transaction(async (tx) => {
      const [existingPermission] = await tx
        .select()
        .from(permissions)
        .where(eq(permissions.id, permissionId))
        .limit(1);

      if (!existingPermission) {
        throw new NotFoundException('Permission not found');
      }

      const [existingUser] = await tx
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!existingUser) {
        throw new NotFoundException('User not found');
      }

      await tx.insert(userPermissions).values({ permissionId, userId });
    });
  }

  async getUserPermissions(
    userId: number,
  ): Promise<PermissionListResponseDto[]> {
    const userPerms = await this.drizzle.db
      .select({
        permission: permissions,
      })
      .from(userPermissions)
      .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
      .where(eq(userPermissions.userId, userId));

    const rolePerms = await this.drizzle.db
      .select({
        permission: permissions,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .innerJoin(userRoles, eq(rolePermissions.roleId, userRoles.roleId))
      .where(eq(userRoles.userId, userId));

    const allPerms = [...userPerms, ...rolePerms].map((p) => p.permission);
    return allPerms.map(this.mapToPermissionListResponseDto);
  }

  async checkPermission(
    userId: number,
    requiredPermission: string,
  ): Promise<boolean> {
    if (await this.userHasSuperRole(userId)) {
      return true;
    }

    const userPermissions = await this.getUserPermissions(userId);

    // Check for global wildcard permission
    if (userPermissions.some((p) => p.name === '*:*')) {
      return true;
    }

    const [requiredType, requiredResource] = requiredPermission.split(':');

    return userPermissions.some((p) => {
      if (p.name === requiredPermission) {
        return true;
      }
      if (p.name === `*:${requiredResource}`) {
        return true;
      }
      const [permType, permResource] = p.name.split(':');
      if (permResource === requiredResource) {
        if (
          requiredType === 'read' &&
          (permType === 'write' || permType === 'admin')
        ) {
          return true;
        }
        if (requiredType === 'write' && permType === 'admin') {
          return true;
        }
      }
      return false;
    });
  }

  private async userHasSuperRole(userId: number): Promise<boolean> {
    const superRole = await this.drizzle.db
      .select()
      .from(roles)
      .where(eq(roles.name, 'super'))
      .limit(1);

    if (!superRole.length) return false;

    const userSuperRole = await this.drizzle.db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(userRoles.roleId, superRole[0].id),
        ),
      )
      .limit(1);

    return userSuperRole.length > 0;
  }

  private mapToPermissionListResponseDto(
    permission: typeof permissions.$inferSelect,
  ): PermissionListResponseDto {
    return {
      id: permission.id,
      name: permission.name,
      type: permission.type,
      resourceId: permission.resourceId,
    };
  }

  private mapToPermissionResponseDto(permissionWithResource: {
    permission: typeof permissions.$inferSelect;
    resource: typeof resources.$inferSelect | null;
  }): PermissionResponseDto {
    return {
      id: permissionWithResource.permission.id,
      name: permissionWithResource.permission.name,
      type: permissionWithResource.permission.type,
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
