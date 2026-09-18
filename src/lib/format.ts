/**
 * Formatting helpers — Damero Propiedades.
 *
 * No dependency. Currency is deliberately NOT folded into these helpers: the
 * card renders the currency code and the numeric amount as two styled elements
 * (`--text-label-sm` mono code + price token amount), so each side is formatted
 * where it is rendered (docs/DESIGN.md §3, §16).
 */

const AMOUNT_FORMATTER = new Intl.NumberFormat('es-AR', {
  maximumFractionDigits: 0,
});

/**
 * Format a numeric amount with `es-AR` thousands separators.
 *
 * `95000` → `95.000` · `120000000` → `120.000.000`
 *
 * Returns an empty string for non-finite input so a missing price degrades to
 * nothing instead of the literal `NaN` on screen.
 */
export function formatAmount(value: number): string {
  if (!Number.isFinite(value)) return '';
  return AMOUNT_FORMATTER.format(value);
}
