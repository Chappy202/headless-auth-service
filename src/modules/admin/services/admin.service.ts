import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '@/infrastructure/database/drizzle.service';
import { users } from '@/infrastructure/database/schema';
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

@Injectable()
export class AdminService {
  constructor(
    private drizzle: DrizzleService,
    private userService: UserService,
    private permissionsService: PermissionsService,
    private resourcesService: ResourcesService,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const hashedPassword = await hashPassword(createUserDto.password);
    const user = await this.userService.create({
      ...createUserDto,
      password: hashedPassword,
    });
    return this.mapToUserResponseDto(user);
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
    if (updateUserDto.password) {
      updateUserDto.password = await hashPassword(updateUserDto.password);
    }
    const [updatedUser] = await this.drizzle.db
      .update(users)
      .set(updateUserDto)
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return this.mapToUserResponseDto(updatedUser);
  }

  async deleteUser(id: number): Promise<UserResponseDto> {
    const [deletedUser] = await this.drizzle.db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    if (!deletedUser) {
      throw new NotFoundException('User not found');
    }

    return this.mapToUserResponseDto(deletedUser);
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
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      mfaEnabled: user.mfaEnabled,
    };
  }
}
