import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SendEmailDto } from '../dto/send-email.dto';
import { EmailResponseDto } from '../dto/email-response.dto';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: this.configService.get<boolean>('EMAIL_SECURE'),
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });
  }

  async sendEmail(sendEmailDto: SendEmailDto): Promise<EmailResponseDto> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_FROM'),
        to: sendEmailDto.to,
        subject: sendEmailDto.subject,
        html: sendEmailDto.content,
      });

      return {
        success: true,
        message: 'Email sent successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to send email: ${error.message}`,
      };
    }
  }

  async sendVerificationEmail(
    to: string,
    token: string,
  ): Promise<EmailResponseDto> {
    const verificationLink = `${this.configService.get<string>('EMAIL_VERIFICATION_URL')}?token=${token}`;
    const content = `Please click <a href="${verificationLink}">here</a> to verify your email address.`;

    return this.sendEmail({
      to,
      subject: 'Verify Your Email',
      content,
    });
  }

  async sendPasswordResetEmail(
    to: string,
    token: string,
  ): Promise<EmailResponseDto> {
    const resetLink = `${this.configService.get<string>('PASSWORD_RESET_URL')}?token=${token}`;
    const content = `Please click <a href="${resetLink}">here</a> to reset your password.`;

    return this.sendEmail({
      to,
      subject: 'Reset Your Password',
      content,
    });
  }
}
