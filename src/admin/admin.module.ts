import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { AuthModule } from 'src/auth/auth.module';
import { PermissionService } from 'src/auth/services/permission.service';

@Module({
  imports: [DrizzleModule, AuthModule],
  providers: [AdminService, PermissionService],
  controllers: [AdminController],
})
export class AdminModule {}
