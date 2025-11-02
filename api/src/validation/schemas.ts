import { z } from 'zod';

export const CartSchema = z.object({
  buyer: z
    .object({
      phone: z.string().min(8),
      name: z.string().optional(),
    })
    .optional(),
  items: z.array(
    z.object({
      productId: z.string(),
      qty: z.number().int().min(1),
    }),
  ),
});

export const PaySchema = z.object({
  method: z.literal('MPESA'),
  phone: z.string().min(8),
});

export const MpesaCallbackSchema = z.object({
  Body: z.object({
    stkCallback: z.object({
      MerchantRequestID: z.string(),
      CheckoutRequestID: z.string(),
      ResultCode: z.number(),
      ResultDesc: z.string(),
      CallbackMetadata: z
        .object({
          Item: z.array(
            z.object({
              Name: z.string(),
              Value: z.any().optional(),
            }),
          ),
        })
        .optional(),
    }),
  }),
});
