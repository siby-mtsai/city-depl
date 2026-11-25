import { Injectable } from '@nestjs/common';
import { CityContext } from '../city/city-context';
import { ALL_FEATURES, CityConfig, Feature } from '../city/city.schema';

/**
 * The ONLY place that decides whether a feature is on.
 * Today it reads the city YAML plus an env kill switch. Later you can swap the body
 * for Unleash / Flagsmith / LaunchDarkly / OpenFeature without touching any caller.
 */
@Injectable()
export class FeatureFlagService {
  constructor(private readonly ctx: CityContext) {}

  isEnabled(feature: Feature, city: CityConfig = this.ctx.current): boolean {
    // Global kill switch: FEATURE_LIVE_TRACKING=off disables it in every city instantly.
    if (process.env[`FEATURE_${feature.toUpperCase()}`] === 'off') return false;
    return city.features[feature];
  }

  enabledFeatures(city: CityConfig = this.ctx.current): Feature[] {
    return ALL_FEATURES.filter((f) => this.isEnabled(f, city));
  }
}
