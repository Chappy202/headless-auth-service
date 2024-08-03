import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 400, description: 'The error status code' })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request', description: 'The error message' })
  message: string;

  @ApiProperty({ example: 'VALIDATION_ERROR', description: 'The error code' })
  error: string;
}
