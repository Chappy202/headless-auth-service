import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { RequirePermission } from '@/common/decorators/permission.decorator';
import { ApiKeyService } from '../services/api-key.service';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@ApiTags('api-keys')
@Controller('api-keys')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class ApiKeyController {
  constructor(private apiKeyService: ApiKeyService) {}

  @Post()
  @RequirePermission('write:api-keys')
  @ApiOperation({ summary: 'Create a new API key' })
  @ApiResponse({
    status: 201,
    description: 'The API key has been successfully created.',
  })
  async createApiKey(@Body() createApiKeyDto: CreateApiKeyDto) {
    return this.apiKeyService.createApiKey(createApiKeyDto);
  }

  @Get()
  @RequirePermission('read:api-keys')
  @ApiOperation({ summary: 'List all API keys' })
  @ApiResponse({ status: 200, description: 'Returns a list of all API keys.' })
  async listApiKeys() {
    return this.apiKeyService.listApiKeys();
  }

  @Delete(':id')
  @RequirePermission('write:api-keys')
  @ApiOperation({ summary: 'Revoke an API key' })
  @ApiResponse({
    status: 200,
    description: 'The API key has been successfully revoked.',
  })
  async revokeApiKey(@Param('id') id: string) {
    return this.apiKeyService.revokeApiKey(+id);
  }
}
