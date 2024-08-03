import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

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

  async sendVerificationEmail(to: string, token: string) {
    const verificationLink = `${this.configService.get<string>('EMAIL_VERIFICATION_URL')}?token=${token}`;

    await this.transporter.sendMail({
      from: this.configService.get<string>('EMAIL_FROM'),
      to,
      subject: 'Verify Your Email',
      html: `Please click <a href="${verificationLink}">here</a> to verify your email address.`,
    });
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const resetLink = `${this.configService.get<string>('PASSWORD_RESET_URL')}?token=${token}`;

    await this.transporter.sendMail({
      from: this.configService.get<string>('EMAIL_FROM'),
      to,
      subject: 'Reset Your Password',
      html: `Please click <a href="${resetLink}">here</a> to reset your password.`,
    });
  }
}
