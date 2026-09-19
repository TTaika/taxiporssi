import { Gem, Star } from "lucide-react";
import type { Offer } from "../state/AppContext";
import { fmtRating } from "../lib/format";

/** Kuljettajan nimi, arvosana ja taso – sama esitys tarjouslistassa, kyydillä ja arviossa. */
export function DriverBadge({ offer, showCar = true }: { offer: Offer; showCar?: boolean }) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-night font-display text-lg font-semibold">
        {offer.initials}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-semibold">{offer.name}</span>
        <span className="flex items-center gap-1 text-sm text-ink-2">
          <Star size={13} className="fill-amber text-amber" aria-hidden />
          {fmtRating(offer.rating)}
          <span className="ml-1 flex items-center gap-1">
            {offer.tier === "Platinum" && <Gem size={13} className="text-[#dfe8f6]" aria-hidden />}
            {offer.tier}
          </span>
        </span>
        {showCar && <span className="block truncate text-sm text-ink-3">{offer.car}</span>}
      </span>
    </span>
  );
}
