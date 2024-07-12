import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../../drizzle/drizzle.service';
import {
  permissions,
  resources,
  rolePermissions,
  userPermissions,
  userRoles,
} from '../../db/schema';
import { eq } from 'drizzle-orm';

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

  async createPermission(resourceId: number, type: 'admin' | 'read' | 'write') {
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
      .innerJoin(resources, eq(permissions.resourceId, resources.id))
      .where(eq(userPermissions.userId, userId));

    const rolePerms = await this.drizzle.db
      .select({
        permissionName: permissions.name,
        resourceName: resources.name,
        permissionType: permissions.type,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .innerJoin(resources, eq(permissions.resourceId, resources.id))
      .innerJoin(userRoles, eq(rolePermissions.roleId, userRoles.roleId))
      .where(eq(userRoles.userId, userId));

    return [...userPerms, ...rolePerms];
  }

  async checkPermission(userId: number, requiredPermission: string) {
    const userPermissions = await this.getUserPermissions(userId);

    // Check for superuser permission
    if (userPermissions.some((p) => p.permissionName === '*:*')) {
      return true;
    }

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
}
