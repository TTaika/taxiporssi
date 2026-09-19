import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from "react";
import { liveTicks } from "../data/market";
import { requests, type RideRequest } from "../data/requests";
import { todaysRides, type Ride } from "../data/rides";
import { driver as driverProfile, reviews as initialReviews, type Review } from "../data/profile";
import {
  DEFAULT_PICKUP,
  LINKED_DRIVER_ID,
  approachRoute,
  carPoint,
  competitors,
  destinationById,
  pickupById,
  pointOf,
  rider,
  tripRoute,
  type Pt,
} from "../data/customer";
import { clampBid, customerAccepts, recommendedPrice, roundCents } from "../lib/pricing";
import { demoMinutes, fmtTime } from "../lib/clock";

export type Role = "driver" | "customer";
export type Tab = "market" | "rides" | "profile";
export type Phase = "bidding" | "waiting" | "accepted" | "declined" | "lost";
export type CustomerStage = "home" | "quote" | "offers" | "ride" | "receipt" | "rating";
export type TripStage = "pickup" | "onboard" | "done";

export const OFFER_SECONDS = 30;
const CUSTOMER_THINK_MS = 2400;
const TICK_MS = 4000;
/** Demossa kyyti on nopeutettu: nouto ja matka kestävät muutaman sekunnin. */
export const STAGE_MS: Record<Exclude<TripStage, "done">, number> = { pickup: 5000, onboard: 6000 };

export interface Offer {
  id: string;
  name: string;
  initials: string;
  tier: string;
  rating: number;
  car: string;
  plate: string;
  etaMin: number;
  price: number;
  carPoint: Pt;
  approach: Pt[];
  /** Tarjous tuli kuljettajan näkymästä (Mikko), ei simulaatiosta */
  fromDriverApp: boolean;
}

/** Yksi kyyti kartalla. Asiakkaan ja kuljettajan näkymä voivat seurata samaa kyytiä. */
export interface Trip {
  id: string;
  map: RideRequest["map"];
  pickupMin: number;
  tripMin: number;
  stage: TripStage;
  stageStartedAt: number;
}

export interface ActiveRequest {
  request: RideRequest;
  /** Markkinan kilometrihinta pyynnön saapuessa */
  perKm: number;
  recommended: number;
  bid: number;
  /** Viimeksi asiakkaalle lähetetty hinta */
  sentBid: number | null;
  phase: Phase;
  secondsLeft: number;
  /** Asiakkaan näkymästä tullut tilaus: asiakas päättää, simulaatio ei vastaa */
  orderId: number | null;
  /** Asiakkaan valitsema kyyti, joka on jo käynnissä */
  tripId?: string;
  lost?: { reason: "other" | "cancelled"; winner?: Offer };
}

/** Kuljettajan käynnissä oleva kyyti. */
export interface DriverRide {
  tripId: string;
  request: RideRequest;
  price: number;
  suggested: number;
  /** Kyyti on kirjattu päivän tuloihin */
  earned: boolean;
}

export interface CustomerState {
  stage: CustomerStage;
  pickupId: string;
  destinationId: string | null;
  orderId: number | null;
  perKm: number;
  recommended: number;
  offers: Offer[];
  chosen: Offer | null;
  tripId: string | null;
  /** Kuitin tiedot kyydin päätyttyä */
  receipt: { number: string; at: number } | null;
}

interface Toast {
  id: number;
  text: string;
}

interface State {
  /** Kumpi puhelin näkyy, kun ruudulle mahtuu vain yksi */
  role: Role;
  tick: number;
  trips: Record<string, Trip>;
  // Kuljettaja
  tab: Tab;
  online: boolean;
  active: ActiveRequest | null;
  driverRide: DriverRide | null;
  nextRequest: number;
  /** Viive seuraavaan automaattiseen kyytipyyntöön, kun kuljettaja on ajossa */
  nextDelayMs: number;
  rides: Ride[];
  reviews: Review[];
  rating: number;
  ratingCount: number;
  // Asiakas
  customer: CustomerState;
  orderSeq: number;
  tripSeq: number;
  toastSeq: number;
  toasts: Record<Role, Toast | null>;
}

