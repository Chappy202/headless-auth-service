import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsNumber,
  IsArray,
  Matches,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePermissionDto {
  @ApiProperty({
    example: 'read:users',
    description: 'The name of the permission in format "type:resource"',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(admin|read|write|\*):([a-z0-9-]+|\*)$/, {
    message:
      'Permission name must be in the format "type:resource", e.g., "read:users"',
  })
  name: string;

  @ApiProperty({
    enum: ['admin', 'read', 'write', '*'],
    description: 'The type of the permission',
  })
  @IsString()
  @IsIn(['admin', 'read', 'write', '*'])
  type: 'admin' | 'read' | 'write' | '*';

  @ApiProperty({
    example: 1,
    description: 'The ID of the resource this permission is for',
  })
  @IsNumber()
  @Type(() => Number)
  resourceId: number;
}

export class UpdatePermissionDto {
  @ApiProperty({
    example: 'read:users',
    description: 'The new name of the permission in format "type:resource"',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^(admin|read|write|\*):([a-z0-9-]+|\*)$/, {
    message:
      'Permission name must be in the format "type:resource", e.g., "read:users"',
  })
  name?: string;

  @ApiProperty({
    enum: ['admin', 'read', 'write', '*'],
    description: 'The new type of the permission',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['admin', 'read', 'write', '*'])
  type?: 'admin' | 'read' | 'write' | '*';

  @ApiProperty({
    example: 1,
    description: 'The new ID of the resource this permission is for',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  resourceId?: number;
}

export class AssignPermissionsDto {
  @ApiProperty({
    type: [Number],
    description: 'The IDs of the permissions to assign',
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  permissionIds: number[];
}

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
    example: 1,
    description: 'The ID of the resource this permission is for',
  })
  resourceId: number;
}

export class PermissionDetailResponseDto extends PermissionResponseDto {
  @ApiProperty({
    example: { id: 1, name: 'users', description: 'User management' },
    description: 'The resource details',
  })
  resource: {
    id: number;
    name: string;
    description: string | null;
  };
}

export class AssignmentResponseDto {
  @ApiProperty({ example: 5, description: 'Number of permissions added' })
  added: number;

  @ApiProperty({ example: 2, description: 'Number of permissions ignored' })
  ignored: number;

  @ApiProperty({
    example: '5 added, 2 ignored because already present',
    description: 'Description of the assignment operation',
  })
  description: string;
}
