import { ApiProperty } from '@nestjs/swagger';

export class RolesResponseDto {
  @ApiProperty({ example: 1, description: 'The unique identifier of the role' })
  id: number;

  @ApiProperty({ example: 'editor', description: 'The name of the role' })
  name: string;
}
