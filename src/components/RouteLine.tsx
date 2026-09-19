interface Props {
  from: string;
  to: string;
  fromSub?: string;
  toSub?: string;
  compact?: boolean;
}

/** Nouto (sininen piste) ja määränpää (vihreä neliö) – samat merkit kuin kartalla. */
export function RouteLine({ from, to, fromSub, toSub, compact = false }: Props) {
  return (
    <div className="flex min-w-0 gap-3">
      <div className={`flex flex-col items-center ${compact ? "py-1.5" : "py-2"}`} aria-hidden>
        <span className="size-2.5 shrink-0 rounded-full bg-volt" />
        <span className="my-1 w-px flex-1 bg-line" />
        <span className="size-2.5 shrink-0 rounded-[3px] bg-go" />
      </div>
      <div className={`flex min-w-0 flex-col ${compact ? "gap-1" : "gap-1.5"}`}>
        <div className="min-w-0">
          <p className={`truncate font-semibold text-ink ${compact ? "" : "text-[17px] leading-tight"}`}>
            <span className="sr-only">Pickup: </span>
            {from}
          </p>
          {fromSub && <p className="truncate text-sm text-ink-3">{fromSub}</p>}
        </div>
        <div className="min-w-0">
          <p className={`truncate font-semibold text-ink ${compact ? "" : "text-[17px] leading-tight"}`}>
            <span className="sr-only">Destination: </span>
            {to}
          </p>
          {toSub && <p className="truncate text-sm text-ink-3">{toSub}</p>}
        </div>
      </div>
    </div>
  );
}
