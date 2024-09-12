import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateResourceDto {
  @ApiProperty({ example: 'users', description: 'The name of the resource' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'User management resource',
    description: 'The description of the resource',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}