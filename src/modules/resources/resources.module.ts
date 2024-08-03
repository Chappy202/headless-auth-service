import { Module } from '@nestjs/common';
import { ResourcesService } from './services/resources.service';
import { ResourcesController } from './controllers/resources.controller';
import { DrizzleModule } from '@/infrastructure/database/drizzle.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [DrizzleModule, PermissionsModule],
  providers: [ResourcesService],
  controllers: [ResourcesController],
  exports: [ResourcesService],
})
export class ResourcesModule {}
