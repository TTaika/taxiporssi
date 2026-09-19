import { destinationById, pickupById } from "../data/customer";
import { stageDuration, useApp, type CustomerState } from "../state/AppContext";
import { fmtTime, useDemoClock, useProgress } from "../lib/clock";
import { fmtEur } from "../lib/format";
import { rider } from "../data/customer";
import { DriverBadge } from "./DriverBadge";
import { LicensePlate } from "./LicensePlate";

/** Tila tulee propsina: poistumisanimaation aikana näkymä pitää viimeisen tilansa. */
export function RideSheet({ customer }: { customer: CustomerState }) {
  const { state } = useApp();
  const offer = customer.chosen!;
  const destination = destinationById(customer.destinationId!);
  const pickup = pickupById(customer.pickupId);
  const trip = customer.tripId ? state.trips[customer.tripId] : undefined;
  const clock = useDemoClock();
  const progress = useProgress(trip?.stageStartedAt ?? 0, trip ? stageDuration(trip) || 1 : 1);

  const toPickup = !trip || trip.stage === "pickup";
  const pickupMin = trip?.pickupMin ?? offer.etaMin;
  const tripMin = trip?.tripMin ?? 0;
  const minsLeft = Math.max(0, Math.ceil((toPickup ? pickupMin : tripMin) * (1 - progress)));
  const arrival = clock + minsLeft + (toPickup ? tripMin : 0);
  const firstName = offer.name.split(" ")[0];

  return (
    <div className="px-4 pb-5 pt-5" aria-live="polite">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-[28px] font-semibold leading-tight">
            {toPickup ? `${firstName} is on the way` : `On the way to ${destination.label ?? destination.area}`}
          </h2>
          <p className="truncate text-ink-2">
            {toPickup ? `Pickup: ${pickup.address}` : `Destination: ${destination.address}`}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-[32px] font-semibold leading-none">
            {minsLeft > 0 ? `${minsLeft} min` : "Now"}
          </p>
          <p className="text-sm text-ink-3">{toPickup ? "to pickup" : "to arrival"}</p>
        </div>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-deck-2" aria-hidden>
        <div
          className={`h-full rounded-full transition-[width] duration-100 ease-linear ${toPickup ? "bg-volt" : "bg-go"}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <p className="mt-1.5 text-right text-sm text-ink-3">Estimated arrival {fmtTime(arrival)}</p>

      <div className="mt-3 flex items-center gap-3">
        <DriverBadge offer={offer} />
        <LicensePlate plate={offer.plate} />
      </div>

      <dl className="mt-4 flex items-center justify-between rounded-2xl border border-line px-4 py-3">
        <dt className="text-ink-2">Agreed price</dt>
        <dd className="font-display text-2xl font-semibold">{fmtEur(offer.price)}</dd>
      </dl>
      <p className="mt-2 text-sm text-ink-3">Charged to your card after the ride ({rider.payment}).</p>
    </div>
  );
}
