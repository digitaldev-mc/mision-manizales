"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";

export function HistoriaImageForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadKey, setUploadKey] = useState(0);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const fileInput = e.currentTarget.querySelector<HTMLInputElement>('input[type="file"]');
      const file = fileInput?.files?.[0];
      if (!file || file.size === 0) {
        throw new Error("Selecciona una imagen antes de agregar al carrusel");
      }

      const uploadBody = new FormData();
      uploadBody.append("file", file);
      uploadBody.append("folder", "historia");
      uploadBody.append("optimize", "1");

      const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: uploadBody });
      const uploadData = (await uploadRes.json()) as { url?: string; error?: string; optimized?: boolean };
      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error ?? "No se pudo subir la imagen");
      }

      const saveRes = await fetch("/api/admin/historia-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: uploadData.url }),
      });
      const saveData = (await saveRes.json()) as { error?: string };
      if (!saveRes.ok) throw new Error(saveData.error ?? "No se pudo agregar al carrusel");

      e.currentTarget.reset();
      setUploadKey((k) => k + 1);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir imagen");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="admin-form-grid" onSubmit={onSubmit}>
      <div className="field full" key={uploadKey}>
        <AdminImageUpload name="imageUrl" label="Subir imagen" />
        <p style={{ fontSize: "0.78rem", color: "#7a8896", marginTop: 6 }}>
          Se optimiza automáticamente (WebP, máx. 1920px) al agregar al carrusel.
        </p>
      </div>
      {error ? (
        <div className="full">
          <p className="err" style={{ display: "block" }}>
            {error}
          </p>
        </div>
      ) : null}
      <div className="field full">
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
          {busy ? "Optimizando y subiendo…" : "Agregar al carrusel"}
        </button>
      </div>
    </form>
  );
}
