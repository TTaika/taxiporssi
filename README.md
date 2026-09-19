# Taxipörssi – demo

An interactive, mobile-first UI demo of a taxi marketplace where offers set the price: a customer app and a
driver app, linked to each other. There is no backend. All data is mock data in `src/data/`, and the shared state
lives in a React Context (`src/state/AppContext.tsx`).

```bash
npm install
npm run dev      # http://localhost:5173 (also reachable from a phone on the same network)
npm run build    # production build in dist/
```

## Customer and driver together

1. The **customer** picks a destination, sees the price the algorithm estimates and taps "Request offers".
2. The **driver** gets the request and offers the suggested price or their own ("Offer").
3. The **customer** sees the driver's offer next to three simulated competitors (Platinum drivers first) and picks one.
   The driver sees "The customer accepted your offer!" or "The customer chose another driver".
4. Both phones follow the same ride: the ETA counts down, the driver sees the fare, the service fee and what they
   earn, and the customer gets a receipt.
5. The customer rates the driver, and the rating shows up in the driver's profile.

The customer can change the pickup point (4 options) and search 14 real places by name, address or district.

On a wide screen (1280 px and up) both phones are shown side by side. On smaller screens a Customer / Driver switch
changes the app shown; a dot on the switch means the other side is waiting for you.

## Driver flow on its own

1. **Market**: the market price per km over 1 h, 4 h and 24 h, plus current demand.
2. **Go online**: a simulated ride request arrives in ~2.5 seconds (on a large screen, also "Send the driver a test
   request").
3. **Offer**: offer the suggested price, adjust by ±€1, or tap the price and type your own.
   The simulated customer accepts offers up to ~15% above the suggestion (`src/lib/pricing.ts`).
4. **Rides**: today's earnings, including the new ride. **Profile**: ratings and Platinum tier benefits.

## Map

The map of central Helsinki is static data generated from OpenStreetMap, and the rides follow real streets.
The demo calls no map API at runtime. To regenerate the data:

```bash
python3 scripts/build-helsinki-map.py
```

The script downloads the map from Overpass, geocodes the addresses with Nominatim and routes the rides with OSRM,
then writes `src/data/helsinki.ts`. Map data © OpenStreetMap contributors (ODbL).
