"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

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
        <form action={formAction}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              defaultValue="admin@misionmanizales.org"
            />
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
          {state.error && <p style={{ color: "#b3432d", marginBottom: 12 }}>{state.error}</p>}
          <button className="btn btn-primary" type="submit" disabled={pending} style={{ width: "100%" }}>
            {pending ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
        <Link href="/" className="btn btn-outline" style={{ width: "100%", marginTop: 12, justifyContent: "center" }}>
          Volver al sitio
        </Link>
      </div>
    </div>
  );
}
