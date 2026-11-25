import { z } from 'zod';

export const CreateOrderSchema = z.strictObject({
  items: z
    .array(
      z.strictObject({
        sku: z.string().min(1),
        qty: z.number().int().positive(),
        unitPrice: z.number().positive(),
      }),
    )
    .min(1),
  paymentMethod: z.enum(['online', 'cash']),
  scheduledFor: z.iso.datetime().optional(),
});

export type CreateOrderDto = z.infer<typeof CreateOrderSchema>;
