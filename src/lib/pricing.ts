/*
  Hinnoittelun mock-logiikka. Oikeassa tuotteessa tämä on backendin algoritmi,
  demossa se on muutama läpinäkyvä kaava.
*/

export const BASE_FARE = 5.9;

/** Asiakas hyväksyy tarjouksen, jos todennäköisyys on vähintään tämän verran (≈ +15 % suosituksesta). */
export const ACCEPT_THRESHOLD = 0.5;

export const roundTo = (v: number, step: number) => Math.round(v / step) * step;
export const roundCents = (v: number) => Math.round(v * 100) / 100;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function recommendedPrice(tripKm: number, perKm: number) {
  return roundCents(roundTo(BASE_FARE + tripKm * perKm, 0.1));
}

/** Rajat, joiden sisällä kuljettaja voi tarjota (±30 % suosituksesta). */
export function bidBounds(recommended: number) {
  return {
    min: roundCents(roundTo(recommended * 0.7, 0.1)),
    max: roundCents(roundTo(recommended * 1.3, 0.1)),
  };
}

export const clampBid = (bid: number, recommended: number) => {
  const { min, max } = bidBounds(recommended);
  return roundCents(clamp(roundTo(bid, 0.1), min, max));
};

/** Hinta, jolla tämän kokoiset kyydit tällä hetkellä yleensä sovitaan. */
export function marketBand(recommended: number) {
  return {
    low: roundCents(roundTo(recommended * 0.88, 0.1)),
    high: roundCents(roundTo(recommended * 1.15, 0.1)),
  };
}

/**
  Arvioitu todennäköisyys, että asiakas hyväksyy tarjouksen.
  Suositushinnalla 88 %, jokainen +10 % korotus laskee noin 24 prosenttiyksikköä.
*/
export function acceptanceProbability(bid: number, recommended: number) {
  const delta = (bid - recommended) / recommended;
  return clamp(0.88 - 2.4 * delta, 0.05, 0.98);
}

/** Demossa asiakkaan vastaus on deterministinen, jotta esitys on ennustettava. */
export const customerAccepts = (bid: number, recommended: number) =>
  acceptanceProbability(bid, recommended) >= ACCEPT_THRESHOLD;

export type AcceptanceLevel = "high" | "medium" | "low";

export function acceptanceLevel(p: number): AcceptanceLevel {
  if (p >= 0.7) return "high";
  if (p >= ACCEPT_THRESHOLD) return "medium";
  return "low";
}
