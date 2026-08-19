"use client";

import { useState } from "react";
import { HistoriaImageForm } from "@/components/admin/HistoriaImageForm";
import { deleteHistoriaImageAction } from "@/app/(admin)/admin/(panel)/actions";

export function HistoriaGalleryPanel({
  initialImages,
}: {
  initialImages: string[];
}) {
  const [images, setImages] = useState(initialImages);

  return (
    <>
      <HistoriaImageForm
        onAdded={(url) => {
          setImages((prev) => [...prev.filter((u) => u !== url), url]);
        }}
      />
      <div className="admin-row-list" style={{ marginTop: 20 }}>
        {images.map((url) => (
          <div className="admin-item" key={url}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" style={{ width: 64, height: 48, objectFit: "cover", borderRadius: 8 }} />
              <code style={{ fontSize: "0.75rem" }}>{url}</code>
            </div>
            <form
              action={deleteHistoriaImageAction}
              onSubmit={() => {
                setImages((prev) => prev.filter((u) => u !== url));
              }}
            >
              <input type="hidden" name="imageUrl" value={url} />
              <button type="submit" className="btn btn-danger btn-sm">
                Quitar
              </button>
            </form>
          </div>
        ))}
      </div>
    </>
  );
}
