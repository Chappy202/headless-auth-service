import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
import { DrizzleModule } from 'src/infrastructure/database/drizzle.module';
import { UserService } from './services/user.service';

@Module({
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
  imports: [DrizzleModule],
})
export class UserModule {}
