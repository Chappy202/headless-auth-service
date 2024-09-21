import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@/infrastructure/database/drizzle.service';
import {
  permissions,
  userPermissions,
  rolePermissions,
  userRoles,
  roles,
} from '@/infrastructure/database/schema';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class AuthorizationService {
  constructor(private drizzle: DrizzleService) {}

  async checkPermission(
    userId: number,
    requiredPermission: string,
  ): Promise<boolean> {
    // Check for super role first
    const hasSuperRole = await this.userHasSuperRole(userId);
    if (hasSuperRole) {
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
