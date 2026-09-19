import { CircleCheck } from "lucide-react";
import { RouteLine } from "../components/RouteLine";
import { destinationById, pickupById, rider, tripRoute } from "../data/customer";
import { useApp, type CustomerState } from "../state/AppContext";
import { fmtTime } from "../lib/clock";
import { fmtEur, fmtKm } from "../lib/format";

/** Kyyti on perillä: kuitti ennen arviota. */
export function ReceiptSheet({ customer }: { customer: CustomerState }) {
  const { dispatch } = useApp();
  const offer = customer.chosen!;
  const destination = destinationById(customer.destinationId!);
  const pickup = pickupById(customer.pickupId);
  const route = tripRoute(pickup.id, destination.id);
  const receipt = customer.receipt;
  const firstName = offer.name.split(" ")[0];

  return (
    <div className="px-4 pb-5 pt-5">
      <div className="flex items-center gap-3">
        <span className="glow-go grid size-12 shrink-0 place-items-center rounded-full bg-go text-go-ink">
          <CircleCheck size={28} strokeWidth={2.2} aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-[28px] font-semibold leading-tight">Ride complete</h2>
          <p className="truncate text-ink-2">
            Arrived at {destination.address}
            {receipt && ` at ${fmtTime(receipt.at)}`}
          </p>
        </div>
      </div>

      <section aria-label="Receipt" className="mt-4 rounded-2xl border border-line p-4">
        <div className="flex items-baseline justify-between">
          <span className="font-semibold">Receipt</span>
          {receipt && <span className="tnum text-sm text-ink-3">{receipt.number}</span>}
        </div>
        <div className="mt-3">
          <RouteLine compact from={pickup.address} to={destination.address} />
        </div>
        <dl className="mt-3 space-y-1.5 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-ink-3">Distance and time</dt>
            <dd className="text-right">
              {fmtKm(route.km)}, {route.min} min
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-3">Driver</dt>
            <dd className="text-right">
              {offer.name}, {offer.plate}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-3">Paid with</dt>
            <dd className="text-right">{rider.payment}</dd>
          </div>
        </dl>
        <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
          <span className="font-semibold">Total</span>
          <span className="font-display text-[32px] font-semibold leading-none">{fmtEur(offer.price)}</span>
        </div>
        <p className="mt-1.5 text-xs text-ink-3">
          Fixed price agreed before the ride. VAT included. A copy was sent to your email.
        </p>
      </section>

      <button
        type="button"
        onClick={() => dispatch({ type: "startRating" })}
        className="glow-go mt-4 flex h-16 w-full items-center justify-center rounded-2xl bg-go text-xl font-semibold text-go-ink"
      >
        Rate {firstName}
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: "skipRating" })}
        className="mt-1 h-11 w-full font-medium text-ink-2 hover:text-ink"
      >
        Done
      </button>
    </div>
  );
}
