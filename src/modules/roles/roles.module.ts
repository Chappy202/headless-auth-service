import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/infrastructure/database/drizzle.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { RolesController } from './controllers/roles.controller';
import { RolesService } from './services/roles.service';

@Module({
  imports: [DrizzleModule, PermissionsModule],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
