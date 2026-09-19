import { Area, AreaChart, CartesianGrid, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { axisTicks, type PricePoint, type RangeKey } from "../data/market";
import { fmtDec2, fmtPerKm } from "../lib/format";

const VOLT = "#3aa0ff";
const SURFACE = "#0a1322";
const GRID = "#1a2940";
const AXIS_TEXT = "#7084a0";

/** Tasaiset y-akselin tikit: askel 0,1 tai 0,2 €/km vaihteluvälin mukaan. */
function yScale(data: PricePoint[]) {
  const prices = data.map((d) => d.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const step = max - min <= 0.4 ? 0.1 : 0.2;
  const lo = Math.floor(min / step - 0.2) * step;
  const hi = Math.ceil(max / step + 0.2) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + 1e-9; v += step) ticks.push(Math.round(v * 100) / 100);
  return { domain: [ticks[0], ticks[ticks.length - 1]] as [number, number], ticks };
}

export function MarketChart({ data, range }: { data: PricePoint[]; range: RangeKey }) {
  const last = data[data.length - 1];
  const { domain, ticks } = yScale(data);

  return (
    <figure>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 14, right: 0, bottom: 0, left: 20 }}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis
              dataKey="t"
              ticks={axisTicks[range]}
              interval={0}
              tickLine={false}
              axisLine={{ stroke: GRID }}
              tick={{ fill: AXIS_TEXT, fontSize: 12 }}
              tickMargin={8}
              padding={{ left: 4, right: 10 }}
            />
            <YAxis
              orientation="right"
              domain={domain}
              ticks={ticks}
              tickFormatter={fmtDec2}
              tickLine={false}
              axisLine={false}
              tick={{ fill: AXIS_TEXT, fontSize: 12 }}
              width={40}
            />
            <Tooltip
              cursor={{ stroke: VOLT, strokeOpacity: 0.5 }}
              isAnimationActive={false}
              content={({ active, payload }) => {
                const point = payload?.[0]?.payload as PricePoint | undefined;
                if (!active || !point) return null;
                return (
                  <div className="rounded-lg border border-line bg-deck-2 px-3 py-2 shadow-lg">
                    <div className="text-xs text-ink-3">{point === last ? `${point.t}, now` : point.t}</div>
                    <div className="tnum font-semibold text-ink">{fmtPerKm(point.price)}</div>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={VOLT}
              strokeWidth={2}
              fill={VOLT}
              fillOpacity={0.1}
              activeDot={{ r: 5, fill: VOLT, stroke: SURFACE, strokeWidth: 2 }}
              animationDuration={650}
            />
            <ReferenceDot
              x={last.t}
              y={last.price}
              shape={(props: { cx?: number; cy?: number }) => (
                <g>
                  <circle cx={props.cx} cy={props.cy} r={5} fill={VOLT} className="ping-soft" />
                  <circle cx={props.cx} cy={props.cy} r={5} fill={VOLT} stroke={SURFACE} strokeWidth={2} />
                </g>
              )}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Kaavion arvot ruudunlukijalle. Taulukko kääritään divvin sisään: sr-only ei piilota taulukon otsikkoa. */}
      <div className="sr-only">
        <table aria-label="Market price, euros per kilometre">
          <thead>
            <tr>
              <th scope="col">Time</th>
              <th scope="col">Price</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.t}>
                <td>{d.t}</td>
                <td>{fmtPerKm(d.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
