import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '@/infrastructure/database/drizzle.service';
import { users } from '@/infrastructure/database/schema';
import { eq } from 'drizzle-orm';
import { UpdateProfileDto } from '../dto/update-profile.dto';

@Injectable()
export class UserService {
  constructor(private drizzle: DrizzleService) {}

  async findByUsername(username: string) {
    const [user] = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findById(id: number) {
    const [user] = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(id: number, updateProfileDto: UpdateProfileDto) {
    const [updatedUser] = await this.drizzle.db
      .update(users)
      .set(updateProfileDto)
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  // This method is used by the AuthService for user creation
  async create(
    userData: Omit<typeof users.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>,
  ) {
    const [newUser] = await this.drizzle.db
      .insert(users)
      .values(userData)
      .returning();

    return newUser;
  }
}
