import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'editor', description: 'The name of the role' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;
}
