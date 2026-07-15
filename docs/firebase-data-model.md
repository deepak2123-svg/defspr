# Ledgr Test Firebase Data Model

This repo ships with Firebase-backed Auth/Firestore/Storage wiring plus a local `/dev-demo` fallback. Add the values from `.env.example` to enable real login testing against the separate Ledgr Test Firebase project.

## Collections

- `users`: `uid`, current `role`, `name`, `email`, `status`, legacy student/teacher fields, `memberships`, `scopeKeys`
- `memberships`: `userId`, `role`, `scopeType`, `groupId`, `instituteId`, `status`, optional `inviteToken`
- `instituteGroups`: group clients such as ZEE with `name`, `code`, `status` and timestamps
- `institutes`: standalone institutes or institutes under a group, with contact/location metadata
- `invites`: single-use, 24-hour admin invite tokens for Super Admin, Group Admin and Institute Admin access
- `billingAccounts`: group pooled credits or standalone institute credit accounts
- `creditLedger`: manual purchase, adjustment, activation and refund entries
- `platformSettings`: global settings such as one-price `pricing`
- `auditLogs`: important Super Admin actions including client, invite, credit and scope changes
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
- first Super Admin membership and `scopeKeys`
- sample institute group, institutes, billing accounts, credit ledger, pricing and audit data
- optional demo student, approved teacher, pending teacher and batch records

Set `LEDGR_SEED_DEMO_USERS=false` when seeding a clean production beta.

## Runtime behavior

- Real Firebase users load allowed Firestore collections based on memberships and organization scope.
- Demo users selected from `/dev-demo` stay local and never write Firestore.
- Real Student/Teacher/Admin portal access is invite-only; normal sign-in requires an existing profile.
- Admin invite links are claimed at `/invite/:token` after login/signup and immediately attach the invited membership.
- Super Admin manages groups, institutes, admin invites, global pricing, manual credit ledger and audit logs.
- Students can save and resume `in-progress` attempts; only submitted attempts count against attempt limits.
- Teachers write imports and questions only after approval.
- Legacy `admin` profiles are normalized to `super_admin` for demo/backward compatibility.
