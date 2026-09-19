import { ChevronLeft, CreditCard, Send } from "lucide-react";
import { RouteLine } from "../components/RouteLine";
import { destinationById, pickupById, rider, tripRoute } from "../data/customer";
import { demandNow } from "../data/market";
import { useApp, type CustomerState } from "../state/AppContext";
import { marketBand } from "../lib/pricing";
import { fmtEur, fmtKm, fmtPerKm } from "../lib/format";

/** Tila tulee propsina: poistumisanimaation aikana näkymä pitää viimeisen tilansa. */
export function QuoteSheet({ customer }: { customer: CustomerState }) {
  const { dispatch } = useApp();
  const destination = destinationById(customer.destinationId!);
  const pickup = pickupById(customer.pickupId);
  const route = tripRoute(pickup.id, destination.id);
  const band = marketBand(customer.recommended);

  return (
    <div className="px-4 pb-4 pt-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => dispatch({ type: "backHome" })}
          className="-ml-2 flex h-11 items-center gap-1 px-2 font-medium text-ink-2 hover:text-ink"
        >
          <ChevronLeft size={20} aria-hidden />
          Back
        </button>
        <span className="text-sm text-ink-3">{demandNow.freeCars} free cars nearby</span>
      </div>

      <div className="mt-2">
        <RouteLine
          from={pickup.address}
          fromSub={pickup.kind === "location" ? `${pickup.area}, your current location` : (pickup.label ?? pickup.area)}
          to={destination.label ?? destination.address}
          toSub={destination.label ? `${destination.address}, ${destination.area}` : destination.area}
        />
      </div>

      <div className="mt-4 flex items-end justify-between gap-3 rounded-2xl border border-line px-4 py-3">
        <div>
          <p className="text-sm text-ink-3">Estimated price</p>
          <p className="font-display text-[44px] font-semibold leading-none">{fmtEur(customer.recommended)}</p>
        </div>
        <div className="pb-1 text-right text-ink-2">
          <p>{fmtKm(route.km)}</p>
          <p>{route.min} min</p>
        </div>
      </div>

      <p className="mt-3 text-sm text-ink-2">
        The estimate is based on the market price of {fmtPerKm(customer.perKm)}. Drivers can offer a different price,
        today usually {fmtEur(band.low)}–{fmtEur(band.high)}. You choose the best offer.
      </p>

      <p className="mt-3 flex items-center gap-2 text-ink-2">
        <CreditCard size={18} className="text-ink-3" aria-hidden />
        {rider.payment}
      </p>

      <button
        type="button"
        onClick={() => dispatch({ type: "order" })}
        className="glow-volt mt-4 flex h-16 w-full items-center justify-center gap-2.5 rounded-2xl bg-volt text-xl font-semibold text-night"
      >
        <Send size={20} strokeWidth={2.5} />
        Request offers
      </button>
    </div>
  );
}
