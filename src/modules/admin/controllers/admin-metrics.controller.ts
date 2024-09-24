import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { RequirePermission } from '@/common/decorators/permission.decorator';
import { AdminMetricsResponseDto } from '../dto/admin-metrics.dto';
import { AdminMetricsService } from '../services/admin-metrics.service';

@ApiTags('admin/metrics')
@Controller('admin/metrics')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class AdminMetricsController {
  constructor(private readonly adminMetricsService: AdminMetricsService) {}

  @Get()
  @RequirePermission('read:admin-metrics')
  @ApiOperation({ summary: 'Get admin metrics and usage stats' })
  @ApiResponse({
    status: 200,
    description: 'Admin metrics and usage stats retrieved successfully.',
    type: AdminMetricsResponseDto,
  })
  async getAdminMetrics(): Promise<AdminMetricsResponseDto> {
    return this.adminMetricsService.getAdminMetrics();
  }
}
