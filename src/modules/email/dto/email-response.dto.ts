import { ApiProperty } from '@nestjs/swagger';

export class EmailResponseDto {
  @ApiProperty({
    example: true,
    description: 'Indicates whether the email operation was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'Email sent successfully',
    description: 'A message describing the result of the email operation',
  })
  message: string;
}
