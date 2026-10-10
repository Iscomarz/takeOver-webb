/**
 * Applies a percentage discount to a subtotal expressed in integer cents.
 * The discount amount is rounded to the nearest cent.
 *
 * @param {number} subtotalCents integer cents, >= 0
 * @param {number|string} porcentaje percentage in (0, 100), e.g. 15 or "15.00"
 * @returns {number} integer cents to charge
 */
export function computeDiscountedAmount(subtotalCents, porcentaje) {
  const pct = Number(porcentaje);
  if (!Number.isInteger(subtotalCents) || subtotalCents < 0) {
    throw new Error("subtotalCents must be a non-negative integer");
  }
  if (!Number.isFinite(pct) || pct <= 0 || pct >= 100) {
    throw new Error("porcentaje must be between 0 and 100 (exclusive)");
  }
  // Work in basis points (percentage * 100) so the math stays integer.
  const bps = Math.round(pct * 100);
  const discount = Math.round((subtotalCents * bps) / 10000);
  return subtotalCents - discount;
}
