import { ApiProperty } from '@nestjs/swagger';

export class ResourceResponseDto {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the resource',
  })
  id: number;

  @ApiProperty({ example: 'users', description: 'The name of the resource' })
  name: string;

  @ApiProperty({
    example: 'User management resource',
    description: 'The description of the resource',
  })
  description: string | null;
}
