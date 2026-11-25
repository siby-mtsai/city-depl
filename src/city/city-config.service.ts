import { Injectable } from '@nestjs/common';
import { CityConfig } from './city.schema';

/** Read-only registry of all cities, loaded once at startup. */
@Injectable()
export class CityConfigService {
  constructor(private readonly cities: Map<string, CityConfig>) {}

  get(slug: string): CityConfig | undefined {
    return this.cities.get(slug);
  }

  list(): CityConfig[] {
    return [...this.cities.values()];
  }
}
