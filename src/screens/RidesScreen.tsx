import { RouteLine } from "../components/RouteLine";
import { useApp } from "../state/AppContext";
import { roundCents } from "../lib/pricing";
import { fmtEur, fmtKm, fmtSignedEur } from "../lib/format";

export function RidesScreen() {
  const { state } = useApp();
  const rides = [...state.rides].reverse();

  const total = rides.reduce((sum, r) => sum + r.price, 0);
  const km = rides.reduce((sum, r) => sum + r.km, 0);
  const counterOffers = rides.filter((r) => r.price - r.suggested > 0.005);
  const counterExtra = counterOffers.reduce((sum, r) => sum + (r.price - r.suggested), 0);

  return (
    <div className="pb-4">
      <section className="px-4 pt-3">
        <p className="text-ink-2">Earnings today</p>
        <p className="mt-1 font-display text-[60px] font-semibold leading-[0.95]">{fmtEur(total)}</p>
        <p className="mt-1 text-ink-2">
          {rides.length} rides, {fmtKm(km)}
        </p>
      </section>

      <dl className="mx-4 mt-5 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-deck px-3.5 py-3">
          <dt className="text-sm text-ink-3">From counter-offers</dt>
          <dd className="font-display text-[26px] font-semibold leading-tight">{fmtSignedEur(roundCents(counterExtra))}</dd>
          <dd className="text-sm text-ink-2">{counterOffers.length} rides above the suggestion</dd>
        </div>
        <div className="rounded-2xl bg-deck px-3.5 py-3">
          <dt className="text-sm text-ink-3">Average</dt>
          <dd className="font-display text-[26px] font-semibold leading-tight">{fmtEur(total / rides.length)}</dd>
          <dd className="text-sm text-ink-2">per ride</dd>
        </div>
      </dl>

      <h2 className="mx-4 mt-6 text-lg font-semibold">Rides</h2>
      <ul className="mx-4 mt-1 divide-y divide-line">
        {rides.map((r) => {
          const diff = roundCents(r.price - r.suggested);
          return (
            <li key={r.id} className="flex items-center gap-3 py-3">
              <span className="tnum w-10 shrink-0 text-sm text-ink-3">{r.time}</span>
              <div className="min-w-0 flex-1">
                <RouteLine compact from={r.from} to={r.to} />
              </div>
              <div className="shrink-0 text-right">
                <p className="tnum text-lg font-semibold">{fmtEur(r.price)}</p>
                {diff === 0 ? (
                  <p className="text-sm text-ink-3">Suggested price</p>
                ) : (
                  <p className={`text-sm ${diff > 0 ? "text-volt" : "text-ink-3"}`}>Offer {fmtSignedEur(diff)}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
