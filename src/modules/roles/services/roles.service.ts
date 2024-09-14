import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DrizzleService } from '@/infrastructure/database/drizzle.service';
import { roles, rolePermissions } from '@/infrastructure/database/schema';
import { eq } from 'drizzle-orm';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { RoleResponseDto } from '../dto/role-response.dto';

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

  async getRoleById(id: number): Promise<RoleResponseDto> {
    const [role] = await this.drizzle.db
      .select()
      .from(roles)
      .where(eq(roles.id, id))
      .limit(1);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return this.mapToRoleResponseDto(role);
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

  private mapToRoleResponseDto(
    role: typeof roles.$inferSelect,
  ): RoleResponseDto {
    return {
      id: role.id,
      name: role.name,
    };
  }
}
