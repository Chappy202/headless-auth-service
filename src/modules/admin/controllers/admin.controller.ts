import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
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
import { AdminService } from '../services/admin.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { UpdateUserDto } from '../dto/update-user.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('users')
  @RequirePermission('write:users')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
  })
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.adminService.createUser(createUserDto);
  }

  @Get('users')
  @RequirePermission('read:users')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Return all users.' })
  getUsers() {
    return this.adminService.getUsers();
  }

  @Get('users/:id')
  @RequirePermission('read:users')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiResponse({ status: 200, description: 'Return the user.' })
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(+id);
  }

  @Put('users/:id')
  @RequirePermission('write:users')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully updated.',
  })
  updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.adminService.updateUser(+id, updateUserDto);
  }

  @Delete('users/:id')
  @RequirePermission('write:users')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully deleted.',
  })
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(+id);
  }

  @Post('users/:userId/permissions/:permissionId')
  @RequirePermission('write:permissions')
  @ApiOperation({ summary: 'Assign a permission to a user' })
  @ApiResponse({
    status: 200,
    description: 'The permission has been assigned to the user.',
  })
  assignPermissionToUser(
    @Param('userId') userId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.adminService.assignPermissionToUser(+userId, +permissionId);
  }

  @Get('users/:userId/permissions')
  @RequirePermission('read:permissions')
  @ApiOperation({ summary: 'Get user permissions' })
  @ApiResponse({ status: 200, description: 'Return the user permissions.' })
  getUserPermissions(@Param('userId') userId: string) {
    return this.adminService.getUserPermissions(+userId);
  }

  @Post('resources')
  @RequirePermission('write:resources')
  @ApiOperation({ summary: 'Create a new resource' })
  @ApiResponse({
    status: 201,
    description: 'The resource has been successfully created.',
  })
  createResource(
    @Body() createResourceDto: { name: string; description?: string },
  ) {
    return this.adminService.createResource(
      createResourceDto.name,
      createResourceDto.description,
    );
  }

  @Get('resources')
  @RequirePermission('read:resources')
  @ApiOperation({ summary: 'Get all resources' })
  @ApiResponse({ status: 200, description: 'Return all resources.' })
  getResources() {
    return this.adminService.getResources();
  }
}
