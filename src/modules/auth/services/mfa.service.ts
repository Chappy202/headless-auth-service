import { DrizzleService } from '@/infrastructure/database/drizzle.service';
import { users } from '@/infrastructure/database/schema';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';

@Injectable()
export class MfaService {
  constructor(private drizzle: DrizzleService) {}

  async generateSecret(
    username: string,
  ): Promise<{ secret: string; otpAuthUrl: string; qrCodeDataUrl: string }> {
    const secret = authenticator.generateSecret();
    const otpAuthUrl = authenticator.keyuri(
      username,
      process.env.MFA_APP_NAME || 'MyAuthApp',
      secret,
    );
    const qrCodeDataUrl = await qrcode.toDataURL(otpAuthUrl);

    return { secret, otpAuthUrl, qrCodeDataUrl };
  }

  verifyToken(token: string, secret: string): boolean {
    return authenticator.verify({ token, secret });
  }

  async enableMfa(userId: number) {
    const [user] = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const { secret, otpAuthUrl, qrCodeDataUrl } = await this.generateSecret(
      user.username,
    );

    await this.drizzle.db
      .update(users)
      .set({ mfaSecret: secret })
      .where(eq(users.id, userId));

    return { otpAuthUrl, qrCodeDataUrl };
  }

  async verifyAndEnableMfa(userId: number, token: string) {
    const [user] = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const isValidToken = this.verifyToken(token, user.mfaSecret);
    if (!isValidToken) {
      throw new UnauthorizedException('Invalid MFA token');
    }

    await this.drizzle.db
      .update(users)
      .set({ mfaEnabled: true })
      .where(eq(users.id, userId));

    return { message: 'MFA enabled successfully' };
  }

  async disableMfa(userId: number) {
    await this.drizzle.db
      .update(users)
      .set({ mfaEnabled: false, mfaSecret: null })
      .where(eq(users.id, userId));

    return { message: 'MFA disabled successfully' };
  }
}
