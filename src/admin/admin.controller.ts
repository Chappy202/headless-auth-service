import {
  Controller,
  Post,
  Put,
  UseGuards,
  Body,
  Param,
  Get,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateUserDto } from './dtos/create-user.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { CreateRoleDto } from './dtos/create-role.dto';
import { CreatePermissionDto } from './dtos/create-permission.dto';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RoleGuard)
@Roles('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Post('users')
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.adminService.createUser(createUserDto);
  }

  @Get('users')
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Get('users/:id')
  async getUser(@Param('id') id: number) {
    return this.adminService.getUserDetails(id);
  }

  @Put('users/:id/reset-password')
  async resetUserPassword(
    @Param('id') id: number,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    await this.adminService.resetUserPassword(id, resetPasswordDto.newPassword);
    return { message: 'Password reset successfully' };
  }

  @Post('roles')
  createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.adminService.createRole(createRoleDto.name);
  }

  @Post('permissions')
  createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    return this.adminService.createPermission(createPermissionDto.name);
  }

  @Post('users/:userId/roles/:roleId')
  assignRoleToUser(
    @Param('userId') userId: number,
    @Param('roleId') roleId: number,
  ) {
    return this.adminService.assignRoleToUser(userId, roleId);
  }

  @Post('roles/:roleId/permissions/:permissionId')
  assignPermissionToRole(
    @Param('roleId') roleId: number,
    @Param('permissionId') permissionId: number,
  ) {
    return this.adminService.assignPermissionToRole(roleId, permissionId);
  }

  @Put('users/:id/disable-mfa')
  async disableUserMfa(@Param('id') id: number) {
    return this.adminService.disableUserMfa(id);
  }

  @Get('users/:id/mfa-status')
  async getUserMfaStatus(@Param('id') id: number) {
    return this.adminService.getUserMfaStatus(id);
  }
}
