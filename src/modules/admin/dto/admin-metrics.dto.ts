import { ApiProperty } from '@nestjs/swagger';

export class AdminMetricsResponseDto {
  @ApiProperty({ example: 1000, description: 'Total number of users' })
  userCount: number;

  @ApiProperty({ example: 50, description: 'Total number of permissions' })
  permissionCount: number;

  @ApiProperty({ example: 10, description: 'Total number of roles' })
  roleCount: number;

  @ApiProperty({ example: 20, description: 'Total number of resources' })
  resourceCount: number;

  @ApiProperty({ example: 100, description: 'Number of logins today' })
  dailyLogins: number;

  @ApiProperty({ example: 500, description: 'Number of logins this week' })
  weeklyLogins: number;

  @ApiProperty({ example: 2000, description: 'Number of logins this month' })
  monthlyLogins: number;

  @ApiProperty({
    example: 150,
    description: 'Number of currently active sessions',
  })
  activeSessions: number;
}
