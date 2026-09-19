import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { CircleAlert, CircleCheck, CircleX, Luggage, Pencil, RotateCcw, Send, Star, Timer } from "lucide-react";
import { useApp, OFFER_SECONDS, type ActiveRequest } from "../../state/AppContext";
import { acceptanceLevel, acceptanceProbability, bidBounds, roundCents, type AcceptanceLevel } from "../../lib/pricing";
import { fmtEur, fmtKm, fmtPct, fmtRating, fmtSignedEur, parseEur } from "../../lib/format";
import { RouteLine } from "../RouteLine";

const LEVELS: Record<AcceptanceLevel, { bar: string; icon: typeof CircleCheck; tone: string; text: string }> = {
  high: { bar: "bg-go", icon: CircleCheck, tone: "text-go", text: "The customer will likely accept" },
  medium: { bar: "bg-amber", icon: CircleAlert, tone: "text-amber", text: "Acceptance is uncertain" },
  low: { bar: "bg-stop", icon: CircleX, tone: "text-stop", text: "The customer will likely decline" },
};

export function BidPanel({ active }: { active: ActiveRequest }) {
  const { dispatch } = useApp();
  const { request, recommended, bid, secondsLeft } = active;

  const bounds = bidBounds(recommended);
  const diff = roundCents(bid - recommended);
  const isRecommended = Math.abs(diff) < 0.005;
  const p = acceptanceProbability(bid, recommended);
  const level = LEVELS[acceptanceLevel(p)];
  const urgent = secondsLeft <= 10;

  const setBid = (value: number) => dispatch({ type: "setBid", bid: value });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Jäljellä oleva aika */}
      <div className="mx-6 mt-2 h-1 overflow-hidden rounded-full bg-deck-2" aria-hidden>
        <motion.div
          className={`h-full rounded-full ${urgent ? "bg-amber" : "bg-ink-3"}`}
          initial={false}
          animate={{ width: `${(secondsLeft / OFFER_SECONDS) * 100}%` }}
          transition={{ duration: 1, ease: "linear" }}
        />
      </div>

      <div className="relative min-h-0 flex-1">
        <div className="no-scrollbar absolute inset-0 overflow-y-auto px-4 pb-5 pt-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[26px] font-semibold leading-none">New ride request</h2>
            <div
              className="flex items-center gap-1.5"
              role="timer"
              aria-label={`${secondsLeft} seconds left to respond`}
            >
              <Timer size={18} className={urgent ? "text-amber" : "text-ink-3"} />
              <span className={`tnum font-display text-2xl font-semibold ${urgent ? "text-amber" : "text-ink"}`}>
                {secondsLeft} s
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between gap-2 rounded-2xl border border-line px-3.5 py-2.5">
            <span className="text-ink-2">Suggested price</span>
            <span className="font-display text-2xl font-semibold">{fmtEur(recommended)}</span>
          </div>

          <div className="mt-3">
            <RouteLine
              from={request.pickup.address}
              fromSub={request.pickup.area}
              to={request.dropoff.address}
              toSub={request.dropoff.area}
            />
          </div>

          <dl className="mt-3 grid grid-cols-3 gap-2">
            <Fact label="Pickup" value={fmtKm(request.pickupKm)} sub={`${request.pickupMin} min`} />
            <Fact label="Ride" value={fmtKm(request.tripKm)} sub={`${request.tripMin} min`} />
            <Fact
              label={request.customer.name}
              value={
                <span className="flex items-center gap-1">
                  <Star size={15} className="fill-amber text-amber" aria-hidden />
                  {fmtRating(request.customer.rating)}
                </span>
              }
              sub={`${request.customer.rides} rides`}
            />
          </dl>

          {request.note && (
            <p className="mt-3 flex items-center gap-2 text-sm text-ink-2">
              <Luggage size={16} className="text-ink-3" aria-hidden />
              {request.note}
            </p>
          )}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-deck to-transparent" />
      </div>

      {/* Tarjousohjaimet: aina näkyvissä peukalon ulottuvilla */}
      <div className="border-t border-line bg-deck px-4 pb-4 pt-3">
        <div className="flex items-stretch gap-3">
          <StepButton
            label="−1 €"
            aria="Offer one euro less"
            disabled={bid - 1 < bounds.min}
            onClick={() => setBid(bid - 1)}
          />
          <PriceField
            bid={bid}
            min={bounds.min}
            max={bounds.max}
            caption={isRecommended ? "Suggested price" : `${fmtSignedEur(diff)} vs. suggested`}
            onCommit={setBid}
          />
          <StepButton
            label="+1 €"
            aria="Offer one euro more"
            disabled={bid + 1 > bounds.max}
            onClick={() => setBid(bid + 1)}
          />
        </div>

        <div className="mt-3">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-ink-2">Acceptance probability</span>
            <span className="tnum font-semibold">{fmtPct(p)}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-deck-2">
            <motion.div
              className={`h-full rounded-full ${level.bar}`}
              initial={false}
              animate={{ width: `${p * 100}%` }}
              transition={{ type: "spring", stiffness: 220, damping: 30 }}
            />
          </div>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-2" aria-live="polite">
            <level.icon size={15} className={level.tone} aria-hidden />
            {level.text}
          </p>
        </div>

        <button
          type="button"
          onClick={() => dispatch({ type: "send" })}
          className={`mt-3 flex h-16 w-full items-center justify-center gap-2.5 rounded-2xl text-xl font-semibold transition-colors ${
            isRecommended ? "glow-go bg-go text-go-ink" : "glow-volt bg-volt text-night"
          }`}
        >
          <Send size={21} strokeWidth={2.5} />
          Offer {fmtEur(bid)}
        </button>

        <div className="mt-1 flex items-center justify-between">
          <button
            type="button"
            onClick={() => dispatch({ type: "skip", reason: "skipped" })}
            className="h-11 px-2 font-medium text-ink-2 hover:text-ink"
          >
            Skip ride
          </button>
          {!isRecommended && (
            <button
              type="button"
              onClick={() => setBid(recommended)}
              className="flex h-11 items-center gap-1.5 px-2 font-medium text-ink-2 hover:text-ink"
            >
              <RotateCcw size={16} aria-hidden />
              Reset to {fmtEur(recommended)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value, sub }: { label: string; value: ReactNode; sub: string }) {
  return (
    <div className="rounded-xl bg-deck-2 px-3 py-2">
      <dt className="truncate text-xs text-ink-3">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold leading-tight">{value}</dd>
      <dd className="text-sm text-ink-2">{sub}</dd>
    </div>
  );
}

function StepButton({
  label,
  aria,
  disabled,
  onClick,
}: {
  label: string;
  aria: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.94 }}
      aria-label={aria}
      className="flex h-[76px] w-[76px] shrink-0 [@media(max-height:700px)]:h-16 flex-col items-center justify-center rounded-2xl border border-line bg-deck-2 text-ink hover:border-volt/60 disabled:opacity-35"
    >
      <span className="text-xs text-ink-3">Offer</span>
      <span className="font-display text-[26px] font-semibold leading-none">{label}</span>
    </motion.button>
  );
}

