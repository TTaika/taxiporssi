export interface Tier {
  name: string;
  minRating: number;
  minRides: number;
  serviceFee: number;
}

/** Järjestyksessä matalimmasta korkeimpaan. */
export const tiers: Tier[] = [
  { name: "Bronze", minRating: 0, minRides: 0, serviceFee: 0.1 },
  { name: "Silver", minRating: 4.6, minRides: 100, serviceFee: 0.09 },
  { name: "Gold", minRating: 4.75, minRides: 500, serviceFee: 0.08 },
  { name: "Platinum", minRating: 4.85, minRides: 1000, serviceFee: 0.06 },
];

export const driver = {
  name: "Mikko Laaksonen",
  initials: "ML",
  business: "Taksi Laaksonen Tmi",
  car: "Toyota Corolla Touring Hybrid",
  carShort: "Toyota Corolla",
  plate: "XKT-482",
  since: 2019,
  rating: 4.92,
  ratingCount: 1248,
  totalRides: 3412,
  tier: "Platinum",
  feeSavedThisMonth: 142.3,
  /** Osuus arvioista tähtimäärittäin, 5 → 1 */
  distribution: [
    { stars: 5, share: 0.91 },
    { stars: 4, share: 0.07 },
    { stars: 3, share: 0.01 },
    { stars: 2, share: 0.01 },
    { stars: 1, share: 0 },
  ],
};

export interface Review {
  id: string;
  name: string;
  stars: number;
  when: string;
  text: string;
}

export const reviews: Review[] = [
  {
    id: "a1",
    name: "Aino",
    stars: 5,
    when: "today",
    text: "Arrived quickly and the car was clean. The price felt fair for a Friday night.",
  },
  {
    id: "a2",
    name: "Petri",
    stars: 5,
    when: "yesterday",
    text: "Knew the streets and avoided the traffic on Mannerheimintie. Recommended.",
  },
  {
    id: "a3",
    name: "Leena",
    stars: 4,
    when: "2 days ago",
    text: "Nice driver. The music was a bit loud, otherwise a good ride.",
  },
  {
    id: "a4",
    name: "Joonas",
    stars: 5,
    when: "3 days ago",
    text: "Helped with the bags at Pasila station. Thanks!",
  },
];
