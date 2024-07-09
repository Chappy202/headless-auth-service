import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      // Configure your email service here
    });
  }

  async sendVerificationEmail(to: string, token: string) {
    const verificationLink = `${process.env.EMAIL_VERIFICATION_URL || 'http://yourapp.com/verify-email'}?token=${token}`;

    await this.transporter.sendMail({
      from: process.env.FROM_EMAIL || 'noreply@yourapp.com',
      to,
      subject: 'Verify Your Email',
      html: `Click <a href="${verificationLink}">here</a> to verify your email.`,
    });
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const resetLink = `${process.env.RESET_PASSWORD_URL || 'http://yourapp.com/reset-password'}?token=${token}`;

    await this.transporter.sendMail({
      from: process.env.FROM_EMAIL || 'noreply@yourapp.com',
      to,
      subject: 'Reset Your Password',
      html: `Click <a href="${resetLink}">here</a> to reset your password.`,
    });
  }
}