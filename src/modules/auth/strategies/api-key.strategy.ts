import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Strategy } from 'passport-http-bearer';
import { ApiKeyValidationService } from '../services/api-key-validation.service';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(private apiKeyValidationService: ApiKeyValidationService) {
    super();
  }

  async validate(apiKey: string) {
    const isValid = await this.apiKeyValidationService.validateApiKey(apiKey);
    if (!isValid) {
      throw new UnauthorizedException();
    }
    return true;
  }
}
