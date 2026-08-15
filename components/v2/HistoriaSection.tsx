import Image from "next/image";

export function HistoriaSection() {
  return (
    <section className="historia" id="historia">
      <div className="wrap historia-grid">
        <div className="reveal">
          <span className="section-head kicker" style={{ display: "inline-flex" }}>
            Verdad de marca
          </span>
          <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", margin: "10px 0 16px" }}>
            La reconstrucción no empieza con una gran obra.
          </h2>
          <blockquote>Empieza cuando todos deciden aportar algo.</blockquote>
          <p>
            Hace cien años, tras el incendio de la ciudad, Manizales se reconstruyó «a punta de
            empanadas». En los años noventa, tras el terremoto que tumbó los santos de la Catedral,
            los convites y las empanadas volvieron a ser el espíritu colectivo de reconstrucción.
            Hoy retomamos esa tradición para convertirla en un símbolo contemporáneo de esperanza.
          </p>
          <p style={{ marginTop: 14, fontWeight: 700, color: "var(--azul-profundo)" }}>
            Manizales ya sabe levantarse unida.
          </p>
        </div>
        <div className="img-col reveal-scale">
          <div className="historia-photo">
            <Image
              src="/assets/empanada-foto.png"
              alt="Empanadas de Manizales, símbolo de reconstrucción colectiva"
              width={560}
              height={420}
            />
            <span className="historia-photo-tag">🫓 Un gesto compartido</span>
          </div>
        </div>
      </div>
    </section>
  );
}
