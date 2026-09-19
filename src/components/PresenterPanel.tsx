import { BellRing, RotateCcw } from "lucide-react";
import { useApp } from "../state/AppContext";
import { Logo } from "./Logo";
import { RoleSwitch } from "./RoleSwitch";

const STEPS = [
  "The customer picks a destination and sees the price the algorithm estimates.",
  "The driver gets the request and offers the suggested price or their own.",
  "The customer compares offers and picks a driver.",
  "After the ride, the customer rates the driver, and the rating shows up in the driver's profile.",
];

/** Näkyy vain isolla näytöllä: esittäjän ohjaimet puhelinten vieressä. */
export function PresenterPanel() {
  const { state, dispatch } = useApp();

  return (
    <aside className="no-scrollbar hidden max-h-full w-[340px] shrink-0 flex-col overflow-y-auto py-2 lg:flex xl:w-[300px]">
      <div className="flex items-center gap-3">
        <Logo size={40} />
        <span className="font-display text-4xl font-semibold tracking-wide [@media(max-height:820px)]:text-3xl">
          Taxipörssi
        </span>
      </div>
      <p className="mt-4 text-lg text-ink-2 [@media(max-height:820px)]:mt-3 [@media(max-height:820px)]:text-base">
        A taxi marketplace where offers set the price. The algorithm suggests, the driver offers, the customer chooses.
      </p>

      <div className="mt-6 xl:hidden [@media(max-height:820px)]:mt-4">
        <RoleSwitch />
      </div>

      <ol className="mt-8 space-y-4 [@media(max-height:820px)]:mt-5 [@media(max-height:820px)]:space-y-3">
        {STEPS.map((step, i) => (
          <li key={step} className="flex gap-3.5">
            <span className="grid size-7 shrink-0 place-items-center rounded-full border border-line font-display font-semibold text-ink-2">
              {i + 1}
            </span>
            <span className="pt-0.5 text-ink-2 [@media(max-height:820px)]:text-[15px] [@media(max-height:820px)]:leading-snug">
              {step}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-10 flex flex-col gap-2 [@media(max-height:820px)]:mt-6">
        <button
          type="button"
          disabled={Boolean(state.active || state.driverRide)}
          onClick={() => {
            dispatch({ type: "incoming" });
            dispatch({ type: "setRole", role: "driver" });
          }}
          className="flex h-12 items-center justify-center gap-2.5 rounded-2xl border border-volt/60 font-semibold text-ink hover:bg-volt/10 disabled:opacity-40"
        >
          <BellRing size={18} aria-hidden />
          Send the driver a test request
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "reset" })}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-line font-semibold text-ink-2 hover:text-ink"
        >
          <RotateCcw size={17} aria-hidden />
          Restart demo
        </button>
      </div>
    </aside>
  );
}
