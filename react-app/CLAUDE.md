# react-app

Vite + React 19 + TypeScript 6 + Mantine 9 SPA. Firebase backend (Auth + Firestore). Leaflet map loaded via CDN (`window.L`), not npm.

## Commands

```bash
npm run dev        # dev server at http://localhost:5173
npm run build      # npx tsc -b && npx vite build  (no global tsc)
npm run lint       # eslint
```

## Key paths

| Path | Purpose |
|------|---------|
| `src/pages/` | Route-level components (MapSpotSave, FlightInfo, Home, Settings) |
| `src/hooks/` | `useUserCollection<T>`, `useSettings`, `useLeafletMap` |
| `src/map/` | Leaflet JS modules — `mapCore.js`, `mapMarkers.js`, `mapPlugins.js` |
| `src/types/index.ts` | All shared types including `LeafletMap` interface |
| `src/components/` | Reusable UI (FlightSpotEditDialog, FlightTable, etc.) |
| `src/context/AuthContext.tsx` | Firebase auth, provides `uid` |
| `src/firebase/firebaseConfig.ts` | Firebase project config |

## Patterns

- **Firestore CRUD**: `useUserCollection<T>('FlightSpots' | 'FlightInfos' | 'settings')` — returns `{ items, add, update, remove }` with live `onSnapshot`
- **Settings**: `useSettings()` — returns `{ settings, loading, updateSettings }`
- **Map lifecycle**: `useLeafletMap('fpvMap')` hook — single dynamic import, registry-based marker diffing, AbortController cleanup
- **Error handling**: no global toast — inline `Alert` state inside dialogs; `handleSaveSpot` throws, dialog catches
- **Leaflet**: CDN-loaded via `window.L`; typed via `src/types/leaflet.d.ts` stub and `LeafletMap` interface
- **No `any` in map flow** — use `LeafletMap` from types

## UI library

Mantine 9 (`@mantine/core`). No `@mantine/notifications` installed — surface errors with local `useState` + `<Alert>`.

## Data model

- `FlightSpot` — GPS spot with name, lat/lng, category, tags, optional photo
- `FlightInfo` — flight log entry with mAh, battery type, duration, location ref
- `UserSettings` / `UserApiKeys` — per-user Firestore subcollection (`users/{uid}/settings`)
