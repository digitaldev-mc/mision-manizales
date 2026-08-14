"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { FormEvent, useState } from "react";

export default function AdminLoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email")).trim();
    const password = String(form.get("password"));

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/admin",
      });

      if (!result?.ok || result.error) {
        setError("Credenciales incorrectas o demasiados intentos.");
        return;
      }

      window.location.assign("/admin");
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="admin-shell"
      style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <div className="form-card" style={{ width: "100%", maxWidth: 400 }}>
        <h1 style={{ fontSize: "1.4rem", marginBottom: 8 }}>Panel administrativo</h1>
        <p style={{ color: "#7a8896", fontSize: "0.85rem", marginBottom: 20 }}>
          Misión Manizales — acceso restringido
        </p>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required autoComplete="username" />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p style={{ color: "#b3432d", marginBottom: 12 }}>{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
        <Link href="/" className="btn btn-outline" style={{ width: "100%", marginTop: 12, justifyContent: "center" }}>
          Volver al sitio
        </Link>
      </div>
    </div>
  );
}