type Action =
  | { type: "setRole"; role: Role }
  | { type: "setTab"; tab: Tab }
  | { type: "setOnline"; online: boolean }
  | { type: "tick" }
  | { type: "incoming" }
  | { type: "setBid"; bid: number }
  | { type: "send" }
  | { type: "respond" }
  | { type: "retry" }
  | { type: "skip"; reason: "skipped" | "expired" | "closed" }
  | { type: "startPickup"; at: number }
  | { type: "advanceTrip"; id: string; at: number }
  | { type: "closeDriverRide" }
  | { type: "countdown" }
  | { type: "setPickup"; id: string }
  | { type: "chooseDestination"; id: string }
  | { type: "backHome" }
  | { type: "order" }
  | { type: "competitorOffer"; orderId: number; competitorId: string }
  | { type: "chooseOffer"; offerId: string; at: number }
  | { type: "cancelOrder" }
  | { type: "startRating" }
  | { type: "rate"; stars: number; text: string }
  | { type: "skipRating" }
  | { type: "clearToast"; role: Role }
  | { type: "reset" };

const idleCustomer = (pickupId: string): CustomerState => ({
  stage: "home",
  pickupId,
  destinationId: null,
  orderId: null,
  perKm: 0,
  recommended: 0,
  offers: [],
  chosen: null,
  tripId: null,
  receipt: null,
});

const initialState: State = {
  role: "customer",
  tick: 0,
  trips: {},
  tab: "market",
  online: false,
  active: null,
  driverRide: null,
  nextRequest: 0,
  nextDelayMs: 2500,
  rides: todaysRides,
  reviews: initialReviews,
  rating: driverProfile.rating,
  ratingCount: driverProfile.ratingCount,
  customer: idleCustomer(DEFAULT_PICKUP),
  orderSeq: 0,
  tripSeq: 0,
  toastSeq: 0,
  toasts: { driver: null, customer: null },
};

const livePriceAt = (tick: number) => liveTicks[tick % liveTicks.length];

const withToast = (state: State, role: Role, text: string): State => ({
  ...state,
  toastSeq: state.toastSeq + 1,
  toasts: { ...state.toasts, [role]: { id: state.toastSeq + 1, text } },
});

/** Luo uuden kyydin ja palauttaa sen tunnisteen. */
function createTrip(state: State, trip: Omit<Trip, "id" | "stage" | "stageStartedAt">, at: number) {
  const id = `trip-${state.tripSeq + 1}`;
  return {
    id,
    state: {
      ...state,
      tripSeq: state.tripSeq + 1,
      trips: { ...state.trips, [id]: { ...trip, id, stage: "pickup" as const, stageStartedAt: at } },
    },
  };
}

/** Kirjaa kuljettajan kyydin tuloihin, kun kyyti on perillä. */
function earnIfDone(state: State, at: number): State {
  const ride = state.driverRide;
  if (!ride || ride.earned || state.trips[ride.tripId]?.stage !== "done") return state;
  const entry: Ride = {
    id: ride.tripId,
    time: fmtTime(demoMinutes(at)),
    from: ride.request.pickup.area,
    to: ride.request.dropoff.area,
    km: ride.request.tripKm,
    price: ride.price,
    suggested: ride.suggested,
  };
  return { ...state, rides: [...state.rides, entry], driverRide: { ...ride, earned: true } };
}

/** Kuljettajan näkymän tarjous sellaisena kuin asiakas sen näkee. */
function linkedOffer(active: ActiveRequest, rating: number): Offer {
  return {
    id: "linked-driver",
    name: driverProfile.name.replace(/ (\S)\S*$/, " $1."),
    initials: driverProfile.initials,
    tier: driverProfile.tier,
    rating,
    car: driverProfile.carShort,
    plate: driverProfile.plate,
    etaMin: active.request.pickupMin,
    price: active.sentBid ?? active.bid,
    carPoint: active.request.map.car,
    approach: active.request.map.approach,
    fromDriverApp: true,
  };
}

/** Jos kuljettaja käsittelee tätä tilausta, asiakkaan valinta ratkaisee sen lopputuloksen. */
function resolveLinked(active: ActiveRequest | null, orderId: number | null, outcome: Partial<ActiveRequest>) {
  if (!active || active.orderId === null || active.orderId !== orderId) return active;
  if (active.phase !== "bidding" && active.phase !== "waiting") return active;
  return { ...active, ...outcome };
}

