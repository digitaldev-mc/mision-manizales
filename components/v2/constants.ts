import { lerpColor } from "@/lib/color";

/** Silueta con repulgue real — viewBox 120 20 240 400 */
export const EMPANADA_VIEWBOX = "120 20 240 400";

export const EMPANADA_PATH =
  "M 210,40 A 185,185 0 0,1 150.00,400.00 A 23.58,23.58 0 0,1 156.67,360.00 A 23.58,23.58 0 0,1 163.33,320.00 A 23.58,23.58 0 0,1 170.00,280.00 A 23.58,23.58 0 0,1 176.67,240.00 A 23.58,23.58 0 0,1 183.33,200.00 A 23.58,23.58 0 0,1 190.00,160.00 A 23.58,23.58 0 0,1 196.67,120.00 A 23.58,23.58 0 0,1 203.33,80.00 A 23.58,23.58 0 0,1 210.00,40.00 Z";

export const GAUGE_FILL = {
  x: 120,
  width: 240,
  top: 20,
  bottom: 420,
  range: 400,
} as const;

export function gaugeFillFromPercent(pct: number) {
  const clamped = Math.max(0, Math.min(100, pct));
  const t = clamped / 100;
  const fillH = t * GAUGE_FILL.range;
  const fillY = GAUGE_FILL.bottom - fillH;

  return {
    pct: clamped,
    fillH,
    fillY,
    shineY: Math.max(GAUGE_FILL.top, fillY - 5),
    stopA: lerpColor("#b7a262", "#e0870a", t),
    stopB: lerpColor("#e4d08c", "#ffcf4d", t),
  };
}
