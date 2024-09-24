import {
  Controller,
  Post,
  UseGuards,
  Body,
  HttpCode,
  HttpStatus,
  ConflictException,
  Req,
  Ip,
  BadRequestException,
  Get,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiConsumes,
  ApiProduces,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { RequireFeature } from '@/common/decorators/feature-toggle.decorator';
import { FeatureToggle } from '@/common/enums/feature-toggles.enum';
import { FeatureToggleGuard } from '@/common/guards/feature-toggle.guard';
import { getClientIp } from '@/common/utils/ip.util';
import { RefreshTokenResponseDto } from '../dto/refresh-token-response.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { UserProfileDto } from '@/modules/users/dto/user-profile.dto';
import { UserService } from '@/modules/users/services/user.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Ip() ip: string,
  ): Promise<LoginResponseDto> {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const clientIp = getClientIp(ip);
    return this.authService.login(loginDto, clientIp, userAgent);
  }

  @Post('register')
  @RequireFeature(FeatureToggle.REGISTRATION)
  @UseGuards(FeatureToggleGuard)
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 202,
    description: 'Registration successful, email verification required',
    schema: { properties: { message: { type: 'string' } } },
  })
  @ApiResponse({
    status: 403,
    description: 'Registration is disabled',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Username or email already exists',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
    type: ErrorResponseDto,
  })
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: Request,
    @Ip() ip: string,
  ): Promise<LoginResponseDto | { message: string }> {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const clientIp = getClientIp(ip);
    return this.authService.register(registerDto, clientIp, userAgent);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Refresh token is required',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'JWT token',
    required: true,
    schema: {
      type: 'string',
      example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: { type: 'string' },
      },
      required: ['refreshToken'],
    },
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  async logout(
    @Req() req: Request,
    @Body('refreshToken') refreshToken: string,
  ) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }
    const accessToken = req.headers.authorization.split(' ')[1];
    await this.authService.logout(accessToken, refreshToken);
    return { message: 'Logged out successfully' };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'New access and refresh tokens',
    type: RefreshTokenResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User account is disabled',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Invalid refresh token or user not found',
    type: ErrorResponseDto,
  })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<RefreshTokenResponseDto> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully.',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getCurrentUser(@Req() req: Request): Promise<UserProfileDto> {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const tokenData = await this.authService.validateToken(token);
      return this.userService.getUserProfile(tokenData.userId);
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      throw error;
    }
  }
}
