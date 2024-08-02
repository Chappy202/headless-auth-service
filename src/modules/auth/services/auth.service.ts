import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { EmailService } from 'src/modules/email/services/email.service';
import { desc, eq, or, and, lt } from 'drizzle-orm';
import { ConfigService } from '@nestjs/config';
import { RedisService } from 'src/infrastructure/cache/redis.service';
import { PermissionService } from './permission.service';
import { DrizzleService } from 'src/infrastructure/database/drizzle.service';
import {
  users,
  sessions,
  loginHistory,
  blacklistedTokens,
} from 'src/infrastructure/database/schema';
import { MfaService } from './mfa.service';

@Injectable()
export class AuthService {
  constructor(
    private drizzle: DrizzleService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private mfaService: MfaService,
    private configService: ConfigService,
    private redisService: RedisService,
    private permissionService: PermissionService,
  ) {}

  async validateUser(usernameOrEmail: string, password: string): Promise<any> {
    const user = await this.drizzle.db
      .select()
      .from(users)
      .where(
        or(
          eq(users.username, usernameOrEmail),
          eq(users.email, usernameOrEmail),
        ),
      )
      .limit(1);

    if (user.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user[0].password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user[0];
    return result;
  }

  async login(user: any, ip: string, userAgent: string, mfaToken?: string) {
    if (user.mfaEnabled) {
      if (!mfaToken) {
        return { requireMfa: true };
      }
      const isValidToken = this.mfaService.verifyToken(
        mfaToken,
        user.mfaSecret,
      );
      if (!isValidToken) {
        throw new UnauthorizedException('Invalid MFA token');
      }
    }

    // Fetch user permissions
    const userPermissions = await this.permissionService.getUserPermissions(
      user.id,
    );

    const payload = {
      sub: user.id,
      username: user.username,
      permissions: userPermissions.map((p) => p.permissionName),
    };

    const access_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: process.env.JWT_EXPIRATION || '2h',
    });

