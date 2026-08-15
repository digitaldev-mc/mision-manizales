"use client";

import { useFormStatus } from "react-dom";
import { updateOrderStatusAction } from "@/app/(admin)/admin/(panel)/actions";

const STATUSES = ["pending", "paid", "preparing", "shipped", "delivered", "cancelled"];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-outline btn-sm" disabled={pending}>
      {pending ? "…" : "OK"}
    </button>
  );
}

export function OrderStatusSelect({ id, status }: { id: string; status: string }) {
  return (
    <form action={updateOrderStatusAction} style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <input type="hidden" name="id" value={id} />
      <select name="status" defaultValue={status} style={{ fontSize: "0.78rem", padding: "6px 8px", borderRadius: 8 }}>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <SubmitButton />
    </form>
  );
}
