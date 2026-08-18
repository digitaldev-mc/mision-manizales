import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ConfirmDonationButton } from "@/components/admin/ConfirmDonationButton";
import { DeleteDonationForm } from "@/components/admin/DeleteDonationForm";
import { addManualDonationAction } from "../actions";

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

      {canConfirm ? (
        <div className="admin-panel-card">
          <h2>Registrar donación manual</h2>
          <p style={{ color: "#7a8896", fontSize: "0.88rem", marginBottom: 16 }}>
            Queda confirmada de inmediato y suma al termómetro del sitio.
          </p>
          <form action={addManualDonationAction} className="admin-form-grid">
            <div className="field">
              <label htmlFor="manual-name">Nombre del donante</label>
              <input id="manual-name" name="fullName" required />
            </div>
            <div className="field">
              <label htmlFor="manual-amount">Monto (COP)</label>
              <input id="manual-amount" name="amountCOP" type="number" min={1000} step={1000} required />
            </div>
            <div className="field">
              <label htmlFor="manual-email">Correo (opcional)</label>
              <input id="manual-email" name="email" type="email" />
            </div>
            <div className="field">
              <label htmlFor="manual-phone">Teléfono (opcional)</label>
              <input id="manual-phone" name="phone" />
            </div>
            <div className="field">
              <label htmlFor="manual-method">Método</label>
              <select id="manual-method" name="paymentMethod" defaultValue="transferencia">
                <option value="transferencia">Transferencia</option>
                <option value="paypal">PayPal</option>
                <option value="pse">PSE</option>
              </select>
            </div>
            <div className="field full">
              <label htmlFor="manual-note">Nota / referencia interna</label>
              <input id="manual-note" name="note" placeholder="Ej. consignación Bancolombia 18/08" />
            </div>
            <div className="full">
              <button type="submit" className="btn btn-primary">
                Registrar donación confirmada
              </button>
            </div>
          </form>
        </div>
      ) : null}

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
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 140 }}>
                        {d.status === "pending" ? <ConfirmDonationButton id={d.id} /> : null}
                        <DeleteDonationForm id={d.id} referenceCode={d.referenceCode} />
                      </div>
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
