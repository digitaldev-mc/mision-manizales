"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { PayGateways } from "@/components/v2/PayGateways";
import { PayPalCheckout } from "@/components/v2/PayPalCheckout";
import { SiteFooter } from "@/components/v2/SiteFooter";
import { SiteNav } from "@/components/v2/SiteNav";
import { ScrollProgress } from "@/components/v2/SiteLoader";
import { useScrollReveal } from "@/components/v2/useScrollReveal";

type PendingDonation = {
  donationId: string;
  referenceCode: string;
  amountCOP: number;
  paymentMethod: "paypal" | "transferencia";
};

export default function DonarPage() {
  useScrollReveal();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payMethod, setPayMethod] = useState<"paypal" | "bold">("paypal");
  const [pending, setPending] = useState<PendingDonation | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const paymentMethod = payMethod === "bold" ? "transferencia" : "paypal";
    const payload = {
      amountCOP: Number(form.get("amountCOP")),
      documentType: form.get("documentType"),
      documentNumber: form.get("documentNumber"),
      fullName: form.get("fullName"),
      phone: form.get("phone"),
      email: form.get("email"),
      address: form.get("address"),
      dataConsent: form.get("dataConsent") === "on",
      licitOriginDeclared: form.get("licitOriginDeclared") === "on",
      paymentMethod,
    };

    try {
      const res = await fetch("/api/donaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        donationId?: string;
        referenceCode?: string;
        error?: string;
      };
      if (!res.ok || !data.donationId || !data.referenceCode) {
        throw new Error(data.error ?? "Error al registrar donación");
      }

      if (paymentMethod === "paypal") {
        setPending({
          donationId: data.donationId,
          referenceCode: data.referenceCode,
          amountCOP: payload.amountCOP,
          paymentMethod: "paypal",
        });
        return;
      }

      router.push(`/gracias?ref=${data.referenceCode}&metodo=transferencia`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ScrollProgress />
      <SiteNav />
      <main className="wrap" style={{ padding: "48px 20px 80px" }}>
        <Link href="/" style={{ display: "inline-block", marginBottom: 24, fontWeight: 600 }}>
          ← Volver al inicio
        </Link>
        <div className="modal" style={{ position: "relative", maxWidth: 640, margin: "0 auto" }}>
          <div className="modal-head" style={{ borderRadius: "var(--radius) var(--radius) 0 0" }}>
            <h3>{pending ? "Completa tu pago con PayPal" : "Aportar a la reconstrucción"}</h3>
          </div>
          <div style={{ padding: "24px 28px 28px" }}>
            {pending ? (
              <>
                <p style={{ color: "#5a6875", marginBottom: 20 }}>
                  Tu donación quedó registrada. Finaliza el pago con PayPal para confirmarla.
                </p>
                {error ? (
                  <p className="err" style={{ display: "block", marginBottom: 16 }}>
                    {error}
                  </p>
                ) : null}
                <PayPalCheckout
                  donationId={pending.donationId}
                  referenceCode={pending.referenceCode}
                  amountCOP={pending.amountCOP}
                  onSuccess={(ref) => router.push(`/gracias?ref=${ref}&metodo=paypal`)}
                  onError={setError}
                />
                <button
                  type="button"
                  className="btn btn-outline btn-block"
                  style={{ marginTop: 16 }}
                  onClick={() => {
                    setPending(null);
                    setError("");
                  }}
                >
                  ← Editar datos de la donación
                </button>
              </>
            ) : (
              <>
                <p style={{ color: "#5a6875", marginBottom: 24 }}>
                  Registra tu aporte y continúa al método de pago que elijas.
                </p>
                <form onSubmit={onSubmit}>
                  <div className="field">
                    <label htmlFor="amountCOP">Monto (COP)</label>
                    <input id="amountCOP" name="amountCOP" type="number" min="1000" required />
                  </div>
                  <div className="row2">
                    <div className="field">
                      <label htmlFor="documentType">Tipo de documento</label>
                      <select id="documentType" name="documentType" required>
                        <option value="CC">Cédula de ciudadanía</option>
                        <option value="CE">Cédula de extranjería</option>
                        <option value="Pasaporte">Pasaporte</option>
                        <option value="NIT">NIT</option>
                        <option value="TI">Tarjeta de identidad</option>
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="documentNumber">Número de documento</label>
                      <input id="documentNumber" name="documentNumber" required />
                    </div>
                  </div>
                  <div className="row2">
                    <div className="field">
                      <label htmlFor="fullName">Nombre completo</label>
                      <input id="fullName" name="fullName" required />
                    </div>
                    <div className="field">
                      <label htmlFor="phone">Teléfono</label>
                      <input id="phone" name="phone" required />
                    </div>
                  </div>
                  <div className="row2">
                    <div className="field">
                      <label htmlFor="email">Correo</label>
                      <input id="email" name="email" type="email" required />
                    </div>
                    <div className="field">
                      <label htmlFor="address">Dirección</label>
                      <input id="address" name="address" required />
                    </div>
                  </div>
                  <PayGateways value={payMethod} onChange={setPayMethod} />
                  <div className="check-row">
                    <input id="dataConsent" name="dataConsent" type="checkbox" required />
                    <label htmlFor="dataConsent">
                      Autorizo el tratamiento de mis datos conforme a la{" "}
                      <Link href="/politica-datos" target="_blank">
                        política de datos
                      </Link>
                      .
                    </label>
                  </div>
                  <div className="check-row">
                    <input
                      id="licitOriginDeclared"
                      name="licitOriginDeclared"
                      type="checkbox"
                      required
                    />
                    <label htmlFor="licitOriginDeclared">
                      Declaro que los recursos provienen de una actividad lícita.
                    </label>
                  </div>
                  {error ? (
                    <p className="err" style={{ display: "block" }}>
                      {error}
                    </p>
                  ) : null}
                  <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
                    {loading ? "Registrando…" : payMethod === "paypal" ? "Continuar a PayPal" : "Confirmar donación"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
