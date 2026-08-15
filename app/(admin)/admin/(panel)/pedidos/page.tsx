import { prisma } from "@/lib/prisma";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";

export const dynamic = "force-dynamic";

function cop(n: number) {
  return `$${n.toLocaleString("es-CO")}`;
}

export default async function AdminPedidosPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
    include: {
      items: {
        include: { product: { select: { name: true } } },
      },
    },
  });

  return (
    <>
      <div className="admin-grid-stats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
        <div className="admin-stat-card">
          <div className="label">Total pedidos</div>
          <div className="value">{orders.length}</div>
        </div>
        <div className="admin-stat-card">
          <div className="label">Pendientes</div>
          <div className="value">{orders.filter((o) => o.status === "pending").length}</div>
        </div>
        <div className="admin-stat-card">
          <div className="label">En curso</div>
          <div className="value">
            {orders.filter((o) => ["paid", "preparing", "shipped"].includes(o.status)).length}
          </div>
        </div>
      </div>

      <div className="admin-panel-card">
        <h2>Pedidos de la tienda</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Referencia</th>
                <th>Cliente</th>
                <th>Productos</th>
                <th>Total</th>
                <th>Pago</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Actualizar</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <code style={{ fontSize: "0.78rem" }}>{o.referenceCode}</code>
                  </td>
                  <td>
                    <div>{o.fullName}</div>
                    <div style={{ fontSize: "0.78rem", color: "#7a8896" }}>{o.email}</div>
                  </td>
                  <td style={{ maxWidth: 220 }}>
                    {o.items.map((i) => (
                      <div key={i.id} style={{ fontSize: "0.8rem" }}>
                        {i.quantity}× {i.product.name}
                      </div>
                    ))}
                  </td>
                  <td>{cop(o.totalCOP)}</td>
                  <td>{o.paymentMethod}</td>
                  <td>
                    <span className={`badge badge-${o.status === "pending" ? "pending" : "paid"}`}>{o.status}</span>
                  </td>
                  <td>{o.createdAt.toLocaleString("es-CO")}</td>
                  <td>
                    <OrderStatusSelect id={o.id} status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
