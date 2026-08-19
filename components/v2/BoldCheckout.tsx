"use client";

import { useEffect, useRef, useState } from "react";

type BoldCheckoutProps = {
  donationId: string;
  referenceCode: string;
  amountCOP: number;
  onSuccess: (referenceCode: string) => void;
  onError: (message: string) => void;
};

type CheckoutData = {
  apiKey: string;
  orderId: string;
  amount: number;
  currency: string;
  integritySignature: string;
  redirectionUrl: string;
  originUrl?: string;
  description: string;
  customerData?: string;
  billingAddress?: string;
};

function loadBoldLibrary(): Promise<void> {
  if (document.querySelector('script[src*="boldPaymentButton.js"]')) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.bold.co/library/boldPaymentButton.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar Bold"));
    document.head.appendChild(script);
  });
}

export function BoldCheckout({
  donationId,
  referenceCode,
  amountCOP,
  onSuccess,
  onError,
}: BoldCheckoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function mount() {
      try {
        const res = await fetch("/api/pagos/bold/checkout-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ donationId }),
        });
        const data = (await res.json()) as CheckoutData & { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Error al preparar Bold");

        await loadBoldLibrary();
        if (cancelled || !containerRef.current) return;

        const btn = document.createElement("script");
        btn.setAttribute("data-bold-button", "dark-L");
        btn.setAttribute("data-api-key", data.apiKey);
        btn.setAttribute("data-amount", String(data.amount));
        btn.setAttribute("data-currency", data.currency);
        btn.setAttribute("data-order-id", data.orderId);
        btn.setAttribute("data-integrity-signature", data.integritySignature);
        btn.setAttribute("data-redirection-url", data.redirectionUrl);
        btn.setAttribute("data-description", data.description);
        btn.setAttribute("data-render-mode", "embedded");
        if (data.originUrl) btn.setAttribute("data-origin-url", data.originUrl);
        if (data.customerData) btn.setAttribute("data-customer-data", data.customerData);
        if (data.billingAddress) btn.setAttribute("data-billing-address", data.billingAddress);

        containerRef.current.replaceChildren(btn);
        setLoading(false);

        const onMessage = (event: MessageEvent) => {
          if (typeof event.data !== "object" || !event.data) return;
          const status = String((event.data as { status?: string }).status ?? "").toLowerCase();
          if (status.includes("approved") || status.includes("success")) {
            onSuccess(referenceCode);
          }
        };
        window.addEventListener("message", onMessage);
        return () => window.removeEventListener("message", onMessage);
      } catch (err) {
        if (!cancelled) {
          onError(err instanceof Error ? err.message : "Error Bold");
          setLoading(false);
        }
      }
    }

    const cleanupPromise = mount();
    return () => {
      cancelled = true;
      void cleanupPromise;
    };
  }, [donationId, onError, onSuccess, referenceCode]);

  return (
    <div className="bold-checkout-box">
      <p style={{ color: "#5a6875", fontSize: "0.9rem", marginBottom: 14 }}>
        Referencia <strong>{referenceCode}</strong> · ${amountCOP.toLocaleString("es-CO")} COP
      </p>
      {loading ? (
        <p style={{ color: "#7a8896", fontSize: "0.88rem" }}>Cargando pasarela Bold…</p>
      ) : null}
      <div ref={containerRef} />
      <p style={{ color: "#7a8896", fontSize: "0.78rem", marginTop: 12 }}>
        PSE, tarjeta, Nequi o Bancolombia · al finalizar volverás a la página de gracias.
      </p>
    </div>
  );
}
