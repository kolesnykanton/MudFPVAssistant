# Firebase Setup & Local Development

This guide covers setting up Firebase/Firestore locally with emulators and managing production deployments.

## Prerequisites

- **Firebase CLI**: Installed globally via `npm install -g firebase-tools`
- **Node.js**: v20 or later
- **Firebase Project**: Access to the Firebase Console for your project

## Initial Setup (One-time)

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

Verify installation:
```bash
firebase --version
```

### 2. Set Up `.firebaserc` Locally

Copy the template file and configure your local Firebase project:

```bash
cp .firebaserc.template .firebaserc
```

Edit `.firebaserc` with your actual Firebase project IDs:

```json
{
  "projects": {
    "default": "your-production-project-id",
    "staging": "your-staging-project-id"
  }
}
```

**Note**: `.firebaserc` is in `.gitignore` — never commit this file.

### 3. Login to Firebase (for manual deployments)

```bash
firebase login
```

This opens a browser to authenticate your account.

## Local Development with Emulators

### Start Emulators

From the repo root, start the Firebase emulators:

```bash
firebase emulators:start
```

This will:
- Start **Firestore Emulator** on `http://localhost:8080`
- Start **Storage Emulator** on `http://localhost:9199`
- Open **Emulator UI** on `http://localhost:4000`

### Connect Your App to Emulators

The Blazor/React app should automatically connect to emulators when running locally. If not:

1. **For React** (`react-app/src/firebase/firebaseConfig.ts`):
   - Ensure environment is `development`
   - Check that it connects to `localhost:8080` for Firestore

2. **For Blazor** (`wwwroot/firebase.js`):
   - Same check — should connect to emulator when running locally

### Test Firestore Rules Locally

1. Start emulators: `firebase emulators:start`
2. Run your app pointing to emulator
3. Test CRUD operations:
   - Add a flight
   - Save a spot
   - Check that rules enforce user isolation
   - Verify unauthenticated users cannot access data

### Debugging Emulator

View emulator logs and data:
- **Emulator UI**: http://localhost:4000
- **Firestore Data**: Navigate to Firestore section in UI
- **Rules Evaluation**: Check console logs in UI for rule violations

## Deploying Rules to Production

### Before Deploying

1. **Verify rules locally** with emulator
2. **Review rule changes** to ensure no breaking changes
3. **Test in staging first** (optional):
   ```bash
   firebase deploy --project staging --only firestore:rules,storage:rules
   ```

### Manual Deployment (Development Only)

```bash
# Deploy specific rule type
firebase deploy --only firestore:rules

firebase deploy --only storage:rules

# Deploy both
firebase deploy --only firestore:rules,storage:rules

# Deploy everything (rules + hosting)
firebase deploy
```

### Automatic Deployment (CI/CD)

Deployments automatically run on push to `master` via GitHub Actions (`.github/workflows/firebase-deploy.yml`).

**Requirements**:
- `FIREBASE_TOKEN` secret: Generate with `firebase login:ci`
- `FIREBASE_PROJECT_ID` secret: Your production project ID

## GitHub Secrets Setup (One-time for CI/CD)

### Generate Firebase Token

```bash
firebase login:ci
```

This outputs a token. Copy it and add to GitHub:

1. Go to repo **Settings** → **Secrets and variables** → **Actions**
2. Create new secret:
   - Name: `FIREBASE_TOKEN`
   - Value: Paste the token from above
3. Create another secret:
   - Name: `FIREBASE_PROJECT_ID`
   - Value: Your production Firebase project ID (e.g., `fpv-companion`)

### Verify Secrets

List available secrets:
```bash
# Local check only (via Firebase CLI)
firebase list
```

## Common Tasks

### Update Firestore Rules

1. Edit `firestore.rules`
2. Test locally with emulator
3. Commit and push to `master` → auto-deploys via GitHub Actions
4. Or manually deploy: `firebase deploy --only firestore:rules`

### Update Storage Rules

1. Edit `storage.rules`
2. Test locally with emulator
3. Commit and push to `master` → auto-deploys via GitHub Actions
4. Or manually deploy: `firebase deploy --only storage:rules`

### View Deployed Rules (Production)

```bash
firebase open firestore
```

Opens Firebase Console in browser where you can see deployed rules.

### Reset Emulator Data

```bash
firebase emulators:start --import=<PATH>
```

Or delete local emulator data:
```bash
rm -rf .firebase/
```

Then restart emulator: `firebase emulators:start`

## Troubleshooting

### "No credentials or credentials file found"

Run: `firebase login`

### "Could not determine default project"

Ensure `.firebaserc` exists with a `default` project set.

### Emulator not starting (Port 8080 in use)

Change port in `firebase.json`:
```json
"emulators": {
  "firestore": {
    "port": 8888
  }
}
```

### Rules not working as expected locally

1. Check Emulator UI for rule evaluation logs
2. Verify auth state (logged in vs. anonymous)
3. Check collection/document paths match your app

### GitHub Actions deployment fails

1. Check workflow logs: **Actions** → **Firebase Deploy** workflow
2. Verify `FIREBASE_TOKEN` and `FIREBASE_PROJECT_ID` secrets exist
3. Re-generate token if expired: `firebase login:ci`

## Environment-Specific Configuration

### Separating Production & Local Rules

The `firestore.rules` file handles both production and emulator environments:
- **Emulator**: Uses same rules as production (for realistic testing)
- **Production**: Rules are deployed via `firebase deploy`

If you need different rules for testing, create comments in `firestore.rules`:

```
// Production rules
match /flights/{flightId} {
  allow read, write: if isAuth() && isOwner(resource.data.userId);
}

// For emulator-only testing, comment above and uncomment below:
// match /flights/{flightId} {
//   allow read, write: if true;
// }
```

## References

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [Using Firebase Emulators](https://firebase.google.com/docs/emulator-suite/connect_firestore)
