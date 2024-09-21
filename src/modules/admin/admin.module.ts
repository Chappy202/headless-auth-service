import { Module } from '@nestjs/common';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admin.service';
import { DrizzleModule } from '@/infrastructure/database/drizzle.module';
import { UserModule } from '@/modules/users/user.module';
import { PermissionsModule } from '@/modules/permissions/permissions.module';
import { ResourcesModule } from '@/modules/resources/resources.module';
import { RolesModule } from '../roles/roles.module';
import { ApiKeyManagementController } from './controllers/api-key-management.controller';
import { ApiKeyManagementService } from './services/api-key-management.service';

@Module({
  imports: [
    DrizzleModule,
    UserModule,
    PermissionsModule,
    ResourcesModule,
    RolesModule,
  ],
  controllers: [AdminController, ApiKeyManagementController],
  providers: [AdminService, ApiKeyManagementService],
})
export class AdminModule {}
