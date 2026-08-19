"use client";

import { useState } from "react";
import { AddPartnerForm } from "@/components/admin/AddPartnerForm";
import { deletePartnerAction } from "@/app/(admin)/admin/(panel)/actions";

type PartnerRow = {
  id: string;
  name: string;
  logoUrl: string | null;
  active: boolean;
};

export function PartnersPanel({ initialPartners }: { initialPartners: PartnerRow[] }) {
  const [partners, setPartners] = useState(initialPartners);

  return (
    <>
      <AddPartnerForm
        onCreated={(partner) => {
          setPartners((prev) => {
            if (prev.some((p) => p.id === partner.id)) return prev;
            return [...prev, partner];
          });
        }}
      />
      <div className="admin-row-list" style={{ marginTop: 20 }}>
        {partners.map((p) => (
          <div className="admin-item" key={p.id}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {p.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.logoUrl} alt="" style={{ width: 56, height: 40, objectFit: "contain" }} />
              ) : null}
              <div>
                <strong>{p.name}</strong>
                <div className="meta">{p.active ? "Visible" : "Oculto"}</div>
              </div>
            </div>
            <form
              action={deletePartnerAction.bind(null, p.id)}
              onSubmit={() => setPartners((prev) => prev.filter((x) => x.id !== p.id))}
            >
              <button type="submit" className="btn btn-danger btn-sm">
                Eliminar
              </button>
            </form>
          </div>
        ))}
      </div>
    </>
  );
}
