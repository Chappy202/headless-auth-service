import { Module } from '@nestjs/common';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admin.service';
import { DrizzleModule } from '@/infrastructure/database/drizzle.module';
import { UserModule } from '@/modules/users/user.module';
import { ApiKeyManagementController } from './controllers/api-key-management.controller';
import { ApiKeyManagementService } from './services/api-key-management.service';
import { PermissionManagementService } from './services/permission-management.service';
import { PermissionManagementController } from './controllers/permission-management.controller';
import { AuthModule } from '../auth/auth.module';
import { ResourceManagementController } from './controllers/resource-management.controller';
import { ResourceManagementService } from './services/resource-management.service';
import { RoleManagementController } from './controllers/role-management.controller';
import { RoleManagementService } from './services/role-management.service';

@Module({
  imports: [DrizzleModule, UserModule, AuthModule],
  controllers: [
    AdminController,
    ApiKeyManagementController,
    PermissionManagementController,
    ResourceManagementController,
    RoleManagementController,
  ],
  providers: [
    AdminService,
    ApiKeyManagementService,
    PermissionManagementService,
    ResourceManagementService,
    RoleManagementService,
  ],
})
export class AdminModule {}
