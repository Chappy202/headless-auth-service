import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
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
import { and, eq } from 'drizzle-orm';
import { RefreshTokenResponseDto } from '../dto/refresh-token-response.dto';
import { parseTimeToSeconds } from '@/common/utils/time.util';
import { SessionService } from './session.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly maxLoginAttempts: number;
  private readonly lockoutTime: number;
  constructor(
    private userService: UserService,
    private sessionService: SessionService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private drizzle: DrizzleService,
    private redisService: RedisService,
    private emailService: EmailService,
    private featureToggleService: FeatureToggleService,
  ) {
    this.maxLoginAttempts =
      this.configService.get<number>('MAX_LOGIN_ATTEMPTS') || 5;
    this.lockoutTime = this.configService.get<number>('LOCKOUT_TIME') || 900; // 15 minutes in seconds
  }

  private async generateToken(user: any): Promise<string> {
    const payload = { username: user.username, sub: user.id };
    const jwtExpirationString =
      this.configService.get<string>('JWT_EXPIRATION');
    if (!jwtExpirationString) {
      throw new Error('JWT_EXPIRATION is not set');
    }
    const expirationSeconds = parseTimeToSeconds(jwtExpirationString);

    const access_token = this.jwtService.sign(payload, {
      expiresIn: expirationSeconds,
    });

    const redisKey = `auth_token:${access_token}`;
    const redisValue = JSON.stringify({
      userId: user.id,
      username: user.username,
    });

    try {
      await this.redisService
        .getClient()
        .set(redisKey, redisValue, 'EX', expirationSeconds);
    } catch (error) {
      throw new InternalServerErrorException('Failed to store token');
    }

    return access_token;
  }

  private async generateRefreshToken(
    userId: number,
    ip: string,
    userAgent: string,
  ): Promise<string> {
    const payload = { sub: userId };
    const refreshExpirationString = this.configService.get<string>(
      'JWT_REFRESH_EXPIRATION',
    );
    if (!refreshExpirationString) {
      throw new Error('JWT_REFRESH_EXPIRATION is not set');
    }
    const expirationSeconds = parseTimeToSeconds(refreshExpirationString);

    const refresh_token = this.jwtService.sign(payload, {
      expiresIn: expirationSeconds,
      secret: this.configService.get('JWT_REFRESH_SECRET'),
    });

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expirationSeconds);

    await this.sessionService.createSession(
      userId,
      refresh_token,
      expiresAt,
      ip,
      userAgent,
    );

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
    const loginAttemptsKey = `login_attempts:${loginDto.username}`;
    const loginAttempts = await this.redisService
      .getClient()
      .get(loginAttemptsKey);

    if (loginAttempts && parseInt(loginAttempts) >= this.maxLoginAttempts) {
      throw new UnauthorizedException(
        'Account is locked. Please try again later.',
      );
    }

    const user = await this.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      await this.redisService.getClient().incr(loginAttemptsKey);
      await this.redisService
        .getClient()
        .expire(loginAttemptsKey, this.lockoutTime);

      this.logger.warn(
        `Failed login attempt for username: ${loginDto.username}, IP: ${ip}`,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset login attempts on successful login
    await this.redisService.getClient().del(loginAttemptsKey);

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
      // Always blacklist the access token
      await this.blacklistToken(accessToken);

      const session =
        await this.sessionService.findSessionByToken(refreshToken);

      if (session) {
        // If the session exists, delete it
        await this.sessionService.deleteSession(session.id);
      } else {
        // Log that we couldn't find the session, but don't throw an error
        console.warn(`Session not found for refresh token during logout.`);
      }

      // Always clear any user-related data from Redis or other caches
      await this.clearUserCache(accessToken);
    } catch (error) {
      // Log the error, but don't throw it
      console.error('Error during logout:', error);

      // Ensure the token is blacklisted even if other operations fail
      if (!(error instanceof JsonWebTokenError)) {
        await this.blacklistToken(accessToken);
      }
    }

    // The function will always resolve, ensuring the frontend considers the user logged out
  }

  async refreshToken(
    oldRefreshToken: string,
    ip: string,
    userAgent: string,
  ): Promise<RefreshTokenResponseDto> {
    const session =
      await this.sessionService.findSessionByToken(oldRefreshToken);

    if (!session) {
      throw new NotFoundException('Invalid refresh token');
    }

    const user = await this.userService.findById(session.userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isDisabled) {
      throw new ForbiddenException('User account is disabled');
    }

    // Generate new tokens
    const access_token = await this.generateToken(user);
    const refresh_token = await this.generateRefreshToken(
      user.id,
      ip,
      userAgent,
    );

    // Delete the old session
    await this.sessionService.deleteSession(session.id);

    return { access_token, refresh_token };
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
    try {
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token is blacklisted');
      }

      const tokenData = await this.redisService
        .getClient()
        .get(`auth_token:${token}`);
      if (!tokenData) {
        throw new UnauthorizedException('Token not found in Redis');
      }

      // Verify the token
      const decoded = this.jwtService.verify(token);

      return JSON.parse(tokenData);
    } catch (error) {
      if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException('Invalid JWT token: ' + error.message);
      }
      throw error;
    }
  }

  private async clearUserCache(accessToken: string): Promise<void> {
    try {
      if (accessToken) {
        await this.redisService.getClient().del(`auth_token:${accessToken}`);
      }
    } catch (error) {
      console.error('Error clearing user cache:', error);
    }
  }
}
