"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { buildEmpmetroParticles, type EmpmetroParticle } from "@/lib/empanadometro";

const EMP_MINI_PATH =
  "M 210,40 A 185,185 0 0,1 150.00,400.00 A 23.58,23.58 0 0,1 156.67,360.00 A 23.58,23.58 0 0,1 163.33,320.00 A 23.58,23.58 0 0,1 170.00,280.00 A 23.58,23.58 0 0,1 176.67,240.00 A 23.58,23.58 0 0,1 183.33,200.00 A 23.58,23.58 0 0,1 190.00,160.00 A 23.58,23.58 0 0,1 196.67,120.00 A 23.58,23.58 0 0,1 203.33,80.00 A 23.58,23.58 0 0,1 210.00,40.00 Z";

const CHIMNEY_PATH =
  "M 135.00,-500.00 L 85.00,-500.00 L 85.00,327.17 L 73.70,332.09 L 64.13,338.15 L 55.55,345.55 L 48.15,354.13 L 42.09,363.70 L 37.50,374.06 L 34.48,384.98 L 33.04,397.48 L 34.03,412.54 L 37.94,427.12 L 44.61,440.66 L 53.80,452.64 L 65.15,462.59 L 78.22,470.14 L 92.52,474.99 L 107.48,476.96 L 122.54,475.97 L 137.12,472.06 L 150.66,465.39 L 162.64,456.20 L 172.59,444.85 L 180.14,431.78 L 184.99,417.48 L 186.96,402.52 L 186.34,389.95 L 184.04,378.86 L 179.61,367.08 L 173.31,356.18 L 166.20,347.36 L 156.87,338.91 L 146.30,332.09 L 135.00,327.17 L 135.00,-500.00 Z";

const GLASS_PATH =
  "M 143.00,80.00 L 77.00,80.00 L 77.00,321.67 L 66.30,327.09 L 57.16,333.42 L 48.92,340.89 L 41.73,349.37 L 35.04,359.93 L 30.45,370.06 L 27.22,380.70 L 25.41,391.67 L 25.41,408.33 L 28.66,424.67 L 35.04,440.07 L 44.29,453.92 L 56.08,465.71 L 69.93,474.96 L 85.33,481.34 L 101.67,484.59 L 118.33,484.59 L 134.67,481.34 L 150.07,474.96 L 163.92,465.71 L 175.71,453.92 L 184.96,440.07 L 191.34,424.67 L 194.59,408.33 L 194.90,395.83 L 193.08,382.06 L 189.05,368.76 L 182.91,356.30 L 174.81,345.01 L 166.04,336.09 L 154.89,327.82 L 143.00,321.67 L 143.00,80.00 Z";

const OUTLINE_PATH =
  "M 77.00,80.00 L 77.00,321.67 L 66.30,327.09 L 57.16,333.42 L 48.92,340.89 L 41.73,349.37 L 35.04,359.93 L 30.45,370.06 L 27.22,380.70 L 25.41,391.67 L 25.41,408.33 L 28.66,424.67 L 35.04,440.07 L 44.29,453.92 L 56.08,465.71 L 69.93,474.96 L 85.33,481.34 L 101.67,484.59 L 118.33,484.59 L 134.67,481.34 L 150.07,474.96 L 163.92,465.71 L 175.71,453.92 L 184.96,440.07 L 191.34,424.67 L 194.59,408.33 L 194.90,395.83 L 193.08,382.06 L 189.05,368.76 L 182.91,356.30 L 174.81,345.01 L 166.04,336.09 L 154.89,327.82 L 143.00,321.67 L 143.00,80.00";

function ParticleUse({ p, animate }: { p: EmpmetroParticle; animate: boolean }) {
  const ref = useRef<SVGUseElement>(null);

  useEffect(() => {
    if (!animate || !ref.current) return;
    const node = ref.current;
    node.classList.remove("drop");
    requestAnimationFrame(() => node.classList.add("drop"));
  }, [animate, p.id]);

  return (
    <use
      ref={ref}
      href="#emp-mini"
      fill="url(#empmetroMiniGrad)"
      stroke="#b5602f"
      strokeWidth={6}
      className="empmetro-particle"
      style={
        {
          "--tx": `${p.tx.toFixed(2)}px`,
          "--ty": `${p.ty.toFixed(2)}px`,
          "--sx": `${p.sx.toFixed(2)}px`,
          "--s": p.s.toFixed(3),
          "--rot": `${p.rot.toFixed(1)}deg`,
          animationDelay: `${p.delay}ms`,
        } as CSSProperties
      }
    />
  );
}

export function Empanadometro({ raised, goal }: { raised: number; goal: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTrigger = useRef(0);
  const raisedRef = useRef(raised);
  const goalRef = useRef(goal);
  const [particles, setParticles] = useState<EmpmetroParticle[]>([]);
  const [realPct, setRealPct] = useState(0);
  const [animateKey, setAnimateKey] = useState(0);

  raisedRef.current = raised;
  goalRef.current = goal;

  const drop = useCallback(() => {
    const { particles: next, realPct: pct } = buildEmpmetroParticles(
      raisedRef.current,
      goalRef.current,
    );
    setParticles(next);
    setRealPct(pct);
    setAnimateKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && Date.now() - lastTrigger.current > 700) {
            lastTrigger.current = Date.now();
            drop();
          }
        });
      },
      { threshold: 0.35 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [drop]);

  return (
    <div className="empanadometro" id="empanadometro" ref={containerRef}>
      <svg viewBox="0 -40 220 540" xmlns="http://www.w3.org/2000/svg" overflow="visible">
        <defs>
          <path id="emp-mini" d={EMP_MINI_PATH} />
          <clipPath id="empmetroChimney" clipPathUnits="userSpaceOnUse">
            <path d={CHIMNEY_PATH} />
          </clipPath>
          <linearGradient id="empmetroMiniGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#e0870a" />
            <stop offset="100%" stopColor="#ffd873" />
          </linearGradient>
          <linearGradient id="empmetroGlassGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(0,180,216,.10)" />
            <stop offset="100%" stopColor="rgba(244,197,66,.07)" />
          </linearGradient>
        </defs>

        <path d={GLASS_PATH} fill="url(#empmetroGlassGrad)" />

        <g clipPath="url(#empmetroChimney)" id="empmetro-layer">
          {particles.map((p) => (
            <ParticleUse key={`${animateKey}-${p.id}`} p={p} animate={animateKey > 0} />
          ))}
        </g>

        <g className="empmetro-bands">
          <line x1="77" y1="381" x2="143" y2="381" stroke="var(--azul-profundo)" strokeWidth="2.4" opacity="0.16" />
          <line x1="77" y1="284" x2="143" y2="284" stroke="var(--azul-profundo)" strokeWidth="2.4" opacity="0.16" />
          <line x1="77" y1="187" x2="143" y2="187" stroke="var(--azul-profundo)" strokeWidth="2.4" opacity="0.16" />
          <line x1="77" y1="90" x2="143" y2="90" stroke="var(--terracota)" strokeWidth="2.6" opacity="0.28" />
        </g>

        <path
          fill="none"
          stroke="var(--azul-profundo)"
          strokeWidth="3.5"
          strokeLinecap="round"
          d={OUTLINE_PATH}
        />
      </svg>

      <div className="empmetro-label">
        <strong id="empmetro-pct">{realPct}%</strong>
        <span>
          de la meta · <span id="empmetro-count">{particles.length}</span> empanadas donadas
        </span>
      </div>
    </div>
  );
}
