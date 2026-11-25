import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CityContext } from '../city/city-context';
import { FeatureFlagService } from '../features/feature-flag.service';
import { PaymentService } from '../payments/payment.service';
import { CreateOrderDto } from './create-order.dto';

/**
 * Notice: no `if (city === 'mumbai')` anywhere.
 * Behaviour comes from config (limits, currency), flags (features) and strategies (payments).
 */
@Injectable()
export class OrdersService {
  static readonly EXPRESS_ETA_MINUTES = 30;

  constructor(
    private readonly ctx: CityContext,
    private readonly flags: FeatureFlagService,
    private readonly payments: PaymentService,
  ) {}

  async create(dto: CreateOrderDto) {
    const city = this.ctx.current;
    const total = dto.items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);

    if (total > city.limits.maxOrderValue) {
      throw new BadRequestException(
        `Order total ${total} ${city.currency} exceeds the ${city.displayName} limit of ${city.limits.maxOrderValue}`,
      );
    }
    if (dto.paymentMethod === 'cash' && !this.flags.isEnabled('cash_on_delivery')) {
      throw new BadRequestException(`Cash on delivery is not available in ${city.displayName}`);
    }
    if (dto.scheduledFor && !this.flags.isEnabled('scheduled_orders')) {
      throw new BadRequestException(`Scheduled orders are not available in ${city.displayName}`);
    }
    if (dto.express && !this.flags.isEnabled('express_delivery')) {
      throw new BadRequestException(`Express delivery is not available in ${city.displayName}`);
    }
    if (dto.express && dto.scheduledFor) {
      throw new BadRequestException('An order can be express or scheduled, not both');
    }

    const orderId = `ord_${randomUUID()}`;
    const payment =
      dto.paymentMethod === 'online'
        ? await this.payments.forCurrentCity().charge({ orderId, amount: total, currency: city.currency })
        : { provider: 'cash', status: 'pending' as const };

    const now = new Date();
    return {
      orderId,
      city: city.city,
      total,
      currency: city.currency,
      payment,
      scheduledFor: dto.scheduledFor ?? null,
      express: dto.express ?? false,
      etaMinutes: dto.express ? OrdersService.EXPRESS_ETA_MINUTES : null,
      createdAt: now.toISOString(),
      createdAtLocal: now.toLocaleString('en-GB', { timeZone: city.timezone }),
    };
  }

  /** The next three 30-minute express slots, shown in the city's own timezone. */
  expressSlots(now = new Date()) {
    const city = this.ctx.current;
    const slotMs = 30 * 60 * 1000;
    const firstStart = Math.ceil(now.getTime() / slotMs) * slotMs;
    const slots = [0, 1, 2].map((i) => {
      const start = new Date(firstStart + i * slotMs);
      return {
        start: start.toISOString(),
        startLocal: start.toLocaleTimeString('en-GB', { timeZone: city.timezone, hour: '2-digit', minute: '2-digit' }),
      };
    });
    return { city: city.city, etaMinutes: OrdersService.EXPRESS_ETA_MINUTES, slots };
  }

  tracking(orderId: string) {
    // Stub: replace with your real tracking source.
    return { orderId, status: 'out_for_delivery', etaMinutes: 12 };
  }
}
