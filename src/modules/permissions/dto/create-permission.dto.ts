import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsIn, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePermissionDto {
  @ApiProperty({
    example: 'read:users',
    description: 'The name of the permission',
  })
  @IsString()
  @IsNotEmpty()
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