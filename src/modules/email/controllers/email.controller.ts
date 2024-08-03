import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiConsumes,
  ApiProduces,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { RequirePermission } from '@/common/decorators/permission.decorator';
import { EmailService } from '../services/email.service';
import { SendEmailDto } from '../dto/send-email.dto';
import { EmailResponseDto } from '../dto/email-response.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';

@ApiTags('email')
@Controller('email')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  @RequirePermission('write:email')
  @ApiOperation({ summary: 'Send an email' })
  @ApiResponse({
    status: 200,
    description: 'The email has been successfully sent.',
    type: EmailResponseDto,
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
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  async sendEmail(
    @Body() sendEmailDto: SendEmailDto,
  ): Promise<EmailResponseDto> {
    return this.emailService.sendEmail(sendEmailDto);
  }
}
