import { Module } from '@nestjs/common';
import { ApiKeyController } from './controllers/api-key.controller';
import { ApiKeyService } from './services/api-key.service';
import { DrizzleModule } from '@/infrastructure/database/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [ApiKeyController],
  providers: [ApiKeyService],
  exports: [ApiKeyService],
})
export class ApiKeysModule {}
