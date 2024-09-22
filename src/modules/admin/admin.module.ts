import { Module } from '@nestjs/common';
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
import { UserManagementController } from './controllers/user-management.controller';
import { UserManagementService } from './services/user-management.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [DrizzleModule, UserModule, AuthModule, EmailModule],
  controllers: [
    ApiKeyManagementController,
    PermissionManagementController,
    ResourceManagementController,
    RoleManagementController,
    UserManagementController,
  ],
  providers: [
    ApiKeyManagementService,
    PermissionManagementService,
    ResourceManagementService,
    RoleManagementService,
    UserManagementService,
  ],
})
export class AdminModule {}
