/*
  Asiakkaan puolen mock-data. Asiakas (Aino) valitsee noutopaikan ja kohteen; kilpailevat
  kuljettajat ovat eri puolilla keskustaa. Pisteet, reitit, matkat ja ajat: src/data/helsinki.ts.
*/

import { cars, places, routes, type Pt, type Route } from "./helsinki";

export type { Pt };

export const rider = {
  name: "Aino",
  initials: "A",
  rating: 4.9,
  rides: 38,
  payment: "Visa ending 4821",
};

export interface Place {
  id: string;
  /** Oma nimi (Home, Work) tai paikan nimi */
  label?: string;
  /** Lyhyt nimi pikavalintaan */
  short?: string;
  kind: "home" | "work" | "recent" | "place" | "location";
  address: string;
  area: string;
}

export const DEFAULT_PICKUP = "fredrikinkatu34";

export const pickupOptions: Place[] = [
  { id: "fredrikinkatu34", label: "Your location", kind: "location", address: "Fredrikinkatu 34", area: "Kamppi" },
  { id: "kaivokatu1", label: "Helsinki Central Station", kind: "place", address: "Kaivokatu 1", area: "Kluuvi" },
  { id: "vaasankatu12", kind: "place", address: "Vaasankatu 12", area: "Kallio" },
  {
    id: "tyynenmerenkatu14",
    label: "West Harbour, Terminal 2",
    kind: "place",
    address: "Tyynenmerenkatu 14",
    area: "Jätkäsaari",
  },
];

export const destinations: Place[] = [
  { id: "makelankatu52", label: "Home", kind: "home", address: "Mäkelänkatu 52", area: "Vallila" },
  { id: "ratapihantie6", label: "Work", kind: "work", address: "Ratapihantie 6", area: "Pasila" },
  { id: "lauttasaarentie28", kind: "recent", address: "Lauttasaarentie 28", area: "Lauttasaari" },
  { id: "messitytonkatu4", kind: "recent", address: "Messitytönkatu 4", area: "Jätkäsaari" },
  {
    id: "kaivokatu1",
    label: "Helsinki Central Station",
    short: "Central Station",
    kind: "place",
    address: "Kaivokatu 1",
    area: "Kluuvi",
  },
  {
    id: "oodi",
    label: "Oodi Central Library",
    short: "Oodi Library",
    kind: "place",
    address: "Töölönlahdenkatu 4",
    area: "Kluuvi",
  },
  { id: "olympiastadion", label: "Olympic Stadium", kind: "place", address: "Paavo Nurmen tie 1", area: "Töölö" },
  { id: "kauppatori", label: "Market Square", kind: "place", address: "Kauppatori", area: "Kaartinkaupunki" },
  {
    id: "katajanokanlaituri8",
    label: "Katajanokka Terminal",
    kind: "place",
    address: "Katajanokanlaituri 8",
    area: "Katajanokka",
  },
  {
    id: "tyynenmerenkatu14",
    label: "West Harbour, Terminal 2",
    kind: "place",
    address: "Tyynenmerenkatu 14",
    area: "Jätkäsaari",
  },
  { id: "haartmaninkatu4", label: "Meilahti Hospital", kind: "place", address: "Haartmaninkatu 4", area: "Meilahti" },
  {
    id: "hermanninrantatie5",
    label: "Redi Shopping Centre",
    kind: "place",
    address: "Hermannin rantatie 5",
    area: "Kalasatama",
  },
  { id: "vaasankatu12", kind: "place", address: "Vaasankatu 12", area: "Kallio" },
  { id: "isopuistotie1", label: "Kaivohuone", kind: "place", address: "Iso Puistotie 1", area: "Kaivopuisto" },
];

/** Pikavalinnat hakukentän alla. */
export const popularIds = ["kaivokatu1", "kauppatori", "olympiastadion", "oodi"];

export const pickupById = (id: string) => pickupOptions.find((p) => p.id === id) ?? pickupOptions[0];
export const destinationById = (id: string) => destinations.find((d) => d.id === id)!;

export const pointOf = (id: string) => (places as Record<string, Pt>)[id];

/** Asiakkaan kyyti noutopaikasta kohteeseen. */
export const tripRoute = (pickupId: string, destId: string): Route => routes[`${pickupId}>${destId}`];

/** Kuljettajan ajo noutopaikalle. */
export const approachRoute = (driverId: string, pickupId: string): Route => routes[`${driverId}>${pickupId}`];

/** Kuljettajan näkymän kuljettaja (Mikko) lähtee Erottajalta. */
export const LINKED_DRIVER_ID = "mikko";

export interface Competitor {
  id: string;
  name: string;
  initials: string;
  tier: string;
  rating: number;
  car: string;
  plate: string;
  /** Tarjous suhteessa suositushintaan, euroa */
  priceDelta: number;
  /** Milloin tarjous saapuu tilauksen jälkeen */
  delayMs: number;
}

export const competitors: Competitor[] = [
  {
    id: "sanna",
    name: "Sanna K.",
    initials: "SK",
    tier: "Gold",
    rating: 4.81,
    car: "Škoda Octavia",
    plate: "MLS-317",
    priceDelta: 0,
    delayMs: 1800,
  },
  {
    id: "ahmed",
    name: "Ahmed R.",
    initials: "AR",
    tier: "Gold",
    rating: 4.88,
    car: "Tesla Model 3",
    plate: "ZTE-905",
    priceDelta: 2,
    delayMs: 4200,
  },
  {
    id: "juha",
    name: "Juha V.",
    initials: "JV",
    tier: "Silver",
    rating: 4.64,
    car: "Mercedes-Benz E 300",
    plate: "KRV-221",
    priceDelta: -1,
    delayMs: 6800,
  },
];

export const carPoint = (driverId: string) => (cars as Record<string, Pt>)[driverId];

/** Muita vapaita autoja kartalla (tarjontaa). */
export const idleCars: Pt[] = [cars.idle1, cars.idle2, cars.idle3, cars.idle4, cars.idle5];

export const positiveTags = ["Smooth ride", "Clean car", "Friendly", "Good route", "Fair price"];
export const improvementTags = ["Late", "Driving style", "Car cleanliness", "Route", "Price"];
