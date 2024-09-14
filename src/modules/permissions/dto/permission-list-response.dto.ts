import { ApiProperty } from '@nestjs/swagger';

export class PermissionListResponseDto {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the permission',
  })
  id: number;

  @ApiProperty({
    example: 'read:users',
    description: 'The name of the permission',
  })
  name: string;

  @ApiProperty({
    enum: ['admin', 'read', 'write', '*'],
    description: 'The type of the permission',
  })
  type: 'admin' | 'read' | 'write' | '*';

  @ApiProperty({
    example: 1,
    description: 'The ID of the resource this permission is for',
  })
  resourceId: number | null;
}
