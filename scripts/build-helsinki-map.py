#!/usr/bin/env python3
"""
Generoi src/data/helsinki.ts: Helsingin keskustan kartta ja demon kyytien reitit.

Ajetaan käsin kerran (demo itse ei käytä mitään karttarajapintaa):
    python3 scripts/build-helsinki-map.py [välimuistikansio]

Lähteet: OpenStreetMap (Overpass), osoitteet Nominatim, reitit OSRM.
Karttadata © OpenStreetMap contributors, ODbL.
"""
import json
import math
import pathlib
import sys
import time
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "data" / "helsinki.ts"
CACHE = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / ".mapcache"
CACHE.mkdir(parents=True, exist_ok=True)
UA = "taxiporssi-demo-mapgen/0.1"

# Rajaus: Lauttasaari – Kalasatama, Suomenlinna – Pasila
S, W, N, E = 60.142, 24.855, 60.215, 24.995
LAT0 = (S + N) / 2
KX = 111.320 * math.cos(math.radians(LAT0)) * 100  # 1 km = 100 yksikköä
KY = 111.200 * 100
WD = (E - W) * KX
HT = (N - S) * KY


def proj_up(lon, lat):
    """Koordinaatit y ylöspäin (rannikon suunta-algoritmia varten)."""
    return ((lon - W) * KX, (lat - S) * KY)


def to_screen(p):
    return (p[0], HT - p[1])


# ---------- lataukset ----------

def fetch(url, name, data=None):
    path = CACHE / name
    if path.exists():
        return json.loads(path.read_text())
    req = urllib.request.Request(url, data=data, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=240) as r:
        body = r.read()
    path.write_bytes(body)
    time.sleep(1.1)  # Nominatimin käyttöehdot: enintään 1 pyyntö sekunnissa
    return json.loads(body)


OVERPASS_QUERY = f"""
[out:json][timeout:180];
(
  way["natural"="coastline"]({S},{W},{N},{E});
  way["highway"~"^(motorway|trunk|primary|secondary|tertiary|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link|residential|unclassified|living_street)$"]({S},{W},{N},{E});
  way["railway"="rail"]["service"!~"."]({S},{W},{N},{E});
  way["leisure"="park"]({S},{W},{N},{E});
  relation["leisure"="park"]({S},{W},{N},{E});
  way["landuse"~"^(cemetery|forest|recreation_ground)$"]({S},{W},{N},{E});
  way["natural"~"^(wood|water)$"]({S},{W},{N},{E});
  relation["natural"="water"]({S},{W},{N},{E});
);
out geom;
"""


ROADS = {
    "motorway", "trunk", "primary", "secondary", "tertiary", "motorway_link", "trunk_link", "primary_link",
    "secondary_link", "tertiary_link", "residential", "unclassified", "living_street",
}


def overpass():
    data = urllib.parse.urlencode({"data": OVERPASS_QUERY}).encode()
    return fetch("https://overpass-api.de/api/interpreter", "osm.json", data)


def geocode(query):
    q = urllib.parse.urlencode({"q": query, "format": "json", "limit": 1})
    res = fetch(f"https://nominatim.openstreetmap.org/search?{q}", f"geo-{query}.json")
    return float(res[0]["lon"]), float(res[0]["lat"])


def snap(lon, lat):
    res = fetch(f"https://router.project-osrm.org/nearest/v1/driving/{lon},{lat}", f"near-{lon:.5f}-{lat:.5f}.json")
    return tuple(res["waypoints"][0]["location"])


def route(a, b):
    url = (
        f"https://router.project-osrm.org/route/v1/driving/{a[0]},{a[1]};{b[0]},{b[1]}"
        "?overview=full&geometries=geojson"
    )
    res = fetch(url, f"route-{a[0]:.5f}-{a[1]:.5f}-{b[0]:.5f}-{b[1]:.5f}.json")
    r = res["routes"][0]
    return r["geometry"]["coordinates"], r["distance"], r["duration"]


# ---------- geometria ----------

