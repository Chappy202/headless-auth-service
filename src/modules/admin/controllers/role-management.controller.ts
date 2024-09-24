import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  NotFoundException,
  ConflictException,
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
import { RoleManagementService } from '../services/role-management.service';
import {
  CreateRoleDto,
  UpdateRoleDto,
  RoleResponseDto,
  RoleDetailResponseDto,
} from '../dto/role-management.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

@ApiTags('admin/roles')
@Controller('admin/roles')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class RoleManagementController {
  constructor(private readonly roleManagementService: RoleManagementService) {}

  @Post()
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
  @ApiResponse({
    status: 409,
    description: 'Role already exists',
    type: ErrorResponseDto,
  })
  async createRole(
    @Body() createRoleDto: CreateRoleDto,
  ): Promise<RoleResponseDto> {
    try {
      return await this.roleManagementService.createRole(createRoleDto);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  @Get()
  @RequirePermission('read:roles')
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({
    status: 200,
    description: 'Return all roles.',
    type: [RoleResponseDto],
  })
  async getAllRoles(): Promise<RoleResponseDto[]> {
    return this.roleManagementService.getAllRoles();
  }

  @Get(':id')
  @RequirePermission('read:roles')
  @ApiOperation({ summary: 'Get role details' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Return the role details.',
    type: RoleDetailResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
    type: ErrorResponseDto,
  })
  async getRoleDetails(
    @Param('id') id: string,
  ): Promise<RoleDetailResponseDto> {
    try {
      return await this.roleManagementService.getRoleDetails(+id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Put(':id')
  @RequirePermission('write:roles')
  @ApiOperation({ summary: 'Update a role' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'The role has been successfully updated.',
    type: RoleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Role with this name already exists',
    type: ErrorResponseDto,
  })
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    try {
      return await this.roleManagementService.updateRole(+id, updateRoleDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof ConflictException) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  @Delete(':id')
  @RequirePermission('write:roles')
  @ApiOperation({ summary: 'Delete a role' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'The role has been successfully deleted.',
    schema: {
      properties: {
        message: { type: 'string' },
        deletedRole: { $ref: '#/components/schemas/RoleResponseDto' },
        affectedUserIds: {
          type: 'array',
          items: { type: 'number' },
          description: 'Array of user IDs affected by the role deletion',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
    type: ErrorResponseDto,
  })
  async deleteRole(@Param('id') id: string): Promise<{
    message: string;
    deletedRole: RoleResponseDto;
    affectedUserIds: number[];
  }> {
    try {
      const result = await this.roleManagementService.deleteRole(+id);
      return {
        message: 'Role successfully deleted',
        deletedRole: result.deletedRole,
        affectedUserIds: result.affectedUserIds,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
