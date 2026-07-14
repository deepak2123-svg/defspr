# Ledgr Test

Ledgr Test is a React + Vite mock-test webapp for NDA, NEET, JEE Main and JEE Advanced. The first live vertical is NDA, with NEET/JEE shells ready for future question banks.

## What is implemented

- Student portal: public/assigned tests, timed exam player, attempt storage, results and analytics.
- Teacher portal: subject-wide question bank, text/DOCX/selectable-PDF import, rules-first parser, preview and publish flow.
- Admin portal: test builder, configurable timing/attempt/result policies, users, results and CSV export.
- Gateway model: `/` shows Student and Teacher entry points only, `/student-login` and `/teacher-login` are separate login screens, and Admin is available only by direct `/admin-login`.
- Route guards: student routes require an active student or admin, teacher routes require an approved teacher or admin, and admin routes require admin.
- Flexible question model: single-correct, multi-correct, numeric, paragraph-ready, rich text and media-ready fields.
- Firebase-ready setup: Auth, Firestore, Storage config, rules and indexes.
- Demo mode: the app runs without Firebase credentials using local browser storage through the non-public `/dev-demo` route.

## Development

```bash
npm install
npm run dev
```

Local preview without Firebase still uses `/dev-demo`. Real auth/data testing uses Firebase env values plus the normal `/student-login`, `/teacher-login`, and `/admin-login` gateways.

## Validation

```bash
npm test
npm run build
npm audit --audit-level=moderate
npm run check
```

## Firebase setup

Copy `.env.example` to `.env` and add Firebase web app credentials:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Firestore and Storage rules live in `firestore.rules` and `storage.rules`.

## Real login testing

Create a separate Firebase project for Ledgr Test, then enable Auth providers:

- Google
- Email/password

Add the Firebase web app values to `.env`. For emulator testing, set `VITE_USE_FIREBASE_EMULATORS=true` and run:

```bash
npm run firebase:emulators
```

Seed Firestore after setting `FIREBASE_PROJECT_ID` or `VITE_FIREBASE_PROJECT_ID` plus either `GOOGLE_APPLICATION_CREDENTIALS` or application-default Google credentials:

```bash
npm run seed:firestore
```

The seed script writes exams, subjects, chapters, initial NDA questions, the NDA diagnostic test, batches, and testing user profiles. Set `LEDGR_ADMIN_UID`, `LEDGR_ADMIN_EMAIL`, and `LEDGR_ADMIN_NAME` before seeding the real admin profile.
