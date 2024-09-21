import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { DrizzleModule } from '@/infrastructure/database/drizzle.module';
import { EncryptedUserService } from './services/encrypted-user.service';

@Module({
  imports: [DrizzleModule],
  providers: [UserService, EncryptedUserService],
  controllers: [UserController],
  exports: [UserService, EncryptedUserService],
})
export class UserModule {}
