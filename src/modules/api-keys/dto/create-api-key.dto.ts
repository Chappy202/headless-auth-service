import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({
    example: 'My API Key',
    description: 'The name of the API key',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    required: false,
    example: '2023-12-31T23:59:59Z',
    description: 'The expiration date of the API key',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
