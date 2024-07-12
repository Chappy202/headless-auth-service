import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '../drizzle/drizzle.service';
import {
  users,
  loginHistory,
  sessions,
  roles,
  permissions,
  rolePermissions,
  userRoles,
} from '../db/schema';
import { and, asc, eq, gt } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(private drizzle: DrizzleService) {}

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async createUser(
    userData: Omit<typeof users.$inferInsert, 'password'> & {
      password: string;
    },
  ) {
    const hashedPassword = await this.hashPassword(userData.password);
    const [user] = await this.drizzle.db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword,
      })
      .returning();

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getUsers() {
    const allUsers = await this.drizzle.db
      .select()
      .from(users)
      .orderBy(asc(users.id));
    return allUsers;
  }

  async getUserDetails(userId: number) {
    // Fetch user details
    const [user] = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Fetch user login history
    const loginHistoryData = await this.drizzle.db
      .select()
      .from(loginHistory)
      .where(eq(loginHistory.userId, userId));

    // Fetch user roles
    const userRolesData = await this.drizzle.db
      .select({ roleId: userRoles.roleId, roleName: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));

    // Fetch active sessions
    const activeSessionsData = await this.drizzle.db
      .select()
      .from(sessions)
      .where(
        and(eq(sessions.userId, userId), gt(sessions.expiresAt, new Date())),
      );

    return {
      user,
      loginHistory: loginHistoryData,
      roles: userRolesData,
      activeSessions: activeSessionsData,
    };
  }

  async resetUserPassword(userId: number, newPassword: string) {
    const hashedPassword = await this.hashPassword(newPassword);
    await this.drizzle.db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));
  }

  async createRole(name: string) {
    const [role] = await this.drizzle.db
      .insert(roles)
      .values({ name })
      .returning();
    return role;
  }

  async createPermission(name: string) {
    const [permission] = await this.drizzle.db
      .insert(permissions)
      .values({ name })
      .returning();
    return permission;
  }

  async assignRoleToUser(userId: number, roleId: number) {
    try {
      // First, check if the user exists
      const user = await this.drizzle.db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length === 0) {
        throw new Error(`User with id ${userId} does not exist`);
      }

      // Then, check if the role exists
      const role = await this.drizzle.db
        .select()
        .from(roles)
        .where(eq(roles.id, roleId))
        .limit(1);

      if (role.length === 0) {
        throw new Error(`Role with id ${roleId} does not exist`);
      }

      // Check if the user already has this role
      const existingUserRole = await this.drizzle.db
        .select()
        .from(userRoles)
        .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)))
        .limit(1);

      if (existingUserRole.length > 0) {
        throw new Error(`User already has this role assigned`);
      }

      // If both user and role exist, and the assignment doesn't already exist, proceed with the insertion
      await this.drizzle.db.insert(userRoles).values({ userId, roleId });
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(
          'An unexpected error occurred while assigning the role to the user',
        );
      }
    }
  }

  async assignPermissionToRole(roleId: number, permissionId: number) {
    await this.drizzle.db
      .insert(rolePermissions)
      .values({ roleId, permissionId });
  }

  async disableUserMfa(userId: number) {
    const [user] = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.mfaEnabled) {
      return { message: 'MFA is already disabled for this user' };
    }

    await this.drizzle.db
      .update(users)
      .set({ mfaEnabled: false, mfaSecret: null })
      .where(eq(users.id, userId));

    return { message: 'MFA disabled successfully for the user' };
  }

  async getUserMfaStatus(userId: number) {
    const [user] = await this.drizzle.db
      .select({
        id: users.id,
        username: users.username,
        mfaEnabled: users.mfaEnabled,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      username: user.username,
      mfaEnabled: user.mfaEnabled,
    };
  }
}
