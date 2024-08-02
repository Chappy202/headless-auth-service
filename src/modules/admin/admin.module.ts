import { Module } from '@nestjs/common';
import { AdminService } from './services/admin.service';
import { AdminController } from './controllers/admin.controller';
import { DrizzleModule } from 'src/infrastructure/database/drizzle.module';
import { AuthModule } from '../auth/auth.module';
import { PermissionService } from '../auth/services/permission.service';

@Module({
  imports: [DrizzleModule, AuthModule],
  providers: [AdminService, PermissionService],
  controllers: [AdminController],
})
export class AdminModule {}
