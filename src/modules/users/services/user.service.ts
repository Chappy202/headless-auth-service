import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@/infrastructure/database/drizzle.service';
import { users } from '@/infrastructure/database/schema';
import { eq } from 'drizzle-orm';
import { encrypt, decrypt } from '@/common/utils/encryption.util';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UserProfileDto } from '../dto/user-profile.dto';
import { UserDto } from '../dto/user.dto';

@Injectable()
export class UserService {
  constructor(private drizzle: DrizzleService) {}

  private async findUser(
    where: any,
    includePassword: boolean = false,
  ): Promise<UserDto | null> {
    const query = this.drizzle.db.select().from(users).where(where).limit(1);

    const [rawUser] = await query;

    if (!rawUser) {
      return null;
    }

    const user: UserDto = {
      id: rawUser.id,
      username: rawUser.username,
      email: rawUser.email ? decrypt(rawUser.email) : '',
      isEmailVerified: rawUser.isEmailVerified,
      createdAt: rawUser.createdAt,
      mfaEnabled: rawUser.mfaEnabled,
      mfaSecret: rawUser.mfaSecret,
      isDisabled: rawUser.isDisabled,
      emailVerificationToken: rawUser.emailVerificationToken,
    };

    if (includePassword) {
      user.password = rawUser.password;
    }

    return user;
  }

  async findByUsername(
    username: string,
    includePassword: boolean = false,
  ): Promise<UserDto | null> {
    return this.findUser(eq(users.username, username), includePassword);
  }

  async findByEmail(email: string): Promise<UserDto | null> {
    const encryptedEmail = encrypt(email);
    return this.findUser(eq(users.email, encryptedEmail));
  }

  async findById(id: number): Promise<UserDto | null> {
    return this.findUser(eq(users.id, id));
  }

  async create(userData: Omit<UserDto, 'id' | 'createdAt'>): Promise<UserDto> {
    const dataToInsert: typeof users.$inferInsert = {
      username: userData.username,
      email: userData.email ? encrypt(userData.email) : null,
      password: userData.password,
      isEmailVerified: userData.isEmailVerified,
      mfaEnabled: userData.mfaEnabled,
      mfaSecret: userData.mfaSecret || null,
      isDisabled: userData.isDisabled,
      emailVerificationToken: userData.emailVerificationToken || null,
    };

    const [newUser] = await this.drizzle.db
      .insert(users)
      .values(dataToInsert)
      .returning();

    return this.findById(newUser.id) as Promise<UserDto>;
  }

  async setEmailVerificationToken(
    userId: number,
    token: string,
  ): Promise<void> {
    await this.drizzle.db
      .update(users)
      .set({ emailVerificationToken: token })
      .where(eq(users.id, userId));
  }

  async getUserProfile(userId: number): Promise<UserProfileDto> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return this.mapToUserProfileDto(user);
  }

  async updateProfile(
    userId: number,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    const updateData: Partial<typeof users.$inferInsert> = {
      ...updateProfileDto,
    };

    if (updateProfileDto.email) {
      updateData.email = encrypt(updateProfileDto.email);
    }

    await this.drizzle.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId));

    const updatedUser = await this.findById(userId);
    if (!updatedUser) {
      throw new Error('User not found');
    }

    return this.mapToUserProfileDto(updatedUser);
  }

  private mapToUserProfileDto(user: UserDto): UserProfileDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      mfaEnabled: user.mfaEnabled,
    };
  }
}
