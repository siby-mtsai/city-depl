import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ChargeInput, ChargeResult, PaymentProvider } from '../payment-provider.interface';

/** STUB: replace the body with the real Stripe SDK call. */
@Injectable()
export class StripeProvider implements PaymentProvider {
  readonly name = 'stripe' as const;
  private readonly logger = new Logger(StripeProvider.name);

  async charge(input: ChargeInput): Promise<ChargeResult> {
    const amountInMinor = Math.round(input.amount * 100);
    this.logger.log(`Creating PaymentIntent ${amountInMinor} ${input.currency} for order ${input.orderId}`);
    return { provider: this.name, paymentId: `pi_${randomUUID()}`, status: 'succeeded' };
  }
}
