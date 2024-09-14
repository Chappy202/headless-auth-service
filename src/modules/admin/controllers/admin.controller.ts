import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiHeader,
  ApiParam,
} from '@nestjs/swagger';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { RequirePermission } from '@/common/decorators/permission.decorator';
import { AdminService } from '../services/admin.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { CreatePermissionDto } from '@/modules/permissions/dto/create-permission.dto';
import { PermissionResponseDto } from '@/modules/permissions/dto/permission-response.dto';
import { CreateResourceDto } from '@/modules/resources/dto/create-resource.dto';
import { ResourceResponseDto } from '@/modules/resources/dto/resource-response.dto';
import { PermissionListResponseDto } from '@/modules/permissions/dto/permission-list-response.dto';
import { UserProfileDto } from '@/modules/users/dto/user-profile.dto';
import { CreateRoleDto } from '@/modules/roles/dto/create-role.dto';
import { RoleResponseDto } from '@/modules/roles/dto/role-response.dto';
import { UpdateRoleDto } from '@/modules/roles/dto/update-role.dto';

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
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Username or email already exists',
    type: ErrorResponseDto,
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
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    try {
      return await this.adminService.createUser(createUserDto);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  @Get('users')
  @RequirePermission('read:users')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'Return all users.',
    type: [UserResponseDto],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Sort field',
    example: 'username',
  })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'] })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiHeader({
    name: 'Authorization',
    description: 'JWT token',
    required: true,
    schema: {
      type: 'string',
      example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
  })
  @ApiHeader({
    name: 'X-Total-Count',
    description: 'Total number of records',
    required: false,
    schema: { type: 'number' },
  })
  async getUsers(
    @Query() paginationDto: PaginationDto,
    // @Query('sort') sort?: string,
    // @Query('order') order?: 'ASC' | 'DESC',
    // @Query('search') search?: string,
  ): Promise<UserResponseDto[]> {
    // TODO: Implement sorting and searching
    return this.adminService.getUsers(paginationDto /*, sort, order, search*/);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Returns the user details.',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid user ID format',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    type: ErrorResponseDto,
  })
  async getUserById(@Param('id') id: string): Promise<UserProfileDto> {
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      throw new BadRequestException(
        'Invalid user ID format. User ID must be a number.',
      );
    }
    try {
      const user = await this.adminService.getUserById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Invalid user ID');
    }
  }

  @Put('users/:id')
  @RequirePermission('write:users')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully updated.',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid user ID',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
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
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const userId = parseInt(id, 10);
    if (isNaN(userId) || userId <= 0) {
      throw new BadRequestException(
        'Invalid user ID. User ID must be a positive integer.',
      );
    }
    return this.adminService.updateUser(userId, updateUserDto);
  }

  @Delete('users/:id')
  @RequirePermission('write:users')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully deleted.',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid user ID',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
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
  async deleteUser(@Param('id') id: string): Promise<UserResponseDto> {
    const userId = parseInt(id, 10);
    if (isNaN(userId) || userId <= 0) {
      throw new BadRequestException(
        'Invalid user ID. User ID must be a positive integer.',
      );
    }
    return this.adminService.deleteUser(userId);
  }

  @Post('users/:userId/permissions/:permissionId')
  @RequirePermission('write:permissions')
  @ApiOperation({ summary: 'Assign a permission to a user' })
  @ApiResponse({
    status: 200,
    description: 'The permission has been assigned to the user.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid user ID',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid permission ID',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User or permission not found',
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
  async assignPermissionToUser(
    @Param('userId') userId: string,
    @Param('permissionId') permissionId: string,
  ): Promise<void> {
    const _userId = parseInt(userId, 10);
    if (isNaN(_userId)) {
      throw new BadRequestException(
        'Invalid user ID. User ID must be a positive integer.',
      );
    }
    const _permissionId = parseInt(permissionId, 10);
    if (isNaN(_permissionId)) {
      throw new BadRequestException(
        'Invalid permission ID. Permission ID must be a positive integer.',
      );
    }
    return this.adminService.assignPermissionToUser(+_userId, +_permissionId);
  }

  @Get('users/:userId/permissions')
  @RequirePermission('read:permissions')
  @ApiOperation({ summary: 'Get user permissions' })
  @ApiResponse({
    status: 200,
    description: 'Return the user permissions.',
    type: [PermissionResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid user ID',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
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
  async getUserPermissions(
    @Param('userId') userId: string,
  ): Promise<PermissionListResponseDto[]> {
    const _userId = parseInt(userId, 10);
    if (isNaN(_userId) || _userId <= 0) {
      throw new BadRequestException(
        'Invalid user ID. User ID must be a positive integer.',
      );
    }
    return this.adminService.getUserPermissions(+_userId);
  }

  @Post('resources')
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
  async createResource(
    @Body() createResourceDto: CreateResourceDto,
  ): Promise<ResourceResponseDto> {
    return this.adminService.createResource(createResourceDto);
  }

  @Get('resources')
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
  async getResources(): Promise<ResourceResponseDto[]> {
    return this.adminService.getResources();
  }

  @Post('permissions')
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
  async createPermission(
    @Body() createPermissionDto: CreatePermissionDto,
  ): Promise<PermissionListResponseDto> {
    return this.adminService.createPermission(createPermissionDto);
  }

  @Get('permissions')
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
  async getPermissions(): Promise<PermissionListResponseDto[]> {
    return this.adminService.getPermissions();
  }

  @Post('roles')
  @RequirePermission('write:roles')
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({
    status: 201,
    description: 'The role has been successfully created.',
    type: RoleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
    type: ErrorResponseDto,
  })
  async createRole(
    @Body() createRoleDto: CreateRoleDto,
  ): Promise<RoleResponseDto> {
    return this.adminService.createRole(createRoleDto);
  }

  @Get('roles')
  @RequirePermission('read:roles')
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({
    status: 200,
    description: 'Return all roles.',
    type: [RoleResponseDto],
  })
  async getRoles(): Promise<RoleResponseDto[]> {
    return this.adminService.getRoles();
  }

  @Get('roles/:id')
  @RequirePermission('read:roles')
  @ApiOperation({ summary: 'Get a role by id' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Return the role.',
    type: RoleResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found.',
    type: ErrorResponseDto,
  })
  async getRole(@Param('id') id: string): Promise<RoleResponseDto> {
    return this.adminService.getRoleById(+id);
  }

  @Put('roles/:id')
  @RequirePermission('write:roles')
  @ApiOperation({ summary: 'Update a role' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'The role has been successfully updated.',
    type: RoleResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found.',
    type: ErrorResponseDto,
  })
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    return this.adminService.updateRole(+id, updateRoleDto);
  }

  @Delete('roles/:id')
  @RequirePermission('write:roles')
  @ApiOperation({ summary: 'Delete a role' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'The role has been successfully deleted.',
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found.',
    type: ErrorResponseDto,
  })
  async deleteRole(@Param('id') id: string): Promise<void> {
    return this.adminService.deleteRole(+id);
  }

  @Post('roles/:roleId/permissions/:permissionId')
  @RequirePermission('write:roles')
  @ApiOperation({ summary: 'Assign a permission to a role' })
  @ApiParam({ name: 'roleId', type: 'number' })
  @ApiParam({ name: 'permissionId', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'The permission has been assigned to the role.',
  })
  @ApiResponse({
    status: 404,
    description: 'Role or permission not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Permission is already assigned to this role.',
    type: ErrorResponseDto,
  })
  async assignPermissionToRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ): Promise<void> {
    try {
      await this.adminService.assignPermissionToRole(+roleId, +permissionId);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }
}
