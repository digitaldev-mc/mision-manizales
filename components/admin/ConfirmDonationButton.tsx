"use client";

import { useTransition } from "react";
import { confirmDonationAction } from "@/app/(admin)/admin/(panel)/actions";

export function ConfirmDonationButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="btn btn-primary btn-sm"
      disabled={pending}
      onClick={() => startTransition(() => confirmDonationAction(id))}
    >
      {pending ? "…" : "Confirmar"}
    </button>
  );
}
