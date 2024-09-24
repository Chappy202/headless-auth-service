import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DrizzleService } from '@/infrastructure/database/drizzle.service';
import {
  roles,
  rolePermissions,
  userRoles,
  permissions,
} from '@/infrastructure/database/schema';
import { eq, sql } from 'drizzle-orm';
import {
  CreateRoleDto,
  UpdateRoleDto,
  RoleResponseDto,
  RoleDetailResponseDto,
} from '../dto/role-management.dto';

@Injectable()
export class RoleManagementService {
  constructor(private drizzle: DrizzleService) {}

  async createRole(createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
    return this.drizzle.db.transaction(async (tx) => {
      const [existingRole] = await tx
        .select()
        .from(roles)
        .where(sql`lower(${roles.name}) = lower(${createRoleDto.name})`)
        .limit(1);

      if (existingRole) {
        throw new ConflictException(
          `Role with name "${createRoleDto.name}" already exists (case-insensitive)`,
        );
      }

      const [newRole] = await tx
        .insert(roles)
        .values({ name: createRoleDto.name })
        .returning();

      if (createRoleDto.permissionIds) {
        await this.assignPermissionsToRole(
          tx,
          newRole.id,
          createRoleDto.permissionIds,
        );
      }

      return this.mapToRoleResponseDto(newRole);
    });
  }

  async getAllRoles(): Promise<RoleResponseDto[]> {
    const roleList = await this.drizzle.db.select().from(roles);
    return roleList.map(this.mapToRoleResponseDto);
  }

  async getRoleDetails(id: number): Promise<RoleDetailResponseDto> {
    const [role] = await this.drizzle.db
      .select()
      .from(roles)
      .where(eq(roles.id, id))
      .limit(1);

    if (!role) {
      throw new NotFoundException(`Role with id ${id} not found`);
    }

    const rolePermissionsList = await this.drizzle.db
      .select({
        id: permissions.id,
        name: permissions.name,
        type: permissions.type,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, id));

    return {
      ...this.mapToRoleResponseDto(role),
      permissions: rolePermissionsList,
    };
  }

  async updateRole(
    id: number,
    updateRoleDto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    return this.drizzle.db.transaction(async (tx) => {
      const [existingRole] = await tx
        .select()
        .from(roles)
        .where(eq(roles.id, id))
        .limit(1);

      if (!existingRole) {
        throw new NotFoundException(`Role with id ${id} not found`);
      }

      if (
        updateRoleDto.name &&
        updateRoleDto.name.toLowerCase() !== existingRole.name.toLowerCase()
      ) {
        const [duplicateRole] = await tx
          .select()
          .from(roles)
          .where(sql`lower(${roles.name}) = lower(${updateRoleDto.name})`)
          .limit(1);

        if (duplicateRole) {
          throw new ConflictException(
            `Role with name "${updateRoleDto.name}" already exists (case-insensitive)`,
          );
        }
      }

      const [updatedRole] = await tx
        .update(roles)
        .set({ name: updateRoleDto.name || existingRole.name })
        .where(eq(roles.id, id))
        .returning();

      if (updateRoleDto.permissionIds) {
        await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, id));
        await this.assignPermissionsToRole(tx, id, updateRoleDto.permissionIds);
      }

      return this.mapToRoleResponseDto(updatedRole);
    });
  }

  async deleteRole(
    id: number,
  ): Promise<{ deletedRole: RoleResponseDto; affectedUserIds: number[] }> {
    return this.drizzle.db.transaction(async (tx) => {
      const [role] = await tx
        .select()
        .from(roles)
        .where(eq(roles.id, id))
        .limit(1);

      if (!role) {
        throw new NotFoundException(`Role with id ${id} not found`);
      }

      await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, id));

      const affectedUsers = await tx
        .select({ userId: userRoles.userId })
        .from(userRoles)
        .where(eq(userRoles.roleId, id));

      await tx.delete(userRoles).where(eq(userRoles.roleId, id));

      const [deletedRole] = await tx
        .delete(roles)
        .where(eq(roles.id, id))
        .returning();

      return {
        deletedRole: this.mapToRoleResponseDto(deletedRole),
        affectedUserIds: affectedUsers.map((user) => user.userId),
      };
    });
  }

  private async assignPermissionsToRole(
    tx: any,
    roleId: number,
    permissionIds: number[],
  ): Promise<void> {
    for (const permissionId of permissionIds) {
      const [permission] = await tx
        .select()
        .from(permissions)
        .where(eq(permissions.id, permissionId))
        .limit(1);

      if (!permission) {
        throw new NotFoundException(
          `Permission with id ${permissionId} not found`,
        );
      }

      await tx.insert(rolePermissions).values({ roleId, permissionId });
    }
  }

  private mapToRoleResponseDto(
    role: typeof roles.$inferSelect,
  ): RoleResponseDto {
    return {
      id: role.id,
      name: role.name,
    };
  }
}
