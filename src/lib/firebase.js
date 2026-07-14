const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);
export const useFirebaseEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";

let cachedServices = null;
let emulatorsConnected = false;

export async function getFirebaseServices() {
  if (!isFirebaseConfigured) throw new Error("Firebase is not configured. Add the VITE_FIREBASE_* values from .env.example.");
  if (cachedServices) return cachedServices;

  const [{ initializeApp, getApps }, authModule, firestoreModule, storageModule] = await Promise.all([
    import("firebase/app"),
    import("firebase/auth"),
    import("firebase/firestore"),
    import("firebase/storage")
  ]);

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  const auth = authModule.getAuth(app);
  const db = firestoreModule.getFirestore(app);
  const storage = storageModule.getStorage(app);

  if (useFirebaseEmulators && !emulatorsConnected) {
    authModule.connectAuthEmulator(auth, import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL || "http://127.0.0.1:9099", {
      disableWarnings: true
    });
    firestoreModule.connectFirestoreEmulator(
      db,
      import.meta.env.VITE_FIRESTORE_EMULATOR_HOST || "127.0.0.1",
      Number(import.meta.env.VITE_FIRESTORE_EMULATOR_PORT || 8080)
    );
    storageModule.connectStorageEmulator(
      storage,
      import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_HOST || "127.0.0.1",
      Number(import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_PORT || 9199)
    );
    emulatorsConnected = true;
  }

  cachedServices = { app, auth, db, storage, authModule, firestoreModule, storageModule };
  return cachedServices;
}

export async function signInWithGoogle(fallbackRole = "student") {
  const { auth, authModule } = await getFirebaseServices();
  const provider = new authModule.GoogleAuthProvider();
  const credential = await authModule.signInWithPopup(auth, provider);
  const profile = await ensureUserProfile(credential.user, fallbackRole);
  return { user: credential.user, profile };
}

export async function signInWithEmail(email, password, fallbackRole = "student") {
  const { auth, authModule } = await getFirebaseServices();
  const credential = await authModule.signInWithEmailAndPassword(auth, email, password);
  const profile = await ensureUserProfile(credential.user, fallbackRole);
  return { user: credential.user, profile };
}

export async function signUpWithEmail(email, password, name, fallbackRole = "student") {
  const { auth, authModule } = await getFirebaseServices();
  const credential = await authModule.createUserWithEmailAndPassword(auth, email, password);
  const profile = await ensureUserProfile(credential.user, fallbackRole, name);
  return { user: credential.user, profile };
}

export async function listenToAuth(callback) {
  const { auth, authModule } = await getFirebaseServices();
  return authModule.onAuthStateChanged(auth, callback);
}

export async function signOutCurrentUser() {
  const { auth, authModule } = await getFirebaseServices();
  return authModule.signOut(auth);
}

export async function ensureUserProfile(user, fallbackRole = "student", name = "") {
  const { db, firestoreModule } = await getFirebaseServices();
  if (!user) return null;

  const userRef = firestoreModule.doc(firestoreModule.collection(db, "users"), user.uid);
  const snapshot = await firestoreModule.getDoc(userRef);
  if (snapshot.exists()) return snapshot.data();

  const profile = {
    uid: user.uid,
    role: fallbackRole,
    status: fallbackRole === "teacher" ? "pending" : "active",
    name: name || user.displayName || user.email?.split("@")[0] || "Student",
    email: user.email || "",
    batchIds: [],
    teacherSubjectIds: [],
    createdAt: new Date().toISOString()
  };
  await firestoreModule.setDoc(userRef, { ...profile, createdAt: firestoreModule.serverTimestamp() });
  return profile;
}
