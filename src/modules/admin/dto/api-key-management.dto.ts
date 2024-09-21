import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
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
  @MaxLength(255)
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

export class ApiKeyResponseDto {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the API key',
  })
  id: number;

  @ApiProperty({
    example: 'My API Key',
    description: 'The name of the API key',
  })
  name: string;

  @ApiProperty({ example: 'abc123def456', description: 'The API key' })
  key: string;

  @ApiProperty({
    example: '2023-12-31T23:59:59Z',
    description: 'The expiration date of the API key',
    required: false,
  })
  expiresAt: Date | null;

  @ApiProperty({
    example: '2023-01-01T00:00:00Z',
    description: 'The creation date of the API key',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2023-01-02T12:34:56Z',
    description: 'The last used date of the API key',
    required: false,
  })
  lastUsedAt: Date | null;
}
