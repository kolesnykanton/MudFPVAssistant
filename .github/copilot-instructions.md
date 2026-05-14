# Copilot Instructions

## Project Overview

**MudFPVAssistant** is a monorepo containing a **React + TypeScript SPA** (primary) and legacy **Blazor WebAssembly** (.NET 9) application for FPV drone pilots. Both track flight sessions, save GPS flight spots on a map, and manage drone settings. Backend is **Firebase** (Firestore + Auth + Storage) with no server-side component.

**Active deployment**: React app only (CI deploys to GitHub Pages on push to `master`). The Blazor app serves as a reference or backup implementation.

## Build & Run

### React App (Primary)

```bash
cd react-app
npm run dev        # Dev server at http://localhost:5173
npm run build      # TypeScript check + Vite build to dist/
npm run lint       # ESLint check (no --fix; see package.json)
npm test           # Run Playwright E2E tests (headless)
npm run test:ui    # Run Playwright with UI
```

CI/CD deploys to GitHub Pages via `.github/workflows/deploy.yml`.

### Blazor App (Reference)

```bash
dotnet build
dotnet run         # Dev server at HTTP :5106 / HTTPS :7214
dotnet publish MudFPVAssistant.csproj -c Release -o publish
```

Connects to Firebase Emulators automatically in `Development` mode:
- Firestore: `localhost:8080`
- Storage: `localhost:9199`

## Architecture

### React App (Primary)

```
Firebase Auth + Firestore
    ↑ (firebase npm package)
Pages/Components
    ↑
Hooks: useData(), useSettings(), useUserCollection<T>()
    ↑
Context: AuthContext.tsx, DataContext.tsx
    ↑
Services: Firebase SDK calls direct (no interop layer)
```

**Key patterns:**
- `AuthContext` provides `uid` from Firebase Auth
- `DataContext` provides centralized Firestore subscriptions: `flights`, `spots` (both reactive via `onSnapshot`)
- `useData()` returns `{ flights, spots, addFlight, updateFlight, deleteFlight, addSpot, updateSpot, deleteSpot }`
- `useSettings()` wraps `useUserCollection<T>('settings')` for user preferences
- `useUserCollection<T>(collectionName)` — generic hook for any user collection with `add`, `update`, `remove`
- Firestore document path: `users/{uid}/{collectionName}/{docId}`
- **Flight query**: `orderBy('date', 'desc').limit(100)` for latest 100 flights
- **Map components**: react-leaflet (`FpvMap`, `SpotMarker`, `MapControls`, `WeatherLayers`) — all from `src/components/map/`
- **UI library**: Mantine 9; errors shown via `@mantine/notifications` (bottom-left, auto-dismiss)

### Blazor App (Reference/Backup)

```
Firebase JS SDK (ESM modules via CDN)
  └─ window.* global functions   (wwwroot/js/firebase/firebaseInterop.js)
       └─ IJSRuntime              (C# → JS bridge)
            └─ UserDocumentService
                 └─ ReactiveUserCollectionService<T>   (in-memory cache)
                      └─ IDataSource<T> / CloudXxxDataSource
                           └─ Pages/Components
```

All Firebase calls go through JS global functions (`window.addUserDoc`, `window.getUserDocs`, etc.). **Never call Firebase SDK directly from C#** — always use `IJSRuntime`.

### Adding a New Data Type (React)

1. Add type to `src/types/index.ts`
2. Create hook in `src/hooks/` (or use generic `useUserCollection<T>('collectionName')`)
3. Use in pages via `useData()` or custom hook
4. Add context provider in `src/context/DataContext.tsx` if needed for global state

### Adding a New Data Type (Blazor)

1. Create `Models/Drone.cs` with `Id` property (see convention below)
2. Register `ReactiveUserCollectionService<Drone>` in `Program.cs`
3. Create `Services/DataSources/CloudDroneDataSource.cs`
4. Register DI binding in `Program.cs`
5. Use `DataSourceFactory.Get<Drone>()` in pages

## Key Conventions

### React App

