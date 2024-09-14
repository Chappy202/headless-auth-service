import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '@/infrastructure/database/drizzle.service';
import { roles, userRoles, users } from '@/infrastructure/database/schema';
import { eq } from 'drizzle-orm';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UserProfileDto } from '../dto/user-profile.dto';
import { hashPassword } from '@/common/utils/crypto.util';
import { encrypt, decrypt } from '@/common/utils/encryption.util';
import { PermissionsService } from '@/modules/permissions/services/permissions.service';
import { PermissionListResponseDto } from '@/modules/permissions/dto/permission-list-response.dto';

@Injectable()
export class UserService {
  constructor(
    private drizzle: DrizzleService,
    private permissionsService: PermissionsService,
  ) {}

  async findByUsername(
    username: string,
  ): Promise<typeof users.$inferSelect | null> {
    const [user] = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (user && user.email) {
      user.email = decrypt(user.email);
    }

    return user || null;
  }

  async findById(id: number): Promise<typeof users.$inferSelect | null> {
    const [user] = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (user && user.email) {
      user.email = decrypt(user.email);
    }

    return user || null;
  }

  async findByIdSecure(
    id: number,
  ): Promise<Omit<typeof users.$inferSelect, 'password'> | null> {
    const [user] = await this.drizzle.db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        isEmailVerified: users.isEmailVerified,
        createdAt: users.createdAt,
        mfaEnabled: users.mfaEnabled,
        mfaSecret: users.mfaSecret,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      return null;
    }

    return user;
  }

  async getUserProfile(id: number): Promise<UserProfileDto> {
    const [user] = await this.drizzle.db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        isEmailVerified: users.isEmailVerified,
        createdAt: users.createdAt,
        mfaEnabled: users.mfaEnabled,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userRolesData = await this.getUserRoles(id);
    const permissions = await this.permissionsService.getUserPermissions(id);

    return this.mapToUserProfileDto(user, userRolesData, permissions);
  }

  async updateProfile(
    id: number,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    const updateData: Partial<typeof users.$inferInsert> = {
      ...updateProfileDto,
    };

    if (updateProfileDto.password) {
      updateData.password = await hashPassword(updateProfileDto.password);
    }

    if (updateProfileDto.email) {
      updateData.email = encrypt(updateProfileDto.email);
    }

    const [updatedUser] = await this.drizzle.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    const userRolesData = await this.getUserRoles(id);
    const permissions = await this.permissionsService.getUserPermissions(id);

    return this.mapToUserProfileDto(updatedUser, userRolesData, permissions);
  }

  private async getUserRoles(userId: number) {
    return this.drizzle.db
      .select({
        id: roles.id,
        name: roles.name,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));
  }

  async create(
    userData: Omit<typeof users.$inferInsert, 'id' | 'createdAt'>,
  ): Promise<typeof users.$inferSelect> {
    const dataToInsert = { ...userData };
    if (dataToInsert.email) {
      dataToInsert.email = encrypt(dataToInsert.email);
    }

    const [newUser] = await this.drizzle.db
      .insert(users)
      .values(dataToInsert)
      .returning();

    if (newUser.email) {
      newUser.email = decrypt(newUser.email);
    }

    return newUser;
  }

  private mapToUserProfileDto(
    user: Partial<typeof users.$inferSelect>,
    userRoles: { id: number; name: string }[],
    permissions: PermissionListResponseDto[],
  ): UserProfileDto {
    return {
      id: user.id!,
      username: user.username!,
      email: user.email ? decrypt(user.email) : null,
      isEmailVerified: user.isEmailVerified!,
      createdAt: user.createdAt!,
      mfaEnabled: user.mfaEnabled!,
      roles: userRoles,
      permissions: permissions,
    };
  }
}
