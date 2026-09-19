import { useState } from "react";
import { motion } from "framer-motion";
import { Gem, Star } from "lucide-react";
import { useApp, type CustomerState } from "../state/AppContext";
import { destinationById, improvementTags, positiveTags } from "../data/customer";
import { DriverBadge } from "./DriverBadge";

/** Tila tulee propsina: poistumisanimaation aikana näkymä pitää viimeisen tilansa. */
export function RatingSheet({ customer }: { customer: CustomerState }) {
  const { dispatch } = useApp();
  const offer = customer.chosen!;
  const destination = destinationById(customer.destinationId!);
  const [stars, setStars] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState("");

  const positive = stars === 0 || stars >= 4;
  const tagOptions = positive ? positiveTags : improvementTags;

  const pickStars = (n: number) => {
    if (n >= 4 !== positive) setTags([]);
    setStars(n);
  };
  const toggleTag = (tag: string) => setTags((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]));

  const submit = () => {
    const written = text.trim();
    const fallback = tags.length ? `${tags.join(", ")}.` : positive ? "Good ride." : "No comment.";
    dispatch({ type: "rate", stars, text: written || fallback });
  };

  return (
    <div className="px-4 pt-5">
      <p className="text-ink-2">Arrived at {destination.address}</p>
      <h2 className="font-display text-[28px] font-semibold leading-tight">How was your ride?</h2>

      <div className="mt-3 flex">
        <DriverBadge offer={offer} />
      </div>

      <div role="radiogroup" aria-label="Rating" className="mt-4 flex justify-between">
        {[1, 2, 3, 4, 5].map((n) => (
          <motion.button
            key={n}
            type="button"
            role="radio"
            aria-checked={stars === n}
            aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
            onClick={() => pickStars(n)}
            whileTap={{ scale: 0.85 }}
            className="grid size-14 place-items-center rounded-2xl hover:bg-deck-2"
          >
            <Star size={38} strokeWidth={1.5} className={n <= stars ? "fill-amber text-amber" : "text-ink-3"} />
          </motion.button>
        ))}
      </div>

      {stars > 0 && (
        <>
          <p className="mt-4 text-sm text-ink-2">{positive ? "What went well?" : "What could be better?"}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {tagOptions.map((tag) => {
              const selected = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleTag(tag)}
                  className={`h-10 rounded-full border px-4 font-medium transition-colors ${
                    selected ? "border-go bg-go/15 text-ink" : "border-line text-ink-2 hover:text-ink"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
          <label htmlFor="review-text" className="sr-only">
            Written review
          </label>
          <textarea
            id="review-text"
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tell us more (optional)"
            className="mt-3 w-full resize-none rounded-2xl border border-line bg-deck-2 px-4 py-3 text-ink outline-none placeholder:text-ink-3 focus:border-volt"
          />
        </>
      )}

      <p className="mt-3 flex items-start gap-2 text-sm text-ink-3">
        <Gem size={14} className="mt-0.5 shrink-0" aria-hidden />
        Your rating affects the driver's tier and how prominently their offers are shown.
      </p>

      {/* Pääpainike pysyy näkyvissä myös matalalla näytöllä. */}
      <div className="sticky bottom-0 -mx-4 mt-3 bg-deck px-4 pt-2">
        <button
          type="button"
          disabled={stars === 0}
          onClick={submit}
          className="glow-go flex h-16 w-full items-center justify-center rounded-2xl bg-go text-xl font-semibold text-go-ink disabled:opacity-40 disabled:shadow-none"
        >
          Send rating
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "skipRating" })}
          className="mt-1 h-11 w-full pb-1 font-medium text-ink-2 hover:text-ink"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
