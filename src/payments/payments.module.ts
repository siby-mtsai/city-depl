import { Module } from '@nestjs/common';
import { PAYMENT_PROVIDERS, PaymentProvider } from './payment-provider.interface';
import { PaymentService } from './payment.service';
import { RazorpayProvider } from './providers/razorpay.provider';
import { StripeProvider } from './providers/stripe.provider';

/** To add a gateway: write a class implementing PaymentProvider and add it to both lists below. */
const GATEWAYS = [RazorpayProvider, StripeProvider];

@Module({
  providers: [
    ...GATEWAYS,
    {
      provide: PAYMENT_PROVIDERS,
      useFactory: (...providers: PaymentProvider[]) => providers,
      inject: GATEWAYS,
    },
    PaymentService,
  ],
  exports: [PaymentService],
})
export class PaymentsModule {}
