import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { RequirePermission } from '@/common/decorators/permission.decorator';
import { ResourcesService } from '../services/resources.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CreateResourceDto } from '../dto/create-resource.dto';

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
  })
  create(@Body() createResourceDto: CreateResourceDto) {
    return this.resourcesService.createResource(createResourceDto);
  }

  @Get()
  @RequirePermission('read:resources')
  @ApiOperation({ summary: 'Get all resources' })
  @ApiResponse({ status: 200, description: 'Return all resources.' })
  findAll() {
    return this.resourcesService.getResources();
  }

  @Get(':id')
  @RequirePermission('read:resources')
  @ApiOperation({ summary: 'Get a resource by id' })
  @ApiResponse({ status: 200, description: 'Return the resource.' })
  @ApiResponse({ status: 404, description: 'Resource not found.' })
  findOne(@Param('id') id: string) {
    return this.resourcesService.getResourceById(+id);
  }

  @Get(':id/permissions')
  @RequirePermission('read:resources')
  @ApiOperation({ summary: 'Get permissions for a resource' })
  @ApiResponse({
    status: 200,
    description: 'Return the permissions for the resource.',
  })
  getPermissions(@Param('id') id: string) {
    return this.resourcesService.getResourcePermissions(+id);
  }
}
