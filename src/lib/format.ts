// Englanninkielinen käyttöliittymä, euromuoto "€20.10".
const eur = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });
const dec2 = new Intl.NumberFormat("en-IE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dec1 = new Intl.NumberFormat("en-IE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const int = new Intl.NumberFormat("en-IE");

export const fmtEur = (v: number) => eur.format(v);
export const fmtPerKm = (v: number) => `€${dec2.format(v)}/km`;
export const fmtDec2 = (v: number) => dec2.format(v);
export const fmtKm = (v: number) => `${dec1.format(v)} km`;
export const fmtRating = (v: number) => (Number.isInteger(v * 10) ? dec1.format(v) : dec2.format(v));
export const fmtInt = (v: number) => int.format(v);

/** "+€1.00" / "−€2.00" – aina etumerkillä */
export const fmtSignedEur = (v: number) => `${v >= 0 ? "+" : "−"}${eur.format(Math.abs(v))}`;
export const fmtSignedPct = (v: number) => `${v >= 0 ? "+" : "−"}${dec1.format(Math.abs(v * 100))}%`;
export const fmtPct1 = (v: number) => `${dec1.format(v * 100)}%`;
export const fmtPct = (v: number) => `${Math.round(v * 100)}%`;

/** Hyväksyy muodot "22,5", "22.50", "22 €" */
export function parseEur(input: string): number | null {
  const n = Number(input.replace(/[^\d,.-]/g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}
