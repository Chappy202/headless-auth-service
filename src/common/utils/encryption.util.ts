import * as CryptoJS from 'crypto-js';
import { ConfigService } from '@nestjs/config';

let ENCRYPTION_KEY: string;

export function initializeEncryption(configService: ConfigService) {
  ENCRYPTION_KEY = configService.get<string>('ENCRYPTION_KEY');
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is not set in the environment variables');
  }
}

export function encrypt(text: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('Encryption has not been initialized');
  }
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

export function decrypt(ciphertext: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('Encryption has not been initialized');
  }
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
