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
import { PermissionsService } from '@/modules/permissions/services/permissions.service';
import { ResourcesService } from '@/modules/resources/services/resources.service';
import { hashPassword } from '@/common/utils/crypto.util';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { CreatePermissionDto } from '@/modules/permissions/dto/create-permission.dto';
import { CreateResourceDto } from '@/modules/resources/dto/create-resource.dto';
import { PermissionResponseDto } from '@/modules/permissions/dto/permission-response.dto';
import { ResourceResponseDto } from '@/modules/resources/dto/resource-response.dto';
import { decrypt, encrypt } from '@/common/utils/encryption.util';

@Injectable()
export class AdminService {
  constructor(
    private drizzle: DrizzleService,
    private userService: UserService,
    private permissionsService: PermissionsService,
    private resourcesService: ResourcesService,
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

  async getUserById(id: number): Promise<UserResponseDto> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException(
        'Invalid user ID. User ID must be a positive integer.',
      );
    }
    const user = await this.userService.findByIdSecure(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.mapToUserResponseDto(user);
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
  }

  async assignPermissionToUser(
    userId: number,
    permissionId: number,
  ): Promise<void> {
    await this.permissionsService.assignPermissionToUser(permissionId, userId);
  }

  async getUserPermissions(userId: number): Promise<PermissionResponseDto[]> {
    return this.permissionsService.getUserPermissions(userId);
  }

  async createResource(
    createResourceDto: CreateResourceDto,
  ): Promise<ResourceResponseDto> {
    return this.resourcesService.createResource(createResourceDto);
  }

  async getResources(): Promise<ResourceResponseDto[]> {
    return this.resourcesService.getResources();
  }

  async createPermission(
    createPermissionDto: CreatePermissionDto,
  ): Promise<PermissionResponseDto> {
    return this.permissionsService.createPermission(createPermissionDto);
  }

  async getPermissions(): Promise<PermissionResponseDto[]> {
    return this.permissionsService.getPermissions();
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