function reducer(state: State, action: Action): State {
  const active = state.active;
  const customer = state.customer;

  switch (action.type) {
    case "setRole":
      return { ...state, role: action.role };

    case "setTab":
      return { ...state, tab: action.tab };

    case "setOnline":
      return { ...state, online: action.online, nextDelayMs: 2500 };

    case "tick":
      return { ...state, tick: state.tick + 1 };

    // ---------- Kuljettaja ----------

    case "incoming": {
      if (active || state.driverRide) return state;
      const request = requests[state.nextRequest % requests.length];
      const perKm = livePriceAt(state.tick);
      const recommended = recommendedPrice(request.tripKm, perKm);
      return {
        ...state,
        online: true,
        nextRequest: state.nextRequest + 1,
        active: {
          request,
          perKm,
          recommended,
          bid: recommended,
          sentBid: null,
          phase: "bidding",
          secondsLeft: OFFER_SECONDS,
          orderId: null,
        },
      };
    }

    case "setBid":
      if (active?.phase !== "bidding") return state;
      return { ...state, active: { ...active, bid: clampBid(action.bid, active.recommended) } };

    case "send": {
      if (active?.phase !== "bidding") return state;
      const sent: ActiveRequest = { ...active, phase: "waiting", sentBid: active.bid };
      const reachesCustomer = sent.orderId !== null && customer.stage === "offers" && customer.orderId === sent.orderId;
      if (!reachesCustomer) return { ...state, active: sent };
      return {
        ...state,
        active: sent,
        customer: {
          ...customer,
          offers: [...customer.offers.filter((o) => !o.fromDriverApp), linkedOffer(sent, state.rating)],
        },
      };
    }

    case "respond": {
      if (active?.phase !== "waiting" || active.sentBid === null || active.orderId !== null) return state;
      const accepted = customerAccepts(active.sentBid, active.recommended);
      return { ...state, active: { ...active, phase: accepted ? "accepted" : "declined" } };
    }

    case "retry":
      if (active?.phase !== "declined") return state;
      return {
        ...state,
        active: { ...active, phase: "bidding", secondsLeft: Math.max(active.secondsLeft, 15) },
      };

    case "countdown":
      if (active?.phase !== "bidding") return state;
      if (active.secondsLeft <= 1) return reducer(state, { type: "skip", reason: "expired" });
      return { ...state, active: { ...active, secondsLeft: active.secondsLeft - 1 } };

    case "skip": {
      if (!active) return state;
      const cleared = { ...state, active: null, nextDelayMs: 8000 };
      if (action.reason === "closed") return cleared;
      return withToast(cleared, "driver", action.reason === "expired" ? "Ride request expired" : "Ride skipped");
    }

    case "startPickup": {
      if (active?.phase !== "accepted" || active.sentBid === null) return state;
      const { request } = active;
      let next: State = state;
      let tripId = active.tripId;
      // Simuloidulla asiakkaalla kyyti alkaa vasta nyt; oikean asiakkaan kyyti on jo käynnissä.
      if (!tripId || !state.trips[tripId]) {
        const created = createTrip(
          state,
          { map: request.map, pickupMin: request.pickupMin, tripMin: request.tripMin },
          action.at,
        );
        tripId = created.id;
        next = created.state;
      }
      next = {
        ...next,
        active: null,
        driverRide: { tripId, request, price: active.sentBid, suggested: active.recommended, earned: false },
      };
      return earnIfDone(next, action.at);
    }

    case "advanceTrip": {
      const trip = state.trips[action.id];
      if (!trip || trip.stage === "done") return state;
      const stage: TripStage = trip.stage === "pickup" ? "onboard" : "done";
      let next: State = {
        ...state,
        trips: { ...state.trips, [trip.id]: { ...trip, stage, stageStartedAt: action.at } },
      };
      if (stage === "done" && customer.tripId === trip.id && customer.stage === "ride") {
        next = {
          ...next,
          customer: {
            ...customer,
            stage: "receipt",
            receipt: { number: `TX-${String(customer.orderId ?? 0).padStart(5, "0")}`, at: demoMinutes(action.at) },
          },
        };
      }
      return earnIfDone(next, action.at);
    }

    case "closeDriverRide":
      if (!state.driverRide) return state;
      return { ...state, driverRide: null, nextDelayMs: 20000 };

    // ---------- Asiakas ----------

    case "setPickup":
      if (customer.stage !== "home") return state;
      return { ...state, customer: idleCustomer(action.id) };

    case "chooseDestination": {
      if (customer.stage !== "home" && customer.stage !== "quote") return state;
      const route = tripRoute(customer.pickupId, action.id);
      if (!route) return state;
      const perKm = livePriceAt(state.tick);
      return {
        ...state,
        customer: {
          ...idleCustomer(customer.pickupId),
          stage: "quote",
          destinationId: action.id,
          perKm,
          recommended: recommendedPrice(route.km, perKm),
        },
      };
    }

    case "backHome":
      if (customer.stage !== "quote") return state;
      return { ...state, customer: idleCustomer(customer.pickupId) };

    case "order": {
      if (customer.stage !== "quote" || !customer.destinationId) return state;
      const pickup = pickupById(customer.pickupId);
      const destination = destinationById(customer.destinationId);
      const route = tripRoute(pickup.id, destination.id);
      const approach = approachRoute(LINKED_DRIVER_ID, pickup.id);
      const orderId = state.orderSeq + 1;
      const request: RideRequest = {
        id: `order-${orderId}`,
        customer: { name: rider.name, rating: rider.rating, rides: rider.rides },
        pickup: { address: pickup.address, area: pickup.area },
        dropoff: { address: destination.address, area: destination.area },
        pickupKm: approach.km,
        pickupMin: approach.min,
        tripKm: route.km,
        tripMin: route.min,
        map: {
          car: carPoint(LINKED_DRIVER_ID),
          pickup: pointOf(pickup.id),
          dropoff: pointOf(destination.id),
          approach: approach.path,
          trip: route.path,
        },
      };
      // Tilaus menee aina myös kuljettajan näkymään (demo korvaa mahdollisen simuloidun pyynnön).
      // Jos kuljettaja on kesken kyydin, hän ei ehdi tarjota: asiakas saa vain kilpailijoiden tarjoukset.
      const driverFree = !state.driverRide;
      return {
        ...state,
        orderSeq: orderId,
        online: driverFree ? true : state.online,
        customer: { ...customer, stage: "offers", orderId, offers: [] },
        active: driverFree
          ? {
              request,
              perKm: customer.perKm,
              recommended: customer.recommended,
              bid: customer.recommended,
              sentBid: null,
              phase: "bidding",
              secondsLeft: OFFER_SECONDS,
              orderId,
            }
          : active,
      };
    }

    case "competitorOffer": {
      if (customer.stage !== "offers" || customer.orderId !== action.orderId) return state;
      if (customer.offers.some((o) => o.id === action.competitorId)) return state;
      const c = competitors.find((x) => x.id === action.competitorId);
      if (!c) return state;
      const approach = approachRoute(c.id, customer.pickupId);
      const offer: Offer = {
        id: c.id,
        name: c.name,
        initials: c.initials,
        tier: c.tier,
        rating: c.rating,
        car: c.car,
        plate: c.plate,
        etaMin: approach.min,
        price: roundCents(customer.recommended + c.priceDelta),
        carPoint: carPoint(c.id),
        approach: approach.path,
        fromDriverApp: false,
      };
      return { ...state, customer: { ...customer, offers: [...customer.offers, offer] } };
    }

    case "chooseOffer": {
      if (customer.stage !== "offers" || !customer.destinationId) return state;
      const offer = customer.offers.find((o) => o.id === action.offerId);
      if (!offer) return state;
      const route = tripRoute(customer.pickupId, customer.destinationId);
      const { id: tripId, state: withTrip } = createTrip(
        state,
        {
          map: {
            car: offer.carPoint,
            pickup: pointOf(customer.pickupId),
            dropoff: pointOf(customer.destinationId),
            approach: offer.approach,
            trip: route.path,
          },
          pickupMin: offer.etaMin,
          tripMin: route.min,
        },
        action.at,
      );
      return {
        ...withTrip,
        active: resolveLinked(
          active,
          customer.orderId,
          offer.fromDriverApp
            ? { phase: "accepted", tripId }
            : { phase: "lost", lost: { reason: "other", winner: offer } },
        ),
        customer: { ...customer, stage: "ride", chosen: offer, tripId },
      };
    }

    case "cancelOrder":
      if (customer.stage !== "offers") return state;
      return withToast(
        {
          ...state,
          active: resolveLinked(active, customer.orderId, { phase: "lost", lost: { reason: "cancelled" } }),
          customer: idleCustomer(customer.pickupId),
        },
        "customer",
        "Order cancelled",
      );

    case "startRating":
      if (customer.stage !== "receipt") return state;
      return { ...state, customer: { ...customer, stage: "rating" } };

    case "rate": {
      if (customer.stage !== "rating" || !customer.chosen) return state;
      let next: State = { ...state, customer: idleCustomer(customer.pickupId) };
      if (customer.chosen.fromDriverApp) {
        const count = state.ratingCount + 1;
        next = withToast(
          {
            ...next,
            reviews: [
              {
                id: `order-${customer.orderId}`,
                name: rider.name,
                stars: action.stars,
                when: "just now",
                text: action.text,
              },
              ...state.reviews,
            ],
            ratingCount: count,
            rating: roundCents((state.rating * state.ratingCount + action.stars) / count),
          },
          "driver",
          `New rating from ${rider.name}: ${action.stars} ${action.stars === 1 ? "star" : "stars"}`,
        );
      }
      return withToast(next, "customer", "Thanks for your rating!");
    }

    case "skipRating":
      if (customer.stage !== "rating" && customer.stage !== "receipt") return state;
      return { ...state, customer: idleCustomer(customer.pickupId) };

    case "clearToast":
      return { ...state, toasts: { ...state.toasts, [action.role]: null } };

    case "reset":
      return { ...initialState, tick: state.tick, role: state.role };
  }
}

