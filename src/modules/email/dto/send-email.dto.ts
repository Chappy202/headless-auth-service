import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class SendEmailDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The recipient email address',
  })
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @ApiProperty({
    example: 'Welcome to our platform',
    description: 'The subject of the email',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    example: 'Hello! Welcome to our platform. We hope you enjoy your stay.',
    description: 'The content of the email',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
