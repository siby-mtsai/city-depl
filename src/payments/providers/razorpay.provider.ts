import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ChargeInput, ChargeResult, PaymentProvider } from '../payment-provider.interface';

/** STUB: replace the body with the real Razorpay SDK call. */
@Injectable()
export class RazorpayProvider implements PaymentProvider {
  readonly name = 'razorpay' as const;
  private readonly logger = new Logger(RazorpayProvider.name);

  async charge(input: ChargeInput): Promise<ChargeResult> {
    // Razorpay expects amounts in paise (smallest unit).
    const amountInPaise = Math.round(input.amount * 100);
    this.logger.log(`Charging ${amountInPaise} paise ${input.currency} for order ${input.orderId}`);
    return { provider: this.name, paymentId: `pay_${randomUUID()}`, status: 'succeeded' };
  }
}
