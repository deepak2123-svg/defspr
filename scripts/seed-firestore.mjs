import fs from "node:fs";
import process from "node:process";
import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import {
  demoUsers,
  examCatalog,
  seedBatches,
  seedQuestions,
  seedTests,
  subjectCatalog
} from "../src/data/catalog.js";

loadEnvFile();

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const seedDemoUsers = process.env.LEDGR_SEED_DEMO_USERS !== "false";
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST ||
  (process.env.VITE_USE_FIREBASE_EMULATORS === "true"
    ? `${process.env.VITE_FIRESTORE_EMULATOR_HOST || "127.0.0.1"}:${process.env.VITE_FIRESTORE_EMULATOR_PORT || 8080}`
    : "");

if (!projectId) {
  throw new Error("Set FIREBASE_PROJECT_ID or VITE_FIREBASE_PROJECT_ID before running the seed script.");
}

if (emulatorHost) process.env.FIRESTORE_EMULATOR_HOST = emulatorHost;

const appOptions = { projectId };
if (!emulatorHost) {
  appOptions.credential = serviceAccountPath
    ? cert(JSON.parse(fs.readFileSync(serviceAccountPath, "utf8")))
    : applicationDefault();
}

initializeApp(appOptions);
const db = getFirestore();

const adminUser = {
  uid: process.env.LEDGR_ADMIN_UID || "admin-demo",
  role: "admin",
  status: "active",
  name: process.env.LEDGR_ADMIN_NAME || "Ledgr Test Admin",
  email: process.env.LEDGR_ADMIN_EMAIL || "admin@ledgr.test",
  batchIds: [],
  teacherSubjectIds: []
};

const users = seedDemoUsers
  ? [adminUser, ...demoUsers.filter((user) => user.uid !== "admin-demo")]
  : [adminUser];

const subjects = Object.entries(subjectCatalog).flatMap(([examId, examSubjects]) =>
  examSubjects.map((subject) => ({ ...subject, examId }))
);

const chapters = subjects.flatMap((subject) =>
  subject.chapters.map((chapter) => ({
    id: slug(`${subject.id}-${chapter}`),
    examId: subject.examId,
    subjectId: subject.id,
    name: chapter
  }))
);

await writeDocs("exams", Object.values(examCatalog));
await writeDocs("subjects", subjects);
await writeDocs("chapters", chapters);
await writeDocs("questions", seedQuestions);
await writeDocs("tests", seedTests);
await writeDocs("users", users, "uid");
await writeDocs("batches", seedBatches);

console.log(`Seeded Ledgr Test Firestore project ${projectId}.`);
console.log(`Admin profile: ${adminUser.email} (${adminUser.uid})`);

async function writeDocs(collectionName, docs, idField = "id") {
  let batch = db.batch();
  let pending = 0;

  for (const item of docs) {
    const id = item[idField];
    if (!id) throw new Error(`${collectionName} item is missing ${idField}`);
    batch.set(db.collection(collectionName).doc(id), stripUndefined(item), { merge: true });
    pending += 1;

    if (pending === 400) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }

  if (pending > 0) await batch.commit();
}

function stripUndefined(value) {
  if (Array.isArray(value)) return value.map(stripUndefined);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, stripUndefined(item)])
    );
  }
  return value;
}

function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function loadEnvFile() {
  if (!fs.existsSync(".env")) return;
  const lines = fs.readFileSync(".env", "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (process.env[key]) continue;
    process.env[key] = rest.join("=").replace(/^"|"$/g, "");
  }
}
