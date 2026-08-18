"use client";

import { useEffect, useState } from "react";

type HistoriaCarouselProps = {
  images: string[];
  tag?: string;
};

export function HistoriaCarousel({ images, tag = "🫓 Un gesto compartido" }: HistoriaCarouselProps) {
  const slides = images.length > 0 ? images : ["/assets/empanada-foto.png"];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="historia-photo historia-carousel">
      <div className="historia-carousel-track">
        {slides.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${src}-${i}`}
            src={src}
            alt="Imagen de la historia de Misión Manizales"
            className={i === index ? "is-active" : undefined}
          />
        ))}
      </div>
      <span className="historia-photo-tag">{tag}</span>
      {slides.length > 1 ? (
        <div className="historia-carousel-dots" aria-hidden>
          {slides.map((_, i) => (
            <span key={i} className={i === index ? "active" : undefined} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
