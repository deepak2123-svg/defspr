import { getFirebaseServices } from "./firebase.js";
import { mergeRemoteState } from "./appState.js";
import { getActiveMemberships, isSuperAdmin } from "./memberships.js";

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

async function readDocSafely(name, id, fallback = null) {
  try {
    const { db, firestoreModule } = await getFirebaseServices();
    const snapshot = await firestoreModule.getDoc(firestoreModule.doc(db, name, id));
    return snapshot.exists() ? normalizeDoc(snapshot) : fallback;
  } catch (error) {
    console.warn(`Ledgr Test could not read ${name}/${id}:`, error.message);
    return fallback;
  }
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
  const activeMemberships = getActiveMemberships(user);
  const superAdmin = isSuperAdmin(user);
  const adminMembership = activeMemberships.find((membership) => ["super_admin", "group_admin", "institute_admin"].includes(membership.role));
  const isAdmin = superAdmin;
  const isStudent = user.role === "student";
  const isTeacher = user.role === "teacher";
  const groupMemberships = activeMemberships.filter((membership) => membership.role === "group_admin" && membership.groupId);
  const instituteMemberships = activeMemberships.filter((membership) => membership.role === "institute_admin" && membership.instituteId);

  const scopedGroups = superAdmin
    ? readCollectionSafely("instituteGroups")
    : groupMemberships.length
      ? Promise.all(groupMemberships.map((membership) => readDocSafely("instituteGroups", membership.groupId))).then((items) => items.filter(Boolean))
      : [];
  const scopedInstitutes = superAdmin
    ? readCollectionSafely("institutes")
    : groupMemberships.length
      ? Promise.all(groupMemberships.map((membership) => readCollectionSafely("institutes", [firestoreModule.where("groupId", "==", membership.groupId)]))).then((groups) => groups.flat())
      : instituteMemberships.length
        ? Promise.all(instituteMemberships.map((membership) => readDocSafely("institutes", membership.instituteId))).then((items) => items.filter(Boolean))
        : [];

  const [questions, tests, attempts, imports, users, batches, flags, memberships, instituteGroups, institutes, invites, billingAccounts, creditLedger, pricing, auditLogs] = await Promise.all([
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
    isAdmin ? readCollectionSafely("flags") : [],
    superAdmin
      ? readCollectionSafely("memberships")
      : readCollectionSafely("memberships", [firestoreModule.where("userId", "==", user.uid)]),
    scopedGroups,
    scopedInstitutes,
    superAdmin ? readCollectionSafely("invites") : [],
    superAdmin
      ? readCollectionSafely("billingAccounts")
      : adminMembership?.role === "group_admin"
        ? readCollectionSafely("billingAccounts", [firestoreModule.where("groupId", "==", adminMembership.groupId)])
        : adminMembership?.role === "institute_admin"
          ? readCollectionSafely("billingAccounts", [firestoreModule.where("instituteId", "==", adminMembership.instituteId)])
          : [],
    superAdmin ? readCollectionSafely("creditLedger") : [],
    readDocSafely("platformSettings", "pricing"),
    superAdmin ? readCollectionSafely("auditLogs") : []
  ]);

  return mergeRemoteState(
    {
      questions,
      tests,
      attempts: sortNewestFirst(attempts),
      imports: sortNewestFirst(imports),
      users,
      memberships,
      instituteGroups: sortNewestFirst(instituteGroups),
      institutes: sortNewestFirst(institutes),
      invites: sortNewestFirst(invites),
      billingAccounts,
      creditLedger: sortNewestFirst(creditLedger),
      platformSettings: pricing ? { pricing } : undefined,
      auditLogs: sortNewestFirst(auditLogs),
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

export async function upsertDocumentInFirestore(collectionName, item, idField = "id") {
  const { db, firestoreModule } = await getFirebaseServices();
  const id = item?.[idField];
  if (!id) throw new Error(`${collectionName} document is missing ${idField}.`);
  await firestoreModule.setDoc(firestoreModule.doc(db, collectionName, id), stripUndefined(item), { merge: true });
}

export async function upsertDocumentsInFirestore(collectionName, items, idField = "id") {
  const { db, firestoreModule } = await getFirebaseServices();
  const batch = firestoreModule.writeBatch(db);
  items.forEach((item) => {
    const id = item?.[idField];
    if (!id) throw new Error(`${collectionName} document is missing ${idField}.`);
    batch.set(firestoreModule.doc(db, collectionName, id), stripUndefined(item), { merge: true });
  });
  await batch.commit();
}
