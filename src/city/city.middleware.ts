import { BadRequestException, Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { isIP } from 'node:net';
import { CityConfigService } from './city-config.service';
import { CityContext } from './city-context';

/**
 * Works out the city for each request, then runs the rest of the request inside that city's context.
 *   1. X-City header        (mobile apps, internal calls)
 *   2. Subdomain            (mumbai.example.com)
 */
export function resolveCitySlug(req: Request): string | undefined {
  const header = req.header('x-city');
  if (header) return header.trim().toLowerCase();

  const host = req.hostname ?? '';
  if (isIP(host)) return undefined; // 10.0.0.5 is not "city 10"
  const parts = host.split('.');
  if (parts.length > 2) return parts[0].toLowerCase();
  return undefined;
}

@Injectable()
export class CityMiddleware implements NestMiddleware {
  constructor(
    private readonly cities: CityConfigService,
    private readonly ctx: CityContext,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const slug = resolveCitySlug(req);
    if (!slug) {
      throw new BadRequestException('City not specified. Send an X-City header or use <city>.yourdomain.com');
    }
    const city = this.cities.get(slug);
    if (!city) throw new NotFoundException(`Unknown city "${slug}"`);

    res.setHeader('X-City', city.city);
    this.ctx.run(city, () => next());
  }
}
