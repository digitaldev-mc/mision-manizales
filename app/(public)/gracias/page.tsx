import Link from "next/link";

export default async function GraciasPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  return (
    <div className="wrap" style={{ padding: "80px 24px", textAlign: "center" }}>
      <h1>¡Gracias por tu aporte!</h1>
      <p style={{ marginTop: 12, color: "#5a6875" }}>
        Tu donación fue registrada{ref ? ` con referencia ${ref}` : ""}. El termómetro
        subirá cuando el pago quede confirmado.
      </p>
      <Link href="/" className="btn btn-primary" style={{ marginTop: 24 }}>
        Volver al inicio
      </Link>
    </div>
  );
}
