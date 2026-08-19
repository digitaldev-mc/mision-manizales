"use client";

import { useEffect, useState } from "react";

export function BoldReturnConfirm({
  reference,
  txStatus,
  isStore = false,
}: {
  reference?: string;
  txStatus?: string;
  isStore?: boolean;
}) {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!reference || !txStatus) return;

    fetch("/api/pagos/bold/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referenceCode: reference, txStatus }),
    })
      .then(async (res) => {
        const data = (await res.json()) as { status?: string; error?: string; type?: string };
        if (data.status === "confirmed") {
          setMessage(
            isStore
              ? "Tu pago con Bold quedó confirmado. ¡Gracias por apoyar Misión Comparte!"
              : "Tu pago con Bold quedó confirmado. ¡Gracias por tu aporte!",
          );
        } else if (txStatus.toLowerCase() !== "approved") {
          setMessage(
            isStore
              ? "El pago no se completó. Puedes intentar de nuevo desde el carrito."
              : "El pago no se completó. Puedes intentar de nuevo desde Donar.",
          );
        }
      })
      .catch(() => {});
  }, [reference, txStatus, isStore]);

  if (!message) return null;

  return (
    <p style={{ marginTop: 12, color: "#2d6a4f", fontWeight: 600 }}>
      {message}
    </p>
  );
}
