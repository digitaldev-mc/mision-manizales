import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  const [donations, orders, products] = await Promise.all([
    prisma.donation.count(),
    prisma.order.count(),
    prisma.product.count(),
  ]);

  return (
    <div className="admin-shell">
      <div className="admin-top">
        <div>⚙️ Misión Manizales · Admin</div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/" className="btn btn-ghost btn-sm">
            Ver sitio
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button type="submit" className="btn btn-ghost btn-sm">
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
      <div className="admin-panel">
        <h1>Bienvenido, {session.user.name}</h1>
        <p style={{ color: "#7a8896", marginTop: 8 }}>Rol: {session.user.role}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 24 }}>
          <div className="stat-box">
            <div className="label">Donaciones</div>
            <div className="value">{donations}</div>
          </div>
          <div className="stat-box">
            <div className="label">Pedidos</div>
            <div className="value">{orders}</div>
          </div>
          <div className="stat-box">
            <div className="label">Productos</div>
            <div className="value">{products}</div>
          </div>
        </div>
        <nav style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/admin/donaciones">Donaciones</Link>
          <Link href="/admin/pedidos">Pedidos</Link>
          <Link href="/admin/productos">Productos</Link>
          <Link href="/admin/contenido">Contenido</Link>
          <Link href="/admin/termometro">Termómetro</Link>
        </nav>
      </div>
    </div>
  );
}
