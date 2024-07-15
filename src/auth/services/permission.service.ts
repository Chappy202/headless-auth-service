import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../../drizzle/drizzle.service';
import {
  permissions,
  resources,
  rolePermissions,
  roles,
  userPermissions,
  userRoles,
} from '../../drizzle/schema';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class PermissionService {
  constructor(private drizzle: DrizzleService) {}

  async listPermissions() {
    return this.drizzle.db.select().from(permissions);
  }

  async listResources() {
    return this.drizzle.db.select().from(resources);
  }

  async getResourcePermissions(resourceId: number) {
    return this.drizzle.db
      .select()
      .from(permissions)
      .where(eq(permissions.resourceId, resourceId));
  }

  async createResource(name: string, description?: string) {
    const [resource] = await this.drizzle.db
      .insert(resources)
      .values({ name, description })
      .returning();
    return resource;
  }

  async createPermission(
    resourceId: number,
    type: 'admin' | 'read' | 'write' | '*',
  ) {
    const name = `${type}:${(await this.getResourceById(resourceId)).name}`;
    const [permission] = await this.drizzle.db
      .insert(permissions)
      .values({ resourceId, type, name })
      .returning();
    return permission;
  }

  async getResourceById(id: number) {
    const [resource] = await this.drizzle.db
      .select()
      .from(resources)
      .where(eq(resources.id, id))
      .limit(1);
    return resource;
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
        resourceName: resources.name,
        permissionType: permissions.type,
      })
      .from(userPermissions)
      .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
      .leftJoin(resources, eq(permissions.resourceId, resources.id))
      .where(eq(userPermissions.userId, userId));

    const rolePerms = await this.drizzle.db
      .select({
        permissionName: permissions.name,
        resourceName: resources.name,
        permissionType: permissions.type,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .leftJoin(resources, eq(permissions.resourceId, resources.id))
      .innerJoin(userRoles, eq(rolePermissions.roleId, userRoles.roleId))
      .where(eq(userRoles.userId, userId));

    const allPerms = [...userPerms, ...rolePerms];

    // Handle null resource names (like for '*:*' permission)
    return allPerms.map((perm) => ({
      ...perm,
      resourceName: perm.resourceName || '*',
      permissionName: perm.permissionName || `${perm.permissionType}:*`,
    }));
  }

  async checkPermission(userId: number, requiredPermission: string) {
    // First, check if the user has the super role
    if (await this.userHasSuperRole(userId)) {
      return true;
    }

    const userPermissions = await this.getUserPermissions(userId);

    const [requiredType, requiredResource] = requiredPermission.split(':');

    return userPermissions.some((p) => {
      // Check for exact match
      if (p.permissionName === requiredPermission) {
        return true;
      }

      // Check for resource-wide admin permission
      if (p.resourceName === requiredResource && p.permissionType === 'admin') {
        return true;
      }

      // Check for wildcard permission on the resource
      if (p.permissionName === `*:${requiredResource}`) {
        return true;
      }

      // Check if the user has a higher level of permission than required
      if (p.resourceName === requiredResource) {
        if (
          requiredType === 'read' &&
          (p.permissionType === 'write' || p.permissionType === 'admin')
        ) {
          return true;
        }
        if (requiredType === 'write' && p.permissionType === 'admin') {
          return true;
        }
      }

      return false;
    });
  }

  async userHasSuperRole(userId: number): Promise<boolean> {
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
