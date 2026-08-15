"use client";

import Link from "next/link";

type HeroSectionProps = {
  raisedCOP: number;
  donorCount: number;
};

export function HeroSection({ raisedCOP, donorCount }: HeroSectionProps) {
  const raisedLabel = `$ ${raisedCOP.toLocaleString("es-CO")}`;

  return (
    <section className="hero" id="inicio">
      <div className="blob blob-anim" />
      <div className="blob blob2 blob-anim" />
      <div className="hero-top">
        <div className="hero-copy reveal">
          <span className="eyebrow">🫓 Manizales se reconstruye entre todos</span>
          <h1>
            Una empanada es un gesto.
            <br />
            <em>Miles de gestos</em> reconstruyen una ciudad.
          </h1>
          <p>
            Hace un siglo fue el incendio. En los noventa, un terremoto tumbó los santos de la
            Catedral. Hoy volvemos a esa memoria: pequeños aportes compartidos que levantan a
            Manizales.
          </p>
          <div className="hero-actions">
            <Link href="/donar" className="btn btn-primary">
              🫓 Quiero aportar
            </Link>
            <a href="#apoya" className="btn btn-ghost">
              Ver el avance del recaudo ↓
            </a>
          </div>
        </div>
        <div className="hero-medal reveal-scale">
          <div className="medal-glow" />
          <div className="medal-ring" />
          <div className="medal-ring2" />
          <div className="medal-img">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/sello-catedral.png" alt="Sello artístico Catedral de Manizales" />
          </div>
          <div className="medal-badge">✦ Sello ciudadano</div>
        </div>
      </div>
      <div className="hero-strip">
        <div className="hero-strip-inner">
          <div className="hero-stat">
            <strong id="hs-raised">{raisedLabel}</strong>
            <span>Recaudado hoy</span>
          </div>
          <div className="hero-stat">
            <strong id="hs-donors">{donorCount}</strong>
            <span>Donantes solidarios</span>
          </div>
          <div className="hero-stat">
            <strong>Fase 1 / 4</strong>
            <span>Dolor y respuesta</span>
          </div>
          <div className="hero-stat">
            <strong>🫓 100%</strong>
            <span>Ciudadano y transparente</span>
          </div>
        </div>
      </div>
    </section>
  );
}
