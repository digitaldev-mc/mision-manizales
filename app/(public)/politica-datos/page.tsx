import Link from "next/link";

export default function PoliticaDatosPage() {
  return (
    <div className="wrap" style={{ padding: "48px 24px", maxWidth: 800 }}>
      <h1>Política de Tratamiento de Datos Personales</h1>
      <p style={{ marginTop: 16 }}>
        Misión Manizales trata los datos personales de donantes y compradores únicamente
        para fines de trazabilidad, confirmación de pagos y cumplimiento legal conforme a
        la Ley 1581 de 2012.
      </p>
      <p style={{ marginTop: 12 }}>
        Para solicitudes de acceso, corrección o eliminación de datos, escribir a{" "}
        <a href="mailto:manizalescomparte@gmail.com">manizalescomparte@gmail.com</a>.
      </p>
      <p style={{ marginTop: 12, color: "#7a8896" }}>
        [Placeholder: responsable del tratamiento y plazo de retención — confirmar con
        asesoría legal del cliente.]
      </p>
      <Link href="/" style={{ display: "inline-block", marginTop: 24 }}>
        ← Volver al inicio
      </Link>
    </div>
  );
}
