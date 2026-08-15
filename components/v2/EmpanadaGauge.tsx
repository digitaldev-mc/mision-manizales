"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { lerpColor } from "@/lib/color";
import { fmtCOPShort } from "@/lib/format";
import { EMPANADA_CRIMP, EMPANADA_PATH } from "./constants";
import { animateCount } from "./useScrollReveal";

type ThermometerData = {
  goalCOP: number;
  raisedCOP: number;
  percent: number;
  donationCount: number;
};

export function EmpanadaGauge() {
  const [data, setData] = useState<ThermometerData | null>(null);
  const lastPct = useRef(-1);
  const [sparkKey, setSparkKey] = useState(0);

  useEffect(() => {
    async function load(animate = false) {
      try {
        const res = await fetch("/api/termometro");
        if (!res.ok) return;
        const json = (await res.json()) as ThermometerData;
        setData(json);

        if (animate) {
          const raisedEl = document.getElementById("raised-amount");
          const hsRaised = document.getElementById("hs-raised");
          const hsDonors = document.getElementById("hs-donors");
          animateCount(raisedEl, json.raisedCOP, "$ ");
          animateCount(hsRaised, json.raisedCOP, "$ ");
          animateCount(hsDonors, json.donationCount, "");
        }

        if (json.percent > lastPct.current + 0.001) {
          setSparkKey((k) => k + 1);
        }
        lastPct.current = json.percent;
      } catch {
        /* ignore */
      }
    }

    load(false);
    const id = setInterval(() => load(true), 25000);
    return () => clearInterval(id);
  }, []);

  const goal = data?.goalCOP ?? 500_000_000;
  const raised = data?.raisedCOP ?? 0;
  const pct = data ? Math.min(100, (raised / goal) * 100) : 0;
  const t = pct / 100;
  const fillH = t * 385;
  const fillY = 420 - fillH;
  const stopA = lerpColor("#b7a262", "#e0870a", t);
  const stopB = lerpColor("#e4d08c", "#ffcf4d", t);
  const donationCount = data?.donationCount ?? 0;

  return (
    <section className="termo-section" id="apoya">
      <div
        className="blob blob-anim"
        style={{
          width: 340,
          height: 340,
          top: -60,
          left: -90,
          background: "radial-gradient(circle, rgba(111,165,122,.28), transparent 65%)",
        }}
      />
      <div className="wrap">
        <div className="section-head reveal">
          <span className="kicker">Recaudo en vivo</span>
          <h2>El termómetro de la reconstrucción</h2>
          <p>
            Cada aporte suma. Así vamos frente a la meta para reconstruir viviendas y, en la fase
            final, aportar al restablecimiento de la Catedral.
          </p>
        </div>

        <div className="termo-card reveal-scale">
          <div className="termo-tube-wrap">
            <div className="gauge-svg-wrap">
              <svg viewBox="0 0 320 420" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="fillGrad" x1="0" y1="1" x2="0" y2="0">
                    <stop id="fillStopA" offset="0%" stopColor={stopA} />
                    <stop id="fillStopB" offset="100%" stopColor={stopB} />
                  </linearGradient>
                  <clipPath id="empanadaClip">
                    <path d={EMPANADA_PATH} />
                  </clipPath>
                </defs>
                <path
                  d={EMPANADA_PATH}
                  fill="var(--amarillo-opaco)"
                  stroke="var(--terracota)"
                  strokeWidth="7"
                />
                <g clipPath="url(#empanadaClip)">
                  <rect
                    id="gauge-fill-rect"
                    x="0"
                    y={fillY}
                    width="320"
                    height={fillH}
                    fill="url(#fillGrad)"
                  />
                  <rect
                    id="gauge-shine"
                    x="0"
                    y={Math.max(35, fillY - 5)}
                    width="320"
                    height="6"
                    fill="#fff6d8"
                    opacity="0.65"
                  />
                </g>
                <path
                  d={EMPANADA_PATH}
                  fill="none"
                  stroke="var(--terracota)"
                  strokeWidth="7"
                />
                <path
                  d={EMPANADA_CRIMP}
                  fill="none"
                  stroke="#b5602f"
                  strokeWidth="4"
                  strokeDasharray="2 15"
                  strokeLinecap="round"
                  opacity="0.45"
                />
              </svg>
              {[0, 1, 2].map((i) => (
                <div
                  key={`${sparkKey}-${i}`}
                  className="gauge-sparkle go"
                  style={{
                    ["--dx" as string]: `${(i - 1) * 22}px`,
                    left: `${46 + i * 6}%`,
                  }}
                />
              ))}
            </div>
            <span className="termo-goal-label">
              Meta: <strong className="mono">{fmtCOPShort(goal)}</strong>
            </span>
          </div>

          <div className="termo-info">
            <div className="amount-row">
              <span className="raised mono" id="raised-amount">
                {fmtCOPShort(raised)}
              </span>
              <span className="goal">
                de ${goal.toLocaleString("es-CO")} ·{" "}
                <span id="pct-label">{pct.toFixed(1)}%</span>
              </span>
            </div>
            <div className="termo-bar-flat">
              <div
                className="termo-bar-flat-fill"
                id="termo-bar-flat-fill"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="termo-stats">
              <div>
                <strong id="stat-donaciones">{donationCount}</strong>
                Donaciones confirmadas
              </div>
              <div>
                <strong>Fase 1</strong>
                Dolor y respuesta
              </div>
              <div>
                <strong>Fase 4</strong>
                Legado
              </div>
            </div>
            <div style={{ marginTop: 24 }}>
              <Link href="/donar" className="btn btn-primary">
                🫓 Aportar mi empanada
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
