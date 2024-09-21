import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DrizzleService } from '@/infrastructure/database/drizzle.service';
import { roles, userRoles, users } from '@/infrastructure/database/schema';
import { eq } from 'drizzle-orm';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UserService } from '@/modules/users/services/user.service';
import { hashPassword } from '@/common/utils/crypto.util';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { decrypt, encrypt } from '@/common/utils/encryption.util';
import { UserProfileDto } from '@/modules/users/dto/user-profile.dto';
import { RolesService } from '@/modules/roles/services/roles.service';
import { CreateRoleDto } from '@/modules/roles/dto/create-role.dto';
import { RoleResponseDto } from '@/modules/roles/dto/role-response.dto';
import { UpdateRoleDto } from '@/modules/roles/dto/update-role.dto';

@Injectable()
export class AdminService {
  constructor(
    private drizzle: DrizzleService,
    private userService: UserService,
    private rolesService: RolesService,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      const hashedPassword = await hashPassword(createUserDto.password);
      const encryptedEmail = createUserDto.email
        ? encrypt(createUserDto.email)
        : null;

      const user = await this.drizzle.db.transaction(async (tx) => {
        const [newUser] = await tx
          .insert(users)
          .values({
            username: createUserDto.username,
            password: hashedPassword,
            email: encryptedEmail,
            isEmailVerified: createUserDto.isEmailVerified || false,
            mfaEnabled: createUserDto.mfaEnabled || false,
          })
          .returning();

        const [defaultRole] = await tx
          .select()
          .from(roles)
          .where(eq(roles.name, 'user'))
          .limit(1);

        if (!defaultRole) {
          throw new Error('Default role not found');
        }

        await tx.insert(userRoles).values({
          userId: newUser.id,
          roleId: defaultRole.id,
        });

        return newUser;
      });

      return this.mapToUserResponseDto(user);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Username or email already exists');
      }
      throw error;
    }
  }

  async getUsers(paginationDto: PaginationDto): Promise<UserResponseDto[]> {
    const { page = 1, limit = 10 } = paginationDto;
    const offset = (page - 1) * limit;

    const userList = await this.drizzle.db
      .select()
      .from(users)
      .limit(limit)
      .offset(offset);

    return userList.map(this.mapToUserResponseDto);
  }

  async getUserById(id: number): Promise<UserProfileDto> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException(
        'Invalid user ID. User ID must be a positive integer.',
      );
    }
    const user = await this.userService.getUserProfile(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateUser(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    try {
      const updateData: Partial<typeof users.$inferInsert> = {
        ...updateUserDto,
      };

      if (updateUserDto.password) {
        updateData.password = await hashPassword(updateUserDto.password);
      }

      if (updateUserDto.email) {
        updateData.email = encrypt(updateUserDto.email);
      }

      const [updatedUser] = await this.drizzle.db
        .update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning();

      if (!updatedUser) {
        throw new NotFoundException('User not found');
      }

      return this.mapToUserResponseDto(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while updating the user',
      );
    }
  }

  async deleteUser(id: number): Promise<UserResponseDto> {
    try {
      return this.drizzle.db.transaction(async (tx) => {
        // Delete associated records in user_roles
        await tx.delete(userRoles).where(eq(userRoles.userId, id));

        // Now delete the user
        const [deletedUser] = await tx
          .delete(users)
          .where(eq(users.id, id))
          .returning();

        if (!deletedUser) {
          throw new NotFoundException('User not found');
        }

        return this.mapToUserResponseDto(deletedUser);
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while deleting the user',
      );
    }
  }

  async createRole(createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
    return this.rolesService.createRole(createRoleDto);
  }

  async getRoles(): Promise<RoleResponseDto[]> {
    return this.rolesService.getRoles();
  }

  async getRoleById(id: number): Promise<RoleResponseDto> {
    return this.rolesService.getRoleById(id);
  }

  async updateRole(
    id: number,
    updateRoleDto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    return this.rolesService.updateRole(id, updateRoleDto);
  }

  async deleteRole(id: number): Promise<void> {
    return this.rolesService.deleteRole(id);
  }

  async assignPermissionToRole(
    roleId: number,
    permissionId: number,
  ): Promise<void> {
    return this.rolesService.assignPermissionToRole(roleId, permissionId);
  }

  private mapToUserResponseDto(
    user: Omit<typeof users.$inferSelect, 'password'>,
  ): UserResponseDto {
    let decryptedEmail = null;
    if (user.email) {
      try {
        decryptedEmail = decrypt(user.email);
      } catch (error) {
        console.error('Error decrypting email:', error);
        // Leave decryptedEmail as null
      }
    }

    return {
      id: user.id,
      username: user.username,
      email: decryptedEmail,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      mfaEnabled: user.mfaEnabled,
    };
  }
}
