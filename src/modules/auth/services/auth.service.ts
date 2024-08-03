import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '@/modules/users/services/user.service';
import { DrizzleService } from '@/infrastructure/database/drizzle.service';
import { comparePassword, hashPassword } from '@/common/utils/crypto.util';
import { RegisterDto } from '../dto/register.dto';
import { blacklistedTokens } from '@/infrastructure/database/schema';
import { eq, lt } from 'drizzle-orm';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private drizzle: DrizzleService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.userService.findByUsername(username);
    if (user && (await comparePassword(pass, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(registerDto: RegisterDto) {
    const hashedPassword = await hashPassword(registerDto.password);
    const user = await this.userService.create({
      ...registerDto,
      password: hashedPassword,
    });

    return this.login(user);
  }

  async logout(token: string) {
    await this.blacklistToken(token);
  }

  private async blacklistToken(token: string) {
    const decoded = this.jwtService.decode(token) as { exp: number };
    const expiresAt = new Date(decoded.exp * 1000);

    await this.drizzle.db.insert(blacklistedTokens).values({
      token,
      expiresAt,
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

  async cleanupExpiredTokens() {
    const now = new Date();
    await this.drizzle.db
      .delete(blacklistedTokens)
      .where(lt(blacklistedTokens.expiresAt, now));
  }
}
