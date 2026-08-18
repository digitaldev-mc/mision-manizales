"use client";

import Link from "next/link";
import { HeroVideoBanner } from "./HeroVideoBanner";

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

      <div className="hero-banner-stage">
        <HeroVideoBanner />
        <div className="hero-headline-content">
          <span className="eyebrow">🫓 Manizales se reconstruye entre todos</span>
          <h1 className="hero-headline">
            <span className="hero-headline-line">Una empanada es un gesto.</span>
            <span className="hero-headline-line">
              <em>Miles de gestos</em> reconstruyen una ciudad.
            </span>
          </h1>
        </div>
      </div>

      <div className="hero-top">
        <div className="hero-copy reveal">
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
