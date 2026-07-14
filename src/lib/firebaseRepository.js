import { getFirebaseServices } from "./firebase.js";
import { mergeRemoteState } from "./appState.js";

function normalizeDoc(docSnapshot) {
  return cleanFirestoreValue({ id: docSnapshot.id, ...docSnapshot.data() });
}

function cleanFirestoreValue(value) {
  if (value?.toDate) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(cleanFirestoreValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cleanFirestoreValue(item)]));
  }
  return value;
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

function sortNewestFirst(items) {
  return [...items].sort((a, b) => String(b.createdAt || b.submittedAt || b.publishedAt || "").localeCompare(String(a.createdAt || a.submittedAt || a.publishedAt || "")));
}

async function readCollection(name, constraints = []) {
  const { db, firestoreModule } = await getFirebaseServices();
  const ref = firestoreModule.collection(db, name);
  const snapshot = await firestoreModule.getDocs(constraints.length ? firestoreModule.query(ref, ...constraints) : ref);
  return snapshot.docs.map(normalizeDoc);
}

async function readCollectionSafely(name, constraints = [], fallback = []) {
  try {
    return await readCollection(name, constraints);
  } catch (error) {
    console.warn(`Ledgr Test could not read ${name}:`, error.message);
    return fallback;
  }
}

async function readOwnUser(user) {
  const { db, firestoreModule } = await getFirebaseServices();
  const snapshot = await firestoreModule.getDoc(firestoreModule.doc(db, "users", user.uid));
  return snapshot.exists() ? normalizeDoc(snapshot) : user;
}

async function readQuestionsForRole(user) {
  const { firestoreModule } = await getFirebaseServices();
  if (user.role === "admin") return readCollectionSafely("questions");

  if (user.role === "teacher" && user.teacherSubjectIds?.length) {
    const chunks = [];
    for (let index = 0; index < user.teacherSubjectIds.length; index += 10) {
      chunks.push(user.teacherSubjectIds.slice(index, index + 10));
    }
    const subjectQuestions = (
      await Promise.all(
        chunks.map((chunk) => readCollectionSafely("questions", [firestoreModule.where("subjectId", "in", chunk)]))
      )
    ).flat();
    const publishedQuestions = await readCollectionSafely("questions", [firestoreModule.where("status", "==", "published")]);
    return Array.from(new Map([...subjectQuestions, ...publishedQuestions].map((question) => [question.id, question])).values());
  }

  return readCollectionSafely("questions", [firestoreModule.where("status", "==", "published")]);
}

export async function loadFirestoreState(user) {
  const { firestoreModule } = await getFirebaseServices();
  const isAdmin = user.role === "admin";
  const isStudent = user.role === "student";
  const isTeacher = user.role === "teacher";

  const [questions, tests, attempts, imports, users, batches, flags] = await Promise.all([
    readQuestionsForRole(user),
    isAdmin ? readCollectionSafely("tests") : readCollectionSafely("tests", [firestoreModule.where("status", "==", "published")]),
    isAdmin
      ? readCollectionSafely("attempts")
      : isStudent
        ? readCollectionSafely("attempts", [firestoreModule.where("studentUid", "==", user.uid)])
        : [],
    isAdmin
      ? readCollectionSafely("imports")
      : isTeacher
        ? readCollectionSafely("imports", [firestoreModule.where("createdBy", "==", user.uid)])
        : [],
    isAdmin ? readCollectionSafely("users") : [await readOwnUser(user)],
    isAdmin
      ? readCollectionSafely("batches")
      : isStudent
        ? readCollectionSafely("batches", [firestoreModule.where("studentIds", "array-contains", user.uid)])
        : [],
    isAdmin ? readCollectionSafely("flags") : []
  ]);

  return mergeRemoteState(
    {
      questions,
      tests,
      attempts: sortNewestFirst(attempts),
      imports: sortNewestFirst(imports),
      users,
      batches,
      flags: sortNewestFirst(flags)
    },
    user
  );
}

export async function publishQuestionsToFirestore(questions, importRecord) {
  const { db, firestoreModule } = await getFirebaseServices();
  const batch = firestoreModule.writeBatch(db);

  questions.forEach((question) => {
    batch.set(firestoreModule.doc(db, "questions", question.id), stripUndefined(question), { merge: true });
  });
  batch.set(firestoreModule.doc(db, "imports", importRecord.id), stripUndefined(importRecord), { merge: true });
  await batch.commit();
}

export async function upsertAttemptInFirestore(attempt) {
  const { db, firestoreModule } = await getFirebaseServices();
  await firestoreModule.setDoc(firestoreModule.doc(db, "attempts", attempt.id), stripUndefined(attempt), { merge: true });
}

export async function createTestInFirestore(test) {
  const { db, firestoreModule } = await getFirebaseServices();
  await firestoreModule.setDoc(firestoreModule.doc(db, "tests", test.id), stripUndefined(test), { merge: true });
}

export async function updateUserInFirestore(uid, patch) {
  const { db, firestoreModule } = await getFirebaseServices();
  await firestoreModule.setDoc(firestoreModule.doc(db, "users", uid), stripUndefined(patch), { merge: true });
}

export async function addFlagToFirestore(flag) {
  const { db, firestoreModule } = await getFirebaseServices();
  await firestoreModule.setDoc(firestoreModule.doc(db, "flags", flag.id), stripUndefined(flag), { merge: true });
}
