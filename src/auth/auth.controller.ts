import {
  Controller,
  Post,
  UseGuards,
  Request,
  Body,
  Ip,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ResetPasswordDto } from 'src/admin/dtos/reset-password.dto';
import { RegisterDto } from './dtos/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req, @Ip() ip, @Body('mfaToken') mfaToken?: string) {
    return this.authService.login(req.user, ip, mfaToken);
  }

  @Post('introspect')
  @UseGuards(AuthGuard('api-key'))
  async introspectToken(@Body('token') token: string) {
    return this.authService.introspectToken(token);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(@Request() req) {
    const token = req.headers.authorization.split(' ')[1];
    await this.authService.blacklistToken(token);
    return { message: 'Logged out successfully' };
  }

  @Post('refresh')
  async refreshToken(@Body('token') token: string) {
    if (!token) {
      throw new UnauthorizedException('No refresh token provided');
    }
    return this.authService.refreshToken(token);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('request-password-reset')
  @UseGuards(AuthGuard('jwt'))
  async requestPasswordReset(@Body('email') email: string) {
    return this.authService.requestPasswordReset(email);
  }

  @Post('reset-password')
  @UseGuards(AuthGuard('jwt'))
  async resetPassword(@Request() req, @Body() resetDto: ResetPasswordDto) {
    const token = req.headers.authorization.split(' ')[1];
    return this.authService.resetPassword(token, resetDto.newPassword);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('enable-mfa')
  async enableMfa(@Request() req) {
    return this.authService.enableMfa(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('verify-mfa')
  async verifyAndEnableMfa(@Request() req, @Body('token') token: string) {
    return this.authService.verifyAndEnableMfa(req.user.userId, token);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('disable-mfa')
  async disableMfa(@Request() req) {
    return this.authService.disableMfa(req.user.userId);
  }
}