    const refresh_token = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
    });

    // Create a new session
    const [session] = await this.drizzle.db
      .insert(sessions)
      .values({
        userId: user.id,
        token: refresh_token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userAgent,
        ipAddress: ip,
      })
      .returning();

    // Limit active sessions
    await this.limitActiveSessions(user.id);

    // Record login history
    await this.drizzle.db.insert(loginHistory).values({
      userId: user.id,
      ip,
      userAgent,
      location: await this.getLocationFromIp(ip),
    });

    // Remove oldest login history if there are more than 7
    const loginHistories = await this.drizzle.db
      .select()
      .from(loginHistory)
      .where(eq(loginHistory.userId, user.id))
      .orderBy(desc(loginHistory.createdAt))
      .limit(8);

    if (loginHistories.length > 7) {
      await this.drizzle.db
        .delete(loginHistory)
        .where(eq(loginHistory.id, loginHistories[7].id));
    }

    return {
      access_token,
      refresh_token,
      sessionId: session.id,
    };
  }

  async logout(token: string) {
    await this.blacklistToken(token);
    // Find and deactivate the session
    const [session] = await this.drizzle.db
      .select()
      .from(sessions)
      .where(eq(sessions.token, token))
      .limit(1);

    if (session) {
      await this.revokeSession(session.id);
    }
  }

  async limitActiveSessions(userId: number, maxSessions: number = 8) {
    const activeSessions = await this.drizzle.db
      .select()
      .from(sessions)
      .where(and(eq(sessions.userId, userId), eq(sessions.isActive, true)))
      .orderBy(desc(sessions.lastUsedAt));

    if (activeSessions.length > maxSessions) {
      const sessionsToDeactivate = activeSessions.slice(maxSessions);
      for (const session of sessionsToDeactivate) {
        await this.revokeSession(session.id);
      }
    }
  }

  async getUserSessions(userId: number) {
    return this.drizzle.db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, userId));
  }

  async revokeSession(sessionId: number) {
    const [session] = await this.drizzle.db
      .update(sessions)
      .set({ isActive: false })
      .where(eq(sessions.id, sessionId))
      .returning();

    if (session) {
      await this.blacklistToken(session.token);
    }
  }

  async revokeAllUserSessions(userId: number) {
    const userSessions = await this.drizzle.db
      .select()
      .from(sessions)
      .where(and(eq(sessions.userId, userId), eq(sessions.isActive, true)));

    for (const session of userSessions) {
      await this.revokeSession(session.id);
    }
  }

  async getLocationFromIp(ip: string): Promise<string> {
    // Implement IP geolocation logic here
    // You might want to use a third-party service or library for this
    return 'Unknown';
  }

  async refreshToken(refreshToken: string, userAgent: string, ip: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      });

      const [session] = await this.drizzle.db
        .select()
        .from(sessions)
        .where(
          and(eq(sessions.token, refreshToken), eq(sessions.isActive, true)),
        )
        .limit(1);

      if (!session) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Fetch updated user permissions
      const userPermissions = await this.permissionService.getUserPermissions(
        payload.sub,
      );

      const newPayload = {
        sub: payload.sub,
        username: payload.username,
        permissions: userPermissions.map((p) => p.permissionName),
      };

      const newAccessToken = this.jwtService.sign(newPayload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: process.env.JWT_EXPIRATION || '2h',
      });

      // Update session
      await this.drizzle.db
        .update(sessions)
        .set({ lastUsedAt: new Date(), userAgent, ipAddress: ip })
        .where(eq(sessions.id, session.id));

      return { access_token: newAccessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async register(userData: {
    username: string;
    email?: string;
    password: string;
  }) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const [user] = await this.drizzle.db
      .insert(users)
      .values({
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
      })
      .returning();

    if (userData.email) {
      // Generate verification token
      const verificationToken = this.jwtService.sign(
        { userId: user.id },
        { expiresIn: process.env.VERIFICATION_TOKEN_EXPIRATION || '24h' },
      );

      // Send verification email
      await this.emailService.sendVerificationEmail(
        user.email,
        verificationToken,
      );

      return {
        message:
          'User registered. Please check your email to verify your account.',
      };
    }

    return {
      message: 'User registered.',
    };
  }

  async requestPasswordReset(email: string) {
    const [user] = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const resetToken = this.jwtService.sign(
      { userId: user.id },
      { expiresIn: process.env.PASSWORD_RESET_TOKEN_EXPIRATION || '1h' },
    );

    await this.emailService.sendPasswordResetEmail(email, resetToken);

    return { message: 'Password reset instructions sent to your email.' };
  }

  async resetPassword(resetToken: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(resetToken);
      const hashedPassword = await bcrypt.hash(
        newPassword,
        process.env.SALT_ROUNDS || 12,
      );

      await this.drizzle.db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, payload.userId));

      return { message: 'Password reset successful.' };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
  }

  async blacklistToken(token: string) {
    const decoded = this.jwtService.decode(token) as { exp: number };
    const expiresAt = new Date(decoded.exp * 1000);

    await this.drizzle.db.insert(blacklistedTokens).values({
      token,
      expiresAt,
    });

    // Add to Redis cache
    await this.redisService
      .getClient()
      .set(
        `blacklisted_token:${token}`,
        '1',
        'EX',
        Math.floor((expiresAt.getTime() - Date.now()) / 1000),
      );
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    // Check Redis cache first
    const cachedResult = await this.redisService
      .getClient()
      .get(`blacklisted_token:${token}`);
    if (cachedResult) {
      return true;
    }

    // If not in cache, check database
    const [blacklistedToken] = await this.drizzle.db
      .select()
      .from(blacklistedTokens)
      .where(eq(blacklistedTokens.token, token))
      .limit(1);

    return !!blacklistedToken;
  }

  async cleanupExpiredTokens() {
    const now = new Date();

    console.log('Cleaning up expired tokens...');

    // Remove expired tokens from the database
    const expiredTokens = await this.drizzle.db
      .delete(blacklistedTokens)
      .where(lt(blacklistedTokens.expiresAt, now))
      .returning();

    return expiredTokens.length;
  }
}
