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
