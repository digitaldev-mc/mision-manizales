"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";

export function AddProductForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadKey, setUploadKey] = useState(0);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 10000);
    return () => clearTimeout(t);
  }, [error]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const form = e.currentTarget;
      const fileInput = form.querySelector<HTMLInputElement>('input[type="file"]');
      const file = fileInput?.files?.[0];

      if (!file || file.size === 0) {
        throw new Error("Selecciona una imagen (JPEG, JPG, PNG, etc.)");
      }

      const body = new FormData();
      body.append("name", String(new FormData(form).get("name") ?? ""));
      body.append("priceCOP", String(new FormData(form).get("priceCOP") ?? ""));
      body.append("description", String(new FormData(form).get("description") ?? ""));
      body.append("file", file);

      const res = await fetch("/api/admin/products", { method: "POST", body });
      const data = (await res.json()) as {
        ok?: boolean;
        imageUrl?: string;
        error?: string;
        product?: { name: string };
      };

      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "No se pudo crear el producto");
      }

      setSuccess(`Producto "${data.product?.name ?? ""}" creado con imagen ${data.imageUrl ?? ""}`);
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
    <form className="admin-form-grid" onSubmit={onSubmit} encType="multipart/form-data">
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
        <AdminImageUpload name="imageUrl" label="Imagen del producto (obligatoria)" required />
        <p style={{ fontSize: "0.78rem", color: "#7a8896", marginTop: 6 }}>
          Acepta JPEG/JPG, PNG, WebP y más. Se optimiza a JPG al subir.
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
      <div className="full">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Subiendo imagen y guardando…" : "Crear producto"}
        </button>
      </div>
    </form>
  );
}
