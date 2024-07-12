import { Module } from '@nestjs/common';
import { AuthService } from 'src/auth/services/auth.service';
import { CleanupService } from './services/cleanup.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  providers: [AuthService, CleanupService],
  imports: [ScheduleModule.forRoot()],
})
export class SchedulesModule {}
