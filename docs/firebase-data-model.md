# Ledgr Test Firebase Data Model

This repo ships with a demo in-browser state store and Firebase-ready wiring. Add the values from `.env.example` to enable production Auth, Firestore and Storage.

## Collections

- `users`: `uid`, `role`, `name`, `email`, `status`, `batchIds`, `teacherSubjectIds`
- `exams`: exam definitions for NDA, NEET, JEE Main and JEE Advanced
- `subjects`: subject definitions per exam
- `chapters`: chapter definitions per subject
- `questions`: rich question bank with type, stem, options, answer, solution, media refs and dedupe hash
- `imports`: teacher upload/import jobs and parsed question metadata
- `tests`: admin-created mocks/practice sets with timing, visibility, attempt and result-release policies
- `attempts`: student responses, score, analytics and integrity events
- `batches`: optional student groups and assigned tests
- `flags`: question-quality reports and duplicate/correction requests

## Import Strategy

The v1 app uses a rules-first parser for pasted text, DOCX and selectable-text PDFs. Scanned PDFs are detected and should be handled by manual OCR before import. Optional AI cleanup can be added later behind an admin-controlled cost switch.
