# Firebase Configuration Migration Checklist

## ✅ Completed

- [x] Install Firebase CLI globally
- [x] Create `firestore.rules` with default security rules template
- [x] Update `firebase.json` with Firestore rules reference and hosting config
- [x] Create `.firebaserc.template` for local configuration
- [x] Create GitHub Actions workflow (`.github/workflows/firebase-deploy.yml`)
- [x] Create documentation (`docs/firebase-setup.md`, `docs/firebase-migration-notes.md`)
- [x] Commit all changes to branch `claude/firestore-config-migration-GrMKu`
- [x] Push to origin

## ⚠️ Required Actions (Before Using in Production)

### 1. Update Firestore Rules ⚠️ **IMPORTANT**

The `firestore.rules` file currently contains default/template rules. You need to replace them with your actual rules from Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project → **Firestore Database** → **Rules** tab
3. Copy your current production rules (entire text)
4. Open `/home/user/MudFPVAssistant/firestore.rules`
5. Replace entire contents with your rules
6. Commit and push:
   ```bash
   git add firestore.rules
   git commit -m "Update firestore.rules: use actual production rules"
   git push origin claude/firestore-config-migration-GrMKu
   ```

### 2. Set Up Local .firebaserc

For local development to work, you need to create a `.firebaserc` file:

```bash
cp .firebaserc.template .firebaserc
```

Edit `.firebaserc` and replace `fpv-companion` with your actual Firebase project ID(s):

```json
{
  "projects": {
    "default": "your-actual-project-id",
    "staging": "your-staging-project-id"
  }
}
```

**Note**: `.firebaserc` is in `.gitignore` — this file is NOT committed (correct behavior, as it contains project-specific IDs).

### 3. Set Up GitHub Secrets (For CI/CD Deployment)

GitHub Actions needs two secrets to deploy rules to Firebase:

#### Step 1: Generate Firebase CI Token

```bash
firebase login:ci
```

This will:
1. Open a browser for authentication
2. Generate a token and display it in terminal
3. Copy the entire token (long string)

#### Step 2: Add Secrets to GitHub

1. Go to your repository on GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add First Secret:
   - **Name**: `FIREBASE_TOKEN`
   - **Value**: Paste the token from Step 1
   - Click **Add secret**
5. Add Second Secret:
   - **Name**: `FIREBASE_PROJECT_ID`
   - **Value**: Your Firebase project ID (e.g., `fpv-companion`)
   - Click **Add secret**

Verify both secrets appear in the Secrets list (tokens will be masked with `*`).

### 4. Test Locally with Emulators

```bash
# Start Firebase emulators
firebase emulators:start

# In another terminal, run your Blazor/React app
dotnet run  # For Blazor

# Test CRUD operations:
# - Add a flight
# - Save a spot
# - Verify rules work (users can't access other users' data)
```

### 5. Test GitHub Actions Deployment

Make a small test change to verify CI/CD works:

```bash
# Make a small comment change to firestore.rules
# Commit and push
git add firestore.rules
git commit -m "test: verify GitHub Actions deployment"
git push origin claude/firestore-config-migration-GrMKu

# Watch GitHub Actions:
# - Go to Actions tab in GitHub
# - Click "Deploy to Firebase" workflow
# - Verify it runs and completes successfully
```

## 📋 Additional Configuration (Optional)

### Update Storage Rules (Production)

The `storage.rules` file currently uses emulator settings (`allow read, write: if true;`).

For production, update it with proper security rules:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth.uid == userId;
    }
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

Then commit and deploy:
```bash
git add storage.rules
git commit -m "update: improve storage security rules"
git push origin master  # This triggers GitHub Actions deployment
```

### Configure Firebase Hosting (Future)

When ready to deploy React app via Firebase Hosting:

1. Ensure React app builds successfully: `npm run build` (in `react-app/`)
2. Uncomment the hosting deployment line in `.github/workflows/firebase-deploy.yml`
3. Add `hosting` to the `--only` flag: `--only firestore:rules,storage:rules,hosting`

## 🔍 Verification Checklist

Before considering this migration complete:

- [ ] `.firebaserc` exists locally (not committed)
- [ ] `firestore.rules` contains your actual production rules
- [ ] GitHub secrets `FIREBASE_TOKEN` and `FIREBASE_PROJECT_ID` are set
- [ ] Firebase emulators start without errors: `firebase emulators:start`
- [ ] Local app connects to emulator and CRUD operations work
- [ ] GitHub Actions workflow logs show successful deployment (after pushing to `master`)
- [ ] Production Firestore Console shows the deployed rules

## 📚 Documentation

Detailed guides are available:

- **`docs/firebase-setup.md`** — Complete setup and development guide
- **`docs/firebase-migration-notes.md`** — Migration details and rationale
- **This file** — Quick checklist and next steps

## ⚡ Quick Reference

### Local Development
```bash
# Start emulators
firebase emulators:start

# Deploy rules to emulator (if needed)
firebase deploy --only firestore:rules,storage:rules
```

### Production Deployment
```bash
# Manual deployment (requires firebase login)
firebase deploy --only firestore:rules,storage:rules

# Automatic (on master push via GitHub Actions)
git push origin master
```

### View Deployed Rules
```bash
# Open Firebase Console
firebase open firestore
```

### Troubleshooting
See `docs/firebase-setup.md` → Troubleshooting section for common issues.

---

**Status**: ✅ Repository structure ready | ⚠️ Awaiting rule export and GitHub Secrets setup

**Next Priority**: Export actual rules from Firebase Console and update `firestore.rules`
