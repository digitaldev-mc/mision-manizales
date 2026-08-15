import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function cop(n: number) {
  return `$${n.toLocaleString("es-CO")}`;
}

export default async function AdminDashboardPage() {
  const [
    donationStats,
    orderStats,
    productCount,
    pendingDonations,
    pendingOrders,
    settings,
    recentDonations,
    recentOrders,
  ] = await Promise.all([
    prisma.donation.aggregate({
      _count: true,
      _sum: { amountCOP: true },
      where: { status: "confirmed" },
    }),
    prisma.order.aggregate({
      _count: true,
      _sum: { totalCOP: true },
      where: { status: { in: ["paid", "preparing", "shipped", "delivered"] } },
    }),
    prisma.product.count({ where: { active: true } }),
    prisma.donation.count({ where: { status: "pending" } }),
    prisma.order.count({ where: { status: "pending" } }),
    prisma.thermometerSetting.findUnique({ where: { id: 1 } }),
    prisma.donation.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { referenceCode: true, fullName: true, amountCOP: true, status: true, createdAt: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { referenceCode: true, fullName: true, totalCOP: true, status: true, createdAt: true },
    }),
  ]);

  const goalCOP = settings?.goalCOP ?? 500_000_000;
  const manualAdjustCOP = settings?.manualAdjustCOP ?? 0;
  const raisedCOP =
    (donationStats._sum.amountCOP ?? 0) + (orderStats._sum.totalCOP ?? 0) + manualAdjustCOP;
  const percent = goalCOP > 0 ? Math.min(100, Math.round((raisedCOP / goalCOP) * 100)) : 0;

  return (
    <>
      <div className="admin-grid-stats">
        <div className="admin-stat-card">
          <div className="label">Recaudo total</div>
          <div className="value">{cop(raisedCOP)}</div>
          <div className="hint">{percent}% de la meta</div>
        </div>
        <div className="admin-stat-card">
          <div className="label">Donaciones confirmadas</div>
          <div className="value">{donationStats._count}</div>
          <div className="hint">{pendingDonations} pendientes</div>
        </div>
        <div className="admin-stat-card">
          <div className="label">Pedidos pagados</div>
          <div className="value">{orderStats._count}</div>
          <div className="hint">{pendingOrders} por confirmar</div>
        </div>
        <div className="admin-stat-card">
          <div className="label">Productos activos</div>
          <div className="value">{productCount}</div>
          <div className="hint">Meta: {cop(goalCOP)}</div>
        </div>
      </div>

      <div className="admin-progress-bar-wrap admin-panel-card">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <strong>Progreso del termómetro</strong>
          <span style={{ color: "#7a8896", fontSize: "0.85rem" }}>{percent}% · {cop(raisedCOP)} / {cop(goalCOP)}</span>
        </div>
        <div className="admin-progress-track">
          <div className="admin-progress-fill" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
        <div className="admin-panel-card">
          <h2>Últimas donaciones</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ref.</th>
                  <th>Nombre</th>
                  <th>Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {recentDonations.map((d) => (
                  <tr key={d.referenceCode}>
                    <td>{d.referenceCode}</td>
                    <td>{d.fullName}</td>
                    <td>{cop(d.amountCOP)}</td>
                    <td>
                      <span className={`badge badge-${d.status === "confirmed" ? "confirmed" : "pending"}`}>
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-panel-card">
          <h2>Últimos pedidos</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ref.</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.referenceCode}>
                    <td>{o.referenceCode}</td>
                    <td>{o.fullName}</td>
                    <td>{cop(o.totalCOP)}</td>
                    <td>
                      <span className={`badge badge-${o.status === "pending" ? "pending" : "paid"}`}>{o.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
