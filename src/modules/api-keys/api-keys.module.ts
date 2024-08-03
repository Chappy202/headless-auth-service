import { Module } from '@nestjs/common';
import { ApiKeyService } from './services/api-key.service';
import { ApiKeyController } from './controllers/api-key.controller';
import { DrizzleModule } from '@/infrastructure/database/drizzle.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [DrizzleModule, PermissionsModule],
  providers: [ApiKeyService],
  controllers: [ApiKeyController],
  exports: [ApiKeyService],
})
export class ApiKeysModule {}
