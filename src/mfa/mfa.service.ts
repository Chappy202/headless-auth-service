import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';

@Injectable()
export class MfaService {
  async generateSecret(username: string): Promise<{ secret: string; otpAuthUrl: string; qrCodeDataUrl: string }> {
    const secret = authenticator.generateSecret();
    const otpAuthUrl = authenticator.keyuri(username, process.env.MFA_APP_NAME || 'MyAuthApp', secret);
    const qrCodeDataUrl = await qrcode.toDataURL(otpAuthUrl);

    return { secret, otpAuthUrl, qrCodeDataUrl };
  }

  verifyToken(token: string, secret: string): boolean {
    return authenticator.verify({ token, secret });
  }
}