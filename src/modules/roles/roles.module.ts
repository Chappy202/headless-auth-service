import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/infrastructure/database/drizzle.module';
import { RolesController } from './controllers/roles.controller';
import { RolesService } from './services/roles.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DrizzleModule, AuthModule],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
