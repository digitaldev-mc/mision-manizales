"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { addProductAction } from "@/app/(admin)/admin/(panel)/actions";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";

export function AddProductForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadKey, setUploadKey] = useState(0);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 8000);
    return () => clearTimeout(t);
  }, [error]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const form = e.currentTarget;
      const fd = new FormData(form);
      const file = fd.get("file");

      if (file instanceof File && file.size > 0) {
        const uploadBody = new FormData();
        uploadBody.append("file", file);
        uploadBody.append("folder", "productos");
        const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: uploadBody });
        const uploadData = (await uploadRes.json()) as { url?: string; error?: string };
        if (!uploadRes.ok || !uploadData.url) {
          throw new Error(uploadData.error ?? "No se pudo subir la imagen");
        }
        fd.set("imageUrl", uploadData.url);
      }

      fd.delete("file");

      const name = String(fd.get("name") ?? "").trim();
      const priceCOP = Number(fd.get("priceCOP"));
      if (!name || !Number.isFinite(priceCOP) || priceCOP <= 0) {
        throw new Error("Nombre y precio válidos son obligatorios");
      }

      await addProductAction(fd);
      form.reset();
      setUploadKey((k) => k + 1);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el producto");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="admin-form-grid" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="name">Nombre</label>
        <input id="name" name="name" required placeholder="Empanada solidaria" disabled={busy} />
      </div>
      <div className="field">
        <label htmlFor="priceCOP">Precio (COP)</label>
        <input
          id="priceCOP"
          name="priceCOP"
          type="number"
          min={1000}
          step={500}
          required
          disabled={busy}
        />
      </div>
      <div className="field full">
        <label htmlFor="description">Descripción</label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Detalle del producto"
          disabled={busy}
        />
      </div>
      <div className="field full" key={uploadKey}>
        <AdminImageUpload name="imageUrl" label="Imagen del producto" />
      </div>
      {error ? (
        <div className="full">
          <p className="err" style={{ display: "block" }}>
            {error}
          </p>
        </div>
      ) : null}
      <div className="full">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Guardando…" : "Crear producto"}
        </button>
      </div>
    </form>
  );
}
