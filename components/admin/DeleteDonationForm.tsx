"use client";

import { useState, useTransition } from "react";
import { deleteDonationAction } from "@/app/(admin)/admin/(panel)/actions";

export function DeleteDonationForm({
  id,
  referenceCode,
}: {
  id: string;
  referenceCode: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [pending, startTransition] = useTransition();
  const canDelete = confirmText === "ELIMINAR";

  if (!open) {
    return (
      <button
        type="button"
        className="btn btn-sm"
        style={{ color: "#b42318", borderColor: "#fecdca" }}
        onClick={() => setOpen(true)}
      >
        Eliminar
      </button>
    );
  }

  return (
    <form
      className="admin-delete-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canDelete) return;
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          await deleteDonationAction(fd);
          setOpen(false);
          setConfirmText("");
        });
      }}
    >
      <input type="hidden" name="id" value={id} />
      <p style={{ margin: "0 0 8px", fontSize: "0.78rem", color: "#7a8896" }}>
        {referenceCode}
      </p>
      <input
        name="confirmText"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder='Escribe ELIMINAR'
        autoComplete="off"
        style={{ width: "100%", marginBottom: 6, fontSize: "0.82rem" }}
      />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button
          type="submit"
          className="btn btn-sm"
          disabled={pending || !canDelete}
          style={{ color: "#b42318", borderColor: "#fecdca" }}
        >
          {pending ? "…" : "Confirmar"}
        </button>
        <button
          type="button"
          className="btn btn-sm"
          disabled={pending}
          onClick={() => {
            setOpen(false);
            setConfirmText("");
          }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
