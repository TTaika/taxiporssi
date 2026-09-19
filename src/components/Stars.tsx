import { Star } from "lucide-react";
import { fmtRating } from "../lib/format";

/** Viisi tähteä, osittainen täyttö keskiarvolle (esim. 4,92). */
export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const row = (className: string) => (
    <span className={`flex gap-0.5 ${className}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={size} className="shrink-0 fill-current" strokeWidth={0} />
      ))}
    </span>
  );

  return (
    <span className="relative inline-flex" role="img" aria-label={`${fmtRating(value)} out of 5 stars`}>
      {row("text-line")}
      <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${(value / 5) * 100}%` }}>
        {row("text-amber")}
      </span>
    </span>
  );
}
