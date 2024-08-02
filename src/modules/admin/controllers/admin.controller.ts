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
import { AdminService } from '../services/admin.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PermissionGuard } from 'src/modules/auth/guards/permission.guard';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(AuthGuard('jwt'), PermissionGuard)
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

  @Put('users/:id/disable-mfa')
  async disableUserMfa(@Param('id') id: number) {
    return this.adminService.disableUserMfa(id);
  }

  @Get('users/:id/mfa-status')
  async getUserMfaStatus(@Param('id') id: number) {
    return this.adminService.getUserMfaStatus(id);
  }
}
