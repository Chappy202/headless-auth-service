import * as CryptoJS from 'crypto-js';
import { ConfigService } from '@nestjs/config';

const configService = new ConfigService();
const ENCRYPTION_KEY = configService.get<string>('ENCRYPTION_KEY');

export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

export function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
