import { memo, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";
import { MAP_SIZE, districts, mapLayers, type Pt } from "../data/helsinki";

/*
  Helsingin keskustan kartta OpenStreetMap-datasta (staattinen, generoitu:
  scripts/build-helsinki-map.py). Ei karttarajapintaa eikä avaimia.
  Näkymä zoomataan reitin ympärille; merkit ja tekstit pysyvät samankokoisina zoomista riippumatta.
*/

const SEA = "#081a2f";
/** Tiukin zoomaus lyhyemmällä sivulla, yksikköinä (100 = 1 km). */
const MIN_SPAN = 160;
const PAD = 0.14;

export interface MapScene {
  pickup: Pt;
  dropoff?: Pt;
  /** Kuljettajan auto (reitin alkupiste) */
  car?: Pt;
  /** Kuljettajan reitti noutoon */
  approach?: Pt[];
  /** Asiakkaan kyyti */
  trip?: Pt[];
}

/** idle = lähtöpaikassa, approach/trip = liikkeellä, arrived = perillä */
export type CarMotion = "idle" | "approach" | "trip" | "arrived";

interface Props {
  scene: MapScene;
  /** Vaihtuu, kun reitti vaihtuu – käynnistää reitin piirtoanimaation */
  sceneKey: string;
  motion?: CarMotion;
  /** Muut autot kartalla */
  cars?: Pt[];
  /** Pisteet, joihin näkymä rajataan (oletuksena reitti tai kaikki autot) */
  focus?: Pt[];
  label: string;
  insets?: Insets;
  /** Milloin auton liike alkoi (ms) – näkymä voi liittyä kesken käynnissä olevaan kyytiin */
  motionStart?: number;
  /** Liikkeen kesto (ms) */
  motionMs?: number;
}

/** Kaukaa katsottuna näytetään vain tunnetuimmat kaupunginosat, jotta nimet eivät mene päällekkäin. */
const MAIN_DISTRICTS = new Set([
  "Kamppi",
  "Punavuori",
  "Kallio",
  "Pasila",
  "Töölö",
  "Vallila",
  "Lauttasaari",
  "Jätkäsaari",
  "Katajanokka",
  "Kalasatama",
]);
const DETAIL_ZOOM = 1.5;
/** Tätä kauempaa katsottuna nimet menisivät päällekkäin, joten niitä ei näytetä. */
const FAR_ZOOM = 2.6;

const toD = (pts: Pt[]) => "M" + pts.map((p) => `${p[0]},${p[1]}`).join("L");

/** Kartan reunoilta varattu tila (px) päällä oleville elementeille, esim. tietosiruille ja alapaneelille. */
export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const NO_INSETS: Insets = { top: 12, right: 12, bottom: 12, left: 12 };

/** Rajaa näkymän pisteiden ympärille niin, että ne mahtuvat reunavarausten sisään. */
function fitViewBox(points: Pt[], width: number, height: number, inset: Insets) {
  // Ennen ensimmäistä mittausta oletetaan puhelimen levyinen kartta.
  const W = width || 390;
  const H = height || 240;
  const iw = Math.max(60, W - inset.left - inset.right);
  const ih = Math.max(60, H - inset.top - inset.bottom);
  const aspect = iw / ih;
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const needW = (maxX - minX) * (1 + 2 * PAD);
  const needH = (maxY - minY) * (1 + 2 * PAD);
  const innerW = Math.max(needW, needH * aspect, aspect >= 1 ? MIN_SPAN * aspect : MIN_SPAN);
  // Yksikköä per pikseli; koko kartta mahtuu aina näkyviin.
  const u = Math.min(innerW / iw, Math.max(MAP_SIZE.w / W, MAP_SIZE.h / H));
  const w = u * W;
  const h = u * H;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const rawX = cx - (iw * u) / 2 - inset.left * u;
  const rawY = cy - (ih * u) / 2 - inset.top * u;
  const x = w >= MAP_SIZE.w ? (MAP_SIZE.w - w) / 2 : Math.min(Math.max(rawX, 0), MAP_SIZE.w - w);
  const y = h >= MAP_SIZE.h ? (MAP_SIZE.h - h) / 2 : Math.min(Math.max(rawY, 0), MAP_SIZE.h - h);
  return { box: `${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`, unitsPerPx: u };
}

/** Staattinen pohjakartta: piirretään kerran, zoomaus hoidetaan viewBoxilla. */
const BaseMap = memo(function BaseMap() {
  const line = {
    fill: "none",
    vectorEffect: "non-scaling-stroke",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  } as const;
  return (
    <g>
      <rect x={-2000} y={-2000} width={MAP_SIZE.w + 4000} height={MAP_SIZE.h + 4000} fill={SEA} />
      <path d={mapLayers.land} fill="#121d30" />
      <path d={mapLayers.parks} fill="#0f2620" />
      <path d={mapLayers.water} fill={SEA} />
      <path d={mapLayers.minor} stroke="#1b2a42" strokeWidth={1} {...line} />
      <path d={mapLayers.rail} stroke="#3a4a67" strokeWidth={1.2} strokeDasharray="4 3" {...line} />
      <path d={mapLayers.mid} stroke="#25385a" strokeWidth={2} {...line} />
      <path d={mapLayers.major} stroke="#30476f" strokeWidth={3} {...line} />
    </g>
  );
});

export function CityMap({
  scene,
  sceneKey,
  motion: carMotion = "idle",
  cars = [],
  label,
  insets = NO_INSETS,
  motionStart,
  motionMs,
  focus: focusOverride,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const approachRef = useRef<SVGPathElement>(null);
  const tripRef = useRef<SVGPathElement>(null);
  const carRef = useRef<SVGGElement>(null);
  const reduceMotion = useReducedMotion();
  const [size, setSize] = useState({ w: 0, h: 0 });
  // Kaksi karttaa voi olla näkyvissä yhtä aikaa, joten SVG-id:t ovat yksilöllisiä.
  const glowId = `glow-${useId().replace(/[^\w-]/g, "")}`;

  useLayoutEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setSize({ w: r.width, h: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const focus: Pt[] = focusOverride ? [scene.pickup, ...focusOverride] : [scene.pickup];
  if (scene.dropoff) focus.push(scene.dropoff);
  if (scene.car) focus.push(scene.car);
  if (scene.trip) focus.push(...scene.trip);
  if (scene.approach) focus.push(...scene.approach);
  if (!focusOverride && !scene.dropoff && !scene.car) focus.push(...cars);
  const { box, unitsPerPx: u } = fitViewBox(focus, size.w, size.h, insets);

  // Auto ajaa noutoon tai kyydin määränpäähän.
  useEffect(() => {
    const car = carRef.current;
    const path = carMotion === "trip" || carMotion === "arrived" ? tripRef.current : approachRef.current;
    if (!car || !path) return;
    const place = (v: number) => {
      const p = path.getPointAtLength(v * path.getTotalLength());
      car.setAttribute("transform", `translate(${p.x} ${p.y})`);
    };
    const duration = motionMs ?? (carMotion === "trip" ? 5500 : 4500);
    const from = motionStart ? Math.min(1, Math.max(0, (Date.now() - motionStart) / duration)) : 0;
    if (carMotion === "arrived" || from >= 1) {
      place(1);
      return;
    }
    if (carMotion === "idle" || reduceMotion) {
      place(0);
      return;
    }
    // Tasainen nopeus, jotta auto on samassa kohdassa molemmissa näkymissä.
    const controls = animate(from, 1, { duration: (duration * (1 - from)) / 1000, ease: "linear", onUpdate: place });
    return () => controls.stop();
  }, [carMotion, reduceMotion, sceneKey, motionStart, motionMs]);

  const line = {
    fill: "none",
    vectorEffect: "non-scaling-stroke",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  } as const;
  const tripLine = { fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as const;

  return (
    <div className="relative h-full w-full">
      <motion.svg
        ref={svgRef}
        initial={false}
        animate={{ viewBox: box }}
        transition={{ duration: 0.7, ease: "easeInOut" }}
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        role="img"
        aria-label={label}
      >
        <defs>
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={3 * u} />
          </filter>
        </defs>

        <BaseMap />

        {districts
          .filter((d) => u <= DETAIL_ZOOM || (u <= FAR_ZOOM && MAIN_DISTRICTS.has(d.name)))
          .map((d) => (
            <text
              key={d.name}
              x={d.at[0]}
              y={d.at[1]}
              fill="#6a7e9c"
              stroke="#0d1628"
              strokeWidth={3 * u}
              paintOrder="stroke"
              fontSize={10.5 * u}
              fontFamily="Barlow, sans-serif"
              fontWeight={600}
              textAnchor="middle"
            >
              {d.name}
            </text>
          ))}

        {/* Muut vapaat autot */}
        {cars.map(([x, y]) => (
          <g key={`${x},${y}`} transform={`translate(${x} ${y}) scale(${u})`}>
            <circle r={5.5} fill="#0a1322" />
            <circle r={4} fill="#9aabc4" />
          </g>
        ))}

        {scene.approach && (
          <path
            ref={approachRef}
            d={toD(scene.approach)}
            stroke="#3aa0ff"
            strokeWidth={3}
            strokeDasharray="1 7"
            {...line}
          />
        )}

        {/* Piirtoanimaatio (pathLength) toimii vain ilman non-scaling-strokea: muuten viivaus mitataan
            ruudun pikseleinä ja zoomatessa sisään reitin loppuosa jää piirtämättä. Leveys skaalataan siksi itse. */}
        {scene.trip && (
          <>
            <motion.path
              key={`${sceneKey}-glow`}
              d={toD(scene.trip)}
              stroke="#39f28a"
              strokeWidth={9 * u}
              strokeOpacity={0.35}
              filter={`url(#${glowId})`}
              {...tripLine}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.1, delay: 0.35, ease: "easeInOut" }}
            />
            <motion.path
              key={sceneKey}
              ref={tripRef}
              d={toD(scene.trip)}
              stroke="#39f28a"
              strokeWidth={3.5 * u}
              {...tripLine}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.1, delay: 0.35, ease: "easeInOut" }}
            />
          </>
        )}

        {scene.dropoff && (
          <g transform={`translate(${scene.dropoff[0]} ${scene.dropoff[1]}) scale(${u})`}>
            <rect x={-7} y={-7} width={14} height={14} rx={3.5} fill="#0a1322" stroke="#39f28a" strokeWidth={2.5} />
            <rect x={-2.5} y={-2.5} width={5} height={5} rx={1} fill="#39f28a" />
          </g>
        )}

        {/* Noutopaikka */}
        <g transform={`translate(${scene.pickup[0]} ${scene.pickup[1]}) scale(${u})`}>
          <circle r={7} fill="#3aa0ff" className="ping-soft" />
          <circle r={7.5} fill="#3aa0ff" stroke="#0a1322" strokeWidth={2.5} />
        </g>

        {/* Kuljettaja: ulompi g liikkuu, sisempi pitää koon vakiona */}
        {scene.car && (
          <g ref={carRef} transform={`translate(${scene.car[0]} ${scene.car[1]})`}>
            <g transform={`scale(${u})`}>
              <circle r={10} fill="#0a1322" />
              <circle r={8.5} fill="#eaf1fb" />
              <path d="M0,-5 L4,4.2 L0,2.2 L-4,4.2 Z" fill="#0a1322" />
            </g>
          </g>
        )}
      </motion.svg>

      <span className="pointer-events-none absolute bottom-5 right-2 z-10 text-[9px] text-ink-3/80">
        © OpenStreetMap
      </span>
    </div>
  );
}
