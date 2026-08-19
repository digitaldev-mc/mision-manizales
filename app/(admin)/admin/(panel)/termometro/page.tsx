import { prisma } from "@/lib/prisma";
import { updateThermometerAction } from "../actions";

export const dynamic = "force-dynamic";

function cop(n: number) {
  return `$${n.toLocaleString("es-CO")}`;
}

export default async function AdminTermometroPage() {
  const [settings, donations, orders] = await Promise.all([
    prisma.thermometerSetting.findUnique({ where: { id: 1 } }),
    prisma.donation.aggregate({
      where: { status: "confirmed" },
      _sum: { amountCOP: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { status: { in: ["paid", "preparing", "shipped", "delivered"] } },
      _sum: { thermometerContributionCOP: true, totalCOP: true },
    }),
  ]);

  const goalCOP = settings?.goalCOP ?? 500_000_000;
  const manualAdjustCOP = settings?.manualAdjustCOP ?? 0;
  const fromDonations = donations._sum.amountCOP ?? 0;
  const fromOrders = orders._sum.thermometerContributionCOP ?? 0;
  const fromOrdersTotal = orders._sum.totalCOP ?? 0;
  const raisedCOP = fromDonations + fromOrders + manualAdjustCOP;
  const percent = goalCOP > 0 ? Math.min(100, Math.round((raisedCOP / goalCOP) * 100)) : 0;

  return (
    <>
      <div className="admin-grid-stats">
        <div className="admin-stat-card">
          <div className="label">Meta</div>
          <div className="value" style={{ fontSize: "1.4rem" }}>
            {cop(goalCOP)}
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="label">Recaudo calculado</div>
          <div className="value" style={{ fontSize: "1.4rem" }}>
            {cop(raisedCOP)}
          </div>
          <div className="hint">{percent}%</div>
        </div>
        <div className="admin-stat-card">
          <div className="label">Donaciones</div>
          <div className="value">{donations._count}</div>
          <div className="hint">{cop(fromDonations)}</div>
        </div>
        <div className="admin-stat-card">
          <div className="label">Tienda</div>
          <div className="value">{cop(fromOrders)}</div>
          <div className="hint">Ventas: {cop(fromOrdersTotal)} · Aporte termómetro: {cop(fromOrders)}</div>
        </div>
      </div>

      <div className="admin-panel-card">
        <h2>Configurar termómetro</h2>
        <p style={{ color: "#7a8896", fontSize: "0.88rem", marginBottom: 20 }}>
          El termómetro suma donaciones confirmadas, el aporte de tienda (según % por producto) y el ajuste manual.
        </p>
        <form action={updateThermometerAction} className="admin-form-grid">
          <div className="field">
            <label htmlFor="goalCOP">Meta de recaudo (COP)</label>
            <input
              id="goalCOP"
              name="goalCOP"
              type="text"
              inputMode="numeric"
              defaultValue={goalCOP}
              placeholder="Ej. 500000000 o 500.000.000"
              required
            />
            <p style={{ fontSize: "0.78rem", color: "#7a8896", marginTop: 6 }}>
              Cualquier monto entero en pesos colombianos, con o sin puntos.
            </p>
          </div>
          <div className="field">
            <label htmlFor="manualAdjustCOP">Ajuste manual (COP)</label>
            <input
              id="manualAdjustCOP"
              name="manualAdjustCOP"
              type="text"
              inputMode="numeric"
              defaultValue={manualAdjustCOP}
              placeholder="0"
            />
          </div>
          <div className="full">
            <button type="submit" className="btn btn-primary">
              Guardar configuración
            </button>
          </div>
        </form>
        <div className="admin-progress-bar-wrap" style={{ marginTop: 24 }}>
          <div className="admin-progress-track">
            <div className="admin-progress-fill" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>
    </>
  );
}
