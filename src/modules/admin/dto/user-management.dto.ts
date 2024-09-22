import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsArray,
  IsNumber,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'johndoe', description: 'The username of the user' })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  username: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'The email of the user',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'The password of the user',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password is too weak',
  })
  password: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether to verify the email on creation',
  })
  @IsBoolean()
  @IsOptional()
  verifyEmail?: boolean;

  @ApiPropertyOptional({
    type: [Number],
    description: 'The IDs of the roles to assign to the user',
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  roleIds?: number[];

  @ApiPropertyOptional({
    type: [Number],
    description: 'The IDs of the permissions to assign to the user',
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  permissionIds?: number[];
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'johndoe', description: 'The new username' })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({
    example: 'john@example.com',
    description: 'The new email',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: 'Password123!',
    description: 'The new password',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password is too weak',
  })
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether MFA is enabled for the user',
  })
  @IsBoolean()
  @IsOptional()
  mfaEnabled?: boolean;

  @ApiPropertyOptional({
    type: [Number],
    description: 'The IDs of the roles to assign to the user',
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  roleIds?: number[];

  @ApiPropertyOptional({
    type: [Number],
    description: 'The IDs of the permissions to assign to the user',
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  permissionIds?: number[];

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the user account is disabled',
  })
  @IsBoolean()
  @IsOptional()
  isDisabled?: boolean;
}

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

  @ApiProperty({
    type: [Object],
    description: 'The roles assigned to the user',
  })
  roles: { id: number; name: string }[];

  @ApiProperty({
    type: [Object],
    description: 'The permissions assigned to the user',
  })
  permissions: { id: number; name: string }[];

  @ApiProperty({
    example: false,
    description: 'Whether the user account is disabled',
  })
  isDisabled: boolean;
}

export class UserDetailsResponseDto extends UserResponseDto {
  @ApiProperty({
    type: [Object],
    description: 'The latest sessions of the user',
  })
  latestSessions: {
    id: number;
    createdAt: Date;
    lastUsedAt: Date;
    userAgent: string;
    ipAddress: string;
  }[];

  @ApiProperty({
    type: [Object],
    description: 'The latest login history of the user',
  })
  latestLoginHistory: {
    id: number;
    createdAt: Date;
    ip: string;
    location: string;
    userAgent: string;
  }[];
}

export class PaginatedUsersResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  users: UserResponseDto[];

  @ApiProperty({ example: 100, description: 'Total number of users' })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 10, description: 'Number of users per page' })
  limit: number;
}
