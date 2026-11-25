import { Global, Module } from '@nestjs/common';
import * as path from 'node:path';
import { FeatureFlagService } from '../features/feature-flag.service';
import { FeatureGuard } from '../features/feature.guard';
import { loadCityConfigs } from './city-config.loader';
import { CityConfigService } from './city-config.service';
import { CityContext } from './city-context';
import { CityController } from './city.controller';
import { CityMiddleware } from './city.middleware';

@Global()
@Module({
  controllers: [CityController],
  providers: [
    {
      provide: CityConfigService,
      useFactory: () =>
        new CityConfigService(
          loadCityConfigs(process.env.CITY_CONFIG_DIR ?? path.resolve(process.cwd(), 'config/cities')),
        ),
    },
    CityContext,
    CityMiddleware,
    FeatureFlagService,
    FeatureGuard,
  ],
  exports: [CityConfigService, CityContext, CityMiddleware, FeatureFlagService, FeatureGuard],
})
export class CityModule {}
