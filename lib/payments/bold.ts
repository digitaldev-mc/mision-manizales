import { createHash, createHmac, timingSafeEqual } from "crypto";

export function boldIdentityKey(): string {
  return process.env.BOLD_IDENTITY_KEY ?? process.env.NEXT_PUBLIC_BOLD_IDENTITY_KEY ?? "";
}

export function boldSecretKey(): string {
  return process.env.BOLD_SECRET_KEY ?? "";
}

export function boldSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://mision.manizalescomparte.com";
}

/** Hash SHA256: {orderId}{amount}{currency}{secret} */
export function boldIntegritySignature(orderId: string, amountCOP: number, currency = "COP"): string {
  const secret = boldSecretKey();
  if (!secret) throw new Error("BOLD_SECRET_KEY no configurada");
  const amount = Math.round(amountCOP);
  const payload = `${orderId}${amount}${currency}${secret}`;
  return createHash("sha256").update(payload).digest("hex");
}

export function verifyBoldWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const secret = boldSecretKey();
  if (!secret) return false;

  const encoded = Buffer.from(rawBody, "utf-8").toString("base64");
  const hashed = createHmac("sha256", secret).update(encoded).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(hashed, "utf-8"), Buffer.from(signature, "utf-8"));
  } catch {
    return false;
  }
}

export function boldDocumentType(documentType: string): string {
  const map: Record<string, string> = {
    CC: "CC",
    CE: "CE",
    Pasaporte: "PA",
    NIT: "NIT",
    TI: "TI",
  };
  return map[documentType] ?? "CC";
}

export type BoldWebhookPayload = {
  type?: string;
  data?: {
    metadata?: { reference?: string };
    payment_id?: string;
  };
};
