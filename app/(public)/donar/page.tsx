"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function DonarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
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
      paymentMethod: form.get("paymentMethod"),
    };

    try {
      const res = await fetch("/api/donaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al registrar donación");

      if (payload.paymentMethod === "paypal") {
        const orderRes = await fetch("/api/pagos/paypal/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ donationId: data.donationId }),
        });
        if (!orderRes.ok) throw new Error("No se pudo iniciar PayPal");
      }

      router.push(`/gracias?ref=${data.referenceCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wrap" style={{ padding: "48px 24px" }}>
      <Link href="/" style={{ display: "inline-block", marginBottom: 24 }}>
        ← Volver al inicio
      </Link>
      <div className="form-card">
        <h1 style={{ marginBottom: 8 }}>Aportar a la reconstrucción</h1>
        <p style={{ color: "#5a6875", marginBottom: 24 }}>
          Tu donación queda en estado pendiente hasta confirmarse el pago.
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
          <div className="field">
            <label htmlFor="paymentMethod">Método de pago</label>
            <select id="paymentMethod" name="paymentMethod" required>
              <option value="paypal">PayPal</option>
              <option value="transferencia">Transferencia bancaria</option>
            </select>
          </div>
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
            <input id="licitOriginDeclared" name="licitOriginDeclared" type="checkbox" required />
            <label htmlFor="licitOriginDeclared">
              Declaro que los recursos provienen de una actividad lícita.
            </label>
          </div>
          {error && <p style={{ color: "#b3432d", marginBottom: 12 }}>{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Procesando…" : "Confirmar donación"}
          </button>
        </form>
      </div>
    </div>
  );
}
