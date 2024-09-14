import { Module } from '@nestjs/common';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admin.service';
import { DrizzleModule } from '@/infrastructure/database/drizzle.module';
import { UserModule } from '@/modules/users/user.module';
import { PermissionsModule } from '@/modules/permissions/permissions.module';
import { ResourcesModule } from '@/modules/resources/resources.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    DrizzleModule,
    UserModule,
    PermissionsModule,
    ResourcesModule,
    RolesModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
