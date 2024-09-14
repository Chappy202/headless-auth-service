import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiConsumes,
  ApiProduces,
} from '@nestjs/swagger';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { RequirePermission } from '@/common/decorators/permission.decorator';
import { ResourcesService } from '../services/resources.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CreateResourceDto } from '../dto/create-resource.dto';
import { ResourceResponseDto } from '../dto/resource-response.dto';
import { PermissionResponseDto } from '@/modules/permissions/dto/permission-response.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { PermissionListResponseDto } from '@/modules/permissions/dto/permission-list-response.dto';

@ApiTags('resources')
@Controller('resources')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  @RequirePermission('write:resources')
  @ApiOperation({ summary: 'Create a new resource' })
  @ApiResponse({
    status: 201,
    description: 'The resource has been successfully created.',
    type: ResourceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
    type: ErrorResponseDto,
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'JWT token',
    required: true,
    schema: {
      type: 'string',
      example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  async create(
    @Body() createResourceDto: CreateResourceDto,
  ): Promise<ResourceResponseDto> {
    return this.resourcesService.createResource(createResourceDto);
  }

  @Get()
  @RequirePermission('read:resources')
  @ApiOperation({ summary: 'Get all resources' })
  @ApiResponse({
    status: 200,
    description: 'Return all resources.',
    type: [ResourceResponseDto],
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'JWT token',
    required: true,
    schema: {
      type: 'string',
      example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
  })
  @ApiProduces('application/json')
  async findAll(): Promise<ResourceResponseDto[]> {
    return this.resourcesService.getResources();
  }

  @Get(':id')
  @RequirePermission('read:resources')
  @ApiOperation({ summary: 'Get a resource by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the resource.',
    type: ResourceResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Resource not found.',
    type: ErrorResponseDto,
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'JWT token',
    required: true,
    schema: {
      type: 'string',
      example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
  })
  @ApiProduces('application/json')
  async findOne(@Param('id') id: string): Promise<ResourceResponseDto> {
    return this.resourcesService.getResourceById(+id);
  }

  @Get(':id/permissions')
  @RequirePermission('read:resources')
  @ApiOperation({ summary: 'Get permissions for a resource' })
  @ApiResponse({
    status: 200,
    description: 'Return the permissions for the resource.',
    type: [PermissionResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Resource not found.',
    type: ErrorResponseDto,
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'JWT token',
    required: true,
    schema: {
      type: 'string',
      example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
  })
  @ApiProduces('application/json')
  async getPermissions(
    @Param('id') id: string,
  ): Promise<PermissionListResponseDto[]> {
    return this.resourcesService.getResourcePermissions(+id);
  }
}
