import { ChartSpline, Receipt, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useApp, type Tab } from "../state/AppContext";

const TABS: { key: Tab; label: string; icon: LucideIcon }[] = [
  { key: "market", label: "Market", icon: ChartSpline },
  { key: "rides", label: "Rides", icon: Receipt },
  { key: "profile", label: "Profile", icon: UserRound },
];

export function TabBar() {
  const { state, dispatch } = useApp();

  return (
    <nav
      className="grid shrink-0 grid-cols-3 border-t border-line bg-deck pb-[var(--safe-bottom,env(safe-area-inset-bottom))]"
      aria-label="Main menu"
    >
      {TABS.map(({ key, label, icon: Icon }) => {
        const selected = state.tab === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => dispatch({ type: "setTab", tab: key })}
            aria-current={selected ? "page" : undefined}
            className={`relative flex h-16 flex-col items-center justify-center gap-1 text-sm font-medium transition-colors ${
              selected ? "text-ink" : "text-ink-3 hover:text-ink-2"
            }`}
          >
            {selected && <span className="absolute inset-x-8 top-0 h-0.5 rounded-full bg-volt" aria-hidden />}
            <Icon size={22} className={selected ? "text-volt" : undefined} aria-hidden />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
