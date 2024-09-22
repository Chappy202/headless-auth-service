import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsArray,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'editor', description: 'The name of the role' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiProperty({
    type: [Number],
    description: 'The IDs of the permissions to assign to the role',
    required: false,
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  permissionIds?: number[];
}

export class UpdateRoleDto {
  @ApiProperty({
    example: 'editor',
    description: 'The updated name of the role',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  name?: string;

  @ApiProperty({
    type: [Number],
    description: 'The IDs of the permissions to assign to the role',
    required: false,
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  permissionIds?: number[];
}

export class RoleResponseDto {
  @ApiProperty({ example: 1, description: 'The unique identifier of the role' })
  id: number;

  @ApiProperty({ example: 'editor', description: 'The name of the role' })
  name: string;
}

export class RoleDetailResponseDto extends RoleResponseDto {
  @ApiProperty({
    type: [Object],
    description: 'The permissions assigned to this role',
  })
  permissions: { id: number; name: string; type: string }[];
}
