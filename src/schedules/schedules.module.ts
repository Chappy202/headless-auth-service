import { Module } from '@nestjs/common';
import { CleanupService } from './services/cleanup.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  providers: [CleanupService],
  imports: [AuthModule],
})
export class SchedulesModule {}