**Types & Models:**
- All shared types in `src/types/index.ts` (`FlightSpot`, `FlightInfo`, `UserSettings`, `UserApiKeys`)
- No explicit model files; types are interfaces/types only

**Firestore CRUD:**
- `useData()` for flights/spots only (centralized in `DataContext`)
- `useUserCollection<T>(collectionName)` for other per-user collections
- Direct Firebase SDK calls; no abstraction layer

**Component patterns:**
- Route-level pages in `src/pages/` (MapSpotSave, FlightInfo, Home, Settings)
- Reusable UI components in `src/components/` (FlightTable, FlightSpotEditDialog, etc.)
- Map components in `src/components/map/` — all use react-leaflet with `useMap()` hook
- **No `any` types in map flow** — all Leaflet types from `@types/leaflet`; `leaflet-measure` needs manual declaration in `src/types/leaflet.d.ts`

**Error handling:**
- Show transient feedback via `notifications.show({ color, message })` from `@mantine/notifications`
- Dialogs may keep inline `Alert` for blocking save errors (e.g., `FlightSpotEditDialog`)
- Map controls in `MapControls.tsx` are safe-wrapped so one plugin failure doesn't block others

**API keys:**
- Google Maps API key loaded from Firestore at runtime (`UserSettings.ApiKeys.GoogleApiKey`), not hardcoded
- RainViewer API key also from `UserSettings.ApiKeys`

**Styling:**
- Use Mantine 9 components (no other UI libraries)
- Component-scoped CSS via `<style>` blocks in `.tsx` files (if needed)

### Blazor App

**Model classes:**
- All Firestore-backed models **must** have `Id` property exactly as shown:
  ```csharp
  [JsonPropertyName("id")]
  [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
  public string? Id { get; set; }
  ```
- `Id` is set to `null` before sending to Firestore; `ReactiveUserCollectionService<T>` assigns the doc ID after creation

**Reactive UI updates:**
- Components subscribe to `IDataSource<T>.OnUpdated` and call `InvokeAsync(StateHasChanged)` to re-render
- Always implement `IDisposable` and unsubscribe from `OnUpdated` to avoid memory leaks

**JS Interop:**
- Firebase JS is ES module in `index.html` (`type="module"`)
- All Firebase calls via JS global functions in `wwwroot/js/firebase/firebaseInterop.js`
- Map interop (`wwwroot/js/map/`) follows same pattern
- **Never** call Firebase SDK directly from C#

**Code organization:**
- Complex pages use partial class / code-behind pattern (e.g., `Pages/MapSpotSave.razor` + `Pages/MapSpotSave.razor.cs`)
- Simple pages use inline `@code { }` blocks

**Language:**
- Code comments and XML summaries may be in **Ukrainian** — intentional. Add new comments in same language as surrounding code

**UI framework:**
- MudBlazor v8 only; no other UI libraries
- Snackbar configured in `Program.cs` (bottom-left, 2 s duration)

## Testing

### React App: Playwright E2E

[Playwright](https://playwright.dev) is configured for end-to-end testing. Test files go in `tests/e2e/*.spec.ts`.

```bash
npm test           # Run all tests headless
npm run test:ui    # Interactive UI mode (debug tests)
```

**Key patterns:**
- Tests automatically start dev server (`npm run dev` via `webServer` config)
- Base URL is `http://localhost:5173`
- Auth is typically required — tests may fail if Firebase emulator isn't running or if auth gates the page
- Use `page.goto('/')`, `page.locator(selector)`, `expect()` for assertions
- Tests run in parallel by default; use `.serial` for sequential tests if needed

**Example test:**
```typescript
import { test, expect } from '@playwright/test';

test('flight table loads', async ({ page }) => {
  await page.goto('/flight-info');
  await page.waitForLoadState('networkidle');
  const table = page.locator('table, [role="grid"]');
  await expect(table).toBeDefined();
});
```

Config: `playwright.config.ts` (Chrome, Firefox, WebKit by default; adjust as needed).

### Blazor App

No automated tests in the Blazor codebase.
