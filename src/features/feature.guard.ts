import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Feature } from '../city/city.schema';
import { FeatureFlagService } from './feature-flag.service';

export const FEATURE_KEY = 'requiredFeature';

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly flags: FeatureFlagService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const feature = this.reflector.getAllAndOverride<Feature | undefined>(FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!feature || this.flags.isEnabled(feature)) return true;
    throw new ForbiddenException(`"${feature}" is not available in this city`);
  }
}
