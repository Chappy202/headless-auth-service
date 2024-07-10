// api-key.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import Strategy from 'passport-headerapikey';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(private authService: AuthService) {
    super({ header: 'X-API-KEY', prefix: '' },
    true,
    async (apiKey, done) => {
      return this.validate(apiKey, done);
    });
  }

  async validate(apiKey: string, done: (error: Error, data) => {}) {
    const isValid = await this.authService.validateApiKey(apiKey);
    if (!isValid) {
      return done(new UnauthorizedException(), null);
    }
    return done(null, { apiKey });
  }
}