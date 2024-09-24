export class UserDto {
  id: number;
  username: string;
  email: string;
  isEmailVerified: boolean;
  createdAt: Date;
  mfaEnabled: boolean;
  mfaSecret: string | null;
  isDisabled: boolean;
  emailVerificationToken: string | null;
  password?: string;
}
