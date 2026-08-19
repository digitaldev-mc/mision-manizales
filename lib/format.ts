export function fmtCOP(n: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
}

export function fmtCOPShort(n: number) {
  return `$ ${Number(n || 0).toLocaleString("es-CO")}`;
}

/** Acepta "500000000", "500.000.000" o "-150000" → entero COP. */
export function parseCopInput(
  raw: FormDataEntryValue | null | undefined,
  options?: { allowZero?: boolean; allowNegative?: boolean },
): number {
  const trimmed = String(raw ?? "").trim().replace(/\s/g, "");
  if (!trimmed) return options?.allowZero ? 0 : NaN;

  const negative = trimmed.startsWith("-");
  const cleaned = (negative ? trimmed.slice(1) : trimmed).replace(/\./g, "").replace(/,/g, "");

  if (!/^\d+$/.test(cleaned)) return NaN;

  const value = Number(cleaned) * (negative ? -1 : 1);
  if (!Number.isSafeInteger(value)) return NaN;
  if (value < 0 && !options?.allowNegative) return NaN;
  if (value === 0 && !options?.allowZero) return NaN;
  if (value <= 0 && !options?.allowZero && !options?.allowNegative) return NaN;

  return value;
}
