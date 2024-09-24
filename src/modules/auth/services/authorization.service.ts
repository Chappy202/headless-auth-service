// src/modules/auth/services/authorization.service.ts

import { DrizzleService } from '@/infrastructure/database/drizzle.service';
import {
  roles,
  permissions,
  userRoles,
  rolePermissions,
  userPermissions,
} from '@/infrastructure/database/schema';
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

@Injectable()
export class AuthorizationService {
  constructor(private drizzle: DrizzleService) {}

  async checkPermission(
    userId: number,
    requiredPermission: string,
  ): Promise<boolean> {
    // Check for super role or global wildcard permission first
    const isSuperUser = await this.isUserSuper(userId);
    if (isSuperUser) {
      return true;
    }

    const userPermissions = await this.getUserPermissions(userId);

    const [requiredType, requiredResource] = requiredPermission.split(':');

    return userPermissions.some((p) => {
      if (p.name === requiredPermission) return true;
      if (p.name === `*:${requiredResource}`) return true;
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

  private async isUserSuper(userId: number): Promise<boolean> {
    const userRolesWithPermissions = await this.drizzle.db
      .select({
        roleName: roles.name,
        permissionName: permissions.name,
      })
      .from(userRoles)
      .innerJoin(roles, eq(roles.id, userRoles.roleId))
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(eq(userRoles.userId, userId));

    const isSuperUser = userRolesWithPermissions.some(
      (rp) => rp.roleName === 'super' || rp.permissionName === '*:*',
    );
    return isSuperUser;
  }

  private async getUserPermissions(
    userId: number,
  ): Promise<{ name: string }[]> {
    const userPerms = await this.drizzle.db
      .select({ name: permissions.name })
      .from(userPermissions)
      .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
      .where(eq(userPermissions.userId, userId));

    const rolePerms = await this.drizzle.db
      .select({ name: permissions.name })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .innerJoin(userRoles, eq(rolePermissions.roleId, userRoles.roleId))
      .where(eq(userRoles.userId, userId));

    return [...userPerms, ...rolePerms];
  }
}
