import { fmtClock, useDemoClock } from "../lib/clock";
import { useApp } from "../state/AppContext";
import { Logo } from "./Logo";

export function AppHeader() {
  const { state } = useApp();
  const clock = useDemoClock();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between px-4">
      <div className="flex items-center gap-2.5">
        <Logo />
        <span className="font-display text-[22px] font-semibold tracking-wide">Taxipörssi</span>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="tnum text-ink-3">{fmtClock(clock)}</span>
        <span
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${
            state.online ? "bg-go/12 text-go" : "bg-deck-2 text-ink-2"
          }`}
        >
          <span className={`size-2 rounded-full ${state.online ? "bg-go" : "bg-ink-3"}`} aria-hidden />
          {state.online ? "Online" : "Offline"}
        </span>
      </div>
    </header>
  );
}
