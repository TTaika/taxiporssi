import { AnimatePresence, motion } from "framer-motion";
import { Gem, LoaderCircle } from "lucide-react";
import { competitors, destinationById } from "../data/customer";
import { useApp, type Offer, type CustomerState } from "../state/AppContext";
import { fmtEur } from "../lib/format";
import { DriverBadge } from "./DriverBadge";

/** Platina-kuljettajien tarjoukset näytetään ensin (tasoetu), muuten saapumisjärjestyksessä. */
const byVisibility = (a: Offer, b: Offer) => Number(b.tier === "Platinum") - Number(a.tier === "Platinum");

/** Tila tulee propsina: poistumisanimaation aikana näkymä pitää viimeisen tilansa. */
export function OffersSheet({ customer }: { customer: CustomerState }) {
  const { dispatch } = useApp();
  const destination = destinationById(customer.destinationId!);
  const offers = [...customer.offers].sort(byVisibility);
  const expecting = customer.offers.length < competitors.length + 1;

  return (
    <div className="px-4 pb-4 pt-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-[28px] font-semibold leading-none">Offers</h2>
        <span className="text-sm text-ink-3" aria-live="polite">
          {customer.offers.length} {customer.offers.length === 1 ? "offer" : "offers"}
        </span>
      </div>
      <p className="mt-1.5 text-ink-2">
        Ride to {destination.area}, estimated price {fmtEur(customer.recommended)}
      </p>

      <ul className="mt-3 flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {offers.map((offer) => {
            return (
              <motion.li
                key={offer.id}
                layout
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              >
                <button
                  type="button"
                  onClick={() => dispatch({ type: "chooseOffer", offerId: offer.id, at: Date.now() })}
                  aria-label={`Choose ${offer.name}: ${fmtEur(offer.price)}, pickup in ${offer.etaMin} min`}
                  className="flex w-full items-center gap-3 rounded-2xl border border-line bg-deck-2 px-3 py-3 text-left transition-colors hover:border-go/60"
                >
                  <DriverBadge offer={offer} />
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-display text-[26px] font-semibold leading-none">{fmtEur(offer.price)}</span>
                    <span className="text-sm text-ink-3">Pickup {offer.etaMin} min</span>
                    <span className="mt-0.5 rounded-lg bg-go px-3 py-1 text-sm font-semibold text-go-ink">Choose</span>
                  </span>
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      {expecting && (
        <p className="mt-3 flex items-center gap-2.5 text-ink-2">
          <LoaderCircle size={18} className="animate-spin text-volt motion-reduce:animate-none" aria-hidden />
          {customer.offers.length === 0 ? "Drivers are making offers…" : "More offers may still come in…"}
        </p>
      )}

      {offers.some((o) => o.tier === "Platinum") && (
        <p className="mt-3 flex items-center gap-2 text-sm text-ink-3">
          <Gem size={14} className="shrink-0" aria-hidden />
          Offers from top-rated Platinum drivers are shown first.
        </p>
      )}

      <button
        type="button"
        onClick={() => dispatch({ type: "cancelOrder" })}
        className="mt-2 h-11 w-full font-medium text-ink-2 hover:text-ink"
      >
        Cancel order
      </button>
    </div>
  );
}
