import Link from "next/link";
import { Thermometer } from "@/components/Thermometer";

export default function HomePage() {
  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <Link href="/" className="brand">
            <span>
              <span className="brand-name">Misión Manizales</span>
              <br />
              <span className="brand-tag">Lo que nos une, nos reconstruye</span>
            </span>
          </Link>
          <ul className="nav-links">
            <li>
              <a href="#historia">Historia</a>
            </li>
            <li>
              <a href="#apoya">Recaudo</a>
            </li>
            <li>
              <Link href="/tienda">Tienda</Link>
            </li>
          </ul>
          <Link href="/donar" className="btn btn-primary btn-sm">
            Donar ahora
          </Link>
        </div>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-media" />
        <div className="hero-overlay">
          <div className="hero-copy">
            <span className="eyebrow">🫓 Manizales se reconstruye entre todos</span>
            <h1>
              Una empanada es un gesto.
              <br />
              Miles de gestos reconstruyen una ciudad.
            </h1>
            <p>
              Pequeños aportes compartidos que levantan a Manizales — hoy, como hace un
              siglo y como en los noventa.
            </p>
            <div className="hero-actions">
              <Link href="/donar" className="btn btn-primary">
                Quiero aportar
              </Link>
              <a href="#apoya" className="btn btn-ghost">
                Ver el avance del recaudo ↓
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="historia" id="historia">
        <div className="wrap">
          <span className="kicker">Verdad de marca</span>
          <h2>La reconstrucción no empieza con una gran obra.</h2>
          <p style={{ color: "#48586a", marginTop: 12, maxWidth: 720 }}>
            Empieza cuando todos deciden aportar algo. Manizales ya sabe levantarse unida.
          </p>
        </div>
      </section>

      <section id="apoya">
        <div className="wrap">
          <div className="section-head">
            <span className="kicker">Recaudo en vivo</span>
            <h2>El termómetro de la reconstrucción</h2>
            <p>Cada aporte confirmado suma. Solo sube con pagos verificados.</p>
          </div>
          <Thermometer />
        </div>
      </section>

      <footer>
        <div className="wrap footer-bottom">
          <span>© 2026 Misión Manizales · Lo que nos une, nos reconstruye</span>
          <Link href="/admin/login" style={{ opacity: 0.6 }}>
            Panel administrativo
          </Link>
        </div>
      </footer>
    </>
  );
}
