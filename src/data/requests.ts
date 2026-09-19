/*
  Saapuvat (simuloidut) kyytipyynnöt. Pisteet, reitit, matkat ja ajat: src/data/helsinki.ts.
*/

import { cars, places, routes, type Pt } from "./helsinki";

export interface RideRequest {
  id: string;
  customer: { name: string; rating: number; rides: number };
  pickup: { address: string; area: string };
  dropoff: { address: string; area: string };
  pickupKm: number;
  pickupMin: number;
  tripKm: number;
  tripMin: number;
  note?: string;
  map: {
    car: Pt;
    pickup: Pt;
    dropoff: Pt;
    /** Kuljettajan reitti noutopaikalle */
    approach: Pt[];
    /** Asiakkaan kyyti */
    trip: Pt[];
  };
}

export const requests: RideRequest[] = [
  {
    id: "r1",
    customer: { name: "Aino", rating: 4.9, rides: 38 },
    pickup: { address: "Fredrikinkatu 34", area: "Kamppi" },
    dropoff: { address: "Mäkelänkatu 52", area: "Vallila" },
    pickupKm: routes.r1Approach.km,
    pickupMin: routes.r1Approach.min,
    tripKm: routes.r1Trip.km,
    tripMin: routes.r1Trip.min,
    map: {
      car: cars.mikko,
      pickup: places.fredrikinkatu34,
      dropoff: places.makelankatu52,
      approach: routes.r1Approach.path,
      trip: routes.r1Trip.path,
    },
  },
  {
    id: "r2",
    customer: { name: "Juhani", rating: 4.7, rides: 12 },
    pickup: { address: "Kaisaniemenkatu 1", area: "Kluuvi" },
    dropoff: { address: "Lauttasaarentie 28", area: "Lauttasaari" },
    pickupKm: routes.r2Approach.km,
    pickupMin: routes.r2Approach.min,
    tripKm: routes.r2Trip.km,
    tripMin: routes.r2Trip.min,
    note: "Two suitcases",
    map: {
      car: cars.r2car,
      pickup: places.kaisaniemenkatu1,
      dropoff: places.lauttasaarentie28,
      approach: routes.r2Approach.path,
      trip: routes.r2Trip.path,
    },
  },
  {
    id: "r3",
    customer: { name: "Sara", rating: 5.0, rides: 61 },
    pickup: { address: "Vaasankatu 12", area: "Kallio" },
    dropoff: { address: "Messitytönkatu 4", area: "Jätkäsaari" },
    pickupKm: routes.r3Approach.km,
    pickupMin: routes.r3Approach.min,
    tripKm: routes.r3Trip.km,
    tripMin: routes.r3Trip.min,
    map: {
      car: cars.r3car,
      pickup: places.vaasankatu12,
      dropoff: places.messitytonkatu4,
      approach: routes.r3Approach.path,
      trip: routes.r3Trip.path,
    },
  },
];
