import { z } from 'zod';

/**
 * The single source of truth for what a city config may contain.
 * Every city MUST declare every feature explicitly (true/false), so forgetting
 * a flag when you add a new feature fails at boot and in CI, not in production.
 */
export const FeaturesSchema = z.strictObject({
  cash_on_delivery: z.boolean(),
  scheduled_orders: z.boolean(),
  live_tracking: z.boolean(),
  express_delivery: z.boolean(),
});
export type Feature = keyof z.infer<typeof FeaturesSchema>;
export const ALL_FEATURES = Object.keys(FeaturesSchema.shape) as Feature[];

export const PAYMENT_PROVIDER_NAMES = ['razorpay', 'stripe'] as const;
export type PaymentProviderName = (typeof PAYMENT_PROVIDER_NAMES)[number];

const isValidTimezone = (tz: string) => {
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

export const CityConfigSchema = z.strictObject({
  city: z.string().regex(/^[a-z][a-z0-9-]*$/, 'lowercase slug, e.g. "new-york"'),
  displayName: z.string().min(1),
  timezone: z.string().refine(isValidTimezone, 'unknown IANA timezone'),
  currency: z.string().regex(/^[A-Z]{3}$/, 'ISO 4217 code, e.g. INR'),
  languages: z.array(z.string().min(2)).min(1),
  features: FeaturesSchema,
  payments: z.strictObject({ provider: z.enum(PAYMENT_PROVIDER_NAMES) }),
  limits: z.strictObject({ maxOrderValue: z.number().positive() }),
});

export type CityConfig = z.infer<typeof CityConfigSchema>;
