"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { parseJsonResponse, resetFormElement } from "@/lib/admin/client-fetch";

type CreatedPartner = {
  id: string;
  name: string;
  logoUrl: string | null;
  active: boolean;
};

export function AddPartnerForm({ onCreated }: { onCreated?: (partner: CreatedPartner) => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadKey, setUploadKey] = useState(0);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.querySelector<HTMLInputElement>('input[type="file"]');
    const file = fileInput?.files?.[0];

    setBusy(true);
    setError("");
    setSuccess("");

    const body = new FormData(form);
    if (file && file.size > 0) {
      body.set("file", file);
    }

    try {
      const res = await fetch("/api/admin/partners", { method: "POST", body });
      const data = await parseJsonResponse<{ ok?: boolean; error?: string; partner?: CreatedPartner }>(res);

      if (!res.ok || !data.ok || !data.partner) {
        throw new Error(data.error ?? "No se pudo agregar el aliado");
      }

      setSuccess(`Aliado "${data.partner.name}" agregado correctamente.`);
      resetFormElement(form);
      setUploadKey((k) => k + 1);
      onCreated?.(data.partner);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al agregar aliado");
    } finally {
      setBusy(false);
    }
  }

  const disabled = busy || isPending;

  return (
    <form className="admin-form-grid" onSubmit={onSubmit} encType="multipart/form-data">
      <div className="field">
        <label htmlFor="partner-name">Nombre</label>
        <input id="partner-name" name="name" required disabled={disabled} />
      </div>
      <div className="field full" key={uploadKey}>
        <AdminImageUpload name="logoUrl" label="Logo del aliado" />
      </div>
      {error ? (
        <div className="full">
          <p className="err" style={{ display: "block" }}>
            {error}
          </p>
        </div>
      ) : null}
      {success ? (
        <div className="full">
          <p style={{ color: "#2d6a4f", fontSize: "0.88rem" }}>{success}</p>
        </div>
      ) : null}
      <div className="full">
        <button type="submit" className="btn btn-primary btn-sm" disabled={disabled}>
          {disabled ? "Subiendo logo…" : "Agregar aliado"}
        </button>
      </div>
    </form>
  );
}
