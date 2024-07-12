import { Controller, Post, UseGuards, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BackendAuthService } from '../services/backend-auth.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('backend-auth')
@Controller('auth')
@UseGuards(AuthGuard('api-key'))
export class BackendAuthController {
  constructor(private backendAuthService: BackendAuthService) {}

  @Post('introspect')
  async introspectToken(@Body('token') token: string) {
    return this.backendAuthService.introspectToken(token);
  }
}
