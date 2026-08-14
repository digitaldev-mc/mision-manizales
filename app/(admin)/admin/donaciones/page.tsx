import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDonacionesPage() {
  const donations = await prisma.donation.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      referenceCode: true,
      fullName: true,
      email: true,
      amountCOP: true,
      status: true,
      paymentMethod: true,
      createdAt: true,
    },
  });

  return (
    <div className="admin-panel" style={{ margin: 24 }}>
      <Link href="/admin">← Dashboard</Link>
      <h1 style={{ marginTop: 16 }}>Donaciones</h1>
      <table style={{ width: "100%", marginTop: 20, fontSize: "0.85rem" }}>
        <thead>
          <tr>
            <th align="left">Referencia</th>
            <th align="left">Nombre</th>
            <th align="left">Monto</th>
            <th align="left">Estado</th>
            <th align="left">Método</th>
          </tr>
        </thead>
        <tbody>
          {donations.map((d) => (
            <tr key={d.id}>
              <td>{d.referenceCode}</td>
              <td>{d.fullName}</td>
              <td>${d.amountCOP.toLocaleString("es-CO")}</td>
              <td>{d.status}</td>
              <td>{d.paymentMethod}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
