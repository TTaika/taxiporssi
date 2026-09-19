import { useEffect, useState } from "react";

/*
  Demon kello: alkaa perjantaina 23.45 ja kulkee reaaliajassa sivun latauksesta.
*/

const LOADED_AT = Date.now();
const START_MINUTES = 23 * 60 + 45;

const pad = (n: number) => String(n).padStart(2, "0");

/** Minuutit perjantain keskiyöstä (yli 1440 = lauantaina). */
export function demoMinutes(at = Date.now()) {
  return START_MINUTES + Math.floor((at - LOADED_AT) / 60000);
}

/** "23:47" */
export function fmtTime(minutes: number) {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

/** "Fri 23:47" / "Sat 00:02" */
export function fmtClock(minutes: number) {
  return `${minutes >= 1440 ? "Sat" : "Fri"} ${fmtTime(minutes)}`;
}

export function useDemoClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);
  return demoMinutes(now);
}

/** Vaiheen eteneminen 0–1 aloitushetkestä, päivittyy noin 10 kertaa sekunnissa. */
export function useProgress(startedAt: number, durationMs: number) {
  const calc = () => Math.min(1, Math.max(0, (Date.now() - startedAt) / durationMs));
  const [progress, setProgress] = useState(calc);
  useEffect(() => {
    setProgress(calc());
    const id = setInterval(() => {
      const p = calc();
      setProgress(p);
      if (p >= 1) clearInterval(id);
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt, durationMs]);
  return progress;
}
