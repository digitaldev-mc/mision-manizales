"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { fmtCOP } from "@/lib/format";
import { PayGateways } from "@/components/v2/PayGateways";
import { PayPalCheckout } from "@/components/v2/PayPalCheckout";
import { BoldCheckout } from "@/components/v2/BoldCheckout";
import { useCart } from "@/components/tienda/CartProvider";

type PendingOrder = {
  orderId: string;
  referenceCode: string;
  totalCOP: number;
  paymentMethod: "paypal" | "pse";
};

export function CheckoutModal() {
  const router = useRouter();
  const {
    checkoutOpen,
    setCheckoutOpen,
    items,
    subtotalCOP,
    shippingCOP,
    totalCOP,
    thermometerEstimateCOP,
    clearCart,
  } = useCart();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payMethod, setPayMethod] = useState<"paypal" | "bold">("paypal");
  const [pending, setPending] = useState<PendingOrder | null>(null);

  if (!checkoutOpen) return null;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const paymentMethod = payMethod === "bold" ? "pse" : "paypal";

    const payload = {
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      documentType: form.get("documentType"),
      documentNumber: form.get("documentNumber"),
      fullName: form.get("fullName"),
      phone: form.get("phone"),
      email: form.get("email"),
      address: form.get("address"),
      dataConsent: form.get("dataConsent") === "on",
      paymentMethod,
    };

    try {
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        orderId?: string;
        referenceCode?: string;
        totalCOP?: number;
        error?: unknown;
      };

      if (!res.ok || !data.orderId || !data.referenceCode) {
        const errMsg =
          typeof data.error === "string"
            ? data.error
            : data.error && typeof data.error === "object"
              ? "Completa todos los campos correctamente"
              : "Error al registrar pedido";
        throw new Error(errMsg);
      }

      setPending({
        orderId: data.orderId,
        referenceCode: data.referenceCode,
        totalCOP: data.totalCOP ?? totalCOP,
        paymentMethod: paymentMethod as "paypal" | "pse",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar pedido");
    } finally {
      setLoading(false);
    }
  }

  function onPaymentSuccess(referenceCode: string) {
    clearCart();
    setCheckoutOpen(false);
    setPending(null);
    router.push(`/gracias?ref=${encodeURIComponent(referenceCode)}&tipo=tienda&metodo=${payMethod === "bold" ? "bold" : "paypal"}`);
  }

  return (
    <div
      className="overlay show store-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !pending) setCheckoutOpen(false);
      }}
      role="presentation"
    >
      <div className="modal wide store-checkout-modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div>
            <span className="kicker">Checkout</span>
            <h3>Finalizar compra</h3>
          </div>
          {!pending ? (
            <button type="button" className="close-x" onClick={() => setCheckoutOpen(false)} aria-label="Cerrar">
              ×
            </button>
          ) : null}
        </div>

        {pending ? (
          <div>
            {pending.paymentMethod === "paypal" ? (
              <PayPalCheckout
                orderId={pending.orderId}
                referenceCode={pending.referenceCode}
                amountCOP={pending.totalCOP}
                onSuccess={onPaymentSuccess}
                onError={setError}
              />
            ) : (
              <BoldCheckout
                orderId={pending.orderId}
                referenceCode={pending.referenceCode}
                amountCOP={pending.totalCOP}
                onSuccess={onPaymentSuccess}
                onError={setError}
              />
            )}
            {error ? (
              <p className="err" style={{ display: "block", marginTop: 12 }}>
                {error}
              </p>
            ) : null}
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="checkout-summary-strip">
              <span>Subtotal {fmtCOP(subtotalCOP)}</span>
              <span>Domicilio {fmtCOP(shippingCOP)}</span>
              <strong>Total {fmtCOP(totalCOP)}</strong>
              <span className="checkout-thermo">🌡️ +{fmtCOP(thermometerEstimateCOP)} al empanadómetro</span>
            </div>

            <div className="row2">
              <div className="field">
                <label htmlFor="co-fullName">Nombre completo</label>
                <input id="co-fullName" name="fullName" required disabled={loading} />
              </div>
              <div className="field">
                <label htmlFor="co-email">Correo</label>
                <input id="co-email" name="email" type="email" required disabled={loading} />
              </div>
            </div>
            <div className="row2">
              <div className="field">
                <label htmlFor="co-docType">Tipo documento</label>
                <select id="co-docType" name="documentType" required disabled={loading}>
                  <option value="CC">Cédula</option>
                  <option value="CE">Cédula extranjería</option>
                  <option value="Pasaporte">Pasaporte</option>
                  <option value="NIT">NIT</option>
                  <option value="TI">Tarjeta identidad</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="co-docNum">Número documento</label>
                <input id="co-docNum" name="documentNumber" required disabled={loading} />
              </div>
            </div>
            <div className="row2">
              <div className="field">
                <label htmlFor="co-phone">Teléfono</label>
                <input id="co-phone" name="phone" required disabled={loading} />
              </div>
              <div className="field">
                <label htmlFor="co-address">Dirección en Manizales</label>
                <input id="co-address" name="address" required placeholder="Barrio, calle, apto" disabled={loading} />
              </div>
            </div>

            <label className="check-row">
              <input type="checkbox" name="dataConsent" required disabled={loading} />
              <span>Acepto el tratamiento de mis datos según la política de privacidad.</span>
            </label>

            <PayGateways value={payMethod} onChange={setPayMethod} />

            {error ? (
              <p className="err" style={{ display: "block" }}>
                {error}
              </p>
            ) : null}

            <button type="submit" className="btn btn-primary btn-block" disabled={loading || items.length === 0}>
              {loading ? "Registrando pedido…" : "Continuar al pago"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
