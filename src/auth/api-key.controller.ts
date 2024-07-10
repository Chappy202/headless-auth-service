// api-key.controller.ts
import { Controller, Post, Get, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('api-keys')
@UseGuards(AuthGuard('jwt')) // Ensure only authenticated users can manage API keys
export class ApiKeyController {
  constructor(private authService: AuthService) {}

  @Post()
  async createApiKey(@Body() body: { name: string; expiresAt?: string }) {
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;
    return this.authService.createApiKey(body.name, expiresAt);
  }

  @Get()
  async listApiKeys() {
    return this.authService.listApiKeys();
  }

  @Delete(':id')
  async revokeApiKey(@Param('id') id: number) {
    await this.authService.revokeApiKey(id);
    return { message: 'API key revoked successfully' };
  }
}