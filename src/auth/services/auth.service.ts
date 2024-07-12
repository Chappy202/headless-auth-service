import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { EmailService } from 'src/email/email.service';
import {
  users,
  sessions,
  loginHistory,
  blacklistedTokens,
} from '../../db/schema';
import { desc, eq, or } from 'drizzle-orm';
import { MfaService } from 'src/mfa/mfa.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private drizzle: DrizzleService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private mfaService: MfaService,
    private configService: ConfigService,
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

    const { password: _, ...result } = user[0];
    return result;
  }

  async login(user: any, ip: string, mfaToken?: string) {
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

    const payload = { username: user.username, sub: user.id };
    const access_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
    });
    const refresh_token = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
    });

    await this.drizzle.db.insert(sessions).values({
      userId: user.id,
      token: refresh_token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Record login history
    await this.drizzle.db.insert(loginHistory).values({
      userId: user.id,
      ip,
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
    };
  }

  async getLocationFromIp(ip: string): Promise<string> {
    // Implement IP geolocation logic here
    // You might want to use a third-party service or library for this
    return 'Unknown';
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      });

      const session = await this.drizzle.db
        .select()
        .from(sessions)
        .where(eq(sessions.token, refreshToken))
        .limit(1);

      if (session.length === 0) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newAccessToken = this.jwtService.sign(
        {
          username: payload.username,
          sub: payload.sub,
        },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: process.env.JWT_EXPIRATION || '2h', // or whatever duration you prefer
        },
      );

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
    await this.drizzle.db.insert(blacklistedTokens).values({
      token,
      expiresAt: new Date(decoded.exp * 1000),
    });
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const [blacklistedToken] = await this.drizzle.db
      .select()
      .from(blacklistedTokens)
      .where(eq(blacklistedTokens.token, token))
      .limit(1);

    return !!blacklistedToken;
  }
}
