# React App — Open Issues

Issues that have been identified but not yet resolved. Everything else listed in
earlier versions of this file has been fixed and removed to avoid confusion.

---

## C. Home.tsx — full FlightSpots snapshot just for the count

**File:** `src/pages/Home.tsx`, line 34

`useUserCollection<FlightSpot>('FlightSpots')` opens a live `onSnapshot` for
the entire spots collection only to display `spots.length`. With many spots this
wastes bandwidth and memory.

**Fix:** store a `count` in a separate Firestore document
(`users/{uid}/meta/stats`) updated by a cloud function or by the add/remove
paths. Or use `getCountFromServer()` for a one-off read on mount instead of
a live subscription.

---

## E. vite-plugin-pwa — peer dependency conflict with Vite 8

**File:** `package.json`

`vite-plugin-pwa@^1.2.0` declares a peer dep on `vite@^3-7`; the project uses
`vite@^8.0.10`. `npm ci` requires `--legacy-peer-deps` (already in
`deploy.yml`). Watch for a compatible release or pin to a specific working
version.

---

## J. Bundle size

**File:** `vite.config.ts`

Recharts (~395 KB), Mantine (~323 KB), Firebase (~428 KB), and Leaflet (~233 KB)
are all downloaded on first load even for users who only visit the Dashboard.

**Fix (P6 in review plan):** lazy-load page routes with `React.lazy()` +
`<Suspense>`. Manual chunks in `vite.config.ts` already split vendors correctly;
lazy import just defers their download until the route is visited.
