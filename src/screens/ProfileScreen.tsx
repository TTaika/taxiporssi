import { CalendarClock, Gem, TrendingDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Stars } from "../components/Stars";
import { driver, tiers } from "../data/profile";
import { useApp } from "../state/AppContext";
import { fmtEur, fmtInt, fmtPct, fmtRating } from "../lib/format";

const METER_MIN = 4.5;
const meterPos = (rating: number) => `${((rating - METER_MIN) / (5 - METER_MIN)) * 100}%`;

export function ProfileScreen() {
  const { state } = useApp();
  const { reviews, rating, ratingCount } = state;
  const tierIndex = tiers.findIndex((t) => t.name === driver.tier);
  const tier = tiers[tierIndex];
  const lower = tiers[tierIndex - 1];
  const base = tiers[0];

  return (
    <div className="px-4 pb-4 pt-3">
      <header className="flex items-center gap-3.5">
        <span className="grid size-14 shrink-0 place-items-center rounded-full border border-line bg-deck-2 font-display text-2xl font-semibold">
          {driver.initials}
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-[26px] font-semibold leading-tight">{driver.name}</h1>
          <p className="text-sm text-ink-2">
            {driver.business}, self-employed since {driver.since}
          </p>
          <p className="truncate text-sm text-ink-3">
            {driver.car}, {driver.plate}
          </p>
        </div>
      </header>

      <section className="mt-6" aria-labelledby="ratings-heading">
        <h2 id="ratings-heading" className="text-lg font-semibold">
          Customer ratings
        </h2>
        <div className="mt-3 flex items-center gap-5">
          <div className="shrink-0">
            <p className="font-display text-[56px] font-semibold leading-none">{fmtRating(rating)}</p>
            <div className="mt-1.5">
              <Stars value={rating} size={15} />
            </div>
            <p className="mt-1 text-sm text-ink-3">{fmtInt(ratingCount)} ratings</p>
          </div>
          <dl className="flex-1 space-y-1.5">
            {driver.distribution.map((d) => (
              <div key={d.stars} className="flex items-center gap-2 text-sm">
                <dt className="tnum w-3 text-ink-2">
                  {d.stars}
                  <span className="sr-only"> stars</span>
                </dt>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-deck-2" aria-hidden>
                  <div className="h-full rounded-full bg-amber" style={{ width: `${d.share * 100}%` }} />
                </div>
                <dd className="tnum w-9 text-right text-ink-3">{fmtPct(d.share)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-[#c9d6ea]/25 bg-deck p-4" aria-labelledby="tier-heading">
        <div className="flex items-center gap-3">
          <span
            className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#c9d6ea]/10 text-[#dfe8f6]"
            aria-hidden
          >
            <Gem size={24} />
          </span>
          <div>
            <h2 id="tier-heading" className="font-display text-2xl font-semibold leading-tight">
              {tier.name} driver
            </h2>
            <p className="text-sm text-ink-2">Good ratings lower your service fee</p>
          </div>
        </div>

        {/* Palvelumaksu on tason tärkein etu, joten se nostetaan esiin. */}
        <div className="mt-4 flex items-end justify-between gap-3 rounded-2xl border border-go/30 bg-go/[0.07] px-4 py-3">
          <div>
            <p className="text-sm text-ink-2">Your service fee</p>
            <p className="font-display text-[56px] font-semibold leading-none">{fmtPct(tier.serviceFee)}</p>
          </div>
          <div className="pb-1 text-right text-sm">
            <p className="text-ink-2">
              {base.name}: {fmtPct(base.serviceFee)}
            </p>
            <p className="flex items-center justify-end gap-1 font-semibold">
              <TrendingDown size={15} className="text-go" aria-hidden />
              {fmtEur(driver.feeSavedThisMonth)} saved this month
            </p>
          </div>
        </div>

        <ul className="mt-4 space-y-3.5">
          <Benefit
            icon={CalendarClock}
            title="Priority on pre-booked rides"
            text="You see airport and business rides 10 minutes before other drivers."
          />
        </ul>

        <div className="mt-4 rounded-2xl bg-deck-2 p-3.5">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-ink-2">Your rating</span>
            <span>
              <span className="font-semibold">{fmtRating(rating)}</span>
              <span className="text-ink-3">
                , {tier.name} threshold {fmtRating(tier.minRating)}
              </span>
            </span>
          </div>
          <div className="relative mt-2.5 h-2 rounded-full bg-night" aria-hidden>
            <div className="h-full rounded-full bg-volt" style={{ width: meterPos(rating) }} />
            <span
              className="absolute -top-1 h-4 w-0.5 -translate-x-1/2 rounded-full bg-ink"
              style={{ left: meterPos(tier.minRating) }}
            />
          </div>
          {lower && (
            <p className="mt-2.5 text-sm text-ink-3">
              If your average drops below {fmtRating(tier.minRating)}, you move to {lower.name} and your service fee
              rises to {fmtPct(lower.serviceFee)}.
            </p>
          )}
        </div>
      </section>

      <section className="mt-6" aria-labelledby="reviews-heading">
        <h2 id="reviews-heading" className="text-lg font-semibold">
          Latest reviews
        </h2>
        <ul className="mt-3 space-y-2.5">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-2xl bg-deck p-3.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{r.name}</span>
                <span className="text-sm text-ink-3">{r.when}</span>
              </div>
              <div className="mt-1">
                <Stars value={r.stars} size={14} />
              </div>
              <p className="mt-1.5 text-ink-2">{r.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6" aria-labelledby="tiers-heading">
        <h2 id="tiers-heading" className="text-lg font-semibold">
          Tiers
        </h2>
        <p className="text-sm text-ink-3">Your tier depends on your rating and how many rides you've driven.</p>
        <ol className="mt-3 space-y-2">
          {[...tiers].reverse().map((t) => {
            const current = t.name === tier.name;
            return (
              <li
                key={t.name}
                aria-current={current ? "true" : undefined}
                className={`flex items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 ${
                  current ? "border-volt/60 bg-volt/[0.07]" : "border-line"
                }`}
              >
                <div className="min-w-0">
                  <p className="font-semibold">
                    {t.name}
                    {current && <span className="ml-2 text-sm font-medium text-volt">Your tier</span>}
                  </p>
                  <p className="text-sm text-ink-3">
                    {t.minRides === 0
                      ? "All new drivers"
                      : `Rating ${fmtRating(t.minRating)}+, ${fmtInt(t.minRides)} rides`}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-display text-2xl font-semibold leading-none">{fmtPct(t.serviceFee)}</p>
                  <p className="text-xs text-ink-3">service fee</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

function Benefit({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <li className="flex gap-3">
      <Icon size={20} className="mt-0.5 shrink-0 text-volt" aria-hidden />
      <div>
        <p className="font-semibold leading-tight">{title}</p>
        <p className="mt-0.5 text-sm text-ink-2">{text}</p>
      </div>
    </li>
  );
}
