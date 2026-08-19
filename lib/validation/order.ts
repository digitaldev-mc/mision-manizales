import { z } from "zod";

export const orderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

export const orderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  documentType: z.enum(["CC", "CE", "Pasaporte", "NIT", "TI"]),
  documentNumber: z.string().min(4).max(20),
  fullName: z.string().min(3).max(120),
  phone: z.string().min(7).max(20),
  email: z.string().email(),
  address: z.string().min(5).max(200),
  dataConsent: z.literal(true),
  paymentMethod: z.enum(["paypal", "pse"]),
});

export type OrderInput = z.infer<typeof orderSchema>;
