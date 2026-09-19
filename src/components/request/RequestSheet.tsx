import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Car, Flag, X } from "lucide-react";
import { CityMap } from "../CityMap";
import { stageDuration, useApp, type ActiveRequest } from "../../state/AppContext";
import { fmtKm } from "../../lib/format";
import { BidPanel } from "./BidPanel";
import { WaitingView } from "./WaitingView";
import { ResultView } from "./ResultView";

/** Tietosirut peittävät kartan yläosaa ja paneeli alareunaa. */
const MAP_INSETS = { top: 44, right: 16, bottom: 26, left: 16 };

export function RequestSheet({ active }: { active: ActiveRequest }) {
  const { state, dispatch } = useApp();
  const { request, phase } = active;
  // Kun asiakas valitsi tämän kuljettajan, kyyti on jo käynnissä asiakkaan näkymässä.
  const trip = active.tripId ? state.trips[active.tripId] : undefined;

  useEffect(() => {
    navigator.vibrate?.([90, 60, 90]);
  }, [request.id]);

  return (
    <motion.div
      className="absolute inset-0 z-30 flex flex-col bg-night"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 32, stiffness: 320 }}
      role="dialog"
      aria-modal="true"
      aria-label="Incoming ride request"
    >
      <div className="relative h-[27%] min-h-[150px] [@media(max-height:700px)]:h-[21%] [@media(max-height:700px)]:min-h-[110px] shrink-0">
        <CityMap
          scene={request.map}
          sceneKey={request.id}
          motion={trip && trip.stage !== "done" ? (trip.stage === "pickup" ? "approach" : "trip") : "idle"}
          motionStart={trip?.stageStartedAt}
          motionMs={trip ? stageDuration(trip) : undefined}
          insets={MAP_INSETS}
          label={`Map: pickup ${request.pickup.address}, destination ${request.dropoff.address}`}
        />

        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          <MapChip icon={<Car size={15} className="text-volt" />}>
            Pickup {fmtKm(request.pickupKm)}, {request.pickupMin} min
          </MapChip>
          <MapChip icon={<Flag size={15} className="text-go" />}>
            Ride {fmtKm(request.tripKm)}, {request.tripMin} min
          </MapChip>
        </div>

        {(phase === "bidding" || phase === "declined") && (
          <button
            type="button"
            onClick={() => dispatch({ type: "skip", reason: "skipped" })}
            className="absolute right-3 top-3 grid size-11 place-items-center rounded-full border border-line bg-night/85 text-ink-2 backdrop-blur hover:text-ink"
            aria-label="Skip ride"
          >
            <X size={20} />
          </button>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-deck to-transparent" />
      </div>

      <div className="relative -mt-3 flex min-h-0 flex-1 flex-col rounded-t-3xl border-t border-line bg-deck">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={phase}
            className="flex min-h-0 flex-1 flex-col"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {phase === "bidding" && <BidPanel active={active} />}
            {phase === "waiting" && <WaitingView active={active} />}
            {(phase === "accepted" || phase === "declined" || phase === "lost") && <ResultView active={active} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function MapChip({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-line bg-night/85 py-1 pl-2 pr-3 text-sm font-medium text-ink backdrop-blur">
      {icon}
      {children}
    </span>
  );
}
