import { AuthGuard } from '@nestjs/passport';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BackendAuthService } from '../services/backend-auth.service';

@Controller('api-keys')
@UseGuards(AuthGuard('jwt'))
export class ApiKeyController {
  constructor(private backendAuthService: BackendAuthService) {}

  @Post()
  async createApiKey(@Body() body: { name: string; expiresAt?: string }) {
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;
    return this.backendAuthService.createApiKey(body.name, expiresAt);
  }

  @Get()
  async listApiKeys() {
    return this.backendAuthService.listApiKeys();
  }

  @Delete(':id')
  async revokeApiKey(@Param('id') id: number) {
    await this.backendAuthService.revokeApiKey(id);
    return { message: 'API key revoked successfully' };
  }
}
