import { useState } from "react";
import { Briefcase, Check, ChevronDown, History, House, LocateFixed, MapPin, Search, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { destinations, pickupById, pickupOptions, popularIds, tripRoute, type Place } from "../data/customer";
import { useApp, type CustomerState } from "../state/AppContext";
import { recommendedPrice } from "../lib/pricing";
import { fmtEur, fmtKm, fmtPerKm } from "../lib/format";

const ICONS: Record<Place["kind"], LucideIcon> = {
  home: House,
  work: Briefcase,
  recent: History,
  place: MapPin,
  location: LocateFixed,
};

/** Haku ilman ääkkösiä ja kirjainkokoa: "toolo" löytää Töölön. */
const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function HomeSheet({ customer }: { customer: CustomerState }) {
  const { dispatch, livePrice } = useApp();
  const [query, setQuery] = useState("");
  const [choosingPickup, setChoosingPickup] = useState(false);

  const pickup = pickupById(customer.pickupId);
  const q = normalize(query.trim());
  const available = destinations.filter((d) => d.id !== pickup.id);
  const matches = q
    ? available.filter((d) => [d.label, d.address, d.area].some((v) => v && normalize(v).includes(q)))
    : available.filter((d) => d.kind !== "place");
  const popular = popularIds.map((id) => available.find((d) => d.id === id)).filter((d): d is Place => !!d);

  return (
    <div className="px-4 pb-4 pt-5">
      <h2 className="font-display text-[28px] font-semibold leading-none">Where to?</h2>

      <button
        type="button"
        onClick={() => setChoosingPickup((v) => !v)}
        aria-expanded={choosingPickup}
        className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-night/60 px-3.5 py-2.5 text-left"
      >
        <span className="size-2.5 shrink-0 rounded-full bg-volt" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-ink-3">Pickup</span>
          <span className="block truncate font-semibold">
            {pickup.label ? `${pickup.label}, ${pickup.address}` : pickup.address}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-volt">
          Change
          <ChevronDown size={16} className={`transition-transform ${choosingPickup ? "rotate-180" : ""}`} aria-hidden />
        </span>
      </button>

      {choosingPickup ? (
        <ul role="radiogroup" aria-label="Pickup" className="mt-1 divide-y divide-line">
          {pickupOptions.map((p) => {
            const Icon = ICONS[p.kind];
            const selected = p.id === pickup.id;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    dispatch({ type: "setPickup", id: p.id });
                    setChoosingPickup(false);
                  }}
                  className="flex w-full items-center gap-3 py-3 text-left"
                >
                  <span
                    className="grid size-10 shrink-0 place-items-center rounded-full bg-deck-2 text-ink-2"
                    aria-hidden
                  >
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{p.label ?? p.address}</span>
                    <span className="block truncate text-sm text-ink-3">
                      {p.label ? `${p.address}, ${p.area}` : p.area}
                    </span>
                  </span>
                  {selected && <Check size={20} className="shrink-0 text-volt" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <>
          <label
            htmlFor="destination-search"
            className="mt-3 flex h-14 items-center gap-3 rounded-2xl border border-line bg-deck-2 px-4 focus-within:border-volt"
          >
            <Search size={20} className="shrink-0 text-ink-3" aria-hidden />
            <span className="sr-only">Search for a destination</span>
            <input
              id="destination-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a place, address or district"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-lg text-ink outline-none placeholder:text-ink-3"
            />
          </label>

          {!q && (
            <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4" aria-label="Popular places">
              {popular.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => dispatch({ type: "chooseDestination", id: d.id })}
                  className="flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-line px-3.5 text-sm font-medium text-ink-2 hover:text-ink"
                >
                  <MapPin size={14} aria-hidden />
                  {d.label ?? d.address}
                </button>
              ))}
            </div>
          )}

          <ul className="mt-1 divide-y divide-line">
            {matches.map((d) => {
              const Icon = ICONS[d.kind];
              const route = tripRoute(pickup.id, d.id);
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "chooseDestination", id: d.id })}
                    className="flex w-full items-center gap-3 py-3 text-left"
                  >
                    <span
                      className="grid size-10 shrink-0 place-items-center rounded-full bg-deck-2 text-ink-2"
                      aria-hidden
                    >
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{d.label ?? d.address}</span>
                      <span className="block truncate text-sm text-ink-3">
                        {d.label ? `${d.address}, ${d.area}` : d.area}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="tnum block font-semibold">~{fmtEur(recommendedPrice(route.km, livePrice))}</span>
                      <span className="block text-sm text-ink-3">{fmtKm(route.km)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
            {matches.length === 0 && (
              <li className="py-4 text-ink-3">
                No matches for “{query.trim()}”. Try a district such as Kallio or a place such as Central Station.
              </li>
            )}
          </ul>

          <p className="mt-2 flex items-start gap-2.5 rounded-2xl bg-night/60 px-3.5 py-3 text-sm text-ink-2">
            <Zap size={16} className="mt-0.5 shrink-0 text-amber" aria-hidden />
            Friday night rush: the market price is {fmtPerKm(livePrice)}. Drivers compete for your ride with offers.
          </p>
        </>
      )}
    </div>
  );
}
