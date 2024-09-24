import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FeatureToggleService {
  constructor(private configService: ConfigService) {}

  isEnabled(feature: string): boolean {
    return (
      this.configService.get<string>(`FEATURE_${feature.toUpperCase()}`) ===
      'true'
    );
  }
}
