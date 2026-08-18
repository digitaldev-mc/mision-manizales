import type { PaymentProvider } from "./provider";

function paypalBaseUrl(): string {
  return process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`PayPal auth failed: ${res.status}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export const paypalProvider: PaymentProvider = {
  async createOrder({ amount, currency, referenceCode }) {
    const token = await getAccessToken();
    const res = await fetch(`${paypalBaseUrl()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: referenceCode,
            amount: {
              currency_code: currency,
              value: currency === "USD" ? (amount / 100).toFixed(2) : Number(amount).toFixed(2),
            },
          },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`PayPal create order failed: ${err}`);
    }

    const data = (await res.json()) as { id: string };
    return { providerOrderId: data.id, redirectOrClientToken: data.id };
  },

  async verifyWebhookSignature(headers, rawBody) {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId) return false;

    const token = await getAccessToken();
    const res = await fetch(
      `${paypalBaseUrl()}/v1/notifications/verify-webhook-signature`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auth_algo: headers.get("paypal-auth-algo"),
          cert_url: headers.get("paypal-cert-url"),
          transmission_id: headers.get("paypal-transmission-id"),
          transmission_sig: headers.get("paypal-transmission-sig"),
          transmission_time: headers.get("paypal-transmission-time"),
          webhook_id: webhookId,
          webhook_event: JSON.parse(rawBody),
        }),
      },
    );

    if (!res.ok) return false;
    const data = (await res.json()) as { verification_status: string };
    return data.verification_status === "SUCCESS";
  },

  parseWebhookEvent(rawBody) {
    const event = JSON.parse(rawBody) as {
      id: string;
      event_type: string;
      resource?: { id?: string; supplementary_data?: { related_ids?: { order_id?: string } } };
    };

    const providerOrderId =
      event.resource?.supplementary_data?.related_ids?.order_id ??
      event.resource?.id ??
      "";

    const approvedTypes = ["CHECKOUT.ORDER.APPROVED", "PAYMENT.CAPTURE.COMPLETED"];
    const failedTypes = ["PAYMENT.CAPTURE.DENIED", "CHECKOUT.ORDER.COMPLETED"];

    let status: "approved" | "failed" = "failed";
    if (approvedTypes.includes(event.event_type)) status = "approved";
    if (failedTypes.includes(event.event_type) && !approvedTypes.includes(event.event_type)) {
      status = "failed";
    }

    return {
      eventId: event.id,
      eventType: event.event_type,
      providerOrderId,
      status,
    };
  },

  async captureOrder(providerOrderId) {
    const token = await getAccessToken();
    const res = await fetch(
      `${paypalBaseUrl()}/v2/checkout/orders/${providerOrderId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!res.ok) {
      return { captured: false };
    }

    return { captured: true };
  },
};
