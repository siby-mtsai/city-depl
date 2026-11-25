import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { CityConfig } from './city.schema';

const storage = new AsyncLocalStorage<CityConfig>();

/**
 * Holds "which city is this request for?" for the lifetime of a request,
 * without passing a `city` argument through every function.
 * Any service can inject CityContext and read `.current`.
 */
@Injectable()
export class CityContext {
  run<T>(city: CityConfig, fn: () => T): T {
    return storage.run(city, fn);
  }

  get current(): CityConfig {
    const city = storage.getStore();
    if (!city) {
      throw new Error('No city in context. Is CityMiddleware applied to this route?');
    }
    return city;
  }
}
