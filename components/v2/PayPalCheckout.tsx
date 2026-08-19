"use client";

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useEffect, useRef, useState } from "react";

type PayPalCheckoutProps = {
  donationId?: string;
  orderId?: string;
  referenceCode: string;
  amountCOP: number;
  onSuccess: (referenceCode: string) => void;
  onError: (message: string) => void;
};

export function PayPalCheckout({
  donationId,
  orderId,
  referenceCode,
  amountCOP,
  onSuccess,
  onError,
}: PayPalCheckoutProps) {
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  useEffect(() => {
    if (!ready || !boxRef.current) return;
    const timer = setTimeout(() => {
      const iframe = boxRef.current?.querySelector("iframe");
      if (!iframe) return;
      try {
        iframe.focus();
      } catch {
        /* noop */
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [ready]);

  if (!clientId) {
    return (
      <p className="err" style={{ display: "block" }}>
        PayPal no está configurado en el sitio. Contacta al administrador.
      </p>
    );
  }

  const trm = 4200;
  const usdApprox = (amountCOP / trm).toFixed(2);

  return (
    <PayPalScriptProvider
      options={{
        clientId,
        currency: "USD",
        intent: "capture",
        components: "buttons",
        locale: "es_CO",
        enableFunding: "paylater,venmo",
        disableFunding: "card",
      }}
    >
      <div className="paypal-checkout-box payment-gateway-box" ref={boxRef}>
        <p style={{ color: "#5a6875", fontSize: "0.9rem", marginBottom: 14 }}>
          Referencia <strong>{referenceCode}</strong> · ${amountCOP.toLocaleString("es-CO")} COP
          <span style={{ display: "block", fontSize: "0.82rem", color: "#7a8896", marginTop: 4 }}>
            Cobro en PayPal: ~USD {usdApprox}
          </span>
        </p>
        <p style={{ color: "#2d6a4f", fontSize: "0.88rem", marginBottom: 12 }}>
          Se abrirá el modal de PayPal — confirma el pago ahí.
        </p>
        <div className="payment-gateway-mount">
          <PayPalButtons
            disabled={busy}
            style={{ layout: "vertical", color: "gold", shape: "rect", label: "paypal", height: 48 }}
            forceReRender={[donationId, orderId, referenceCode]}
            onInit={() => setReady(true)}
            createOrder={async () => {
              setBusy(true);
              try {
                const res = await fetch("/api/pagos/paypal/create-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(orderId ? { orderId } : { donationId }),
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
                  body: JSON.stringify(
                    orderId ? { orderID, orderId } : { orderID, donationId },
                  ),
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
            onError={(err) => {
              console.error("PayPal button error:", err);
              onError("PayPal no pudo abrir el modal. Revisa bloqueadores de ventanas emergentes.");
            }}
          />
        </div>
      </div>
    </PayPalScriptProvider>
  );
}
