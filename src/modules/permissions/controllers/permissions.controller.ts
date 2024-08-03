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
import { PermissionsService } from '../services/permissions.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { PermissionResponseDto } from '../dto/permission-response.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

@ApiTags('permissions')
@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @RequirePermission('write:permissions')
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({
    status: 201,
    description: 'The permission has been successfully created.',
    type: PermissionResponseDto,
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
    @Body() createPermissionDto: CreatePermissionDto,
  ): Promise<PermissionResponseDto> {
    return this.permissionsService.createPermission(createPermissionDto);
  }

  @Get()
  @RequirePermission('read:permissions')
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({
    status: 200,
    description: 'Return all permissions.',
    type: [PermissionResponseDto],
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
  async findAll(): Promise<PermissionResponseDto[]> {
    return this.permissionsService.getPermissions();
  }

  @Get(':id')
  @RequirePermission('read:permissions')
  @ApiOperation({ summary: 'Get a permission by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the permission.',
    type: PermissionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Permission not found.',
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
  async findOne(@Param('id') id: string): Promise<PermissionResponseDto> {
    return this.permissionsService.getPermissionById(+id);
  }

  @Post('assign-to-role/:permissionId/:roleId')
  @RequirePermission('write:permissions')
  @ApiOperation({ summary: 'Assign a permission to a role' })
  @ApiResponse({
    status: 200,
    description: 'The permission has been assigned to the role.',
  })
  @ApiResponse({
    status: 404,
    description: 'Permission or role not found.',
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
  async assignToRole(
    @Param('permissionId') permissionId: string,
    @Param('roleId') roleId: string,
  ): Promise<void> {
    await this.permissionsService.assignPermissionToRole(
      +permissionId,
      +roleId,
    );
  }

  @Post('assign-to-user/:permissionId/:userId')
  @RequirePermission('write:permissions')
  @ApiOperation({ summary: 'Assign a permission to a user' })
  @ApiResponse({
    status: 200,
    description: 'The permission has been assigned to the user.',
  })
  @ApiResponse({
    status: 404,
    description: 'Permission or user not found.',
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
  async assignToUser(
    @Param('permissionId') permissionId: string,
    @Param('userId') userId: string,
  ): Promise<void> {
    await this.permissionsService.assignPermissionToUser(
      +permissionId,
      +userId,
    );
  }
}
