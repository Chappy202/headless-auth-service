import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '@/modules/users/services/user.service';
import { DrizzleService } from '@/infrastructure/database/drizzle.service';
import { RedisService } from '@/infrastructure/cache/redis.service';
import { comparePassword, hashPassword } from '@/common/utils/crypto.util';
import { LoginDto } from '../dto/login.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { RegisterDto } from '../dto/register.dto';
import { users, userRoles, roles } from '@/infrastructure/database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private drizzle: DrizzleService,
    private redisService: RedisService,
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

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.userService.findByUsername(username);
    if (user && (await comparePassword(pass, user.password))) {
      return this.userService.findByIdSecure(user.id);
    }
    return null;
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const access_token = await this.generateToken(user);
    return { access_token };
  }

  async register(registerDto: RegisterDto): Promise<LoginResponseDto> {
    try {
      const hashedPassword = await hashPassword(registerDto.password);

      const user = await this.drizzle.db.transaction(async (tx) => {
        const [newUser] = await tx
          .insert(users)
          .values({
            ...registerDto,
            password: hashedPassword,
          })
          .returning();

        const [defaultRole] = await tx
          .select()
          .from(roles)
          .where(eq(roles.name, 'user'))
          .limit(1);

        if (!defaultRole) {
          throw new Error('Default role not found');
        }

        await tx.insert(userRoles).values({
          userId: newUser.id,
          roleId: defaultRole.id,
        });

        return newUser;
      });

      const access_token = await this.generateToken(user);
      return { access_token };
    } catch (error) {
      if (error.code === '23505') {
        // PostgreSQL unique constraint violation code
        throw new ConflictException('Username or email already exists');
      }
      throw new InternalServerErrorException(
        'An error occurred while registering the user',
      );
    }
  }

  async logout(token: string): Promise<void> {
    await this.blacklistToken(token);
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
}
