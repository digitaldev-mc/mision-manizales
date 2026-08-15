import { prisma } from "@/lib/prisma";
import { addProductAction, toggleProductAction } from "../actions";

export const dynamic = "force-dynamic";

function cop(n: number) {
  return `$${n.toLocaleString("es-CO")}`;
}

export default async function AdminProductosPage() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <>
      <div className="admin-panel-card">
        <h2>Agregar producto</h2>
        <form action={addProductAction} className="admin-form-grid">
          <div className="field">
            <label htmlFor="name">Nombre</label>
            <input id="name" name="name" required placeholder="Empanada solidaria" />
          </div>
          <div className="field">
            <label htmlFor="priceCOP">Precio (COP)</label>
            <input id="priceCOP" name="priceCOP" type="number" min={1000} step={500} required />
          </div>
          <div className="field full">
            <label htmlFor="description">Descripción</label>
            <textarea id="description" name="description" rows={3} placeholder="Detalle del producto" />
          </div>
          <div className="field full">
            <label htmlFor="imageUrl">URL imagen (opcional)</label>
            <input id="imageUrl" name="imageUrl" placeholder="/assets/empanada-foto.png" />
          </div>
          <div className="full">
            <button type="submit" className="btn btn-primary">
              Crear producto
            </button>
          </div>
        </form>
      </div>

      <div className="admin-panel-card">
        <h2>Catálogo ({products.length})</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.imageUrl}
                        alt=""
                        style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover" }}
                      />
                      <div>
                        <strong>{p.name}</strong>
                        <div style={{ fontSize: "0.78rem", color: "#7a8896" }}>{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td>{cop(p.priceCOP)}</td>
                  <td>{p.stock}</td>
                  <td>
                    <span className={`badge ${p.active ? "badge-confirmed" : "badge-failed"}`}>
                      {p.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <form action={toggleProductAction.bind(null, p.id)}>
                      <button type="submit" className="btn btn-outline btn-sm">
                        {p.active ? "Desactivar" : "Activar"}
                      </button>
                    </form>
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
