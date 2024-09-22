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
      'feature',
      context.getHandler(),
    );
    if (!feature) {
      return true;
    }
    return this.featureToggleService.isEnabled(feature);
  }
}
