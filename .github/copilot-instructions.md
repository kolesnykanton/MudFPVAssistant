# Copilot Instructions

## Project Overview

MudFPVAssistant is a **Blazor WebAssembly PWA** (.NET 9) for FPV drone pilots. It tracks flight sessions, saves flight spots on a map, and manages drone-related settings. Backend is **Firebase** (Firestore + Auth + Storage), accessed entirely through **JavaScript interop** — there is no server-side component.

## Build & Run

```bash
# Build
dotnet build

# Run locally (connects to Firebase Emulators automatically in Development)
dotnet run

# Publish (used by CI)
dotnet publish MudFPVAssistant.csproj -c Release -o publish
```

There are no automated tests in this project. CI deploys to GitHub Pages on push to `master` via `.github/workflows/deploy.yml`.

### Firebase Emulators (local dev)

When running in `Development` mode, `Program.cs` calls `connectEmulators()` via JS interop, which connects to:
- Firestore emulator: `localhost:8080`
- Storage emulator: `localhost:9199`

## Architecture

### Data Flow

```
Firebase JS SDK (ESM modules via CDN)
  └─ window.* global functions   (wwwroot/js/firebase/firebaseInterop.js)
       └─ IJSRuntime              (C# → JS bridge)
            └─ UserDocumentService (IUserDocumentService)
                 └─ ReactiveUserCollectionService<T>   (in-memory cache + auth-reactive)
                      └─ IDataSource<T> / CloudXxxDataSource  (abstraction layer)
                           └─ Pages/Components
```

All Firebase SDK calls go through JS global functions (`window.addUserDoc`, `window.getUserDocs`, etc.) defined in `wwwroot/js/firebase/firebaseInterop.js`. **Never call Firebase directly from C#** — always go through `IJSRuntime`.

Firestore document path: `users/{uid}/{collectionName}/{docId}`

### Key Services

| Service | Role |
|---|---|
| `FirebaseAuthService` | Wraps `signInWithGoogle`, `signOutUser`, `subscribeAuthState` JS calls |
| `AuthState` | Holds the current `Uid`; `[JSInvokable] OnAuthStateChanged` called from JS |
| `FirebaseAuthenticationStateProvider` | Bridges `AuthState` to Blazor's `AuthenticationStateProvider` |
| `UserDocumentService` | Generic CRUD over Firestore via `IJSRuntime` |
| `ReactiveUserCollectionService<T>` | Wraps `UserDocumentService`; caches items in memory; fires `OnUpdated` on auth changes and data mutations |
| `IDataSource<T>` / `CloudXxxDataSource` | Thin adapter from `ReactiveUserCollectionService<T>` to the `IDataSource<T>` interface |
| `DataSourceFactory` | Resolves `IDataSource<T>` from DI by type |
| `AppSettingsService` | Wraps `ReactiveUserCollectionService<UserSettings>`; auto-creates a default settings doc if none exists |

### Adding a New Data Type (e.g., `Drone`)

1. Create `Models/Drone.cs` — include `Id` with JSON attributes (see convention below).
2. Register a new `ReactiveUserCollectionService<Drone>` in `Program.cs` with the Firestore collection name.
3. Create `Services/DataSources/CloudDroneDataSource.cs` implementing `IDataSource<Drone>` (delegate to the reactive service).
4. Register `IDataSource<Drone>` → `CloudDroneDataSource` in `Program.cs`.
5. Use `DataSourceFactory.Get<Drone>()` in pages.

## Key Conventions

### Model Classes

All Firestore-backed models **must** follow this pattern for the `Id` field:

```csharp
[JsonPropertyName("id")]
[JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
public string? Id { get; set; }
```

The `Id` is set to `null` before sending to Firestore (so it's not included in the document data) and then assigned the generated Firestore document ID after creation. `ReactiveUserCollectionService<T>` does this via reflection — the property must be named exactly `Id`.

### Reactive UI Updates

Components subscribe to `IDataSource<T>.OnUpdated` and call `InvokeAsync(StateHasChanged)` to re-render:

```csharp
protected override async Task OnInitializedAsync()
{
    _ds = factory.Get<MyModel>();
    await _ds.InitializeAsync();
    _ds.OnUpdated += Refresh;
}

private void Refresh() => InvokeAsync(StateHasChanged);

public void Dispose() => _ds.OnUpdated -= Refresh;
```

Always implement `IDisposable` and unsubscribe from `OnUpdated` to avoid memory leaks.

### API Keys

The Google Maps API key is stored in Firestore under `UserSettings.ApiKeys.GoogleApiKey`, not in environment variables or config files. `FirestoreGoogleMapsKeyService` fetches it via `AppSettingsService` and provides it to `BlazorGoogleMaps`. Other API keys follow the same pattern via `UserApiKeys`.

### JS Interop Modules

Firebase JS is loaded as an ES module (`type="module"` in `index.html`). It exports functions to the `window` object so they are accessible from C# `IJSRuntime`. Map interop (`wwwroot/js/map/`) follows the same pattern.

### Code-Behind Files

Complex pages use the partial class / code-behind pattern (e.g., `Pages/MapSpotSave.razor` + `Pages/MapSpotSave.razor.cs`). Simple pages use inline `@code { }` blocks.

### Inline Styles

Component-scoped CSS is written as `<style>` blocks at the bottom of `.razor` files. There is no CSS modules system.

### Language

Code comments and XML summaries may be in **Ukrainian** — this is intentional. Do not translate existing comments; add new ones in the same language as surrounding code.

## UI Framework

MudBlazor v8 is the component library. Use `MudBlazor` components for all UI. Snackbar is configured in `Program.cs` (bottom-left, 2 s duration). Do not introduce other UI libraries.
