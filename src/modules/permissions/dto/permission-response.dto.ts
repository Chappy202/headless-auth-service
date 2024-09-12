import { ResourceResponseDto } from '@/modules/resources/dto/resource-response.dto';
import { ApiProperty } from '@nestjs/swagger';

export class PermissionResponseDto {
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
    type: ResourceResponseDto,
    description: 'The resource associated with this permission',
  })
  resource: ResourceResponseDto;
}
