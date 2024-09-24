import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
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
import { PermissionManagementService } from '../services/permission-management.service';
import {
  CreatePermissionDto,
  UpdatePermissionDto,
  AssignPermissionsDto,
  PermissionResponseDto,
  PermissionDetailResponseDto,
  AssignmentResponseDto,
} from '../dto/permission-management.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

@ApiTags('admin/permissions')
@Controller('admin/permissions')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class PermissionManagementController {
  constructor(
    private readonly permissionManagementService: PermissionManagementService,
  ) {}

  @Post()
  @RequirePermission('write:permissions')
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({ status: 201, type: PermissionResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  @ApiResponse({
    status: 409,
    type: ErrorResponseDto,
    description: 'Permission already exists',
  })
  async createPermission(
    @Body() createPermissionDto: CreatePermissionDto,
  ): Promise<PermissionResponseDto> {
    try {
      return await this.permissionManagementService.createPermission(
        createPermissionDto,
      );
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  @Get()
  @RequirePermission('read:permissions')
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({ status: 200, type: [PermissionResponseDto] })
  async getAllPermissions(): Promise<PermissionResponseDto[]> {
    return this.permissionManagementService.getAllPermissions();
  }

  @Get(':id')
  @RequirePermission('read:permissions')
  @ApiOperation({ summary: 'Get permission details' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: PermissionDetailResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  async getPermissionDetails(
    @Param('id') id: string,
  ): Promise<PermissionDetailResponseDto> {
    return this.permissionManagementService.getPermissionDetails(+id);
  }

  @Post('assign-to-user/:userId')
  @RequirePermission('write:permissions')
  @ApiOperation({ summary: 'Assign permissions to a user' })
  @ApiParam({ name: 'userId', type: 'number' })
  @ApiResponse({ status: 200, type: AssignmentResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  async assignPermissionsToUser(
    @Param('userId') userId: string,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ): Promise<AssignmentResponseDto> {
    return this.permissionManagementService.assignPermissionsToUser(
      +userId,
      assignPermissionsDto.permissionIds,
    );
  }

  @Post('assign-to-role/:roleId')
  @RequirePermission('write:permissions')
  @ApiOperation({ summary: 'Assign permissions to a role' })
  @ApiParam({ name: 'roleId', type: 'number' })
  @ApiResponse({ status: 200, type: AssignmentResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  async assignPermissionsToRole(
    @Param('roleId') roleId: string,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ): Promise<AssignmentResponseDto> {
    return this.permissionManagementService.assignPermissionsToRole(
      +roleId,
      assignPermissionsDto.permissionIds,
    );
  }

  @Delete(':id')
  @RequirePermission('write:permissions')
  @ApiOperation({ summary: 'Delete a permission' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: PermissionResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  async deletePermission(
    @Param('id') id: string,
  ): Promise<PermissionResponseDto> {
    return this.permissionManagementService.deletePermission(+id);
  }

  @Put(':id')
  @RequirePermission('write:permissions')
  @ApiOperation({ summary: 'Update a permission' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: PermissionResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  @ApiResponse({
    status: 409,
    type: ErrorResponseDto,
    description: 'Permission with this name already exists',
  })
  async updatePermission(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ): Promise<PermissionResponseDto> {
    try {
      return await this.permissionManagementService.updatePermission(
        +id,
        updatePermissionDto,
      );
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }
}
