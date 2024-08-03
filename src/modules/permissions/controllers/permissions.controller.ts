import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { RequirePermission } from '@/common/decorators/permission.decorator';
import { PermissionsService } from '../services/permissions.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CreatePermissionDto } from '../dto/create-permission.dto';

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
  })
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.createPermission(createPermissionDto);
  }

  @Get()
  @RequirePermission('read:permissions')
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({ status: 200, description: 'Return all permissions.' })
  findAll() {
    return this.permissionsService.getPermissions();
  }

  @Get(':id')
  @RequirePermission('read:permissions')
  @ApiOperation({ summary: 'Get a permission by id' })
  @ApiResponse({ status: 200, description: 'Return the permission.' })
  @ApiResponse({ status: 404, description: 'Permission not found.' })
  findOne(@Param('id') id: string) {
    return this.permissionsService.getPermissionById(+id);
  }

  @Post('assign-to-role/:permissionId/:roleId')
  @RequirePermission('write:permissions')
  @ApiOperation({ summary: 'Assign a permission to a role' })
  @ApiResponse({
    status: 200,
    description: 'The permission has been assigned to the role.',
  })
  assignToRole(
    @Param('permissionId') permissionId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.permissionsService.assignPermissionToRole(
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
  assignToUser(
    @Param('permissionId') permissionId: string,
    @Param('userId') userId: string,
  ) {
    return this.permissionsService.assignPermissionToUser(
      +permissionId,
      +userId,
    );
  }
}
