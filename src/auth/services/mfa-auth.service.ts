import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { MfaService } from 'src/mfa/mfa.service';

@Injectable()
export class MFAAuthService {
  constructor(
    private drizzle: DrizzleService,
    private mfaService: MfaService,
  ) {}

  async enableMfa(userId: number) {
    const [user] = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const { secret, otpAuthUrl, qrCodeDataUrl } =
      await this.mfaService.generateSecret(user.username);

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

    const isValidToken = this.mfaService.verifyToken(token, user.mfaSecret);
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
