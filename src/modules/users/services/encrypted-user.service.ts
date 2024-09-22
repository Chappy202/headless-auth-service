import { Injectable } from '@nestjs/common';
import { UserService } from './user.service';
import { encrypt, decrypt } from '@/common/utils/encryption.util';
import { users } from '@/infrastructure/database/schema';
import { UserDto } from '../dto/user.dto';

@Injectable()
export class EncryptedUserService {
  constructor(private userService: UserService) {}

  async create(userData: Omit<UserDto, 'id' | 'createdAt'>) {
    const encryptedData = {
      ...userData,
      email: encrypt(userData.email),
      isEmailVerified: userData.isEmailVerified || false,
      mfaEnabled: userData.mfaEnabled || false,
      mfaSecret: userData.mfaSecret || null,
      isDisabled: userData.isDisabled || false,
      emailVerificationToken: userData.emailVerificationToken || null,
    };
    return this.userService.create(encryptedData);
  }

  async findByUsername(username: string) {
    const user = await this.userService.findByUsername(username);
    if (user && user.email) {
      user.email = decrypt(user.email);
    }
    return user;
  }

  async findById(id: number) {
    const user = await this.userService.findById(id);
    if (user && user.email) {
      user.email = decrypt(user.email);
    }
    return user;
  }
}
