import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsIn, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePermissionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: ['admin', 'read', 'write', '*'] })
  @IsString()
  @IsIn(['admin', 'read', 'write', '*'])
  type: 'admin' | 'read' | 'write' | '*';

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  resourceId: number;
}
