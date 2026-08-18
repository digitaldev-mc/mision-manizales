import Link from "next/link";

export function SiteFooter() {
  return (
    <footer>
      <div className="blob blob-anim" />
      <div className="wrap footer-grid">
        <div>
          <div className="brand">
            <span
              className="brand-logo-wrap"
              style={{ display: "inline-flex", verticalAlign: "middle", marginRight: 10 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/sello-catedral.png" alt="Misión Comparte" />
            </span>
            <span className="brand-name" style={{ fontSize: "1.1rem" }}>
              Misión Comparte
            </span>
          </div>
          <p style={{ maxWidth: 320 }}>
            Marca ciudadana, neutral y de largo plazo para reconstruir Manizales, un gesto a la vez.
          </p>
        </div>
        <div>
          <h4>Navegación</h4>
          <ul>
            <li>
              <a href="#historia">Historia</a>
            </li>
            <li>
              <a href="#apoya">Recaudo</a>
            </li>
            <li>
              <a href="#videos">Historias</a>
            </li>
            <li>
              <a href="#tienda">Tienda</a>
            </li>
          </ul>
        </div>
        <div>
          <h4>Misión Comparte es de todos</h4>
          <ul>
            <li>Manizales, Caldas — Colombia</li>
            <li>hola@misionmanizales.org</li>
          </ul>
        </div>
      </div>
      <div className="wrap footer-bottom">
        <span>© 2026 Misión Comparte · Lo que nos une, nos reconstruye</span>
        <Link href="/admin/login" style={{ opacity: 0.6 }}>
          Panel administrativo
        </Link>
      </div>
    </footer>
  );
}
