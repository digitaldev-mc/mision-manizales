"use client";

import { useEffect, useState } from "react";
import { EMPANADA_CRIMP, EMPANADA_PATH } from "./constants";

export function SiteLoader() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const hide = () => setHidden(true);
    const onLoad = () => setTimeout(hide, 900);
    window.addEventListener("load", onLoad);
    const fallback = setTimeout(hide, 2800);
    return () => {
      window.removeEventListener("load", onLoad);
      clearTimeout(fallback);
    };
  }, []);

  return (
    <div id="loader" className={hidden ? "hide" : undefined}>
      <svg className="loader-emp" viewBox="0 0 320 420" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="loaderGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#c9a24a" />
            <stop offset="55%" stopColor="#f4c542" />
            <stop offset="100%" stopColor="#ffe083" />
          </linearGradient>
          <clipPath id="loaderClip">
            <path d={EMPANADA_PATH} />
          </clipPath>
        </defs>
        <path
          d={EMPANADA_PATH}
          fill="var(--amarillo-opaco)"
          stroke="var(--terracota)"
          strokeWidth="7"
        />
        <g clipPath="url(#loaderClip)">
          <rect className="l-fill" x="0" y="35" width="320" height="385" fill="url(#loaderGrad)" />
        </g>
        <path d={EMPANADA_PATH} fill="none" stroke="var(--terracota)" strokeWidth="7" />
        <path
          d={EMPANADA_CRIMP}
          fill="none"
          stroke="#b5602f"
          strokeWidth="4"
          strokeDasharray="2 15"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>
      <div className="loader-brand">Misión Manizales</div>
      <div className="loader-tag">Lo que nos une, nos reconstruye</div>
      <div className="loader-bar">
        <span />
      </div>
    </div>
  );
}

export function ScrollProgress() {
  return <div className="scroll-progress" id="scroll-progress" />;
}
