import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { DrizzleService } from '@/infrastructure/database/drizzle.service';
import { users, sessions } from '@/infrastructure/database/schema';
import { UpdateProfileDto } from '../dto/profile.dto';

@Injectable()
export class UserService {
  constructor(private drizzle: DrizzleService) {}

  async findOne(id: number) {
    const [user] = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateProfile(id: number, updateData: UpdateProfileDto) {
    const updateValues: Partial<typeof users.$inferInsert> = {};

    if (updateData.username) updateValues.username = updateData.username;
    if (updateData.email) {
      updateValues.email = updateData.email;
      updateValues.isEmailVerified = false;
      // TODO: Implement email verification process
    }
    if (updateData.password) {
      updateValues.password = await bcrypt.hash(
        updateData.password,
        process.env.SALT_ROUNDS || 10,
      );
    }
    if (updateData.mfaEnabled !== undefined)
      updateValues.mfaEnabled = updateData.mfaEnabled;
    if (updateData.mfaSecret) updateValues.mfaSecret = updateData.mfaSecret;

    await this.drizzle.db
      .update(users)
      .set(updateValues)
      .where(eq(users.id, id));
    return this.findOne(id);
  }

  async getSessions(userId: number) {
    const userSessions = await this.drizzle.db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, userId));
    return userSessions;
  }
}
