import { z } from "zod";

export const donationSchema = z.object({
  amountCOP: z.number().int().positive(),
  documentType: z.enum(["CC", "CE", "Pasaporte", "NIT", "TI"]),
  documentNumber: z.string().min(4).max(20),
  fullName: z.string().min(3).max(120),
  phone: z.string().min(7).max(20),
  email: z.string().email(),
  address: z.string().min(5).max(200),
  dataConsent: z.literal(true),
  licitOriginDeclared: z.literal(true),
  paymentMethod: z.enum(["paypal", "transferencia", "pse"]),
});

export type DonationInput = z.infer<typeof donationSchema>;

export function generateReferenceCode(prefix: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}
