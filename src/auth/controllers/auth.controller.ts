import {
  Controller,
  Post,
  UseGuards,
  Request,
  Body,
  Ip,
  UnauthorizedException,
  Get,
  Delete,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../services/auth.service';
import { ResetPasswordDto } from 'src/admin/dtos/reset-password.dto';
import { RegisterDto } from '../dtos/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @UseGuards(AuthGuard('local'))
  async login(@Request() req, @Ip() ip, @Body('mfaToken') mfaToken?: string) {
    const userAgent = req.headers['user-agent'];
    return this.authService.login(req.user, ip, userAgent, mfaToken);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(@Request() req) {
    const token = req.headers.authorization.split(' ')[1];
    await this.authService.logout(token);
    return { message: 'Logged out successfully' };
  }

  @Post('refresh')
  async refreshToken(@Body('token') token: string, @Request() req, @Ip() ip) {
    if (!token) {
      throw new UnauthorizedException('No refresh token provided');
    }
    const userAgent = req.headers['user-agent'];
    return this.authService.refreshToken(token, userAgent, ip);
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

  @Get('sessions')
  @UseGuards(AuthGuard('jwt'))
  async getUserSessions(@Request() req) {
    return this.authService.getUserSessions(req.user.id);
  }

  @Delete('sessions/:id')
  @UseGuards(AuthGuard('jwt'))
  async revokeSession(@Request() req, @Param('id') sessionId: number) {
    await this.authService.revokeSession(sessionId);
    return { message: 'Session revoked successfully' };
  }

  @Delete('sessions')
  @UseGuards(AuthGuard('jwt'))
  async revokeAllSessions(@Request() req) {
    await this.authService.revokeAllUserSessions(req.user.id);
    return { message: 'All sessions revoked successfully' };
  }
}