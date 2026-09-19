import { Power } from "lucide-react";
import { useApp } from "../state/AppContext";

/** Ajossa / tauolla -valinta alareunassa, peukalon ulottuvilla. */
export function DutyBar() {
  const { state, dispatch } = useApp();

  if (!state.online) {
    return (
      <div className="shrink-0 px-4 pb-3 pt-2">
        <button
          type="button"
          onClick={() => dispatch({ type: "setOnline", online: true })}
          className="glow-go flex h-16 w-full items-center justify-center gap-2.5 rounded-2xl bg-go text-xl font-semibold text-go-ink"
        >
          <Power size={22} strokeWidth={2.5} />
          Go online
        </button>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-3 mt-2 flex h-16 shrink-0 items-center justify-between gap-3 rounded-2xl border border-go/30 bg-go/[0.06] pl-4 pr-2">
      <div className="flex min-w-0 items-center gap-3" aria-live="polite">
        <span className="relative flex size-3 shrink-0" aria-hidden>
          <span className="ping-soft absolute inset-0 rounded-full bg-go" />
          <span className="relative size-3 rounded-full bg-go" />
        </span>
        <span className="min-w-0">
          <span className="block font-semibold leading-tight">Online</span>
          <span className="block truncate text-sm text-ink-2">Finding rides nearby…</span>
        </span>
      </div>
      <button
        type="button"
        onClick={() => dispatch({ type: "setOnline", online: false })}
        className="h-12 shrink-0 rounded-xl border border-line bg-deck px-5 font-semibold text-ink hover:border-ink-3"
      >
        Pause
      </button>
    </div>
  );
}
