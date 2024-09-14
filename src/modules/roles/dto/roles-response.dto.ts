import { ApiProperty } from '@nestjs/swagger';
import { PermissionListResponseDto } from '@/modules/permissions/dto/permission-list-response.dto';

export class RolesResponseDto {
  @ApiProperty({ example: 1, description: 'The unique identifier of the role' })
  id: number;

  @ApiProperty({ example: 'editor', description: 'The name of the role' })
  name: string;

  @ApiProperty({
    type: [PermissionListResponseDto],
    description: 'The permissions assigned to the role',
  })
  permissions?: PermissionListResponseDto[];
}
