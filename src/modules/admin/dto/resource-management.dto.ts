import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class CreateResourceDto {
  @ApiProperty({
    example: 'users',
    description: 'The name of the resource (will be converted to lowercase)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiProperty({
    example: 'User management resource',
    description: 'The description of the resource',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;
}

export class UpdateResourceDto {
  @ApiProperty({
    example: 'users',
    description:
      'The updated name of the resource (will be converted to lowercase)',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  name?: string;

  @ApiProperty({
    example: 'User management resource',
    description: 'The updated description of the resource',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;
}

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

export class ResourceDetailsResponseDto extends ResourceResponseDto {
  @ApiProperty({
    type: [Object],
    example: [{ id: 1, name: 'read:users', type: 'read' }],
    description: 'The permissions associated with this resource',
  })
  permissions: { id: number; name: string; type: string }[];
}
