import * as argon2 from 'argon2';
import * as crypto from 'crypto';

export const hashPassword = async (password: string): Promise<string> => {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456, // 19 MiB
    timeCost: 2,
    parallelism: 1,
  });
};

export const comparePassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  return argon2.verify(hash, password);
};

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}
