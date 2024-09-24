import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JsonWebTokenError, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '@/modules/users/services/user.service';
import { DrizzleService } from '@/infrastructure/database/drizzle.service';
import { RedisService } from '@/infrastructure/cache/redis.service';
import { comparePassword, hashPassword } from '@/common/utils/crypto.util';
import { LoginDto } from '../dto/login.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { RegisterDto } from '../dto/register.dto';
import { FeatureToggle } from '@/common/enums/feature-toggles.enum';
import { FeatureToggleService } from '@/common/services/feature-toggle.service';
import { EmailService } from '@/modules/email/services/email.service';
import { v4 as uuidv4 } from 'uuid';
import { loginHistory, sessions } from '@/infrastructure/database/schema';
import { getClientIp } from '@/common/utils/ip.util';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private drizzle: DrizzleService,
    private redisService: RedisService,
    private emailService: EmailService,
    private featureToggleService: FeatureToggleService,
  ) {}

  private async generateToken(user: any): Promise<string> {
    const payload = { username: user.username, sub: user.id };
    const access_token = this.jwtService.sign(payload);

    const expirationSeconds = parseInt(
      this.configService.get('JWT_EXPIRATION'),
      10,
    );
    if (isNaN(expirationSeconds)) {
      throw new Error('Invalid JWT_EXPIRATION configuration');
    }

    await this.redisService
      .getClient()
      .set(
        `auth_token:${access_token}`,
        JSON.stringify({ userId: user.id, username: user.username }),
        'EX',
        expirationSeconds,
      );
    return access_token;
  }

  private async generateRefreshToken(
    userId: number,
    ip: string,
    userAgent: string,
  ): Promise<string> {
    const payload = { sub: userId };
    const refresh_token = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
      secret: this.configService.get('JWT_REFRESH_SECRET'),
    });

    const expirationSeconds = parseInt(
      this.configService.get('JWT_REFRESH_EXPIRATION'),
      10,
    );
    if (isNaN(expirationSeconds)) {
      throw new Error('Invalid JWT_REFRESH_EXPIRATION configuration');
    }

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expirationSeconds);

    await this.drizzle.db.insert(sessions).values({
      userId,
      token: refresh_token,
      expiresAt,
      isActive: true,
      lastUsedAt: new Date(),
      userAgent: userAgent,
      ipAddress: ip,
    });

    return refresh_token;
  }

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.userService.findByUsername(username, true);
    if (
      user &&
      'password' in user &&
      (await comparePassword(pass, user.password))
    ) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(
    loginDto: LoginDto,
    ip: string,
    userAgent: string,
  ): Promise<LoginResponseDto> {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isDisabled) {
      throw new ForbiddenException('Account is disabled');
    }

    const isEmailVerificationEnabled = this.featureToggleService.isEnabled(
      FeatureToggle.EMAIL_VERIFICATION,
    );
    if (isEmailVerificationEnabled && user.email && !user.isEmailVerified) {
      throw new ForbiddenException('Email not verified');
    }
    const access_token = await this.generateToken(user);
    const refresh_token = await this.generateRefreshToken(
      user.id,
      ip,
      userAgent,
    );

    await this.createLoginHistory(user.id, ip, userAgent);

    return { access_token, refresh_token };
  }

  async register(
    registerDto: RegisterDto,
    ip: string,
    userAgent: string,
  ): Promise<LoginResponseDto | { message: string }> {
    if (!this.featureToggleService.isEnabled(FeatureToggle.REGISTRATION)) {
      throw new ForbiddenException('Registration is currently disabled');
    }

    const { username, email, password } = registerDto;

    const existingUser = await this.userService.findByUsername(username);
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    if (email) {
      const existingEmail = await this.userService.findByEmail(email);
      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    const hashedPassword = await hashPassword(password);

    const isEmailVerificationEnabled = this.featureToggleService.isEnabled(
      FeatureToggle.EMAIL_VERIFICATION,
    );
    const isEmailVerified = !email || !isEmailVerificationEnabled;

    const newUser = await this.userService.create({
      username,
      email,
      password: hashedPassword,
      isEmailVerified,
      mfaEnabled: false,
      mfaSecret: null,
      isDisabled: false,
      emailVerificationToken: null,
    });

    if (email && isEmailVerificationEnabled) {
      const verificationToken = uuidv4();
      await this.userService.setEmailVerificationToken(
        newUser.id,
        verificationToken,
      );
      await this.emailService.sendVerificationEmail(email, verificationToken);
      return {
        message:
          'Registration successful. Please check your email to verify your account.',
      };
    }

    const access_token = await this.generateToken(newUser);
    const refresh_token = await this.generateRefreshToken(
      newUser.id,
      ip,
      userAgent,
    );

    await this.createLoginHistory(newUser.id, ip, userAgent);

    return { access_token, refresh_token };
  }

  async logout(accessToken: string, refreshToken: string): Promise<void> {
    try {
      const decodedToken = this.jwtService.verify(accessToken) as {
        sub: number;
      };
      await Promise.all([
        this.blacklistToken(accessToken),
        this.invalidateRefreshToken(decodedToken.sub, refreshToken),
      ]);
    } catch (error) {
      // If the access token is invalid, we still try to invalidate the refresh token
      if (error instanceof JsonWebTokenError) {
        await this.invalidateRefreshTokenByToken(refreshToken);
      } else {
        throw error;
      }
    }
  }

  private async createLoginHistory(
    userId: number,
    ip: string,
    userAgent: string,
  ): Promise<void> {
    await this.drizzle.db.insert(loginHistory).values({
      userId,
      ip,
      userAgent,
    });
  }

  private async blacklistToken(token: string): Promise<void> {
    // Remove the token from active tokens
    await this.redisService.getClient().del(`auth_token:${token}`);

    // Add the token to the blacklist
    const decodedToken = this.jwtService.decode(token) as { exp: number };
    const expirationTime = decodedToken.exp;
    const currentTime = Math.floor(Date.now() / 1000);
    const timeToExpire = expirationTime - currentTime;

    if (timeToExpire > 0) {
      await this.redisService
        .getClient()
        .set(`blacklist:${token}`, 'true', 'EX', timeToExpire);
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklisted = await this.redisService
      .getClient()
      .get(`blacklist:${token}`);
    return !!blacklisted;
  }

  async validateToken(token: string): Promise<any> {
    const isBlacklisted = await this.isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token is blacklisted');
    }

    const tokenData = await this.redisService
      .getClient()
      .get(`auth_token:${token}`);
    if (!tokenData) {
      throw new UnauthorizedException('Invalid token');
    }

    return JSON.parse(tokenData);
  }

  async invalidateRefreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<void> {
    await this.drizzle.db
      .update(sessions)
      .set({ isActive: false })
      .where(
        and(eq(sessions.userId, userId), eq(sessions.token, refreshToken)),
      );
  }

  private async invalidateRefreshTokenByToken(
    refreshToken: string,
  ): Promise<void> {
    const result = await this.drizzle.db
      .update(sessions)
      .set({ isActive: false })
      .where(eq(sessions.token, refreshToken));

    if (result.rowCount === 0) {
      throw new NotFoundException('Refresh token not found');
    }
  }
}
