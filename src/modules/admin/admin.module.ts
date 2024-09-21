import { Module } from '@nestjs/common';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admin.service';
import { DrizzleModule } from '@/infrastructure/database/drizzle.module';
import { UserModule } from '@/modules/users/user.module';
import { RolesModule } from '../roles/roles.module';
import { ApiKeyManagementController } from './controllers/api-key-management.controller';
import { ApiKeyManagementService } from './services/api-key-management.service';
import { PermissionManagementService } from './services/permission-management.service';
import { PermissionManagementController } from './controllers/permission-management.controller';
import { AuthModule } from '../auth/auth.module';
import { ResourceManagementController } from './controllers/resource-management.controller';
import { ResourceManagementService } from './services/resource-management.service';

@Module({
  imports: [DrizzleModule, UserModule, RolesModule, AuthModule],
  controllers: [
    AdminController,
    ApiKeyManagementController,
    PermissionManagementController,
    ResourceManagementController,
  ],
  providers: [
    AdminService,
    ApiKeyManagementService,
    PermissionManagementService,
    ResourceManagementService,
  ],
})
export class AdminModule {}
