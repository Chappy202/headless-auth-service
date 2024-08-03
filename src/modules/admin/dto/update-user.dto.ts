import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
  IsBoolean,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    required: false,
    example: 'johndoe',
    description: 'The new username',
  })
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(20)
  username?: string;

  @ApiProperty({
    required: false,
    example: 'john@example.com',
    description: 'The new email',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    required: false,
    example: 'NewPassword123!',
    description: 'The new password',
  })
  @IsString()
  @IsOptional()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password is too weak',
  })
  password?: string;

  @ApiProperty({
    required: false,
    example: true,
    description: 'Whether the email is verified',
  })
  @IsBoolean()
  @IsOptional()
  isEmailVerified?: boolean;

  @ApiProperty({
    required: false,
    example: false,
    description: 'Whether MFA is enabled for the user',
  })
  @IsBoolean()
  @IsOptional()
  mfaEnabled?: boolean;
}
