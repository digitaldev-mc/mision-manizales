"use client";

import Link from "next/link";
import { useState } from "react";

export function SiteNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  function closeMobile() {
    setMobileOpen(false);
    document.body.classList.remove("lock");
  }

  function toggleMobile() {
    const opening = !mobileOpen;
    setMobileOpen(opening);
    document.body.classList.toggle("lock", opening);
  }

  return (
    <>
      <header className="nav" id="site-nav">
        <div className="nav-inner">
          <Link href="/#inicio" className="brand">
            <span className="brand-logo-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/sello-catedral.png" alt="Sello Misión Manizales" />
            </span>
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
              <a href="#videos">Historias</a>
            </li>
            <li>
              <a href="#aliados">Aliados</a>
            </li>
            <li>
              <a href="#tienda">Tienda</a>
            </li>
          </ul>
          <div className="nav-cta">
            <Link href="/donar" className="btn btn-primary btn-sm desktop-only">
              Donar ahora
            </Link>
            <button
              type="button"
              className={`nav-toggle${mobileOpen ? " open" : ""}`}
              aria-label="Abrir menú"
              onClick={toggleMobile}
            >
              <span />
            </button>
          </div>
        </div>
      </header>

      <div className={`mobile-nav${mobileOpen ? " open" : ""}`} id="mobile-nav">
        <div className="mobile-nav-backdrop" onClick={closeMobile} role="presentation" />
        <nav className="mobile-nav-panel">
          <button type="button" className="mobile-nav-close" onClick={closeMobile}>
            ✕
          </button>
          <a href="#historia" onClick={closeMobile}>
            Historia
          </a>
          <a href="#apoya" onClick={closeMobile}>
            Recaudo
          </a>
          <a href="#videos" onClick={closeMobile}>
            Historias
          </a>
          <a href="#aliados" onClick={closeMobile}>
            Aliados
          </a>
          <a href="#tienda" onClick={closeMobile}>
            Tienda
          </a>
          <Link href="/donar" className="btn btn-primary btn-block" onClick={closeMobile}>
            🫓 Donar ahora
          </Link>
        </nav>
      </div>
    </>
  );
}
