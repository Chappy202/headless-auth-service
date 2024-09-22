import { SetMetadata } from '@nestjs/common';
import { FeatureToggle } from '../enums/feature-toggles.enum';

export const RequireFeature = (feature: FeatureToggle) =>
  SetMetadata('feature', feature);
