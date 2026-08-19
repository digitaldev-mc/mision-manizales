import Link from "next/link";
import { BoldReturnConfirm } from "@/components/v2/BoldReturnConfirm";

export default async function GraciasPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; metodo?: string; "bold-tx-status"?: string }>;
}) {
  const params = await searchParams;
  const ref = params.ref;
  const metodo = params.metodo;
  const boldStatus = params["bold-tx-status"];

  return (
    <div className="wrap" style={{ padding: "80px 24px", textAlign: "center" }}>
      <h1>¡Gracias por tu aporte!</h1>
      <p style={{ marginTop: 12, color: "#5a6875" }}>
        Tu donación fue registrada{ref ? ` con referencia ${ref}` : ""}.
        {metodo === "bold"
          ? " Si completaste el pago en Bold, la confirmación puede tardar unos segundos."
          : " El termómetro subirá cuando el pago quede confirmado."}
      </p>
      {metodo === "bold" ? (
        <BoldReturnConfirm reference={ref} txStatus={boldStatus} />
      ) : null}
      <Link href="/" className="btn btn-primary" style={{ marginTop: 24 }}>
        Volver al inicio
      </Link>
    </div>
  );
}
