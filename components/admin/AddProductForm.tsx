"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState, useTransition } from "react";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { parseJsonResponse, resetFormElement } from "@/lib/admin/client-fetch";

type CreatedProduct = {
  id: string;
  name: string;
  slug: string;
  priceCOP: number;
  imageUrl: string;
  thermometerPercent: number;
  stock: number;
  active: boolean;
  soldOut: boolean;
};

export function AddProductForm({ onCreated }: { onCreated?: (product: CreatedProduct) => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadKey, setUploadKey] = useState(0);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 10000);
    return () => clearTimeout(t);
  }, [error]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 8000);
    return () => clearTimeout(t);
  }, [success]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.querySelector<HTMLInputElement>('input[type="file"]');
    const file = fileInput?.files?.[0];

    if (!file || file.size === 0) {
      setError("Selecciona una imagen (JPEG, JPG, PNG, etc.)");
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    const body = new FormData(form);
    body.set("file", file);

    try {
      const res = await fetch("/api/admin/products", { method: "POST", body });
      const data = await parseJsonResponse<{
        ok?: boolean;
        imageUrl?: string;
        error?: string;
        product?: CreatedProduct;
      }>(res);

      if (!res.ok || !data.ok || !data.product) {
        throw new Error(data.error ?? "No se pudo crear el producto");
      }

      setSuccess(`Producto "${data.product.name}" creado correctamente.`);
      resetFormElement(form);
      setUploadKey((k) => k + 1);
      onCreated?.(data.product);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el producto");
    } finally {
      setBusy(false);
    }
  }

  const disabled = busy || isPending;

  return (
    <form className="admin-form-grid" onSubmit={onSubmit} encType="multipart/form-data">
      <div className="field">
        <label htmlFor="name">Nombre</label>
        <input id="name" name="name" required placeholder="Empanada solidaria" disabled={disabled} />
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
          disabled={disabled}
        />
      </div>
      <div className="field">
        <label htmlFor="thermometerPercent">% al empanadómetro</label>
        <input
          id="thermometerPercent"
          name="thermometerPercent"
          type="number"
          min={0}
          max={100}
          step={1}
          defaultValue={20}
          required
          disabled={disabled}
        />
      </div>
      <div className="field full">
        <label htmlFor="description">Descripción</label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Detalle del producto"
          disabled={disabled}
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
        <button type="submit" className="btn btn-primary" disabled={disabled}>
          {disabled ? "Subiendo imagen y guardando…" : "Crear producto"}
        </button>
      </div>
    </form>
  );
}
