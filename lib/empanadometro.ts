export const EMPMETRO_CX = 238.3;
export const EMPMETRO_CY = 220.0;
export const EMPMETRO_STEM_HALF = 33;
export const EMPMETRO_INSET = 8;
export const EMPMETRO_AMPLIFY_EXP = 0.42;

type RawParticle = { cx: number; cy: number; rot: number; s: number };

export type EmpmetroParticle = {
  id: number;
  tx: number;
  ty: number;
  sx: number;
  sy: number;
  s: number;
  rot: number;
  delay: number;
};

export function empmetroHalfwidth(y: number): number {
  if (y >= 315) {
    const dy = Math.abs(y - 400);
    if (dy > 85 - EMPMETRO_INSET) return 0;
    return Math.sqrt((85 - EMPMETRO_INSET) ** 2 - dy ** 2);
  }
  return EMPMETRO_STEM_HALF - EMPMETRO_INSET;
}

export function empmetroPack(
  targetTopY: number,
  {
    bottomY = 478,
    w = 19,
    h = 36,
    rowStepFrac = 0.62,
    maxParticles = 160,
  }: {
    bottomY?: number;
    w?: number;
    h?: number;
    rowStepFrac?: number;
    maxParticles?: number;
  } = {},
): RawParticle[] {
  const particles: RawParticle[] = [];
  let y = bottomY - h * 0.5;
  const rowStep = h * rowStepFrac;

  while (y - h * 0.5 > targetTopY && y > -450 && particles.length < maxParticles) {
    const hw = empmetroHalfwidth(y);
    if (hw * 2 < w * 0.6) {
      y -= rowStep;
      continue;
    }
    const n = Math.max(1, Math.floor((hw * 2) / (w * 0.86)));
    const spacing = (hw * 2) / n;
    const startX = 110 - hw + spacing / 2;
    for (let i = 0; i < n; i++) {
      particles.push({
        cx: startX + i * spacing + (Math.random() * 4 - 2),
        cy: y + (Math.random() * 4 - 2),
        rot: Math.random() * 20 - 10,
        s: (w / 193.37) * (0.92 + Math.random() * 0.16),
      });
    }
    y -= rowStep;
  }

  return particles;
}

export function empmetroAmplify(realPct: number): number {
  if (realPct <= 0) return 0;
  const boosted = Math.pow(Math.min(100, realPct) / 100, EMPMETRO_AMPLIFY_EXP) * 100;
  return Math.max(boosted, 6);
}

export function buildEmpmetroParticles(
  raised: number,
  goal: number,
): {
  particles: EmpmetroParticle[];
  realPct: number;
} {
  const realPct = goal > 0 ? Math.max(0, Math.min(100, (raised / goal) * 100)) : 0;
  const visualPct = empmetroAmplify(realPct) / 100;
  const targetTopY = 478 - visualPct * (478 - 90);
  const raw = empmetroPack(targetTopY);

  const particles = raw.map((p, i) => {
    const tx = p.cx - EMPMETRO_CX;
    const ty = p.cy - EMPMETRO_CY;
    return {
      id: i,
      tx,
      ty,
      sx: tx + 130 + Math.random() * 90,
      sy: ty + (Math.random() * 10 - 5),
      s: p.s,
      rot: p.rot,
      delay: Math.floor(i / 5) * 180 + (i % 5) * 55,
    };
  });

  return { particles, realPct: Math.round(realPct) };
}
