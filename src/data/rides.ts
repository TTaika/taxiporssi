export interface Ride {
  id: string;
  time: string;
  from: string;
  to: string;
  km: number;
  /** Toteutunut hinta */
  price: number;
  /** Algoritmin suositus pyynnön saapuessa */
  suggested: number;
}

/** Perjantain aiemmat kyydit, uusin viimeisenä. */
export const todaysRides: Ride[] = [
  { id: "h1", time: "18:12", from: "Pasila", to: "Kamppi", km: 4.1, price: 16.4, suggested: 16.4 },
  { id: "h2", time: "19:05", from: "Kamppi", to: "Munkkiniemi", km: 5.3, price: 19.9, suggested: 18.9 },
  { id: "h3", time: "20:31", from: "Hakaniemi", to: "Katajanokka", km: 3.2, price: 13.8, suggested: 13.8 },
  { id: "h4", time: "21:47", from: "Rautatientori", to: "Herttoniemi", km: 8.9, price: 30.6, suggested: 28.6 },
  { id: "h5", time: "22:20", from: "Töölö", to: "Kallio", km: 3.8, price: 15.9, suggested: 15.9 },
  { id: "h6", time: "23:08", from: "Punavuori", to: "Käpylä", km: 7.4, price: 29.1, suggested: 27.1 },
];
