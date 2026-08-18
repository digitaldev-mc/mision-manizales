"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminRole } from "@prisma/client";
import { logoutAction } from "@/app/(admin)/admin/(panel)/actions";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "📊", exact: true },
  { href: "/admin/donaciones", label: "Donaciones", icon: "💛" },
  { href: "/admin/pedidos", label: "Pedidos", icon: "🛍️" },
  { href: "/admin/productos", label: "Productos", icon: "🫓" },
  { href: "/admin/contenido", label: "Contenido", icon: "📰" },
  { href: "/admin/termometro", label: "Termómetro", icon: "🌡️" },
  { href: "/admin/pagos", label: "Pagos", icon: "💳" },
];

const PAGE_META: Record<string, { title: string; subtitle?: string }> = {
  "/admin": { title: "Dashboard", subtitle: "Vista general de la campaña Misión Comparte" },
  "/admin/donaciones": { title: "Donaciones", subtitle: "Aportes recibidos y confirmación manual" },
  "/admin/pedidos": { title: "Pedidos", subtitle: "Tienda solidaria y estados de entrega" },
  "/admin/productos": { title: "Productos", subtitle: "Catálogo de la tienda" },
  "/admin/contenido": { title: "Contenido", subtitle: "Historias, eventos y aliados del sitio" },
  "/admin/termometro": { title: "Termómetro", subtitle: "Meta de recaudo y ajustes manuales" },
  "/admin/pagos": { title: "Pagos", subtitle: "Enlaces PayPal, Bold y datos bancarios" },
};

type AdminShellProps = {
  user: { name: string; email: string; role: AdminRole };
  children: React.ReactNode;
};

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ user, children }: AdminShellProps) {
  const pathname = usePathname();
  const meta = PAGE_META[pathname] ?? { title: "Admin", subtitle: "Misión Comparte" };

  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/sello-catedral.png" alt="" />
          <div>
            <strong>Misión Comparte</strong>
            <span>Panel admin</span>
          </div>
        </div>
        <nav className="admin-nav">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(pathname, item.href, item.exact) ? "active" : undefined}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <Link href="/" className="admin-nav" style={{ padding: 0 }}>
            <span style={{ display: "block", padding: "10px 14px", opacity: 0.85 }}>← Ver sitio público</span>
          </Link>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-header">
          <div>
            <h1>{meta.title}</h1>
            {meta.subtitle ? <p className="admin-header-meta">{meta.subtitle}</p> : null}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ textAlign: "right", fontSize: "0.82rem" }}>
              <strong>{user.name}</strong>
              <div style={{ color: "#7a8896" }}>{user.role}</div>
            </div>
            <form action={logoutAction}>
              <button type="submit" className="btn btn-outline btn-sm">
                Salir
              </button>
            </form>
          </div>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