interface AppContextValue {
  state: State;
  dispatch: Dispatch<Action>;
  livePrice: number;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { online, active, driverRide, nextDelayMs, toasts, customer, trips } = state;
  const phase = active?.phase;
  const activeId = active?.request.id;
  const linked = active ? active.orderId !== null : false;
  const { stage, orderId } = customer;

  // Markkinahinta "elää" muutaman sekunnin välein.
  useEffect(() => {
    const id = setInterval(() => dispatch({ type: "tick" }), TICK_MS);
    return () => clearInterval(id);
  }, []);

  // Ajossa ollessa uusi simuloitu kyytipyyntö saapuu automaattisesti, kun kuljettaja on vapaa.
  useEffect(() => {
    if (!online || activeId || driverRide) return;
    const id = setTimeout(() => dispatch({ type: "incoming" }), nextDelayMs);
    return () => clearTimeout(id);
  }, [online, activeId, driverRide, nextDelayMs]);

  // Tarjousaika kuluu vain, kun kuljettaja on päättämässä hintaa.
  useEffect(() => {
    if (phase !== "bidding") return;
    const id = setInterval(() => dispatch({ type: "countdown" }), 1000);
    return () => clearInterval(id);
  }, [phase, activeId]);

  // Simuloitu asiakas "miettii" hetken. Oikean asiakkaan tilauksessa päättää asiakkaan näkymä.
  useEffect(() => {
    if (phase !== "waiting" || linked) return;
    const id = setTimeout(() => dispatch({ type: "respond" }), CUSTOMER_THINK_MS);
    return () => clearTimeout(id);
  }, [phase, linked]);

