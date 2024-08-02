import { DrizzleModule } from '@/infrastructure/database/drizzle.module';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PermissionService } from '../auth/services/permission.service';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admin.service';

@Module({
  imports: [DrizzleModule, AuthModule],
  providers: [AdminService, PermissionService],
  controllers: [AdminController],
})
export class AdminModule {}
