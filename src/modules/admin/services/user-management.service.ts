// src/modules/admin/services/user-management.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DrizzleService } from '@/infrastructure/database/drizzle.service';
import {
  users,
  roles,
  userRoles,
  permissions,
  userPermissions,
  sessions,
  loginHistory,
} from '@/infrastructure/database/schema';
import { eq, and, desc, sql, or } from 'drizzle-orm';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
  UserDetailsResponseDto,
  PaginatedUsersResponseDto,
} from '../dto/user-management.dto';
import { hashPassword } from '@/common/utils/crypto.util';
import { EmailService } from '@/modules/email/services/email.service';
import { encrypt, decrypt } from '@/common/utils/encryption.util';
import { AuthorizationService } from '@/modules/auth/services/authorization.service';

@Injectable()
export class UserManagementService {
  constructor(
    private drizzle: DrizzleService,
    private emailService: EmailService,
    private authorizationService: AuthorizationService,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { username, email, password, verifyEmail, roleIds, permissionIds } =
      createUserDto;

    return this.drizzle.db.transaction(async (tx) => {
      // Check if username or email already exists
      const existingUser = await tx
        .select()
        .from(users)
        .where(
          or(eq(users.username, username), eq(users.email, encrypt(email))),
        )
        .limit(1);

      if (existingUser.length > 0) {
        throw new ConflictException('Username or email already exists');
      }

      const hashedPassword = await hashPassword(password);
      const encryptedEmail = encrypt(email);

      const [newUser] = await tx
        .insert(users)
        .values({
          username,
          email: encryptedEmail,
          password: hashedPassword,
          isEmailVerified: !verifyEmail,
        })
        .returning();

      // Assign default role if no roles specified
      if (!roleIds || roleIds.length === 0) {
        const [defaultRole] = await tx
          .select()
          .from(roles)
          .where(eq(roles.name, 'user'))
          .limit(1);

        if (defaultRole) {
          await tx
            .insert(userRoles)
            .values({ userId: newUser.id, roleId: defaultRole.id });
        }
      } else {
        for (const roleId of roleIds) {
          await tx.insert(userRoles).values({ userId: newUser.id, roleId });
        }
      }

      // Assign permissions if specified
      if (permissionIds && permissionIds.length > 0) {
        for (const permissionId of permissionIds) {
          await tx
            .insert(userPermissions)
            .values({ userId: newUser.id, permissionId });
        }
      }

      if (verifyEmail) {
        // TODO: Implement email verification logic
        await this.emailService.sendVerificationEmail(
          email,
          'verificationToken',
        );
      }

      return this.getUserResponseDto(newUser.id);
    });
  }

  async getAllUsers(
    page?: number,
    limit?: number,
  ): Promise<PaginatedUsersResponseDto | UserResponseDto[]> {
    let query = this.drizzle.db.select().from(users);

    if (page !== undefined && limit !== undefined) {
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset) as typeof query;
    }

    const userList = await query;

    const userResponses = await Promise.all(
      userList.map((user) => this.getUserResponseDto(user.id)),
    );

    if (page !== undefined && limit !== undefined) {
      const [totalCount] = await this.drizzle.db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(users);

      return {
        users: userResponses,
        total: totalCount.count,
        page,
        limit,
      };
    }

