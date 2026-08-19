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

const BOLD_SCRIPT = "https://checkout.bold.co/library/boldPaymentButton.js";

function clickBoldButton(root: HTMLElement) {
  const btn =
    root.querySelector("button") ??
    root.querySelector("[role='button']") ??
    root.querySelector("a");
  btn?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
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
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let observer: MutationObserver | null = null;
    let openTimer: ReturnType<typeof setTimeout> | null = null;

    async function mount() {
      try {
        const res = await fetch("/api/pagos/bold/checkout-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ donationId }),
        });
        const data = (await res.json()) as CheckoutData & { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Error al preparar Bold");

        if (cancelled || !containerRef.current) return;

        const host = containerRef.current;
        host.replaceChildren();

        const btn = document.createElement("script");
        btn.src = BOLD_SCRIPT;
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

        host.appendChild(btn);
        setLoading(false);
        setOpening(true);

        observer = new MutationObserver(() => {
          if (!host.querySelector("button, [role='button'], a")) return;
          openTimer = setTimeout(() => {
            clickBoldButton(host);
            setOpening(false);
            observer?.disconnect();
          }, 350);
        });
        observer.observe(host, { childList: true, subtree: true });

        openTimer = setTimeout(() => {
          clickBoldButton(host);
          setOpening(false);
        }, 2500);

        const onMessage = (event: MessageEvent) => {
          if (typeof event.origin === "string" && !event.origin.includes("bold.co")) return;
          const payload = event.data as { status?: string; paymentStatus?: string; type?: string };
          const status = String(payload?.status ?? payload?.paymentStatus ?? payload?.type ?? "").toLowerCase();
          if (status.includes("approved") || status.includes("success") || status.includes("paid")) {
            onSuccess(referenceCode);
          }
        };
        window.addEventListener("message", onMessage);

        return () => {
          window.removeEventListener("message", onMessage);
        };
      } catch (err) {
        if (!cancelled) {
          onError(err instanceof Error ? err.message : "Error Bold");
          setLoading(false);
          setOpening(false);
        }
      }
    }

    const cleanupMessage = mount();
    return () => {
      cancelled = true;
      observer?.disconnect();
      if (openTimer) clearTimeout(openTimer);
      void cleanupMessage;
    };
  }, [donationId, onError, onSuccess, referenceCode]);

  return (
    <div className="bold-checkout-box payment-gateway-box">
      <p style={{ color: "#5a6875", fontSize: "0.9rem", marginBottom: 14 }}>
        Referencia <strong>{referenceCode}</strong> · ${amountCOP.toLocaleString("es-CO")} COP
      </p>
      {loading ? (
        <p style={{ color: "#7a8896", fontSize: "0.88rem" }}>Preparando pasarela Bold…</p>
      ) : null}
      {opening ? (
        <p style={{ color: "#2d6a4f", fontSize: "0.88rem", marginBottom: 10 }}>
          Abriendo ventana de pago Bold…
        </p>
      ) : null}
      <div ref={containerRef} className="payment-gateway-mount" />
      {!loading ? (
        <button
          type="button"
          className="btn btn-primary btn-block"
          style={{ marginTop: 12 }}
          onClick={() => containerRef.current && clickBoldButton(containerRef.current)}
        >
          Abrir pago Bold
        </button>
      ) : null}
    </div>
  );
}
