import { SHIPPING_COP_MANIZALES } from "@/lib/cart/constants";

export function calcSubtotalCOP(
  items: { priceCOP: number; quantity: number }[],
): number {
  return items.reduce((sum, item) => sum + item.priceCOP * item.quantity, 0);
}

export function calcThermometerContributionCOP(
  items: { priceCOP: number; quantity: number; thermometerPercent: number }[],
): number {
  return items.reduce(
    (sum, item) =>
      sum + Math.round((item.priceCOP * item.quantity * item.thermometerPercent) / 100),
    0,
  );
}

export function calcOrderTotals(
  items: { priceCOP: number; quantity: number; thermometerPercent: number }[],
) {
  const subtotalCOP = calcSubtotalCOP(items);
  const shippingCOP = items.length > 0 ? SHIPPING_COP_MANIZALES : 0;
  const thermometerContributionCOP = calcThermometerContributionCOP(items);
  const totalCOP = subtotalCOP + shippingCOP;

  return { subtotalCOP, shippingCOP, thermometerContributionCOP, totalCOP };
}
