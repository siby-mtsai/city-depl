import { PaymentProviderName } from '../city/city.schema';

export interface ChargeInput {
  orderId: string;
  amount: number; // in major units, e.g. 499.00
  currency: string;
}

export interface ChargeResult {
  provider: PaymentProviderName;
  paymentId: string;
  status: 'succeeded' | 'pending' | 'failed';
}

/** Every payment gateway implements this. Order code only ever sees this interface. */
export interface PaymentProvider {
  readonly name: PaymentProviderName;
  charge(input: ChargeInput): Promise<ChargeResult>;
}

export const PAYMENT_PROVIDERS = Symbol('PAYMENT_PROVIDERS');
