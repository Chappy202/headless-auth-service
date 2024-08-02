import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '../../../infrastructure/database/drizzle.service';
import {
  users,
  loginHistory,
  sessions,
  roles,
  userRoles,
} from '../../../infrastructure/database/schema';
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
