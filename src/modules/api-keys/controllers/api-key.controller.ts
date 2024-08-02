import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { ApiKeyService } from '../services/api-key.service';

@ApiTags('api-keys')
@Controller('api-keys')
@UseGuards(AuthGuard('jwt'))
export class ApiKeyController {
  constructor(private apiKeyService: ApiKeyService) {}

  @Post()
  async createApiKey(@Body() body: { name: string; expiresAt?: string }) {
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;
    return this.apiKeyService.createApiKey(body.name, expiresAt);
  }

  @Get()
  async listApiKeys() {
    return this.apiKeyService.listApiKeys();
  }

  @Delete(':id')
  async revokeApiKey(@Param('id') id: number) {
    await this.apiKeyService.revokeApiKey(id);
    return { message: 'API key revoked successfully' };
  }
}
