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
      createdAt: now.toISOString(),
      createdAtLocal: now.toLocaleString('en-GB', { timeZone: city.timezone }),
    };
  }

  tracking(orderId: string) {
    // Stub: replace with your real tracking source.
    return { orderId, status: 'out_for_delivery', etaMinutes: 12 };
  }
}
