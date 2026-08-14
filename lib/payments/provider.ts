export interface PaymentProvider {
  createOrder(input: {
    amount: number;
    currency: string;
    referenceCode: string;
  }): Promise<{ providerOrderId: string; redirectOrClientToken: string }>;
  verifyWebhookSignature(headers: Headers, rawBody: string): Promise<boolean>;
  parseWebhookEvent(rawBody: string): {
    eventId: string;
    eventType: string;
    providerOrderId: string;
    status: "approved" | "failed";
  };
  captureOrder(providerOrderId: string): Promise<{ captured: boolean }>;
}
