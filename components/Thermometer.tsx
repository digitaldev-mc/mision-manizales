"use client";

import { useEffect, useState } from "react";

type ThermometerData = {
  goalCOP: number;
  raisedCOP: number;
  percent: number;
};

function fmt(n: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
}

export function Thermometer() {
  const [data, setData] = useState<ThermometerData | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/termometro");
        if (res.ok) setData(await res.json());
      } catch {
        /* ignore */
      }
    }
    load();
    const id = setInterval(load, 25000);
    return () => clearInterval(id);
  }, []);

  const percent = data?.percent ?? 0;
  const raised = data?.raisedCOP ?? 0;
  const goal = data?.goalCOP ?? 500_000_000;

  return (
    <div className="termo-card">
      <div>
        <div className="empanada-gauge">
          <div className="empanada-gauge-fill" style={{ height: `${percent}%` }} />
        </div>
      </div>
      <div>
        <div className="termo-stats">
          <div className="stat-box">
            <div className="label">Recaudado</div>
            <div className="value mono">{fmt(raised)}</div>
          </div>
          <div className="stat-box">
            <div className="label">Meta</div>
            <div className="value mono">{fmt(goal)}</div>
          </div>
          <div className="stat-box">
            <div className="label">Avance</div>
            <div className="value">{percent}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
