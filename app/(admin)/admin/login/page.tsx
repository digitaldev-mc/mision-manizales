"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/sello-catedral.png" alt="" />
          <div>
            <strong style={{ fontFamily: "Fraunces, serif", fontSize: "1.1rem" }}>Misión Comparte</strong>
            <div style={{ fontSize: "0.75rem", color: "#7a8896" }}>Panel administrativo</div>
          </div>
        </div>
        <p style={{ color: "#7a8896", fontSize: "0.88rem", marginBottom: 24, lineHeight: 1.5 }}>
          Acceso restringido para el equipo de la campaña. Ingresa con tu cuenta autorizada.
        </p>
        <form action={formAction}>
          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input id="email" name="email" type="email" required autoComplete="username" />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>
          {state.error ? (
            <p className="err" style={{ marginBottom: 16 }}>
              {state.error}
            </p>
          ) : null}
          <button className="btn btn-primary btn-block" type="submit" disabled={pending}>
            {pending ? "Ingresando…" : "Ingresar al panel"}
          </button>
        </form>
        <Link
          href="/"
          className="btn btn-outline btn-block"
          style={{ marginTop: 14, justifyContent: "center" }}
        >
          Volver al sitio
        </Link>
      </div>
    </div>
  );
}
