"use client";

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useState } from "react";

type PayPalCheckoutProps = {
  donationId: string;
  referenceCode: string;
  amountCOP: number;
  onSuccess: (referenceCode: string) => void;
  onError: (message: string) => void;
};

export function PayPalCheckout({
  donationId,
  referenceCode,
  amountCOP,
  onSuccess,
  onError,
}: PayPalCheckoutProps) {
  const [busy, setBusy] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  if (!clientId) {
    return (
      <p className="err" style={{ display: "block" }}>
        PayPal no está configurado en el sitio. Contacta al administrador.
      </p>
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId,
        currency: "COP",
        intent: "capture",
        components: "buttons",
      }}
    >
      <div className="paypal-checkout-box">
        <p style={{ color: "#5a6875", fontSize: "0.9rem", marginBottom: 14 }}>
          Referencia <strong>{referenceCode}</strong> · ${amountCOP.toLocaleString("es-CO")} COP
        </p>
        <PayPalButtons
          disabled={busy}
          style={{ layout: "vertical", color: "gold", shape: "rect", label: "paypal" }}
          createOrder={async () => {
            setBusy(true);
            try {
              const res = await fetch("/api/pagos/paypal/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ donationId }),
              });
              const data = (await res.json()) as { orderID?: string; error?: string };
              if (!res.ok || !data.orderID) {
                throw new Error(data.error ?? "No se pudo crear la orden PayPal");
              }
              return data.orderID;
            } catch (err) {
              onError(err instanceof Error ? err.message : "Error PayPal");
              throw err;
            } finally {
              setBusy(false);
            }
          }}
          onApprove={async (data) => {
            setBusy(true);
            try {
              const orderID = data.orderID;
              if (!orderID) throw new Error("Orden PayPal inválida");

              const res = await fetch("/api/pagos/paypal/capture-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderID, donationId }),
              });
              const body = (await res.json()) as { referenceCode?: string; error?: string };
              if (!res.ok) throw new Error(body.error ?? "No se pudo confirmar el pago");

              onSuccess(body.referenceCode ?? referenceCode);
            } catch (err) {
              onError(err instanceof Error ? err.message : "Error al confirmar pago");
            } finally {
              setBusy(false);
            }
          }}
          onCancel={() => onError("Pago cancelado en PayPal. Puedes intentar de nuevo.")}
          onError={() => onError("PayPal no pudo completar el pago. Intenta de nuevo.")}
        />
      </div>
    </PayPalScriptProvider>
  );
}
