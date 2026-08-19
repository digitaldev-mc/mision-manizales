"use client";

import { useState } from "react";
import { AddProductForm } from "@/components/admin/AddProductForm";
import { toggleProductAction } from "@/app/(admin)/admin/(panel)/actions";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  priceCOP: number;
  imageUrl: string;
  thermometerPercent: number;
  stock: number;
  active: boolean;
};

function cop(n: number) {
  return `$${n.toLocaleString("es-CO")}`;
}

export function AdminProductosPanel({ initialProducts }: { initialProducts: ProductRow[] }) {
  const [products, setProducts] = useState(initialProducts);

  return (
    <>
      <div className="admin-panel-card">
        <h2>Agregar producto</h2>
        <AddProductForm
          onCreated={(product) => {
            setProducts((prev) => {
              if (prev.some((p) => p.id === product.id)) return prev;
              return [product, ...prev];
            });
          }}
        />
      </div>

      <div className="admin-panel-card">
        <h2>Catálogo ({products.length})</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Precio</th>
                <th>% Termómetro</th>
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
                  <td>{p.thermometerPercent}%</td>
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
