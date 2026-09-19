import { motion } from "framer-motion";
import { ChartSpline, CircleCheck } from "lucide-react";
import { CityMap, type CarMotion } from "../CityMap";
import { useApp, stageDuration, type DriverRide } from "../../state/AppContext";
import { driver, tiers } from "../../data/profile";
import { useProgress } from "../../lib/clock";
import { roundCents } from "../../lib/pricing";
import { fmtEur, fmtKm, fmtPct } from "../../lib/format";

const MAP_INSETS = { top: 16, right: 16, bottom: 30, left: 16 };

/** Kuljettajan käynnissä oleva kyyti: nouto, matka ja lopuksi tulos. */
export function DriverRideView({ ride }: { ride: DriverRide }) {
  const { state, dispatch } = useApp();
  const trip = state.trips[ride.tripId];
  const { request } = ride;
  const stage = trip?.stage ?? "done";
  const progress = useProgress(trip?.stageStartedAt ?? 0, trip ? stageDuration(trip) || 1 : 1);

  const carMotion: CarMotion = stage === "pickup" ? "approach" : stage === "onboard" ? "trip" : "arrived";
  const pickupStage = stage === "pickup";
  const totalMin = pickupStage ? request.pickupMin : request.tripMin;
  const minsLeft = Math.max(0, Math.ceil(totalMin * (1 - progress)));

  const fee = tiers.find((t) => t.name === driver.tier)?.serviceFee ?? 0;
  const feeAmount = roundCents(ride.price * fee);

  return (
    <motion.div
      className="absolute inset-0 z-30 flex flex-col bg-night"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 32, stiffness: 320 }}
      role="dialog"
      aria-modal="true"
      aria-label="Ride in progress"
    >
      <div className="relative min-h-[180px] flex-1">
        {trip && (
          <CityMap
            scene={trip.map}
            sceneKey={trip.id}
            motion={carMotion}
            motionStart={trip.stageStartedAt}
            motionMs={stageDuration(trip)}
            insets={MAP_INSETS}
            label={`Map: ride from ${request.pickup.address} to ${request.dropoff.address}`}
          />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-deck to-transparent" />
      </div>

      <div
        className="relative -mt-4 shrink-0 rounded-t-3xl border-t border-line bg-deck px-4 pb-5 pt-5"
        aria-live="polite"
      >
        {stage !== "done" ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-ink-3">{pickupStage ? "Driving to pickup" : "Customer on board"}</p>
                <h2 className="truncate font-display text-[28px] font-semibold leading-tight">
                  {pickupStage ? request.pickup.address : request.dropoff.address}
                </h2>
                <p className="truncate text-ink-2">
                  {pickupStage
                    ? `${request.customer.name} is waiting in ${request.pickup.area}`
                    : `Drop-off in ${request.dropoff.area}`}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-display text-[32px] font-semibold leading-none">
                  {minsLeft > 0 ? `${minsLeft} min` : "Now"}
                </p>
                <p className="text-sm text-ink-3">{pickupStage ? "to pickup" : "to drop-off"}</p>
              </div>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-deck-2" aria-hidden>
              <div
                className={`h-full rounded-full transition-[width] duration-100 ease-linear ${pickupStage ? "bg-volt" : "bg-go"}`}
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-deck-2 px-3 py-2.5">
                <dt className="text-xs text-ink-3">Agreed price</dt>
                <dd className="font-display text-[26px] font-semibold leading-tight">{fmtEur(ride.price)}</dd>
              </div>
              <div className="rounded-xl bg-deck-2 px-3 py-2.5">
                <dt className="text-xs text-ink-3">Ride</dt>
                <dd className="font-display text-[26px] font-semibold leading-tight">
                  {fmtKm(request.tripKm)}, {request.tripMin} min
                </dd>
              </div>
            </dl>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <span className="glow-go grid size-12 shrink-0 place-items-center rounded-full bg-go text-go-ink">
                <CircleCheck size={28} strokeWidth={2.2} aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-[28px] font-semibold leading-tight">Ride complete</h2>
                <p className="truncate text-ink-2">
                  {request.customer.name} dropped off at {request.dropoff.address}
                </p>
              </div>
            </div>
            <dl className="mt-4 divide-y divide-line rounded-2xl border border-line">
              <div className="flex items-baseline justify-between px-4 py-2.5">
                <dt className="text-ink-2">Fare</dt>
                <dd className="tnum">{fmtEur(ride.price)}</dd>
              </div>
              <div className="flex items-baseline justify-between px-4 py-2.5">
                <dt className="text-ink-2">Service fee ({fmtPct(fee)})</dt>
                <dd className="tnum">−{fmtEur(feeAmount)}</dd>
              </div>
              <div className="flex items-baseline justify-between px-4 py-3">
                <dt className="font-semibold">You earn</dt>
                <dd className="font-display text-[28px] font-semibold leading-none">
                  {fmtEur(roundCents(ride.price - feeAmount))}
                </dd>
              </div>
            </dl>
            <p className="mt-2 text-sm text-ink-3">Added to today's earnings.</p>
            <button
              type="button"
              onClick={() => dispatch({ type: "closeDriverRide" })}
              className="glow-go mt-4 flex h-16 w-full items-center justify-center gap-2.5 rounded-2xl bg-go text-xl font-semibold text-go-ink"
            >
              <ChartSpline size={21} strokeWidth={2.5} aria-hidden />
              Back to market
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
