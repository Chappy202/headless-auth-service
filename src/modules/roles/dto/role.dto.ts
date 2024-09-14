import { ApiProperty } from '@nestjs/swagger';

export class RoleDto {
  @ApiProperty({ example: 1, description: 'The unique identifier of the role' })
  id: number;

  @ApiProperty({ example: 'admin', description: 'The name of the role' })
  name: string;
}
