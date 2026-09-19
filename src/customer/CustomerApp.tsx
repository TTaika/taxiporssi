import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CityMap, type CarMotion, type MapScene } from "../components/CityMap";
import { Logo } from "../components/Logo";
import { Toast } from "../components/Toast";
import {
  LINKED_DRIVER_ID,
  carPoint,
  competitors,
  destinationById,
  idleCars,
  pointOf,
  rider,
  tripRoute,
  type Pt,
} from "../data/customer";
import { demandNow } from "../data/market";
import { stageDuration, useApp, type CustomerStage, type CustomerState } from "../state/AppContext";
import { HomeSheet } from "./HomeSheet";
import { OffersSheet } from "./OffersSheet";
import { QuoteSheet } from "./QuoteSheet";
import { RatingSheet } from "./RatingSheet";
import { ReceiptSheet } from "./ReceiptSheet";
import { RideSheet } from "./RideSheet";

const SHEETS: Record<CustomerStage, (props: { customer: CustomerState }) => ReactNode> = {
  home: HomeSheet,
  quote: QuoteSheet,
  offers: OffersSheet,
  ride: RideSheet,
  receipt: ReceiptSheet,
  rating: RatingSheet,
};

const allCars: Pt[] = [...idleCars, ...competitors.map((c) => carPoint(c.id)), carPoint(LINKED_DRIVER_ID)];

const nearest = (from: Pt, points: Pt[], n: number) =>
  [...points]
    .sort((a, b) => Math.hypot(a[0] - from[0], a[1] - from[1]) - Math.hypot(b[0] - from[0], b[1] - from[1]))
    .slice(0, n);

/** Paneeli nousee kartan alareunan päälle; kotinäkymässä yläreunassa on lisäksi tietosiru. */
const MAP_INSETS = { top: 16, right: 16, bottom: 40, left: 16 };
const HOME_MAP_INSETS = { ...MAP_INSETS, top: 40 };

export function CustomerApp() {
  const { state } = useApp();
  const { customer } = state;
  const destination = customer.destinationId ? destinationById(customer.destinationId) : null;
  const Sheet = SHEETS[customer.stage];

  const trip = customer.tripId ? state.trips[customer.tripId] : undefined;

  // Kartan sisältö vaiheen mukaan: kotinäkymässä tarjonta, sitten reitti, lopuksi kuljettajan ajo.
  const pickupPoint = pointOf(customer.pickupId);
  let scene: MapScene = { pickup: pickupPoint };
  let cars: Pt[] = allCars;
  let carMotion: CarMotion = "idle";
  // Kotinäkymässä rajataan noutopaikkaan ja lähimpiin autoihin, jotta pieni kartta ei zoomaa koko kaupunkiin.
  let focus: Pt[] | undefined = nearest(pickupPoint, allCars, 4);
  if (destination) {
    scene = {
      pickup: pickupPoint,
      dropoff: pointOf(destination.id),
      trip: tripRoute(customer.pickupId, destination.id).path,
    };
    cars = customer.stage === "offers" ? customer.offers.map((o) => o.carPoint) : [];
    focus = undefined;
  }
  if (trip) {
    scene = trip.map;
    carMotion = trip.stage === "pickup" ? "approach" : trip.stage === "onboard" ? "trip" : "arrived";
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-night">
      <header className="flex h-14 shrink-0 items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="font-display text-[22px] font-semibold tracking-wide">Taxipörssi</span>
        </div>
        <span className="flex items-center gap-2 text-sm text-ink-2">
          {rider.name}
          <span
            className="grid size-8 place-items-center rounded-full bg-deck-2 font-display font-semibold text-ink"
            aria-hidden
          >
            {rider.initials}
          </span>
        </span>
      </header>

      <div className="relative min-h-[110px] flex-1">
        <CityMap
          scene={scene}
          sceneKey={destination ? `trip-${customer.pickupId}-${destination.id}-${customer.orderId ?? 0}` : "home"}
          motion={carMotion}
          focus={focus}
          motionStart={trip?.stageStartedAt}
          motionMs={trip ? stageDuration(trip) : undefined}
          insets={customer.stage === "home" ? HOME_MAP_INSETS : MAP_INSETS}
          cars={cars}
          label={destination ? `Map: route to ${destination.address}` : "Map: your location and free cars"}
        />
        {customer.stage === "home" && (
          <span className="absolute left-3 top-2 flex items-center gap-2 rounded-full border border-line bg-night/85 px-3 py-1 text-sm font-medium backdrop-blur">
            <span className="size-2 rounded-full bg-ink-2" aria-hidden />
            {demandNow.freeCars} free cars nearby
          </span>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-deck to-transparent" />
      </div>

      {/* Tarjouslista rullaa, jotta kartalle jää tilaa näyttää reitti. */}
      <div
        className={`relative -mt-4 flex ${customer.stage === "offers" ? "max-h-[60%]" : "max-h-[72%]"} shrink-0 flex-col rounded-t-3xl border-t border-line bg-deck pb-[var(--safe-bottom,env(safe-area-inset-bottom))]`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={customer.stage}
            className="no-scrollbar min-h-0 overflow-y-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <Sheet customer={customer} />
          </motion.div>
        </AnimatePresence>
      </div>

      <Toast role="customer" />
    </div>
  );
}
