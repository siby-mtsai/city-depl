import { Controller, Get } from '@nestjs/common';
import { CityConfigService } from './city/city-config.service';

/** Not city-scoped: load balancers and Kubernetes probes hit this. */
@Controller('health')
export class HealthController {
  constructor(private readonly cities: CityConfigService) {}

  @Get()
  check() {
    return { status: 'ok', cities: this.cities.list().map((c) => c.city) };
  }
}
