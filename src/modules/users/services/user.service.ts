import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '@/infrastructure/database/drizzle.service';
import { users } from '@/infrastructure/database/schema';
import { eq } from 'drizzle-orm';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UserProfileDto } from '../dto/user-profile.dto';
import { hashPassword } from '@/common/utils/crypto.util';

@Injectable()
export class UserService {
  constructor(private drizzle: DrizzleService) {}

  async findByUsername(
    username: string,
  ): Promise<typeof users.$inferSelect | null> {
    const [user] = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    return user || null;
  }

  async findById(id: number): Promise<typeof users.$inferSelect | null> {
    const [user] = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user || null;
  }

  async getUserProfile(id: number): Promise<UserProfileDto> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapToUserProfileDto(user);
  }

  async updateProfile(
    id: number,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    const updateData: Partial<typeof users.$inferInsert> = {
      ...updateProfileDto,
    };

    if (updateProfileDto.password) {
      updateData.password = await hashPassword(updateProfileDto.password);
    }

    const [updatedUser] = await this.drizzle.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return this.mapToUserProfileDto(updatedUser);
  }

  async create(
    userData: Omit<typeof users.$inferInsert, 'id' | 'createdAt'>,
  ): Promise<typeof users.$inferSelect> {
    const [newUser] = await this.drizzle.db
      .insert(users)
      .values(userData)
      .returning();

    return newUser;
  }

  private mapToUserProfileDto(user: typeof users.$inferSelect): UserProfileDto {
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
