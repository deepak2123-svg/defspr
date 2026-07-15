# Ledgr Test Testing And Deployment Checklist

Use this only for the separate Ledgr Test Firebase/Vercel projects. Do not point these steps at the older Ledgr/ClassTracker resources.

## Firebase

1. Create a new Firebase project with a unique project ID.
2. Add a web app and copy the values into `.env`.
3. Enable Auth providers:
   - Google
   - Email/password
4. Enable Firestore and Storage.
5. Deploy rules and indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

6. Seed Firestore:

```bash
npm run seed:firestore
```

7. Verify login flows:
   - public student/teacher signup is not available from real gateways
   - seeded Super Admin direct login at `/admin-login` lands on `/admin`
   - Super Admin can create a group, add/import institutes, add credits and generate an invite
   - `/invite/:token` lets a signed-in/new user claim the invited admin role once
   - Group Admin/Institute Admin claim lands on the minimal scoped `/admin` dashboard
   - non-admin on `/admin-login` is denied

## Local Emulator

1. Set `VITE_USE_FIREBASE_EMULATORS=true` in `.env`.
2. Start emulators:

```bash
npm run firebase:emulators
```

3. In another terminal, seed emulator Firestore:

```bash
npm run seed:firestore
```

4. Run the app and test Student, Teacher, Super Admin and invite-claim gateways.

## Vercel

1. Create a new Vercel project for this repo only.
2. Add the Ledgr Test Firebase `VITE_FIREBASE_*` environment variables.
3. Keep the existing SPA rewrite in `vercel.json`.
4. Deploy a preview.
5. Smoke test:
   - `/`
   - `/student-login`
   - `/teacher-login`
   - `/admin-login`
   - `/invite/:token`
   - Super Admin dashboard tabs: Dashboard, Clients, Invites, Billing, Audit
   - ZEE-style group setup with CSV institute import
   - prepaid credit ledger update
   - student test submission and result view
   - teacher import and publish
   - scoped Group Admin/Institute Admin dashboard after invite claim
