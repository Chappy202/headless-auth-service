import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { RequirePermission } from '@/common/decorators/permission.decorator';
import { ApiKeyManagementService } from '../services/api-key-management.service';
import {
  CreateApiKeyDto,
  ApiKeyResponseDto,
} from '../dto/api-key-management.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

@ApiTags('admin/api-keys')
@Controller('admin/api-keys')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class ApiKeyManagementController {
  constructor(
    private readonly apiKeyManagementService: ApiKeyManagementService,
  ) {}

  @Post()
  @RequirePermission('write:api-keys')
  @ApiOperation({ summary: 'Create a new API key' })
  @ApiResponse({
    status: 201,
    description: 'The API key has been successfully created.',
    type: ApiKeyResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
    type: ErrorResponseDto,
  })
  async createApiKey(
    @Body() createApiKeyDto: CreateApiKeyDto,
  ): Promise<ApiKeyResponseDto> {
    return this.apiKeyManagementService.createApiKey(createApiKeyDto);
  }

  @Get()
  @RequirePermission('read:api-keys')
  @ApiOperation({ summary: 'Get all API keys' })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of all API keys.',
    type: [ApiKeyResponseDto],
  })
  async getAllApiKeys(): Promise<ApiKeyResponseDto[]> {
    return this.apiKeyManagementService.getAllApiKeys();
  }

  @Delete(':id')
  @RequirePermission('write:api-keys')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an API key' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'The ID of the API key to delete',
  })
  @ApiResponse({
    status: 200,
    description: 'The API key has been successfully deleted.',
    type: ApiKeyResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'API key not found',
    type: ErrorResponseDto,
  })
  async deleteApiKey(@Param('id') id: string): Promise<ApiKeyResponseDto> {
    return this.apiKeyManagementService.deleteApiKey(+id);
  }
}