def simplify(pts, tol):
    """Douglas–Peucker."""
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        i, j = stack.pop()
        (x1, y1), (x2, y2) = pts[i], pts[j]
        dx, dy = x2 - x1, y2 - y1
        norm = math.hypot(dx, dy) or 1e-9
        best, idx = -1.0, -1
        for k in range(i + 1, j):
            x, y = pts[k]
            d = abs(dy * x - dx * y + x2 * y1 - y2 * x1) / norm
            if d > best:
                best, idx = d, k
        if best > tol:
            keep[idx] = True
            stack += [(i, idx), (idx, j)]
    return [p for p, k in zip(pts, keep) if k]


def inside(p):
    return 0 <= p[0] <= WD and 0 <= p[1] <= HT


def clip_seg(p, q):
    """Liang–Barsky: janan osa suorakulmion sisällä tai None."""
    x0, y0 = p
    dx, dy = q[0] - x0, q[1] - y0
    t0, t1 = 0.0, 1.0
    for pp, qq in ((-dx, x0), (dx, WD - x0), (-dy, y0), (dy, HT - y0)):
        if pp == 0:
            if qq < 0:
                return None
            continue
        t = qq / pp
        if pp < 0:
            if t > t1:
                return None
            t0 = max(t0, t)
        else:
            if t < t0:
                return None
            t1 = min(t1, t)
    return (x0 + t0 * dx, y0 + t0 * dy), (x0 + t1 * dx, y0 + t1 * dy)


def clip_polyline(pts):
    pieces, cur = [], []
    for p, q in zip(pts, pts[1:]):
        c = clip_seg(p, q)
        if c is None:
            if cur:
                pieces.append(cur)
                cur = []
            continue
        a, b = c
        if not cur:
            cur = [a]
        cur.append(b)
        if b != q:  # poistuu rajauksesta
            pieces.append(cur)
            cur = []
    if cur:
        pieces.append(cur)
    return [pc for pc in pieces if len(pc) >= 2]


def clip_polygon(poly):
    """Sutherland–Hodgman suorakulmiota vasten."""
    def cut(pts, inside_fn, inter):
        out = []
        for i, cur in enumerate(pts):
            prev = pts[i - 1]
            if inside_fn(cur):
                if not inside_fn(prev):
                    out.append(inter(prev, cur))
                out.append(cur)
            elif inside_fn(prev):
                out.append(inter(prev, cur))
        return out

    def ix(x):
        return lambda a, b: (x, a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]))

    def iy(y):
        return lambda a, b: (a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]), y)

    pts = poly
    for fn, it in (
        (lambda p: p[0] >= 0, ix(0)),
        (lambda p: p[0] <= WD, ix(WD)),
        (lambda p: p[1] >= 0, iy(0)),
        (lambda p: p[1] <= HT, iy(HT)),
    ):
        if not pts:
            break
        pts = cut(pts, fn, it)
    return pts


def area(poly):
    return abs(sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(poly, poly[1:] + poly[:1]))) / 2


def point_in(poly, p):
    x, y = p
    c = False
    for (x1, y1), (x2, y2) in zip(poly, poly[1:] + poly[:1]):
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            c = not c
    return c


def join_rings(segments):
    """Yhdistää viivat renkaiksi päätepisteiden perusteella (relaatioiden outer-jäsenet)."""
    key = lambda p: (round(p[0], 7), round(p[1], 7))
    segs = [list(s) for s in segments if len(s) >= 2]
    rings = []
    while segs:
        ring = segs.pop()
        changed = True
        while key(ring[0]) != key(ring[-1]) and changed:
            changed = False
            for i, s in enumerate(segs):
                if key(s[0]) == key(ring[-1]):
                    ring += s[1:]
                elif key(s[-1]) == key(ring[-1]):
                    ring += s[::-1][1:]
                elif key(s[-1]) == key(ring[0]):
                    ring = s + ring[1:]
                elif key(s[0]) == key(ring[0]):
                    ring = s[::-1] + ring[1:]
                else:
                    continue
                segs.pop(i)
                changed = True
                break
        if key(ring[0]) == key(ring[-1]) and len(ring) >= 4:
            rings.append(ring)
    return rings


# ---------- rannikko: maa-alueet ----------

