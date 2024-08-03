import { ApiProperty } from '@nestjs/swagger';

class HealthIndicatorResult {
  @ApiProperty({ example: true, description: 'Status of the health indicator' })
  status: string;

  @ApiProperty({
    example: { message: 'Database is healthy' },
    description: 'Additional details about the health indicator',
  })
  details?: Record<string, any>;
}

export class HealthCheckResponseDto {
  @ApiProperty({
    example: 'ok',
    description: 'Overall status of the application',
  })
  status: string;

  @ApiProperty({
    type: () => HealthIndicatorResult,
    required: false,
    description: 'Health check results for various components',
  })
  info?: Record<string, HealthIndicatorResult>;

  @ApiProperty({
    type: () => HealthIndicatorResult,
    required: false,
    description: 'Error details for failed health checks',
  })
  error?: Record<string, HealthIndicatorResult>;

  @ApiProperty({
    example: { uptime: 1234567 },
    description: 'Additional details about the health check',
  })
  details: Record<string, any>;
}
