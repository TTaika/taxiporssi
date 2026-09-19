import { motion } from "framer-motion";
import { ChartSpline, CircleCheck, CircleMinus, CircleX, Navigation, RotateCcw, TrendingUp } from "lucide-react";
import { useApp, type ActiveRequest } from "../../state/AppContext";
import { roundCents } from "../../lib/pricing";
import { fmtEur, fmtPct1 } from "../../lib/format";

export function ResultView({ active }: { active: ActiveRequest }) {
  const { dispatch } = useApp();
  const { request, recommended, phase } = active;
  const sent = active.sentBid ?? active.bid;
  const diff = roundCents(sent - recommended);

  const icon = {
    accepted: { Icon: CircleCheck, className: "glow-go bg-go text-go-ink" },
    declined: { Icon: CircleX, className: "bg-stop/15 text-stop" },
    lost: { Icon: CircleMinus, className: "bg-deck-2 text-ink-2" },
  }[phase as "accepted" | "declined" | "lost"];

  return (
    <div className="flex flex-1 flex-col px-5 pb-5 pt-6" aria-live="assertive">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 18 }}
          className={`grid size-20 place-items-center rounded-full ${icon.className}`}
        >
          <icon.Icon size={44} strokeWidth={2.2} />
        </motion.div>

        {phase === "accepted" && (
          <>
            <h2 className="mt-5 font-display text-[30px] font-semibold leading-tight">
              The customer accepted your offer!
            </h2>
            <p className="mt-2 text-ink-2">
              {request.customer.name} is waiting at {request.pickup.address}.
            </p>
            <dl className="mt-5 grid w-full grid-cols-2 gap-2 text-left">
              <div className="rounded-xl bg-deck-2 px-3 py-2.5">
                <dt className="text-xs text-ink-3">Agreed price</dt>
                <dd className="font-display text-[28px] font-semibold leading-tight">{fmtEur(sent)}</dd>
              </div>
              <div className="rounded-xl bg-deck-2 px-3 py-2.5">
                <dt className="text-xs text-ink-3">To pickup</dt>
                <dd className="font-display text-[28px] font-semibold leading-tight">{request.pickupMin} min</dd>
              </div>
            </dl>
            {diff > 0 && (
              <p className="mt-3 flex items-center gap-2 text-ink-2">
                <TrendingUp size={18} className="text-go" aria-hidden />
                Your counter-offer earned {fmtEur(diff)} more than the suggested price
              </p>
            )}
          </>
        )}

        {phase === "declined" && (
          <>
            <h2 className="mt-5 font-display text-[30px] font-semibold leading-tight">
              The customer declined your offer
            </h2>
            <p className="mt-2 max-w-[34ch] text-ink-2">
              Your offer of {fmtEur(sent)} was {fmtPct1(diff / recommended)} above the suggested price. Tonight
              customers usually accept up to ~15% more. Try a lower price.
            </p>
          </>
        )}

        {phase === "lost" && (
          <>
            <h2 className="mt-5 font-display text-[30px] font-semibold leading-tight">
              {active.lost?.reason === "cancelled"
                ? "The customer cancelled the order"
                : "The customer chose another driver"}
            </h2>
            {active.lost?.winner ? (
              <>
                <p className="mt-2 max-w-[34ch] text-ink-2">Here's how the chosen offer compared with yours.</p>
                <dl className="mt-5 grid w-full grid-cols-2 gap-2 text-left">
                  <div className="rounded-xl bg-deck-2 px-3 py-2.5">
                    <dt className="text-xs text-ink-3">Chosen price</dt>
                    <dd className="font-display text-[28px] font-semibold leading-tight">
                      {fmtEur(active.lost.winner.price)}
                    </dd>
                    <dd className="text-sm text-ink-2">
                      {active.sentBid === null ? "You didn't offer in time" : `Yours: ${fmtEur(active.sentBid)}`}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-deck-2 px-3 py-2.5">
                    <dt className="text-xs text-ink-3">Chosen pickup time</dt>
                    <dd className="font-display text-[28px] font-semibold leading-tight">
                      {active.lost.winner.etaMin} min
                    </dd>
                    <dd className="text-sm text-ink-2">Yours: {request.pickupMin} min</dd>
                  </div>
                </dl>
              </>
            ) : (
              <p className="mt-2 max-w-[34ch] text-ink-2">The request left the market before the customer chose.</p>
            )}
          </>
        )}
      </div>

      {phase === "accepted" && (
        <button
          type="button"
          onClick={() => dispatch({ type: "startPickup", at: Date.now() })}
          className="glow-go flex h-16 w-full items-center justify-center gap-2.5 rounded-2xl bg-go text-xl font-semibold text-go-ink"
        >
          <Navigation size={22} strokeWidth={2.5} />
          Start pickup
        </button>
      )}

      {phase === "declined" && (
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => dispatch({ type: "retry" })}
            className="glow-volt flex h-16 w-full items-center justify-center gap-2.5 rounded-2xl bg-volt text-xl font-semibold text-night"
          >
            <RotateCcw size={21} strokeWidth={2.5} />
            Make a new offer
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: "skip", reason: "skipped" })}
            className="h-12 font-medium text-ink-2 hover:text-ink"
          >
            Skip ride
          </button>
        </div>
      )}

      {phase === "lost" && (
        <button
          type="button"
          onClick={() => dispatch({ type: "skip", reason: "closed" })}
          className="flex h-16 w-full items-center justify-center gap-2.5 rounded-2xl border border-line bg-deck-2 text-xl font-semibold text-ink"
        >
          <ChartSpline size={21} />
          Back to market
        </button>
      )}
    </div>
  );
}
