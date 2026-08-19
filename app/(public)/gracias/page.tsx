import Link from "next/link";
import { BoldReturnConfirm } from "@/components/v2/BoldReturnConfirm";

export default async function GraciasPage({
  searchParams,
}: {
  searchParams: Promise<{
    ref?: string;
    metodo?: string;
    tipo?: string;
    "bold-tx-status"?: string;
  }>;
}) {
  const params = await searchParams;
  const ref = params.ref;
  const metodo = params.metodo;
  const tipo = params.tipo;
  const boldStatus = params["bold-tx-status"];
  const isStore = tipo === "tienda";

  return (
    <div className="wrap store-thanks" style={{ padding: "80px 24px", textAlign: "center" }}>
      <h1>{isStore ? "¡Gracias por tu compra!" : "¡Gracias por tu aporte!"}</h1>
      <p style={{ marginTop: 12, color: "#5a6875" }}>
        {isStore
          ? `Tu pedido fue registrado${ref ? ` con referencia ${ref}` : ""}. Te contactaremos para coordinar el domicilio en Manizales.`
          : `Tu donación fue registrada${ref ? ` con referencia ${ref}` : ""}.`}
        {metodo === "bold"
          ? " Si completaste el pago en Bold, la confirmación puede tardar unos segundos."
          : isStore
            ? " El empanadómetro subirá cuando el pago quede confirmado."
            : " El termómetro subirá cuando el pago quede confirmado."}
      </p>
      {metodo === "bold" ? (
        <BoldReturnConfirm reference={ref} txStatus={boldStatus} isStore={isStore} />
      ) : null}
      <Link href={isStore ? "/tienda" : "/"} className="btn btn-primary" style={{ marginTop: 24 }}>
        {isStore ? "Volver a la tienda" : "Volver al inicio"}
      </Link>
    </div>
  );
}
