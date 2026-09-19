import { motion, useReducedMotion } from "framer-motion";
import { Gem } from "lucide-react";
import type { ActiveRequest } from "../../state/AppContext";
import { fmtEur } from "../../lib/format";

export function WaitingView({ active }: { active: ActiveRequest }) {
  const reduceMotion = useReducedMotion();
  const { customer } = active.request;
  // Oikea asiakas vertailee tarjouksia omassa näkymässään, joten odotusaika ei ole tiedossa.
  const linked = active.orderId !== null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 pb-8 text-center" aria-live="polite">
      <div className="relative grid size-40 place-items-center" aria-hidden>
        {!reduceMotion &&
          [0, 0.6, 1.2].map((delay) => (
            <motion.span
              key={delay}
              className="absolute inset-0 rounded-full border-2 border-volt"
              initial={{ scale: 0.35, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 0 }}
              transition={{ duration: 1.8, repeat: Infinity, delay, ease: "easeOut" }}
            />
          ))}
        <span className="grid size-16 place-items-center rounded-full bg-volt font-display text-3xl font-semibold text-night">
          {customer.name[0]}
        </span>
      </div>

      <h2 className="mt-4 font-display text-[28px] font-semibold leading-tight">Waiting for the customer's reply…</h2>
      <p className="mt-2 text-ink-2">
        {customer.name} sees your offer of{" "}
        <span className="font-semibold text-ink">{fmtEur(active.sentBid ?? active.bid)}</span>
        {linked && " alongside other offers"}
      </p>

      <div className="mt-6 h-1 w-48 overflow-hidden rounded-full bg-deck-2" aria-hidden>
        {linked ? (
          <motion.div
            className="h-full w-1/3 rounded-full bg-volt"
            initial={{ x: "-100%" }}
            animate={{ x: "300%" }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : (
          <motion.div
            className="h-full origin-left rounded-full bg-volt"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 2.4, ease: "linear" }}
          />
        )}
      </div>

      <p className="mt-8 max-w-[30ch] text-sm text-ink-3">
        <Gem size={15} className="mr-1.5 inline-block align-[-2px] text-ink-2" aria-hidden />
        On the Platinum tier, customers see your offer first
      </p>
    </div>
  );
}
