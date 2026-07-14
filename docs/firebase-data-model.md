# Ledgr Test Firebase Data Model

This repo ships with Firebase-backed Auth/Firestore/Storage wiring plus a local `/dev-demo` fallback. Add the values from `.env.example` to enable real login testing against the separate Ledgr Test Firebase project.

## Collections

- `users`: `uid`, `role`, `name`, `email`, `status`, `batchIds`, `teacherSubjectIds`
- `exams`: exam definitions for NDA, NEET, JEE Main and JEE Advanced
- `subjects`: subject definitions per exam
- `chapters`: chapter definitions per subject
- `questions`: rich question bank with type, stem, options, answer, solution, media refs and dedupe hash
- `imports`: teacher upload/import jobs and parsed question metadata
- `tests`: admin-created mocks/practice sets with timing, visibility, attempt and result-release policies
- `attempts`: in-progress drafts, submitted responses, score, analytics and integrity events
- `batches`: optional student groups and assigned tests
- `flags`: question-quality reports and duplicate/correction requests

## Import Strategy

The v1 app uses a rules-first parser for pasted text, DOCX and selectable-text PDFs. Scanned PDFs are detected and should be handled by manual OCR before import. Optional AI cleanup can be added later behind an admin-controlled cost switch.

## Seeding

Run `npm run seed:firestore` after configuring `FIREBASE_PROJECT_ID` or `VITE_FIREBASE_PROJECT_ID`. The script writes:

- exam, subject and chapter taxonomy
- initial NDA question bank
- NDA diagnostic test
- first admin profile from `LEDGR_ADMIN_UID` / `LEDGR_ADMIN_EMAIL`
- optional demo student, approved teacher, pending teacher and batch records

Set `LEDGR_SEED_DEMO_USERS=false` when seeding a clean production beta.

## Runtime behavior

- Real Firebase users load allowed Firestore collections based on role.
- Demo users selected from `/dev-demo` stay local and never write Firestore.
- Students can save and resume `in-progress` attempts; only submitted attempts count against attempt limits.
- Teachers write imports and questions only after approval.
- Admin writes tests, user role/status changes, result exports and full collection views.
