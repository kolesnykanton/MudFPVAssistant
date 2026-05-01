# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run development server (HTTP :5106 / HTTPS :7214)
dotnet run

# Build for production
dotnet publish MudFPVAssistant.csproj -c Release -o publish

# Restore dependencies
dotnet restore
```

Deployment is automated via GitHub Actions (`.github/workflows/deploy.yml`) on push to `master`, publishing to GitHub Pages.

## Architecture

**MudFPVAssistant** is a Blazor WebAssembly (.NET 9) app for logging FPV drone flights and managing flight spots, backed by Firebase.

### Data Flow

```
Pages/Components
    → ReactiveUserCollectionService<T>   (reactive state, cached in memory)
        → IDataSource<T>                 (Cloud / Local abstraction)
            → FirestoreService           (JS interop to firebase.js)
```

- `ReactiveUserCollectionService<T>` ([Services/ReactiveUserCollectionService.cs](Services/ReactiveUserCollectionService.cs)) — generic service wrapping a live Firestore collection with `OnChange` events. All CRUD flows through here.
- `IDataSource<T>` ([Services/DataSources/](Services/DataSources/)) — interface with implementations `CloudFlightDataSource` and `CloudSpotDataSource`. Swapped at startup based on auth state.
- `FirestoreService` ([Services/Firebase/FirestoreService.cs](Services/Firebase/FirestoreService.cs)) — thin C# wrapper that calls JS via `IJSRuntime` into `wwwroot/firebase.js`.

### Authentication

`FirebaseAuthService` + `FirebaseAuthenticationStateProvider` ([Services/Firebase/](Services/Firebase/)) handle sign-in/out via Firebase Auth. Auth state drives whether Cloud or null data sources are injected.

### Key Models

- `FlightInfo` — flight log entry (date, mAh, battery type, location reference)
- `FlightSpot` — saved GPS location with metadata and optional photo
- `UserSettings`, `UserApiKeys` — per-user preferences and API keys stored in Firestore

### Pages

| Page | Route | Purpose |
|------|-------|---------|
| `Home` | `/` | Dashboard with stats and weather widget |
| `FlightInfo` | `/flight-info` | Flight log table with add/edit |
| `MapSpotSave` | `/map-spot-save` | Google Maps with saved spots |
| `Settings` | `/settings` | API keys and user preferences |

### Firebase / JS Interop

- `wwwroot/firebase.js` — Firestore CRUD, auth, and storage operations exposed as JS module functions
- `wwwroot/firebaseConfig.js` — Firebase project config (loaded at runtime)
- Development mode automatically connects to local Firebase emulators (Firestore :8080, Storage :9199)
- Production enables Firestore offline persistence

### UI

Built on **MudBlazor v8** component library. Layout is a sidebar nav (`Layout/MainLayout.razor` + `NavMenu.razor`). Google Maps integration uses `BlazorGoogleMaps`; the API key is loaded from Firestore (`UserApiKeys`) at runtime rather than hardcoded.
