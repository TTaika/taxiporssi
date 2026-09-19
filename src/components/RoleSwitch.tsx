import { Car, UserRound } from "lucide-react";
import { useApp, type Role } from "../state/AppContext";

const ROLES: { role: Role; label: string; icon: typeof Car }[] = [
  { role: "customer", label: "Customer", icon: UserRound },
  { role: "driver", label: "Driver", icon: Car },
];

/** Vaihtaa näkyvää puhelinta, kun molemmat eivät mahdu ruudulle. Piste = toinen puoli odottaa toimintaa. */
export function RoleSwitch() {
  const { state, dispatch } = useApp();
  const { active, customer, driverRide, trips } = state;

  const waiting: Record<Role, boolean> = {
    driver:
      (!!active && ["bidding", "accepted", "lost"].includes(active.phase)) ||
      (!!driverRide && trips[driverRide.tripId]?.stage === "done"),
    customer:
      (customer.stage === "offers" && customer.offers.length > 0) ||
      customer.stage === "receipt" ||
      customer.stage === "rating",
  };

  return (
    <div role="radiogroup" aria-label="App shown" className="grid grid-cols-2 gap-1 rounded-xl bg-deck p-1">
      {ROLES.map(({ role, label, icon: Icon }) => {
        const selected = state.role === role;
        const attention = waiting[role] && !selected;
        return (
          <button
            key={role}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => dispatch({ type: "setRole", role })}
            className={`relative flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors ${
              selected ? "bg-deck-2 text-ink" : "text-ink-3 hover:text-ink-2"
            }`}
          >
            <Icon size={16} aria-hidden />
            {label}
            {attention && (
              <span className="size-2 rounded-full bg-amber">
                <span className="sr-only">, waiting for you</span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