  // Kilpailevien kuljettajien tarjoukset saapuvat asiakkaalle porrastetusti.
  useEffect(() => {
    if (stage !== "offers" || orderId === null) return;
    const ids = competitors.map((c) =>
      setTimeout(() => dispatch({ type: "competitorOffer", orderId, competitorId: c.id }), c.delayMs),
    );
    return () => ids.forEach(clearTimeout);
  }, [stage, orderId]);

  // Kyydit etenevät: nouto, matka, perillä. Sama ajastin palvelee molempia näkymiä.
  useEffect(() => {
    const timers = Object.values(trips)
      .filter((t) => t.stage !== "done")
      .map((t) => {
        const due = t.stageStartedAt + STAGE_MS[t.stage as Exclude<TripStage, "done">] - Date.now();
        return setTimeout(() => dispatch({ type: "advanceTrip", id: t.id, at: Date.now() }), Math.max(0, due));
      });
    return () => timers.forEach(clearTimeout);
  }, [trips]);

  useEffect(() => {
    if (!toasts.driver) return;
    const id = setTimeout(() => dispatch({ type: "clearToast", role: "driver" }), 2800);
    return () => clearTimeout(id);
  }, [toasts.driver]);

  useEffect(() => {
    if (!toasts.customer) return;
    const id = setTimeout(() => dispatch({ type: "clearToast", role: "customer" }), 2800);
    return () => clearTimeout(id);
  }, [toasts.customer]);

  return (
    <AppContext.Provider value={{ state, dispatch, livePrice: livePriceAt(state.tick) }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}

/** Kuinka pitkä kyydin nykyinen vaihe on (ms). */
export const stageDuration = (trip: Trip) => (trip.stage === "done" ? 0 : STAGE_MS[trip.stage]);
