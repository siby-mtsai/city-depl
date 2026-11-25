import { Controller, Get } from '@nestjs/common';
import { FeatureFlagService } from '../features/feature-flag.service';
import { CityContext } from './city-context';

/** Lets the frontend ask "what does this city support?" so it can hide buttons. */
@Controller('city')
export class CityController {
  constructor(
    private readonly ctx: CityContext,
    private readonly flags: FeatureFlagService,
  ) {}

  @Get()
  describe() {
    const { city, displayName, currency, languages, timezone } = this.ctx.current;
    return { city, displayName, currency, languages, timezone, features: this.flags.enabledFeatures() };
  }
}
