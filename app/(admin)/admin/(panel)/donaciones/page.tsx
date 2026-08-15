import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ConfirmDonationButton } from "@/components/admin/ConfirmDonationButton";

export const dynamic = "force-dynamic";

function cop(n: number) {
  return `$${n.toLocaleString("es-CO")}`;
}

function statusBadge(status: string) {
  const cls =
    status === "confirmed"
      ? "badge-confirmed"
      : status === "failed"
        ? "badge-failed"
        : "badge-pending";
  return <span className={`badge ${cls}`}>{status}</span>;
}

export default async function AdminDonacionesPage() {
  const session = await auth();
  const canConfirm = session?.user.role === "SUPERADMIN" || session?.user.role === "FINANZAS";

  const donations = await prisma.donation.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      referenceCode: true,
      fullName: true,
      email: true,
      phone: true,
      amountCOP: true,
      status: true,
      paymentMethod: true,
      createdAt: true,
    },
  });

  const pending = donations.filter((d) => d.status === "pending").length;
  const confirmed = donations.filter((d) => d.status === "confirmed").length;
  const totalConfirmed = donations
    .filter((d) => d.status === "confirmed")
    .reduce((s, d) => s + d.amountCOP, 0);

  return (
    <>
      <div className="admin-grid-stats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <div className="admin-stat-card">
          <div className="label">Registros</div>
          <div className="value">{donations.length}</div>
        </div>
        <div className="admin-stat-card">
          <div className="label">Pendientes</div>
          <div className="value">{pending}</div>
        </div>
        <div className="admin-stat-card">
          <div className="label">Confirmadas</div>
          <div className="value">{confirmed}</div>
        </div>
        <div className="admin-stat-card">
          <div className="label">Monto confirmado</div>
          <div className="value" style={{ fontSize: "1.35rem" }}>
            {cop(totalConfirmed)}
          </div>
        </div>
      </div>

      <div className="admin-panel-card">
        <h2>Listado de donaciones</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Referencia</th>
                <th>Donante</th>
                <th>Contacto</th>
                <th>Monto</th>
                <th>Método</th>
                <th>Estado</th>
                <th>Fecha</th>
                {canConfirm ? <th>Acción</th> : null}
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <tr key={d.id}>
                  <td>
                    <code style={{ fontSize: "0.78rem" }}>{d.referenceCode}</code>
                  </td>
                  <td>{d.fullName}</td>
                  <td>
                    <div>{d.email}</div>
                    <div style={{ color: "#7a8896", fontSize: "0.78rem" }}>{d.phone}</div>
                  </td>
                  <td>{cop(d.amountCOP)}</td>
                  <td>{d.paymentMethod}</td>
                  <td>{statusBadge(d.status)}</td>
                  <td>{d.createdAt.toLocaleString("es-CO")}</td>
                  {canConfirm ? (
                    <td>
                      {d.status === "pending" ? <ConfirmDonationButton id={d.id} /> : "—"}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