def land_polygons(elements):
    """OSM:n rannikkoviivoilla maa on kulkusuunnan vasemmalla puolella."""
    ways = [e for e in elements if e["type"] == "way" and e.get("tags", {}).get("natural") == "coastline"]
    chains = [(w["nodes"][:], [proj_up(g["lon"], g["lat"]) for g in w["geometry"]]) for w in ways]
    merged = True
    while merged:
        merged = False
        starts = {c[0][0]: i for i, c in enumerate(chains)}
        for i, (nodes, pts) in enumerate(chains):
            j = starts.get(nodes[-1])
            if j is not None and j != i and nodes[0] != nodes[-1]:
                nodes2, pts2 = chains[j]
                chains[i] = (nodes + nodes2[1:], pts + pts2[1:])
                chains.pop(j)
                merged = True
                break

    islands, pieces = [], []
    for nodes, pts in chains:
        closed = nodes[0] == nodes[-1]
        if closed and all(inside(p) for p in pts):
            islands.append(pts[:-1])
            continue
        if closed:
            k = next(i for i, p in enumerate(pts) if not inside(p))
            pts = pts[k:-1] + pts[: k + 1]
        pieces += clip_polyline(pts)

    per = 2 * (WD + HT)

    def tpos(p):
        x, y = p
        eps = 1e-6
        if abs(y) < eps:
            return x
        if abs(x - WD) < eps:
            return WD + y
        if abs(y - HT) < eps:
            return WD + HT + (WD - x)
        return 2 * WD + HT + (HT - y)

    corners = [(WD, (WD, 0)), (WD + HT, (WD, HT)), (2 * WD + HT, (0, HT)), (0.0, (0, 0))]
    segs = [{"pts": pc, "tin": tpos(pc[0]), "tout": tpos(pc[-1])} for pc in pieces]
    used, polys = set(), []
    for start in range(len(segs)):
        if start in used:
            continue
        poly, cur = [], start
        while True:
            used.add(cur)
            poly += segs[cur]["pts"]
            tout = segs[cur]["tout"]
            nxt = min(range(len(segs)), key=lambda j: (segs[j]["tin"] - tout) % per)
            gap = (segs[nxt]["tin"] - tout) % per
            # Kuljetaan rajausta vastapäivään: maa jää vasemmalle.
            for ct, cp in sorted(corners, key=lambda c: (c[0] - tout) % per):
                if 0 < (ct - tout) % per < gap:
                    poly.append(cp)
            if nxt == start or nxt in used:
                break
            cur = nxt
        polys.append(poly)
    return polys + islands


# ---------- pääohjelma ----------

def fmt(v):
    s = f"{v:.1f}"
    return s[:-2] if s.endswith(".0") else s


def path_d(lines, closed=False):
    out = []
    for pts in lines:
        sp = [to_screen(p) for p in pts]
        out.append("M" + "L".join(f"{fmt(x)},{fmt(y)}" for x, y in sp) + ("Z" if closed else ""))
    return "".join(out)


