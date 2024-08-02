import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RequirePermission } from '../decorators/permission.decorator';
import { ApiTags } from '@nestjs/swagger';
import { PermissionGuard } from '../guards/permission.guard';
import { PermissionService } from '../services/permission.service';

@ApiTags('permissions')
@Controller('auth/permissions')
@UseGuards(AuthGuard('jwt'), PermissionGuard)
export class PermissionController {
  constructor(private permissionService: PermissionService) {}

  @Get()
  @RequirePermission('read:permissions')
  async listPermissions() {
    return this.permissionService.listPermissions();
  }

  @Get('resources')
  @RequirePermission('read:resources')
  async listResources() {
    return this.permissionService.listResources();
  }

  @Post('resources')
  //@RequirePermission('write:resources')
  async createResource(@Body() data: { name: string; description?: string }) {
    return this.permissionService.createResource(data.name, data.description);
  }

  @Get('resources/:id')
  @RequirePermission('read:resources')
  async getResource(@Param('id') id: number) {
    return this.permissionService.getResourceById(id);
  }

  @Get('resources/:id/permissions')
  @RequirePermission('read:resources')
  async getResourcePermissions(@Param('id') id: number) {
    return this.permissionService.getResourcePermissions(id);
  }

  @Post()
  //@RequirePermission('write:permissions')
  async createPermission(
    @Body()
    data: {
      resourceId: number;
      type: 'admin' | 'read' | 'write' | '*';
    },
  ) {
    return this.permissionService.createPermission(data.resourceId, data.type);
  }

  @Put('roles/:roleId/permissions/:permissionId')
  @RequirePermission('write:roles')
  async assignPermissionToRole(
    @Param('roleId') roleId: number,
    @Param('permissionId') permissionId: number,
  ) {
    await this.permissionService.assignPermissionToRole(permissionId, roleId);
    return { message: 'Permission assigned to role successfully' };
  }

  @Put('users/:userId/permissions/:permissionId')
  @RequirePermission('write:users')
  async assignPermissionToUser(
    @Param('userId') userId: number,
    @Param('permissionId') permissionId: number,
  ) {
    await this.permissionService.assignPermissionToUser(permissionId, userId);
    return { message: 'Permission assigned to user successfully' };
  }

  @Get('users/:userId/permissions')
  @RequirePermission('read:users')
  async getUserPermissions(@Param('userId') userId: number) {
    return this.permissionService.getUserPermissions(userId);
  }

  @Get('check')
  async checkPermission(
    @Query('userId') userId: number,
    @Query('permission') permission: string,
  ) {
    return this.permissionService.checkPermission(userId, permission);
  }
}
