# Firebase Hosting Migration Plan

Switch from GitHub Pages to Firebase Hosting to fix SPA routing (404 on direct URL / refresh) and consolidate into one platform.

## Where you need a browser vs terminal

| Step | Where |
|---|---|
| Prerequisite: `firebase login` | Terminal — opens browser once for Google auth, then done |
| Steps 1–3 (file edits) | Terminal / editor only |
| Step 4 (`firebase init hosting:github`) | Terminal — briefly opens browser for GitHub OAuth to inject the secret, CLI-initiated |
| Step 5–6 (workflow + local test) | Terminal / editor only |
| Step 7 (disable GitHub Pages) | **GitHub web UI** — repo Settings → Pages → None |
| Firebase Console | **Not required** — Hosting is enabled automatically by `firebase init` |

---

## Files to change

| File | Change |
|---|---|
| `firebase.json` | Add `hosting` block |
| `react-app/vite.config.ts` | `base: './'` → `base: '/'` and `start_url: './'` → `start_url: '/'` |
| `.firebaserc` | Create with project ID |
| `.github/workflows/deploy.yml` | Replace `peaceiris/actions-gh-pages` with `FirebaseExtended/action-hosting-deploy` |

---

## Prerequisite — Firebase CLI login

If you haven't logged in yet:

```bash
firebase login
```

Opens a browser once for Google auth, then you're authenticated for all subsequent CLI commands. Check you're on the right project after: `firebase projects:list`

---

## Step 1 — `firebase.json`

Add the `hosting` block (keep existing `storage` and `emulators` as-is):

```json
{
  "hosting": {
    "public": "react-app/dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "**", "destination": "/index.html" }
    ]
  },
  "storage": {
    "rules": "storage.rules"
  },
  "emulators": {
    "firestore": { "port": 8080 },
    "storage": { "port": 9199 },
    "ui": { "enabled": true },
    "singleProjectMode": true
  }
}
```

The `rewrites` rule is what fixes 404s — all paths return `index.html` and React Router handles routing.

---

## Step 2 — `react-app/vite.config.ts`

GitHub Pages needed `'./'` (relative) because it served from a subdirectory `/MudFPVAssistant/`.
Firebase Hosting serves from root `/` so use absolute base.

```ts
base: '/',
// and inside VitePWA manifest:
start_url: '/',
```

---

## Step 3 — `.firebaserc` (create in repo root)

```json
{
  "projects": {
    "default": "YOUR_FIREBASE_PROJECT_ID"
  }
}
```

Find your project ID: `firebase projects:list`

---

## Step 4 — Service account for GitHub Actions

Run this once from the repo root:

```bash
firebase init hosting:github
```

What it does:
1. Creates a Google service account with deploy permissions (no Firebase Console visit needed)
2. Opens a browser briefly for GitHub OAuth — authorises Firebase CLI to add a secret to your repo
3. Adds the secret automatically as `FIREBASE_SERVICE_ACCOUNT_<YOUR_PROJECT_ID>` in GitHub repo settings

That's it — entirely CLI-driven. The browser pop-up is just GitHub's OAuth consent screen.

---

## Step 5 — `.github/workflows/deploy.yml`

Replace the entire file:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - master

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: react-app/package-lock.json

      - name: Install dependencies
        run: npm ci --legacy-peer-deps
        working-directory: react-app

      - name: Build React app
        run: npm run build
        working-directory: react-app

      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: YOUR_FIREBASE_PROJECT_ID
```

No `Prepare SPA fallback` step — Firebase handles it natively via the rewrite rule.

---

## Step 6 — Test locally

```bash
cd react-app && npm run build
firebase serve --only hosting
```

Open `http://localhost:5000` — navigate to `/map-spot-save` directly, should not 404.

---

## Step 7 — Disable GitHub Pages (after confirming Firebase works)

GitHub repo → Settings → Pages → Source → **None**

---

## Bonus: preview channels

Firebase Hosting supports temporary preview URLs per deploy:

```bash
firebase hosting:channel:deploy my-feature --expires 7d
```

Useful for testing before merging to master.
