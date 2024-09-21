import { Module } from '@nestjs/common';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admin.service';
import { DrizzleModule } from '@/infrastructure/database/drizzle.module';
import { UserModule } from '@/modules/users/user.module';
import { ResourcesModule } from '@/modules/resources/resources.module';
import { RolesModule } from '../roles/roles.module';
import { ApiKeyManagementController } from './controllers/api-key-management.controller';
import { ApiKeyManagementService } from './services/api-key-management.service';
import { PermissionManagementService } from './services/permission-management.service';
import { PermissionManagementController } from './controllers/permission-management.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    DrizzleModule,
    UserModule,
    ResourcesModule,
    RolesModule,
    AuthModule,
  ],
  controllers: [
    AdminController,
    ApiKeyManagementController,
    PermissionManagementController,
  ],
  providers: [
    AdminService,
    ApiKeyManagementService,
    PermissionManagementService,
  ],
})
export class AdminModule {}
