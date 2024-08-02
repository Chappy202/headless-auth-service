// api-key.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import Strategy from 'passport-headerapikey';
import { BackendAuthService } from '../services/backend-auth.service';
import { ApiKeyUser } from 'src/modules/api-keys/types/api-key';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(private backendAuthService: BackendAuthService) {
    super({ header: 'X-API-KEY', prefix: '' }, true, async (apiKey, done) => {
      return this.validate(apiKey, done);
    });
  }

  async validate(
    apiKey: string,
    done: (error: Error | null, user: ApiKeyUser | false) => void,
  ) {
    const isValid = await this.backendAuthService.validateApiKey(apiKey);
    if (!isValid) {
      return done(new UnauthorizedException(), null);
    }
    return done(null, { apiKey });
  }
}