    return userResponses;
  }

  async getUserDetails(userId: number): Promise<UserDetailsResponseDto> {
    const user = await this.getUserResponseDto(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [latestSessions, latestLoginHistory] = await Promise.all([
      this.drizzle.db
        .select({
          id: sessions.id,
          createdAt: sessions.createdAt,
          lastUsedAt: sessions.lastUsedAt,
          userAgent: sessions.userAgent,
          ipAddress: sessions.ipAddress,
        })
        .from(sessions)
        .where(eq(sessions.userId, userId))
        .orderBy(desc(sessions.lastUsedAt))
        .limit(15),
      this.drizzle.db
        .select({
          id: loginHistory.id,
          createdAt: loginHistory.createdAt,
          ip: loginHistory.ip,
          location: loginHistory.location,
          userAgent: loginHistory.userAgent,
        })
        .from(loginHistory)
        .where(eq(loginHistory.userId, userId))
        .orderBy(desc(loginHistory.createdAt))
        .limit(15),
    ]);

    return {
      ...user,
      latestSessions,
      latestLoginHistory,
    };
  }

  async updateUser(
    adminUserId: number,
    userId: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.drizzle.db.transaction(async (tx) => {
      const [existingUser] = await tx
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!existingUser) {
        throw new NotFoundException('User not found');
      }

      // Check if the user being updated is a super user
      const isTargetUserSuper = await this.authorizationService.checkPermission(
        userId,
        '*:*',
      );
      if (isTargetUserSuper) {
        // Check if the admin performing the update is also a super user
        const isAdminSuper = await this.authorizationService.checkPermission(
          adminUserId,
          '*:*',
        );
        if (!isAdminSuper) {
          throw new ForbiddenException(
            'You do not have permission to modify a super user',
          );
        }
      }

      const {
        username,
        email,
        password,
        mfaEnabled,
        roleIds,
        permissionIds,
        isDisabled,
      } = updateUserDto;

      const updateData: Partial<typeof users.$inferInsert> = {};

      if (username) {
        const [duplicateUser] = await tx
          .select()
          .from(users)
          .where(
            and(eq(users.username, username), sql`${users.id} != ${userId}`),
          )
          .limit(1);

        if (duplicateUser) {
          throw new ConflictException('Username already exists');
        }
        updateData.username = username;
      }

      if (email) {
        const encryptedEmail = encrypt(email);
        const [duplicateUser] = await tx
          .select()
          .from(users)
          .where(
            and(eq(users.email, encryptedEmail), sql`${users.id} != ${userId}`),
          )
          .limit(1);

        if (duplicateUser) {
          throw new ConflictException('Email already exists');
        }
        updateData.email = encryptedEmail;
      }

      if (password) {
        updateData.password = await hashPassword(password);
      }

      if (mfaEnabled !== undefined) {
        updateData.mfaEnabled = mfaEnabled;
      }

      if (isDisabled !== undefined) {
        updateData.isDisabled = isDisabled;
      }

      if (roleIds) {
        await tx.delete(userRoles).where(eq(userRoles.userId, userId));
        for (const roleId of roleIds) {
          await tx.insert(userRoles).values({ userId, roleId });
        }
      }

      if (permissionIds) {
        await tx
          .delete(userPermissions)
          .where(eq(userPermissions.userId, userId));
        for (const permissionId of permissionIds) {
          await tx.insert(userPermissions).values({ userId, permissionId });
        }
      }

      await tx.update(users).set(updateData).where(eq(users.id, userId));

      return this.getUserResponseDto(userId);
    });
  }

  async deleteUser(adminUserId: number, userId: number): Promise<void> {
    return this.drizzle.db.transaction(async (tx) => {
      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if the user being deleted is a super user
      const isTargetUserSuper = await this.authorizationService.checkPermission(
        userId,
        '*:*',
      );
      if (isTargetUserSuper) {
        // Check if the admin performing the deletion is also a super user
        const isAdminSuper = await this.authorizationService.checkPermission(
          adminUserId,
          '*:*',
        );
        if (!isAdminSuper) {
          throw new ForbiddenException(
            'You do not have permission to delete a super user',
          );
        }
      }

      await tx.delete(userRoles).where(eq(userRoles.userId, userId));
      await tx
        .delete(userPermissions)
        .where(eq(userPermissions.userId, userId));
      await tx.delete(sessions).where(eq(sessions.userId, userId));
      await tx.delete(loginHistory).where(eq(loginHistory.userId, userId));
      await tx.delete(users).where(eq(users.id, userId));
    });
  }

  async getUserSessionsAndLoginHistory(userId: number): Promise<{
    sessions: any[];
    loginHistory: any[];
  }> {
    const [userSessions, userLoginHistory] = await Promise.all([
      this.drizzle.db
        .select()
        .from(sessions)
        .where(eq(sessions.userId, userId))
        .orderBy(desc(sessions.lastUsedAt)),
      this.drizzle.db
        .select()
        .from(loginHistory)
        .where(eq(loginHistory.userId, userId))
        .orderBy(desc(loginHistory.createdAt)),
    ]);

    return {
      sessions: userSessions,
      loginHistory: userLoginHistory,
    };
  }

  async requestUserEmailVerification(userId: number): Promise<void> {
    const [user] = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('User email is already verified');
    }

    // TODO: Generate and save verification token
    const verificationToken = 'generated-token';

    await this.drizzle.db
      .update(users)
      .set({ isEmailVerified: false })
      .where(eq(users.id, userId));

    const decryptedEmail = decrypt(user.email);
    await this.emailService.sendVerificationEmail(
      decryptedEmail,
      verificationToken,
    );
  }

  async requestUserPasswordReset(userId: number): Promise<void> {
    const [user] = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // TODO: Generate and save password reset token
    const resetToken = 'generated-reset-token';

    const decryptedEmail = decrypt(user.email);
    await this.emailService.sendPasswordResetEmail(decryptedEmail, resetToken);
  }

  private async getUserResponseDto(userId: number): Promise<UserResponseDto> {
    const [user] = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userRolesResult = await this.drizzle.db
      .select({
        id: roles.id,
        name: roles.name,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));

    const userPermissionsResult = await this.drizzle.db
      .select({
        id: permissions.id,
        name: permissions.name,
      })
      .from(userPermissions)
      .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
      .where(eq(userPermissions.userId, userId));

    return {
      id: user.id,
      username: user.username,
      email: user.email ? decrypt(user.email) : null,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      mfaEnabled: user.mfaEnabled,
      isDisabled: user.isDisabled,
      roles: userRolesResult,
      permissions: userPermissionsResult,
    };
  }
}