def main():
    osm = overpass()["elements"]

    land = [simplify(p, 0.8) for p in land_polygons(osm)]
    rautatientori = proj_up(24.9430, 60.1710)
    if not any(point_in(p, rautatientori) for p in land):
        sys.exit("Rannikon suunta meni väärin: Rautatientori ei ole maalla.")

    water, parks = [], []
    classes = {"major": [], "mid": [], "minor": [], "rail": []}
    for e in osm:
        t = e.get("tags", {})
        if e["type"] == "way":
            pts = [proj_up(g["lon"], g["lat"]) for g in e["geometry"]]
            hw = t.get("highway", "")
            if hw in ROADS:
                base = hw.replace("_link", "")
                cls = "major" if base in ("motorway", "trunk", "primary") else "mid" if base in ("secondary", "tertiary") else "minor"
                classes[cls] += [simplify(pc, 0.7) for pc in clip_polyline(pts)]
            elif hw:
                continue
            elif t.get("railway") == "rail":
                classes["rail"] += [simplify(pc, 0.7) for pc in clip_polyline(pts)]
            elif t.get("natural") == "water" and e["nodes"][0] == e["nodes"][-1]:
                water.append(pts[:-1])
            elif e["nodes"][0] == e["nodes"][-1] and (
                t.get("leisure") == "park" or t.get("landuse") in ("cemetery", "forest", "recreation_ground") or t.get("natural") == "wood"
            ):
                parks.append(pts[:-1])
        elif e["type"] == "relation":
            outers = [[proj_up(g["lon"], g["lat"]) for g in m["geometry"]] for m in e["members"] if m.get("role") == "outer" and m.get("geometry")]
            rings = [r[:-1] for r in join_rings(outers)]
            (water if t.get("natural") == "water" else parks).extend(rings)

    def polys(src, min_area):
        out = []
        for p in src:
            c = clip_polygon(p)
            if len(c) >= 3 and area(c) >= min_area:
                out.append(simplify(c, 1.0))
        return out

    water = polys(water, 20)
    parks = polys(parks, 120)

    # Paikat ja reitit
    places = {
        "fredrikinkatu34": "Fredrikinkatu 34, Helsinki",
        "makelankatu52": "Mäkelänkatu 52, Helsinki",
        "kaisaniemenkatu1": "Kaisaniemenkatu 1, Helsinki",
        "lauttasaarentie28": "Lauttasaarentie 28, Helsinki",
        "vaasankatu12": "Vaasankatu 12, Helsinki",
        "messitytonkatu4": "Messitytönkatu 4, Helsinki",
        "ratapihantie6": "Ratapihantie 6, Helsinki",
        "kaivokatu1": "Kaivokatu 1, Helsinki",
        "oodi": "Töölönlahdenkatu 4, Helsinki",
        "olympiastadion": "Paavo Nurmen tie 1, Helsinki",
        "kauppatori": "Kauppatori, Helsinki",
        "katajanokanlaituri8": "Katajanokanlaituri 8, Helsinki",
        "tyynenmerenkatu14": "Tyynenmerenkatu 14, Helsinki",
        "haartmaninkatu4": "Haartmaninkatu 4, Helsinki",
        "hermanninrantatie5": "Hermannin rantatie 5, Helsinki",
        "isopuistotie1": "Iso Puistotie 1, Helsinki",
    }
    cars = {
        "mikko": (24.9447, 60.1664),  # Erottaja
        "r2car": (24.9521, 60.1832),  # Kallio
        "r3car": (24.9612, 60.1880),  # Sörnäinen
        "sanna": (24.9232, 60.1790),  # Töölö
        "ahmed": (24.9312, 60.1686),  # Kamppi
        "juha": (24.9662, 60.1958),  # Hermanni
        "idle1": (24.9300, 60.1760),
        "idle2": (24.9452, 60.1602),
        "idle3": (24.9452, 60.1880),
        "idle4": (24.9190, 60.1662),
        "idle5": (24.9700, 60.1830),
    }
    loc = {k: snap(*geocode(q)) for k, q in places.items()}
    loc.update({k: snap(*v) for k, v in cars.items()})

    pairs = {
        "r1Approach": ("mikko", "fredrikinkatu34"),
        "r1Trip": ("fredrikinkatu34", "makelankatu52"),
        "r2Approach": ("r2car", "kaisaniemenkatu1"),
        "r2Trip": ("kaisaniemenkatu1", "lauttasaarentie28"),
        "r3Approach": ("r3car", "vaasankatu12"),
        "r3Trip": ("vaasankatu12", "messitytonkatu4"),
        "toWork": ("fredrikinkatu34", "ratapihantie6"),
        "toLauttasaari": ("fredrikinkatu34", "lauttasaarentie28"),
        "toJatkasaari": ("fredrikinkatu34", "messitytonkatu4"),
        "sannaApproach": ("sanna", "fredrikinkatu34"),
        "ahmedApproach": ("ahmed", "fredrikinkatu34"),
        "juhaApproach": ("juha", "fredrikinkatu34"),
    }
    # Asiakkaan sovellus: jokaisesta noutopaikasta jokaiseen kohteeseen, ja kuljettajilta jokaiseen noutopaikkaan.
    pickups = ["fredrikinkatu34", "kaivokatu1", "vaasankatu12", "tyynenmerenkatu14"]
    dests = [
        "makelankatu52", "ratapihantie6", "lauttasaarentie28", "messitytonkatu4", "kaivokatu1", "oodi",
        "olympiastadion", "kauppatori", "katajanokanlaituri8", "tyynenmerenkatu14", "haartmaninkatu4",
        "hermanninrantatie5", "vaasankatu12", "isopuistotie1",
    ]
    for p in pickups:
        for d in dests:
            if d != p:
                pairs[f"{p}>{d}"] = (p, d)
        for drv in ("mikko", "sanna", "ahmed", "juha"):
            pairs[f"{drv}>{p}"] = (drv, p)

    routes = {}
    for rid, (a, b) in pairs.items():
        coords, dist, dur = route(loc[a], loc[b])
        pts = simplify([proj_up(lon, lat) for lon, lat in coords], 0.5)
        routes[rid] = {
            "path": [[round(x, 1) for x in to_screen(p)] for p in pts],
            "km": round(dist / 1000, 1),
            # OSRM:n ajoajat ovat vapaan liikenteen aikoja; liikennevalot lisäävät yöllä noin 15 %.
            "min": max(2, math.ceil(dur / 60 * 1.15)),
        }

    def pt(lonlat):
        x, y = to_screen(proj_up(*lonlat))
        return [round(x, 1), round(y, 1)]

    districts = [
        ("Kamppi", 24.9305, 60.1682), ("Punavuori", 24.9375, 60.1612), ("Ullanlinna", 24.9485, 60.1575),
        ("Kaartinkaupunki", 24.9470, 60.1648), ("Kruununhaka", 24.9560, 60.1720), ("Katajanokka", 24.9665, 60.1668),
        ("Kallio", 24.9495, 60.1842), ("Sörnäinen", 24.9640, 60.1868), ("Alppila", 24.9420, 60.1915),
        ("Vallila", 24.9555, 60.1950), ("Hermanni", 24.9690, 60.1935), ("Pasila", 24.9310, 60.2005),
        ("Töölö", 24.9215, 60.1805), ("Meilahti", 24.9060, 60.1895), ("Ruoholahti", 24.9160, 60.1640),
        ("Jätkäsaari", 24.9135, 60.1560), ("Lauttasaari", 24.8740, 60.1585), ("Kalasatama", 24.9790, 60.1875),
        ("Suomenlinna", 24.9860, 60.1460), ("Keskuspuisto", 24.9180, 60.1985),
    ]

    layers = {
        "land": path_d([p + p[:1] for p in land], closed=True),
        "water": path_d([p + p[:1] for p in water], closed=True),
        "parks": path_d([p + p[:1] for p in parks], closed=True),
        "rail": path_d(classes["rail"]),
        "minor": path_d(classes["minor"]),
        "mid": path_d(classes["mid"]),
        "major": path_d(classes["major"]),
    }

    ts = [
        "// Generoitu tiedostolla scripts/build-helsinki-map.py – älä muokkaa käsin.",
        "// Karttadata © OpenStreetMap contributors (ODbL). Reitit: OSRM (project-osrm.org).",
        "// Koordinaatit: 1 km = 100 yksikköä, pohjoinen ylhäällä.",
        "",
        "export type Pt = [number, number];",
        "",
        f"export const MAP_SIZE = {{ w: {fmt(WD)}, h: {fmt(HT)} }};",
        "",
        "export const mapLayers = {",
        *[f"  {k}: {json.dumps(v)}," for k, v in layers.items()],
        "};",
        "",
        "export const districts: { name: string; at: Pt }[] = [",
        *[f'  {{ name: "{n}", at: {json.dumps(pt((lon, lat)))} }},' for n, lon, lat in districts],
        "];",
        "",
        "export const places = {",
        *[f"  {k}: {json.dumps(pt(loc[k]))} as Pt," for k in places],
        "};",
        "",
        "export const cars = {",
        *[f"  {k}: {json.dumps(pt(loc[k]))} as Pt," for k in cars],
        "};",
        "",
        "export interface Route {",
        "  path: Pt[];",
        "  km: number;",
        "  min: number;",
        "}",
        "",
        "export const routes: Record<string, Route> = {",
        *[f"  {json.dumps(k)}: {{ km: {v['km']}, min: {v['min']}, path: {json.dumps(v['path'], separators=(',', ':'))} as Pt[] }}," for k, v in routes.items()],
        "};",
        "",
    ]
    OUT.write_text("\n".join(ts))
    print(f"{OUT.relative_to(ROOT)}: {OUT.stat().st_size / 1024:.0f} kB, map {WD:.0f} x {HT:.0f}")
    for k in layers:
        print(f"  {k}: {len(layers[k]) / 1024:.0f} kB")
    print(f"  {len(routes)} reittiä")
    for k in places:
        print(f"  {k}: {loc[k][1]:.5f}, {loc[k][0]:.5f}")


if __name__ == "__main__":
    main()
