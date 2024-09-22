import {
  Controller,
  Get,
  Post,
  Put,
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
import { ResourceManagementService } from '../services/resource-management.service';
import {
  CreateResourceDto,
  UpdateResourceDto,
  ResourceResponseDto,
  ResourceDetailsResponseDto,
} from '../dto/resource-management.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

@ApiTags('admin/resources')
@Controller('admin/resources')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class ResourceManagementController {
  constructor(
    private readonly resourceManagementService: ResourceManagementService,
  ) {}

  @Post()
  @RequirePermission('write:resources')
  @ApiOperation({ summary: 'Create a new resource' })
  @ApiResponse({ status: 201, type: ResourceResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  @ApiResponse({
    status: 409,
    type: ErrorResponseDto,
    description: 'Resource already exists',
  })
  async createResource(
    @Body() createResourceDto: CreateResourceDto,
  ): Promise<ResourceResponseDto> {
    return this.resourceManagementService.createResource(createResourceDto);
  }

  @Get()
  @RequirePermission('read:resources')
  @ApiOperation({ summary: 'Get all resources' })
  @ApiResponse({ status: 200, type: [ResourceResponseDto] })
  async getAllResources(): Promise<ResourceResponseDto[]> {
    return this.resourceManagementService.getAllResources();
  }

  @Get(':id')
  @RequirePermission('read:resources')
  @ApiOperation({ summary: 'Get resource details' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: ResourceDetailsResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  async getResourceDetails(
    @Param('id') id: string,
  ): Promise<ResourceDetailsResponseDto> {
    return this.resourceManagementService.getResourceDetails(+id);
  }

  @Put(':id')
  @RequirePermission('write:resources')
  @ApiOperation({ summary: 'Update a resource' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: ResourceResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  @ApiResponse({
    status: 409,
    type: ErrorResponseDto,
    description: 'Resource with this name already exists',
  })
  async updateResource(
    @Param('id') id: string,
    @Body() updateResourceDto: UpdateResourceDto,
  ): Promise<ResourceResponseDto> {
    return this.resourceManagementService.updateResource(
      +id,
      updateResourceDto,
    );
  }

  @Delete(':id')
  @RequirePermission('write:resources')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a resource' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 204, description: 'Resource successfully deleted' })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  async deleteResource(@Param('id') id: string): Promise<void> {
    await this.resourceManagementService.deleteResource(+id);
  }
}
