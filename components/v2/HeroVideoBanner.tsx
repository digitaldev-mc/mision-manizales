"use client";

import { useEffect, useRef } from "react";

export function HeroVideoBanner() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      video.pause();
      video.removeAttribute("src");
      return;
    }

    video.play().catch(() => {
      /* autoplay blocked — poster remains visible */
    });
  }, []);

  return (
    <div className="hero-banner" aria-hidden>
      <video
        ref={videoRef}
        className="hero-banner-video"
        muted
        loop
        playsInline
        preload="metadata"
        poster="/assets/donaciones-hero-poster.jpg"
      >
        <source src="/assets/donaciones-hero.mp4" type="video/mp4" />
      </video>
      <div className="hero-banner-overlay" />
      <div className="hero-banner-shine" />
    </div>
  );
}
