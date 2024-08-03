import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 1, description: 'The unique identifier of the user' })
  id: number;

  @ApiProperty({ example: 'johndoe', description: 'The username of the user' })
  username: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'The email of the user',
  })
  email: string;

  @ApiProperty({ example: true, description: 'Whether the email is verified' })
  isEmailVerified: boolean;

  @ApiProperty({
    example: '2023-01-01T00:00:00Z',
    description: 'The date and time when the user was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: false,
    description: 'Whether Multi-Factor Authentication is enabled for the user',
  })
  mfaEnabled: boolean;
}
