"use client";

import { useEffect, useRef, useState } from "react";
import { IMAGE_ACCEPT, IMAGE_FORMATS_LABEL } from "@/lib/upload/constants";

type AdminImageUploadProps = {
  name?: string;
  label?: string;
  defaultUrl?: string;
  required?: boolean;
};

export function AdminImageUpload({
  name = "imageUrl",
  label = "Imagen",
  defaultUrl = "",
  required = false,
}: AdminImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(defaultUrl);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  function onFileChange(file: File | undefined) {
    if (!file) return;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    const local = URL.createObjectURL(file);
    setObjectUrl(local);
    setPreview(local);
  }

  return (
    <div className="field full">
      <label>{label}</label>
      {defaultUrl && !objectUrl ? <input type="hidden" name={name} value={defaultUrl} /> : null}
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
            name="file"
            accept={IMAGE_ACCEPT}
            required={required}
            onChange={(e) => onFileChange(e.target.files?.[0])}
          />
          <p style={{ fontSize: "0.78rem", color: "#7a8896", marginTop: 6 }}>
            {IMAGE_FORMATS_LABEL}
          </p>
        </div>
      </div>
    </div>
  );
}
