import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { users, userRoles, roles, rolePermissions, permissions } from '../../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private drizzle: DrizzleService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const userRolesResult = await this.drizzle.db.select({
      roleName: roles.name,
    })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, user.userId));

    const userRoleNames = userRolesResult.map(r => r.roleName);

    return requiredRoles.some(role => userRoleNames.includes(role));
  }
}