import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { MarketChart } from "../components/MarketChart";
import { RANGES, demandNow, priceHistory, type RangeKey } from "../data/market";
import { useApp } from "../state/AppContext";
import { fmtDec2, fmtEur, fmtPerKm, fmtSignedPct } from "../lib/format";

export function MarketScreen() {
  const { state, dispatch, livePrice } = useApp();
  const [range, setRange] = useState<RangeKey>("1h");

  // Viimeinen piste on aina "nyt" ja seuraa elävää markkinahintaa.
  const data = useMemo(
    () => priceHistory[range].map((p, i, all) => (i === all.length - 1 ? { ...p, price: livePrice } : p)),
    [range, livePrice],
  );

  const prices = data.map((d) => d.price);
  const change = livePrice - data[0].price;
  const up = change >= 0;
  const TrendIcon = up ? TrendingUp : TrendingDown;
  const since = RANGES.find((r) => r.key === range)!.since;
  const demandRatio = (demandNow.openRequests / demandNow.freeCars).toFixed(1);
  const earnings = state.rides.reduce((sum, r) => sum + r.price, 0);

  return (
    <div className="pb-4">
      <section className="px-4 pt-3" aria-label="Market price">
        <p className="text-ink-2">Market price now</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-display text-[68px] font-semibold leading-[0.9]">{fmtDec2(livePrice)}</span>
          <span className="font-display text-2xl font-medium text-ink-2">€/km</span>
        </div>
        <p className="mt-2 flex items-center gap-1.5 font-medium">
          <TrendIcon size={18} className={up ? "text-go" : "text-stop"} aria-hidden />
          {up ? "+" : "−"}€{fmtDec2(Math.abs(change))}/km ({fmtSignedPct(change / data[0].price)}) {since}
        </p>
      </section>

      <div
        role="radiogroup"
        aria-label="Time range"
        className="mx-4 mt-5 grid grid-cols-3 gap-1 rounded-2xl bg-deck p-1"
      >
        {RANGES.map((r) => {
          const selected = r.key === range;
          return (
            <button
              key={r.key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setRange(r.key)}
              className={`relative h-11 rounded-xl text-lg font-semibold transition-colors ${
                selected ? "text-ink" : "text-ink-3 hover:text-ink-2"
              }`}
            >
              {selected && (
                <motion.span
                  layoutId="range-pill"
                  className="absolute inset-0 rounded-xl border border-line bg-deck-2"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
              <span className="relative">{r.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 pr-1">
        <MarketChart key={range} data={data} range={range} />
      </div>

      <dl className="mx-4 mt-3 grid grid-cols-3 divide-x divide-line rounded-2xl border border-line">
        <Stat label="Lowest" value={Math.min(...prices)} />
        <Stat label="Average" value={prices.reduce((a, b) => a + b, 0) / prices.length} />
        <Stat label="Highest" value={Math.max(...prices)} />
      </dl>

      <section className="mx-4 mt-5 rounded-2xl border border-go/30 bg-go/[0.06] p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-go/15 text-go" aria-hidden>
            <Zap size={20} />
          </span>
          <div>
            <h2 className="text-lg font-semibold leading-tight">Good time to drive</h2>
            <p className="mt-1 text-ink-2">
              {demandNow.openRequests} requests are waiting near you and {demandNow.freeCars} cars are free. Demand is{" "}
              {demandRatio}× the supply.
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-go/15 pt-3">
          <span className="text-ink-2">Forecast {demandNow.peakWindow}</span>
          <span className="font-semibold">~{fmtPerKm(demandNow.peakForecast)}</span>
        </div>
      </section>

      <div className="mt-3 px-4">
        <button
          type="button"
          onClick={() => dispatch({ type: "setTab", tab: "rides" })}
          className="flex w-full items-center justify-between rounded-2xl border border-line bg-deck px-4 py-3 text-left hover:border-ink-3"
        >
          <span>
            <span className="block text-sm text-ink-3">Earnings today</span>
            <span className="block font-display text-[28px] font-semibold leading-tight">{fmtEur(earnings)}</span>
          </span>
          <span className="flex items-center gap-1.5 text-ink-2">
            {state.rides.length} rides
            <ChevronRight size={20} aria-hidden />
          </span>
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-3 py-2.5">
      <dt className="text-sm text-ink-3">{label}</dt>
      <dd className="tnum font-semibold">{fmtPerKm(value)}</dd>
    </div>
  );
}
