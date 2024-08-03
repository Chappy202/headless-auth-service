import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '@/infrastructure/database/drizzle.service';
import { users } from '@/infrastructure/database/schema';
import { eq } from 'drizzle-orm';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserService } from '@/modules/users/services/user.service';
import { PermissionsService } from '@/modules/permissions/services/permissions.service';
import { ResourcesService } from '@/modules/resources/services/resources.service';
import { hashPassword } from '@/common/utils/crypto.util';

@Injectable()
export class AdminService {
  constructor(
    private drizzle: DrizzleService,
    private userService: UserService,
    private permissionsService: PermissionsService,
    private resourcesService: ResourcesService,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    const hashedPassword = await hashPassword(createUserDto.password);
    const user = await this.userService.create({
      ...createUserDto,
      password: hashedPassword,
    });
    return user;
  }

  async getUsers() {
    return this.drizzle.db.select().from(users);
  }

  async getUserById(id: number) {
    return this.userService.findById(id);
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto) {
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

    return updatedUser;
  }

  async deleteUser(id: number) {
    const [deletedUser] = await this.drizzle.db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    if (!deletedUser) {
      throw new NotFoundException('User not found');
    }

    return deletedUser;
  }

  // Methods for managing permissions and resources
  async assignPermissionToUser(userId: number, permissionId: number) {
    return this.permissionsService.assignPermissionToUser(permissionId, userId);
  }

  async getUserPermissions(userId: number) {
    return this.permissionsService.getUserPermissions(userId);
  }

  async createResource(name: string, description?: string) {
    return this.resourcesService.createResource({ name, description });
  }

  async getResources() {
    return this.resourcesService.getResources();
  }
}
