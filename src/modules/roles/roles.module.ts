import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [ConfigModule, PermissionsModule],
})
export class RolesModule {}
