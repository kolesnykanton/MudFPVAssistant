# react-app

Vite + React 19 + TypeScript 6 + Mantine 9 SPA. Firebase backend (Auth + Firestore). Leaflet map via **react-leaflet** npm package (not CDN).

## Commands

```bash
npm run dev        # dev server at http://localhost:5173
npm run build      # tsc -b && vite build
npm run lint       # eslint
```

## Key paths

| Path | Purpose |
|------|---------|
| `src/pages/` | Route-level components (MapSpotSave, FlightInfo, Home, Settings) |
| `src/hooks/` | `useUserCollection<T>`, `useSettings` |
| `src/components/map/` | react-leaflet map components — `FpvMap`, `SpotMarker`, `MapControls`, `WeatherLayers`, `MapInteraction` |
| `src/types/index.ts` | All shared types (`FlightSpot`, `FlightInfo`, `UserSettings`) |
| `src/components/` | Reusable UI (FlightSpotEditDialog, FlightInfoEditDialog, FlightTable, etc.) |
| `src/context/AuthContext.tsx` | Firebase auth, provides `uid` |
| `src/context/DataContext.tsx` | Single Firestore subscription per collection (FlightInfos, FlightSpots) shared across pages |
| `src/firebase/firebaseConfig.ts` | Firebase project config |

## Patterns

- **Flights/Spots data**: `useData()` from `DataContext` — returns `{ flights, spots, *Loading, addFlight/updateFlight/deleteFlight, addSpot/updateSpot/deleteSpot }`. `FlightInfos` query has `orderBy('date','desc')` + `limit(100)`.
- **Other Firestore CRUD**: `useUserCollection<T>('settings')` — returns `{ items, add, update, remove }` with live `onSnapshot`. Used by `useSettings` only.
- **Settings**: `useSettings()` — returns `{ settings, loading, updateSettings }`
- **Map**: `<FpvMap spots={...} openWeatherApiKey={...} onContextMenu={...} />` — fully declarative react-leaflet; `ContextMenuState` type exported from `FpvMap.tsx`
- **Map controls**: `MapControls.tsx` adds plugins (locate, fullscreen, geocoder, measure) via `useMap()` effect; safe-wrapped so one failure doesn't block others
- **Weather overlays**: `WeatherLayers.tsx` — fetches RainViewer API for last radar frame; renders OWM Wind/Clouds/Rain if API key present
- **Error handling**: `@mantine/notifications` is wired up — pages call `notifications.show({ color, message })` for save/delete feedback. Dialogs may still keep an inline `Alert` for in-context save errors that block the close (e.g. `FlightSpotEditDialog`).
- **No `any` in map flow** — all Leaflet types from `@types/leaflet`; only `leaflet-measure` needs a manual declaration in `src/types/leaflet.d.ts`

## UI library

Mantine 9 (`@mantine/core`, `@mantine/dates`, `@mantine/hooks`, `@mantine/notifications`). Use `notifications.show(...)` from `@mantine/notifications` for transient feedback.

## Data model

- `FlightSpot` — GPS spot with name, lat/lng, category, tags, optional photo
- `FlightInfo` — flight log entry with mAh, battery type, duration, location ref
- `UserSettings` / `UserApiKeys` — per-user Firestore subcollection (`users/{uid}/settings`)
