"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { parseJsonResponse, resetFormElement } from "@/lib/admin/client-fetch";

export function HistoriaImageForm({ onAdded }: { onAdded?: (imageUrl: string) => void }) {
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

    if (!file || file.size === 0) {
      setError("Selecciona una imagen antes de agregar al carrusel");
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const uploadBody = new FormData();
      uploadBody.append("file", file);
      uploadBody.append("folder", "historia");
      uploadBody.append("optimize", "1");

      const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: uploadBody });
      const uploadData = await parseJsonResponse<{ url?: string; error?: string }>(uploadRes);
      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error ?? "No se pudo subir la imagen");
      }

      const saveRes = await fetch("/api/admin/historia-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: uploadData.url }),
      });
      const saveData = await parseJsonResponse<{ ok?: boolean; error?: string; url?: string }>(saveRes);
      if (!saveRes.ok || !saveData.ok) {
        throw new Error(saveData.error ?? "No se pudo agregar al carrusel");
      }

      setSuccess("Imagen agregada al carrusel.");
      resetFormElement(form);
      setUploadKey((k) => k + 1);
      onAdded?.(uploadData.url);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir imagen");
    } finally {
      setBusy(false);
    }
  }

  const disabled = busy || isPending;

  return (
    <form className="admin-form-grid" onSubmit={onSubmit}>
      <div className="field full" key={uploadKey}>
        <AdminImageUpload name="imageUrl" label="Subir imagen" />
        <p style={{ fontSize: "0.78rem", color: "#7a8896", marginTop: 6 }}>
          Se optimiza automáticamente (JPG, máx. 1920px) al agregar al carrusel.
        </p>
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
      <div className="field full">
        <button type="submit" className="btn btn-primary btn-sm" disabled={disabled}>
          {disabled ? "Optimizando y subiendo…" : "Agregar al carrusel"}
        </button>
      </div>
    </form>
  );
}
