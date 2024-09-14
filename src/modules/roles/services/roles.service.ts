import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DrizzleService } from '@/infrastructure/database/drizzle.service';
import {
  roles,
  rolePermissions,
  permissions,
} from '@/infrastructure/database/schema';
import { and, eq } from 'drizzle-orm';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { RoleResponseDto } from '../dto/role-response.dto';
import { PermissionListResponseDto } from '@/modules/permissions/dto/permission-list-response.dto';
import { RolesResponseDto } from '../dto/roles-response.dto';

@Injectable()
export class RolesService {
  constructor(private drizzle: DrizzleService) {}

  async createRole(createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
    try {
      const [role] = await this.drizzle.db
        .insert(roles)
        .values(createRoleDto)
        .returning();
      return this.mapToRoleResponseDto(role);
    } catch (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        throw new ConflictException('Role with this name already exists');
      }
      throw error;
    }
  }

  async getRoles(): Promise<RoleResponseDto[]> {
    const roleList = await this.drizzle.db.select().from(roles);
    return roleList.map(this.mapToRoleResponseDto);
  }

  async getRoleById(id: number): Promise<RolesResponseDto> {
    const [role] = await this.drizzle.db
      .select()
      .from(roles)
      .where(eq(roles.id, id))
      .limit(1);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const rolePermissionsList = await this.drizzle.db
      .select({
        permission: permissions,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, id));

    const permissionsList = rolePermissionsList.map((rp) =>
      this.mapToPermissionListResponseDto(rp.permission),
    );

    return {
      ...this.mapToRoleResponseDto(role),
      permissions: permissionsList,
    };
  }

  async updateRole(
    id: number,
    updateRoleDto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    const [updatedRole] = await this.drizzle.db
      .update(roles)
      .set(updateRoleDto)
      .where(eq(roles.id, id))
      .returning();

    if (!updatedRole) {
      throw new NotFoundException('Role not found');
    }

    return this.mapToRoleResponseDto(updatedRole);
  }

  async deleteRole(id: number): Promise<void> {
    await this.drizzle.db.transaction(async (tx) => {
      // Delete associated records in role_permissions
      await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, id));

      // Delete the role
      const [deletedRole] = await tx
        .delete(roles)
        .where(eq(roles.id, id))
        .returning();

      if (!deletedRole) {
        throw new NotFoundException('Role not found');
      }
    });
  }

  async assignPermissionToRole(
    roleId: number,
    permissionId: number,
  ): Promise<void> {
    await this.drizzle.db.transaction(async (tx) => {
      const [existingRole] = await tx
        .select()
        .from(roles)
        .where(eq(roles.id, roleId))
        .limit(1);

      if (!existingRole) {
        throw new NotFoundException('Role not found');
      }

      const [existingPermission] = await tx
        .select()
        .from(permissions)
        .where(eq(permissions.id, permissionId))
        .limit(1);

      if (!existingPermission) {
        throw new NotFoundException('Permission not found');
      }

      // Check if the permission is already assigned to the role
      const [existingAssignment] = await tx
        .select()
        .from(rolePermissions)
        .where(
          and(
            eq(rolePermissions.roleId, roleId),
            eq(rolePermissions.permissionId, permissionId),
          ),
        )
        .limit(1);

      if (existingAssignment) {
        throw new ConflictException(
          'Permission is already assigned to this role',
        );
      }

      await tx.insert(rolePermissions).values({ roleId, permissionId });
    });
  }

  private mapToRoleResponseDto(
    role: typeof roles.$inferSelect,
  ): RoleResponseDto {
    return {
      id: role.id,
      name: role.name,
    };
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
}
