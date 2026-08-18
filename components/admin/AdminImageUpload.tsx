"use client";

import { useRef, useState } from "react";

type AdminImageUploadProps = {
  name?: string;
  label?: string;
  folder: string;
  defaultUrl?: string;
  onUploaded?: (url: string) => void;
};

export function AdminImageUpload({
  name = "imageUrl",
  label = "Imagen",
  folder,
  defaultUrl = "",
  onUploaded,
}: AdminImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(defaultUrl);
  const [hiddenUrl, setHiddenUrl] = useState(defaultUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFileChange(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", folder);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Error al subir");
      setPreview(data.url);
      setHiddenUrl(data.url);
      onUploaded?.(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="field full">
      <label>{label}</label>
      <input type="hidden" name={name} value={hiddenUrl} />
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt=""
            style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 12, border: "1px solid #e5e0d2" }}
          />
        ) : null}
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            disabled={busy}
            onChange={(e) => onFileChange(e.target.files?.[0])}
          />
          <p style={{ fontSize: "0.78rem", color: "#7a8896", marginTop: 6 }}>
            {busy ? "Subiendo…" : "JPG, PNG o WebP · máx. 5 MB"}
          </p>
        </div>
      </div>
      {error ? <p className="err" style={{ display: "block", marginTop: 8 }}>{error}</p> : null}
    </div>
  );
}
