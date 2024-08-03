import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '@/infrastructure/database/drizzle.service';
import {
  permissions,
  rolePermissions,
  userPermissions,
  userRoles,
  roles,
} from '@/infrastructure/database/schema';
import { and, eq } from 'drizzle-orm';
import { CreatePermissionDto } from '../dto/create-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(private drizzle: DrizzleService) {}

  async createPermission(createPermissionDto: CreatePermissionDto) {
    const [permission] = await this.drizzle.db
      .insert(permissions)
      .values({
        name: createPermissionDto.name,
        type: createPermissionDto.type,
        resourceId: createPermissionDto.resourceId,
      })
      .returning();
    return permission;
  }

  async getPermissions() {
    return this.drizzle.db.select().from(permissions);
  }

  async getPermissionById(id: number) {
    const [permission] = await this.drizzle.db
      .select()
      .from(permissions)
      .where(eq(permissions.id, id))
      .limit(1);

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return permission;
  }

  async assignPermissionToRole(permissionId: number, roleId: number) {
    await this.drizzle.db
      .insert(rolePermissions)
      .values({ permissionId, roleId });
  }

  async assignPermissionToUser(permissionId: number, userId: number) {
    await this.drizzle.db
      .insert(userPermissions)
      .values({ permissionId, userId });
  }

  async getUserPermissions(userId: number) {
    const userPerms = await this.drizzle.db
      .select({
        permissionName: permissions.name,
        permissionType: permissions.type,
      })
      .from(userPermissions)
      .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
      .where(eq(userPermissions.userId, userId));

    const rolePerms = await this.drizzle.db
      .select({
        permissionName: permissions.name,
        permissionType: permissions.type,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .innerJoin(userRoles, eq(rolePermissions.roleId, userRoles.roleId))
      .where(eq(userRoles.userId, userId));

    return [...userPerms, ...rolePerms];
  }

  async checkPermission(userId: number, requiredPermission: string) {
    if (await this.userHasSuperRole(userId)) {
      return true;
    }

    const userPermissions = await this.getUserPermissions(userId);
    const [requiredType, requiredResource] = requiredPermission.split(':');

    return userPermissions.some((p) => {
      if (p.permissionName === requiredPermission) {
        return true;
      }
      if (p.permissionName === `*:${requiredResource}`) {
        return true;
      }
      const [permType, permResource] = p.permissionName.split(':');
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
}
