import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { CityConfigService } from '../city/city-config.service';
import { CityContext } from '../city/city-context';
import { PaymentProviderName } from '../city/city.schema';
import { PAYMENT_PROVIDERS, PaymentProvider } from './payment-provider.interface';

/** Picks the right gateway for the current city (strategy pattern). */
@Injectable()
export class PaymentService implements OnModuleInit {
  private readonly byName: Map<PaymentProviderName, PaymentProvider>;

  constructor(
    @Inject(PAYMENT_PROVIDERS) providers: PaymentProvider[],
    private readonly ctx: CityContext,
    private readonly cities: CityConfigService,
  ) {
    this.byName = new Map(providers.map((p) => [p.name, p]));
  }

  /** Fail at boot if any city points at a provider that isn't registered. */
  onModuleInit() {
    const missing = this.cities
      .list()
      .filter((c) => !this.byName.has(c.payments.provider))
      .map((c) => `${c.city} -> ${c.payments.provider}`);
    if (missing.length) throw new Error(`No payment provider registered for: ${missing.join(', ')}`);
  }

  forCurrentCity(): PaymentProvider {
    return this.byName.get(this.ctx.current.payments.provider)!;
  }
}
