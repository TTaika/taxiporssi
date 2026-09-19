/*
  Markkinahinnan historia (keskimääräinen kilometrihinta pääkaupunkiseudulla).
  Demon skenaario: perjantai klo 23.45, iltaruuhka on alkamassa.
*/

export type RangeKey = "1h" | "4h" | "24h";

export interface PricePoint {
  t: string;
  price: number;
}


export const RANGES: { key: RangeKey; label: string; since: string }[] = [
  { key: "1h", label: "1 h", since: "in the last hour" },
  { key: "4h", label: "4 h", since: "in the last 4 hours" },
  { key: "24h", label: "24 h", since: "in the last 24 hours" },
];

export const priceHistory: Record<RangeKey, PricePoint[]> = {
  "1h": [
    { t: "22:45", price: 2.62 },
    { t: "22:50", price: 2.63 },
    { t: "22:55", price: 2.65 },
    { t: "23:00", price: 2.66 },
    { t: "23:05", price: 2.68 },
    { t: "23:10", price: 2.69 },
    { t: "23:15", price: 2.71 },
    { t: "23:20", price: 2.73 },
    { t: "23:25", price: 2.74 },
    { t: "23:30", price: 2.77 },
    { t: "23:35", price: 2.79 },
    { t: "23:40", price: 2.81 },
    { t: "23:45", price: 2.84 },
  ],
  "4h": [
    { t: "19:45", price: 2.15 },
    { t: "20:00", price: 2.13 },
    { t: "20:15", price: 2.16 },
    { t: "20:30", price: 2.19 },
    { t: "20:45", price: 2.23 },
    { t: "21:00", price: 2.26 },
    { t: "21:15", price: 2.29 },
    { t: "21:30", price: 2.34 },
    { t: "21:45", price: 2.37 },
    { t: "22:00", price: 2.43 },
    { t: "22:15", price: 2.49 },
    { t: "22:30", price: 2.55 },
    { t: "22:45", price: 2.62 },
    { t: "23:00", price: 2.66 },
    { t: "23:15", price: 2.71 },
    { t: "23:30", price: 2.77 },
    { t: "23:45", price: 2.84 },
  ],
  "24h": [
    { t: "Thu 23:45", price: 2.41 },
    { t: "00:45", price: 2.36 },
    { t: "01:45", price: 2.29 },
    { t: "02:45", price: 2.21 },
    { t: "03:45", price: 2.08 },
    { t: "04:45", price: 1.96 },
    { t: "05:45", price: 1.91 },
    { t: "06:45", price: 2.02 },
    { t: "07:45", price: 2.33 },
    { t: "08:45", price: 2.46 },
    { t: "09:45", price: 2.24 },
    { t: "10:45", price: 2.07 },
    { t: "11:45", price: 2.03 },
    { t: "12:45", price: 2.09 },
    { t: "13:45", price: 2.06 },
    { t: "14:45", price: 2.12 },
    { t: "15:45", price: 2.29 },
    { t: "16:45", price: 2.43 },
    { t: "17:45", price: 2.35 },
    { t: "18:45", price: 2.19 },
    { t: "19:45", price: 2.15 },
    { t: "20:45", price: 2.23 },
    { t: "21:45", price: 2.37 },
    { t: "22:45", price: 2.62 },
    { t: "23:45", price: 2.84 },
  ],
};

/** Akselin tikit per aikaväli – tasaiset välit, viimeinen piste aina mukana. */
export const axisTicks: Record<RangeKey, string[]> = {
  "1h": ["22:45", "23:00", "23:15", "23:30", "23:45"],
  "4h": ["19:45", "20:45", "21:45", "22:45", "23:45"],
  "24h": ["05:45", "11:45", "17:45", "23:45"],
};

/** "Elävä" markkinahinta: arvo vaihtuu muutaman sekunnin välein tämän sarjan mukaan. */
export const liveTicks = [2.84, 2.85, 2.85, 2.86, 2.85, 2.87, 2.88, 2.87, 2.86, 2.87, 2.85, 2.84];

export const demandNow = {
  openRequests: 41,
  freeCars: 19,
  peakWindow: "01:00–03:00",
  peakForecast: 3.1,
};
