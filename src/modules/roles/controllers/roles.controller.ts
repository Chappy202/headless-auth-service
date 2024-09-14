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
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { RequirePermission } from '@/common/decorators/permission.decorator';
import { RolesService } from '../services/roles.service';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { RoleResponseDto } from '../dto/role-response.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

@ApiTags('roles')
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

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
  async createRole(
    @Body() createRoleDto: CreateRoleDto,
  ): Promise<RoleResponseDto> {
    return this.rolesService.createRole(createRoleDto);
  }

  @Get()
  @RequirePermission('read:roles')
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({
    status: 200,
    description: 'Return all roles.',
    type: [RoleResponseDto],
  })
  async getRoles(): Promise<RoleResponseDto[]> {
    return this.rolesService.getRoles();
  }

  @Get(':id')
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
    return this.rolesService.getRoleById(+id);
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
    status: 404,
    description: 'Role not found.',
    type: ErrorResponseDto,
  })
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    return this.rolesService.updateRole(+id, updateRoleDto);
  }

  @Delete(':id')
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
    return this.rolesService.deleteRole(+id);
  }
}
