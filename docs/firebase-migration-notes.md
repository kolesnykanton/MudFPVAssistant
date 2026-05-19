# Firebase Configuration Migration

This document explains the migration from console-only Firebase configuration to repository-based configuration with automated deployments.

## What Changed

### Files Added to Repository

| File | Purpose |
|------|---------|
| `firestore.rules` | Firestore security rules (version controlled) |
| `firebase.json` | Firebase project config with emulator & hosting settings |
| `.firebaserc.template` | Template for local `.firebaserc` (project mapping) |
| `.github/workflows/firebase-deploy.yml` | GitHub Actions workflow for automatic rule deployment |
| `docs/firebase-setup.md` | Local development guide |

### Files Already in Repository

| File | Status |
|------|--------|
| `storage.rules` | Already present (emulator-specific, will be versioned with production rules) |
| `.gitignore` | Updated to keep `.firebaserc` private (was already configured) |

## Migration Steps Completed

### 1. ✅ Installed Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. ✅ Created Firestore Rules File

**`firestore.rules`** — Contains default security rules:
- User authentication required for all operations
- Users can only access their own documents
- Collections: `users`, `flights`, `spots`, `userSettings`, `userApiKeys`
- Deny all other access by default (deny rule at bottom)

**⚠️ Action Required**: Replace the default rules with your actual rules from Firebase Console:
1. Go to [Firebase Console](https://console.firebase.google.com) → Project → Firestore → Rules
2. Copy your current production rules
3. Replace contents of `firestore.rules` with your actual rules
4. Test locally with emulator: `firebase emulators:start`

### 3. ✅ Updated firebase.json

Added:
- `firestore` block pointing to `firestore.rules`
- `hosting` block configured for React app in `react-app/dist`
- SPA rewrite rules for client-side routing

Kept:
- Emulator configuration for local development
- Storage rules reference

### 4. ✅ Created GitHub Actions Workflow

**`.github/workflows/firebase-deploy.yml`** — Automatic deployment on push to `master`:
- Triggers when: `firestore.rules`, `storage.rules`, or `firebase.json` change
- Deploys: Firestore & Storage rules only (hosting commented out)
- Requires: `FIREBASE_TOKEN` and `FIREBASE_PROJECT_ID` secrets

**⚠️ Action Required**: Set up GitHub Secrets (one-time):
```bash
firebase login:ci
```
Then add to GitHub repo settings:
- `FIREBASE_TOKEN`: Token from above command
- `FIREBASE_PROJECT_ID`: Your Firebase project ID (e.g., `fpv-companion`)

### 5. ✅ Created Configuration Templates & Documentation

- **`.firebaserc.template`** — Copy and customize with your project IDs
- **`docs/firebase-setup.md`** — Complete guide for local development
- **`docs/firebase-migration-notes.md`** — This file

## Next Steps

### For Local Development

1. Copy `.firebaserc.template` → `.firebaserc`:
   ```bash
   cp .firebaserc.template .firebaserc
   ```
2. Edit `.firebaserc` with your Firebase project ID
3. Start emulators: `firebase emulators:start`
4. Run your app and test CRUD operations

### For Production Deployment

1. Replace `firestore.rules` with your actual rules from console
2. Set up GitHub Secrets (`FIREBASE_TOKEN`, `FIREBASE_PROJECT_ID`)
3. Commit and push to `master`
4. GitHub Actions automatically deploys rules

### Migrating Existing Rules

If you have rules in Firebase Console that differ from the template:

1. Go to Firebase Console → Firestore → Rules
2. Copy your current rules (entire text)
3. Open `firestore.rules` locally
4. Replace entire contents with your rules
5. Test locally: `firebase emulators:start`
6. Commit and push

## Configuration Structure

```
.
├── firebase.json                           # Firebase project config
├── firestore.rules                         # Firestore security rules (TO BE UPDATED)
├── storage.rules                           # Storage security rules
├── .firebaserc.template                    # Template for local config
├── .gitignore                              # Includes .firebaserc
├── .github/
│   └── workflows/
│       ├── deploy.yml                      # GitHub Pages deployment (existing)
│       └── firebase-deploy.yml             # Firebase deployment (NEW)
└── docs/
    ├── firebase-setup.md                   # Local development guide
    └── firebase-migration-notes.md         # This file
```

## Environment Strategy

### Local Development (Emulator)
- **Firestore**: Runs on `localhost:8080`
- **Storage**: Runs on `localhost:9199`
- **Rules**: Uses same `firestore.rules` as production for realistic testing
- **Data**: Ephemeral (lost when emulator stops, unless saved)

### Production
- **Rules**: Deployed via GitHub Actions on `master` push
- **Data**: Persistent, real user data
- **Rules Evaluation**: Against production Firestore service

### Staging (Optional Future)
- Similar to production but in staging Firebase project
- Can be configured in `.firebaserc` under `"staging"` project

## Benefits of This Setup

1. **Version Control**: Rules are tracked in Git with full history
2. **Code Review**: Rule changes can be reviewed in pull requests
3. **Automated Deployment**: No manual console deployments needed
4. **Environment Consistency**: Same rules locally and in production
5. **Rollback Capability**: Can revert rule changes via Git history
6. **Documentation**: Clear separation of emulator vs. production config

## Common Workflows

### Updating Rules

1. **Local Development**:
   ```bash
   firebase emulators:start
   # Edit firestore.rules
   # App automatically uses new rules in emulator
   # Test your changes
   ```

2. **Push to Production**:
   ```bash
   git add firestore.rules
   git commit -m "Update Firestore rules: [describe changes]"
   git push origin master
   # GitHub Actions automatically deploys rules
   ```

### Adding New Collections

1. Add new collection rules to `firestore.rules`
2. Test locally with emulator
3. Commit and deploy via GitHub Actions

### Rolling Back Rules

```bash
# View rule history
git log --oneline firestore.rules

# Revert to specific commit
git revert <commit-hash>
git push origin master
# GitHub Actions deploys reverted rules
```

## Security Considerations

1. **API Keys**: Move from hardcoded to environment variables (future)
2. **Firebase Token**: Stored securely in GitHub Secrets, never in code
3. **Rules**: Keep `.firebaserc` in `.gitignore` (project IDs private)
4. **Access Control**: Review rules for overly permissive settings
5. **Audit**: Monitor rule deployments via GitHub Actions logs

## Troubleshooting

### "Could not find a default project"
- Ensure `.firebaserc` exists and has `"default"` project set
- Run: `firebase use --add` to configure project

### Emulator won't start
- Check if ports 8080 (Firestore) or 9199 (Storage) are in use
- Change ports in `firebase.json` if needed
- Or: Stop processes using those ports

### Rules not deploying
- Check GitHub Actions logs: Settings → Actions → Firebase Deploy
- Verify `FIREBASE_TOKEN` and `FIREBASE_PROJECT_ID` secrets exist
- Regenerate token if expired: `firebase login:ci`

### Rules work locally but not production
- Verify rules are actually deployed: `firebase open firestore`
- Check Firestore usage metrics for rule violations
- Compare local rules with deployed rules

## References

- [Firestore Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase CLI Documentation](https://firebase.google.com/docs/cli)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [GitHub Actions for Firebase](https://github.com/FirebaseExtended/action-hosting-deploy)

## Questions?

Refer to `docs/firebase-setup.md` for detailed setup instructions and troubleshooting.
