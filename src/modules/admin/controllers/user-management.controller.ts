import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { RequirePermission } from '@/common/decorators/permission.decorator';
import { UserManagementService } from '../services/user-management.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
  UserDetailsResponseDto,
  PaginatedUsersResponseDto,
} from '../dto/user-management.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

@ApiTags('admin/users')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class UserManagementController {
  constructor(private readonly userManagementService: UserManagementService) {}

  @Post()
  @RequirePermission('write:users')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Username or email already exists',
    type: ErrorResponseDto,
  })
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return this.userManagementService.createUser(createUserDto);
  }

  @Get()
  @RequirePermission('read:users')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'Return all users.',
    type: PaginatedUsersResponseDto,
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAllUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PaginatedUsersResponseDto | UserResponseDto[]> {
    return this.userManagementService.getAllUsers(page, limit);
  }

  @Get(':id')
  @RequirePermission('read:users')
  @ApiOperation({ summary: 'Get user details' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Return the user details.',
    type: UserDetailsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    type: ErrorResponseDto,
  })
  async getUserDetails(
    @Param('id') id: string,
  ): Promise<UserDetailsResponseDto> {
    console.log('getUserDetails endpoint hit');
    try {
      return await this.userManagementService.getUserDetails(+id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Put(':id')
  @RequirePermission('write:users')
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully updated.',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Cannot modify a super user',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    type: ErrorResponseDto,
  })
  async updateUser(
    @Req() req,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    try {
      return await this.userManagementService.updateUser(
        req.user.userId,
        +id,
        updateUserDto,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof ForbiddenException) {
        throw new ForbiddenException(error.message);
      }
      throw error;
    }
  }

  @Delete(':id')
  @RequirePermission('write:users')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: 204,
    description: 'The user has been successfully deleted.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Cannot delete a super user',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    type: ErrorResponseDto,
  })
  async deleteUser(@Req() req, @Param('id') id: string): Promise<void> {
    try {
      await this.userManagementService.deleteUser(req.user.userId, +id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof ForbiddenException) {
        throw new ForbiddenException(error.message);
      }
      throw error;
    }
  }

  @Get(':id/sessions-and-login-history')
  @RequirePermission('read:users')
  @ApiOperation({ summary: 'Get user sessions and login history' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Return the user sessions and login history.',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    type: ErrorResponseDto,
  })
  async getUserSessionsAndLoginHistory(@Param('id') id: string) {
    try {
      return await this.userManagementService.getUserSessionsAndLoginHistory(
        +id,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Post(':id/request-email-verification')
  @RequirePermission('write:users')
  @ApiOperation({ summary: 'Request email verification for a user' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: 204,
    description: 'Email verification request sent successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
    type: ErrorResponseDto,
  })
  async requestUserEmailVerification(@Param('id') id: string): Promise<void> {
    try {
      await this.userManagementService.requestUserEmailVerification(+id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Post(':id/request-password-reset')
  @RequirePermission('write:users')
  @ApiOperation({ summary: 'Request password reset for a user' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: 204,
    description: 'Password reset request sent successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    type: ErrorResponseDto,
  })
  async requestUserPasswordReset(@Param('id') id: string): Promise<void> {
    try {
      await this.userManagementService.requestUserPasswordReset(+id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
