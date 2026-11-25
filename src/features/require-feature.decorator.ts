import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { Feature } from '../city/city.schema';
import { FEATURE_KEY, FeatureGuard } from './feature.guard';

/**
 * Put on a route (or a whole controller) to block it in cities where the feature is off.
 *   @RequireFeature('live_tracking')
 */
export const RequireFeature = (feature: Feature) =>
  applyDecorators(SetMetadata(FEATURE_KEY, feature), UseGuards(FeatureGuard));
