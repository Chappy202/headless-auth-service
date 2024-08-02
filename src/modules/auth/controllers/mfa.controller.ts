import { Controller, Post, UseGuards, Request, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MfaService } from '../services/mfa.service';

@ApiTags('mfa')
@ApiBearerAuth()
@Controller('auth')
@UseGuards(AuthGuard('jwt'))
export class MFAController {
  constructor(private mfaAuthService: MfaService) {}

  @Post('enable-mfa')
  async enableMfa(@Request() req) {
    return this.mfaAuthService.enableMfa(req.user.userId);
  }

  @Post('verify-mfa')
  async verifyAndEnableMfa(@Request() req, @Body('token') token: string) {
    return this.mfaAuthService.verifyAndEnableMfa(req.user.userId, token);
  }

  @Post('disable-mfa')
  async disableMfa(@Request() req) {
    return this.mfaAuthService.disableMfa(req.user.userId);
  }
}
