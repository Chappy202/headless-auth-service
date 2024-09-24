import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeatureToggleService } from '../services/feature-toggle.service';
import { FeatureToggle } from '../enums/feature-toggles.enum';

@Injectable()
export class FeatureToggleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private featureToggleService: FeatureToggleService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const feature = this.reflector.get<FeatureToggle>(
      'FEATURE',
      context.getHandler(),
    );

    if (!feature) {
      return true; // If no feature, allow access
    }

    const isEnabled = this.featureToggleService.isEnabled(feature);
    console.log(`Feature ${feature} is ${isEnabled ? 'enabled' : 'disabled'}`);

    return isEnabled;
  }
}