function PriceField({
  bid,
  min,
  max,
  caption,
  onCommit,
}: {
  bid: number;
  min: number;
  max: number;
  caption: string;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    if (draft === null) return;
    const value = parseEur(draft);
    if (value !== null) onCommit(value);
    setDraft(null);
  };

  if (draft !== null) {
    return (
      <div className="flex min-w-0 flex-1 flex-col items-center justify-center">
        <label className="flex items-baseline gap-1 rounded-xl border-2 border-volt px-2">
          <span className="font-display text-2xl text-ink-2">€</span>
          <input
            autoFocus
            inputMode="decimal"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setDraft(null);
            }}
            aria-label="Your price in euros"
            className="w-[5.2ch] bg-transparent text-center font-display text-[40px] font-semibold leading-tight text-ink outline-none"
          />
        </label>
        <span className="mt-1 text-xs text-ink-3">
          {fmtEur(min)}–{fmtEur(max)}
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setDraft(bid.toFixed(2))}
      aria-label={`Price ${fmtEur(bid)}. Enter your own price`}
      className="group flex min-w-0 flex-1 flex-col items-center justify-center rounded-2xl"
    >
      <motion.span
        key={bid}
        initial={{ scale: 0.92, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
        className="font-display text-[44px] font-semibold leading-none"
      >
        {fmtEur(bid)}
      </motion.span>
      <span className="mt-1.5 flex items-center gap-1 text-sm text-ink-2">
        <Pencil size={12} className="text-ink-3 group-hover:text-volt" aria-hidden />
        {caption}
      </span>
    </button>
  );
}
