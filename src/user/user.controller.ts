import {
  Controller,
  Get,
  Put,
  UseGuards,
  Request,
  Body,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dtos/profile.dto';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(private userService: UserService) {}

  @Get('profile')
  getProfile(@Request() req) {
    return this.userService.findOne(req.user.userId);
  }

  @Put('profile')
  updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.userId, updateProfileDto);
  }

  @Get('sessions')
  getSessions(@Request() req) {
    return this.userService.getSessions(req.user.userId);
  }

  @Get(':id/permissions')
  getPermissions(@Param('id') id: number) {
    return this.userService.getPermissions(id);
  }

  @Get(':id/roles')
  getRoles(@Param('id') id: number) {
    return this.userService.getRoles(id);
  }
}
