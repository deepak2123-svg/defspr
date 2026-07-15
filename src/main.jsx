import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  demoUsers,
  examCatalog,
  firestoreCollections,
  ndaResources,
  roles,
  subjectCatalog
} from "./data/catalog.js";
import { getRoleHome, normalizeUserProfile, portalHome, portalLogin, resolveAccess } from "./lib/access.js";
import { createSeedState, replaceByUid, shouldUseFirestoreData, upsertById } from "./lib/appState.js";
import { isFirebaseConfigured, ensureUserProfile, listenToAuth, signInWithEmail, signInWithGoogle, signOutCurrentUser, signUpWithEmail } from "./lib/firebase.js";
import {
  addFlagToFirestore,
  createTestInFirestore,
  loadFirestoreState,
  publishQuestionsToFirestore,
  updateUserInFirestore,
  upsertAttemptInFirestore
} from "./lib/firebaseRepository.js";
import { extractTextFromFile, parseMcqText } from "./lib/parser.js";
import { canStartAttempt, getTestDurationSeconds, scoreAttempt, shouldShowResult } from "./lib/scoring.js";
import { loadState, saveState } from "./lib/localStore.js";
import "./styles.css";

const STORE_KEY = "ledgr-test-v1";
const USER_KEY = "ledgr-test-user-v2";

function initialState() {
  return loadState(STORE_KEY, createSeedState());
}

function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [activeUser, setActiveUser] = useState(() => loadState(USER_KEY, null));
  const [state, setState] = useState(initialState);
  const [dataStatus, setDataStatus] = useState({ mode: isFirebaseConfigured ? "firebase-ready" : "local", message: "" });
  const remoteDataEnabled = shouldUseFirestoreData(activeUser, isFirebaseConfigured);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => saveState(STORE_KEY, state), [state]);
  useEffect(() => saveState(USER_KEY, activeUser), [activeUser]);

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined;
    let unsubscribe = () => {};
    let cancelled = false;

    listenToAuth(async (firebaseUser) => {
      if (cancelled || !firebaseUser) return;
      try {
        const profile = normalizeUserProfile(await ensureUserProfile(firebaseUser, "student"), "student");
        setActiveUser((current) => current || profile);
      } catch (error) {
        setDataStatus({ mode: "error", message: error.message });
      }
    }).then((listener) => {
      unsubscribe = listener;
    }).catch((error) => {
      setDataStatus({ mode: "error", message: error.message });
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!remoteDataEnabled) {
      setDataStatus({ mode: isFirebaseConfigured ? "local-preview" : "local", message: "" });
      return;
    }

    let cancelled = false;
    setDataStatus({ mode: "loading", message: "Loading Firestore data..." });
    loadFirestoreState(activeUser)
      .then((remoteState) => {
        if (cancelled) return;
        setState(remoteState);
        setDataStatus({ mode: "firebase", message: "Firestore data connected." });
      })
      .catch((error) => {
        if (!cancelled) setDataStatus({ mode: "error", message: error.message });
      });

    return () => {
      cancelled = true;
    };
  }, [activeUser?.uid, activeUser?.role, activeUser?.status, remoteDataEnabled]);

  const navigate = (to) => {
    window.history.pushState({}, "", to);
    setPath(to);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const actions = useMemo(
    () => ({
      setUser: setActiveUser,
      setState,
      navigate,
      publishQuestions(questions, source = "manual") {
        const now = new Date().toISOString();
        const published = questions.map((question, index) => ({
          ...question,
          id: question.id?.startsWith("draft-") ? `q-${Date.now()}-${index}` : question.id,
          status: "published",
          authorUid: activeUser?.uid || "local-preview",
          publishedAt: now
        }));
        const importRecord = {
          id: `import-${Date.now()}`,
          createdBy: activeUser?.uid || "local-preview",
          source,
          status: "published",
          confidence: 1,
          questionCount: published.length,
          createdAt: now
        };
        setState((current) => {
          return {
            ...current,
            questions: [...published, ...current.questions],
            imports: [importRecord, ...current.imports]
          };
        });
        if (remoteDataEnabled) {
          publishQuestionsToFirestore(published, importRecord).catch((error) => setDataStatus({ mode: "error", message: error.message }));
        }
      },
      addFlag(flag) {
        const nextFlag = { id: `flag-${Date.now()}`, createdAt: new Date().toISOString(), ...flag };
        setState((current) => ({
          ...current,
          flags: [nextFlag, ...current.flags]
        }));
        if (remoteDataEnabled) {
          addFlagToFirestore(nextFlag).catch((error) => setDataStatus({ mode: "error", message: error.message }));
        }
      },
      createTest(test) {
        const nextTest = { ...test, id: `test-${Date.now()}`, status: "published", createdAt: new Date().toISOString() };
        setState((current) => ({
          ...current,
          tests: [nextTest, ...current.tests]
        }));
        if (remoteDataEnabled) {
          createTestInFirestore(nextTest).catch((error) => setDataStatus({ mode: "error", message: error.message }));
        }
      },
      saveAttempt(attempt) {
        const nextAttempt = { ...attempt, id: attempt.id || `attempt-${Date.now()}` };
        setState((current) => ({
          ...current,
          attempts: upsertById(current.attempts, nextAttempt)
        }));
        if (remoteDataEnabled) {
          upsertAttemptInFirestore(nextAttempt).catch((error) => setDataStatus({ mode: "error", message: error.message }));
        }
      },
      updateUser(uid, patch) {
        setActiveUser((current) => (current?.uid === uid ? { ...current, ...patch } : current));
        setState((current) => ({
          ...current,
          users: replaceByUid(current.users, uid, patch)
        }));
        if (remoteDataEnabled) {
          updateUserInFirestore(uid, patch).catch((error) => setDataStatus({ mode: "error", message: error.message }));
        }
      },
      async signOut() {
        try {
          if (isFirebaseConfigured) await signOutCurrentUser();
        } finally {
          setActiveUser(null);
          navigate("/");
        }
      }
    }),
    [activeUser?.uid, remoteDataEnabled]
  );

  return (
    <div className="app-shell">
      <TopBar activeUser={activeUser} actions={actions} navigate={navigate} path={path} />
      <main className="app-main">
        <DataStatusBanner dataStatus={dataStatus} />
        {renderRoute(path, { state, activeUser, actions, dataStatus })}
      </main>
    </div>
  );
}

function renderRoute(path, ctx) {
  if (path === "/student-login") return <GatewayLogin key="student-login" gateway="student" {...ctx} />;
  if (path === "/teacher-login") return <GatewayLogin key="teacher-login" gateway="teacher" {...ctx} />;
  if (path === "/admin-login") return <GatewayLogin key="admin-login" gateway="admin" {...ctx} />;
  if (path === "/dev-demo") return <DevDemoGateway {...ctx} />;
  if (path.startsWith("/student/attempt/")) {
    return <GuardedRoute path={path} ctx={ctx}><AttemptRunner testId={path.split("/").pop()} {...ctx} /></GuardedRoute>;
  }
  if (path.startsWith("/student/results/")) {
    return <GuardedRoute path={path} ctx={ctx}><ResultView attemptId={path.split("/").pop()} {...ctx} /></GuardedRoute>;
  }
  if (path === "/student/tests") return <GuardedRoute path={path} ctx={ctx}><StudentTests {...ctx} /></GuardedRoute>;
  if (path === "/student") return <GuardedRoute path={path} ctx={ctx}><StudentDashboard {...ctx} /></GuardedRoute>;
  if (path === "/teacher/import") return <GuardedRoute path={path} ctx={ctx}><TeacherImport {...ctx} /></GuardedRoute>;
  if (path === "/teacher/questions") return <GuardedRoute path={path} ctx={ctx}><TeacherQuestions {...ctx} /></GuardedRoute>;
  if (path === "/teacher") return <GuardedRoute path={path} ctx={ctx}><TeacherDashboard {...ctx} /></GuardedRoute>;
  if (path === "/admin/tests") return <GuardedRoute path={path} ctx={ctx}><AdminTests {...ctx} /></GuardedRoute>;
  if (path === "/admin/results") return <GuardedRoute path={path} ctx={ctx}><AdminResults {...ctx} /></GuardedRoute>;
  if (path === "/admin/users") return <GuardedRoute path={path} ctx={ctx}><AdminUsers {...ctx} /></GuardedRoute>;
  if (path === "/admin") return <GuardedRoute path={path} ctx={ctx}><AdminDashboard {...ctx} /></GuardedRoute>;
  if (path === "/nda/resources") return <NdaResources />;
  return <Landing {...ctx} />;
}

function DataStatusBanner({ dataStatus }) {
  if (!dataStatus?.message || dataStatus.mode === "firebase") return null;
  return (
    <div className={`data-status ${dataStatus.mode === "error" ? "error" : ""}`}>
      <strong>{dataStatus.mode === "error" ? "Data sync needs attention" : "Data status"}</strong>
      <span>{dataStatus.message}</span>
    </div>
  );
}

function TopBar({ activeUser, actions, navigate, path }) {
  const roleHome = getRoleHome(activeUser);
  const roleLabel = roles[activeUser?.role]?.label;

  return (
    <header className="topbar">
      <button className="brand-mark" onClick={() => navigate("/")} aria-label="Ledgr Test home">
        <span>Ledgr</span>
        <strong>Test</strong>
      </button>
      <nav className="topnav" aria-label="Primary">
        {!activeUser && (
          <>
            <button className={path === "/student-login" ? "active" : ""} onClick={() => navigate("/student-login")}>Student Login</button>
            <button className={path === "/teacher-login" ? "active" : ""} onClick={() => navigate("/teacher-login")}>Teacher Login</button>
            <button className={path === "/admin-login" ? "active" : ""} onClick={() => navigate("/admin-login")}>Admin Login</button>
          </>
        )}
        {activeUser && roleHome !== "/" && (
          <button className={path === roleHome || path.startsWith(`${roleHome}/`) ? "active" : ""} onClick={() => navigate(roleHome)}>
            {roleLabel} Portal
          </button>
        )}
        <button className={path === "/nda/resources" ? "active" : ""} onClick={() => navigate("/nda/resources")}>NDA Resources</button>
      </nav>
      {activeUser ? (
        <div className="session-actions">
          <span className="session-chip">
            <strong>{activeUser.name}</strong>
            <small>{roleLabel || activeUser.role} · {activeUser.status}</small>
          </span>
          <button className="ghost" onClick={actions.signOut}>Sign out</button>
        </div>
      ) : (
        <div className="session-actions">
          <span className="session-chip public-session">
            <strong>Choose gateway</strong>
            <small>Student, Teacher or Admin</small>
          </span>
        </div>
      )}
    </header>
  );
}

function Landing({ state, actions }) {
  const liveQuestions = state.questions.filter((question) => question.status === "published").length;
  const publishedTests = state.tests.filter((test) => test.status === "published").length;
  const submittedAttempts = state.attempts.filter(isSubmittedAttempt).length;
  const firebaseLabel = isFirebaseConfigured ? "Firebase connected" : "Firebase pending";
  const bookDemo = () => {
    window.location.href = "https://ledgrclasses.com/mock-tests/#demo";
  };

  return (
    <section className="mock-marketing" aria-labelledby="mock-marketing-title">
      <div className="mock-hero">
        <div className="mock-hero-copy">
          <p className="eyebrow">Ledgr Mock Tests</p>
          <h1 id="mock-marketing-title">Timed practice tests with separate gateways for every role.</h1>
          <p className="lede">
            Students attempt focused NDA, JEE and NEET mocks. Teachers manage the question bank.
            Admins publish tests, control access and review results from their own console.
          </p>
          <div className="hero-actions">
            <button className="primary" onClick={() => actions.navigate("/student-login")}>Student Portal</button>
            <button className="secondary" onClick={() => actions.navigate("/teacher-login")}>Teacher Workspace</button>
            <button className="secondary" onClick={() => actions.navigate("/admin-login")}>Admin Console</button>
            <button className="ghost" onClick={bookDemo}>Book a demo</button>
          </div>
        </div>
        <div className="mock-hero-visual" aria-label="Demo student test dashboard">
          <img src="/assets/mock-tests-student-dashboard.png" alt="Demo Ledgr Mock Tests student dashboard with safe sample NDA data." />
          <span>Demo data</span>
        </div>
      </div>

      <div className="metric-strip mock-metrics">
        <Metric label="Live questions" value={liveQuestions} />
        <Metric label="Published tests" value={publishedTests || state.tests.length} />
        <Metric label="Submitted attempts" value={submittedAttempts} />
        <Metric label="Runtime" value={firebaseLabel} />
      </div>

      <section className="mock-section mock-split">
        <div className="section-panel mock-copy-panel">
          <p className="eyebrow">Question bank to result review</p>
          <h2>One test workflow, three clean access points.</h2>
          <p>
            The public root is only the marketing page. Each role still enters through its own route,
            so student attempts, teacher imports and admin publishing stay separated.
          </p>
          <ul className="mock-proof-list">
            <li>Students see assigned tests, timers, attempts and released analytics.</li>
            <li>Teachers import DOCX, PDF or text questions and review parsed MCQs.</li>
            <li>Admins publish tests, manage users and export results.</li>
          </ul>
        </div>
        <div className="mock-image-panel">
          <img src="/assets/mock-tests-builder-dashboard.png" alt="Demo teacher and admin mock test builder dashboard with safe sample data." />
        </div>
      </section>

      <section className="mock-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Gateways</p>
            <h2>Send each user to the right doorway.</h2>
          </div>
        </div>
        <div className="mock-gateway-grid">
          <button className="mock-gateway-card student-gateway" onClick={() => actions.navigate("/student-login")}>
            <span className="pill">Student Portal</span>
            <h3>Attempt mocks and review released results.</h3>
            <p>Focused test-taking, timers, answer palettes and score summaries for students.</p>
          </button>
          <button className="mock-gateway-card teacher-gateway" onClick={() => actions.navigate("/teacher-login")}>
            <span className="pill">Teacher Workspace</span>
            <h3>Import and maintain exam questions.</h3>
            <p>Teacher accounts can prepare subject banks once approved by the admin team.</p>
          </button>
          <button className="mock-gateway-card admin-gateway" onClick={() => actions.navigate("/admin-login")}>
            <span className="pill">Admin Console</span>
            <h3>Publish tests and control access.</h3>
            <p>Admins manage users, tests, batches and result exports from a restricted route.</p>
          </button>
        </div>
      </section>

      <section className="section-panel mock-cta">
        <div>
          <p className="eyebrow">Demo setup</p>
          <h2>Bring Mock Tests into the Ledgr Classes system.</h2>
          <p>Book a walkthrough from the main Ledgr site, using the same contact flow as the primary landing page.</p>
        </div>
        <button className="primary" onClick={bookDemo}>Book a demo</button>
      </section>
    </section>
  );
}

const gatewayCopy = {
  student: {
    label: "Student",
    eyebrow: "Student gateway",
    title: "Enter your mock-test workspace.",
    body: "Sign in or create a student account to access public NDA tests, assigned batches, timed attempts and released results.",
    home: portalHome.student,
    fallbackRole: "student",
    allowSignup: true,
    signupLabel: "Create student account",
    defaultEmail: "student@example.com"
  },
  teacher: {
    label: "Teacher",
    eyebrow: "Teacher gateway",
    title: "Enter the question-bank workspace.",
    body: "Sign in to import, edit and publish questions. New teacher accounts remain pending until admin approval.",
    home: portalHome.teacher,
    fallbackRole: "teacher",
    allowSignup: true,
    signupLabel: "Request teacher access",
    defaultEmail: "teacher@example.com"
  },
  admin: {
    label: "Admin",
    eyebrow: "Direct admin gateway",
    title: "Admin access is restricted.",
    body: "Use this direct route only with the seeded Ledgr Test admin account. Non-admin accounts are denied.",
    home: portalHome.admin,
    fallbackRole: "student",
    allowSignup: false,
    signupLabel: "",
    defaultEmail: "admin@example.com"
  }
};

function GatewayLogin({ gateway, activeUser, actions }) {
  const config = gatewayCopy[gateway] || gatewayCopy.student;
  const [message, setMessage] = useState("");
  const [portalIssue, setPortalIssue] = useState(null);
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState(config.defaultEmail);
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const activeAccess = activeUser ? resolveAccess(config.home, activeUser) : null;
  const visibleIssue = portalIssue || (activeUser && activeAccess && !activeAccess.allowed ? activeAccess : null);

  function requireFirebase() {
    if (isFirebaseConfigured) return true;
    setMessage("Firebase is not configured yet for this separate Ledgr Test project. Use /dev-demo for local preview only.");
    return false;
  }

  async function finishLogin(profileSource) {
    const profile = normalizeUserProfile(profileSource, config.fallbackRole);

    if (gateway === "admin" && profile.role !== "admin") {
      try {
        if (isFirebaseConfigured) await signOutCurrentUser();
      } catch {
        // The local session is still cleared below so the direct admin route stays locked.
      }
      actions.setUser(null);
      setPortalIssue(null);
      setMessage("Access denied. This account is not a seeded Ledgr Test admin.");
      return;
    }

    actions.setUser(profile);
    const access = resolveAccess(config.home, profile);
    if (access.allowed) {
      actions.navigate(config.home);
      return;
    }
    if (access.reason === "pending-teacher") {
      actions.navigate(config.home);
      return;
    }
    setPortalIssue(access);
    setMessage("");
  }

  async function handleGoogle() {
    if (!requireFirebase()) return;
    try {
      const result = await signInWithGoogle(config.fallbackRole);
      await finishLogin(result.profile || result.user);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleEmail(nextMode = mode) {
    if (!requireFirebase()) return;
    if (!email || !password) {
      setMessage("Enter an email and password to continue.");
      return;
    }
    try {
      const result = nextMode === "signup"
        ? await signUpWithEmail(email, password, name, config.fallbackRole)
        : await signInWithEmail(email, password, config.fallbackRole);
      await finishLogin(result.profile || result.user);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="login-page">
      <div className={`login-hero ${gateway}-login`}>
        <p className="eyebrow">{config.eyebrow}</p>
        <h1>{config.title}</h1>
        <p className="lede">{config.body}</p>
      </div>

      {activeUser && activeAccess?.allowed && (
        <section className="section-panel">
          <p className="eyebrow">Already signed in</p>
          <h2>{activeUser.name}</h2>
          <p>You can continue directly to the {config.label.toLowerCase()} portal.</p>
          <div className="inline-actions">
            <button className="primary" onClick={() => actions.navigate(config.home)}>Continue</button>
            <button className="ghost" onClick={actions.signOut}>Sign out</button>
          </div>
        </section>
      )}

      {visibleIssue?.reason === "pending-teacher" ? (
        <PendingApproval activeUser={activeUser} actions={actions} />
      ) : (
        visibleIssue && <PortalAccessMessage access={visibleIssue} activeUser={activeUser} actions={actions} />
      )}

      <section className="section-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Sign in</p>
            <h2>{config.label} account</h2>
          </div>
          {config.allowSignup && (
            <div className="segmented-control" aria-label="Login mode">
              <button className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>Sign in</button>
              <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Sign up</button>
            </div>
          )}
        </div>
        {!isFirebaseConfigured && (
          <p className="notice">Production login needs Firebase env values for the separate Ledgr Test project. Local demo access is available only at /dev-demo.</p>
        )}
        <div className="auth-grid">
          {mode === "signup" && config.allowSignup && (
            <Field label="Name"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" /></Field>
          )}
          <Field label="Email"><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" /></Field>
          <Field label="Password"><input value={password} onChange={(event) => setPassword(event.target.value)} type="password" /></Field>
          <div className="inline-actions auth-actions">
            <button className="secondary" onClick={handleGoogle}>Google sign in</button>
            <button className="primary" onClick={() => handleEmail(mode)}>{mode === "signup" ? config.signupLabel : "Email sign in"}</button>
          </div>
        </div>
        {gateway === "admin" && <p className="muted">Admin accounts must be created from the seeded admin UID/email in Firestore.</p>}
        {message && <p className="notice">{message}</p>}
      </section>
    </section>
  );
}

function DevDemoGateway({ actions }) {
  return (
    <section className="page-block">
      <PageTitle eyebrow="Developer demo" title="Local preview access only." />
      <section className="section-panel">
        <p>
          This route is intentionally outside the public gateway flow. It exists only for previewing Ledgr Test
          before the separate Firebase project is configured.
        </p>
      </section>
      <div className="gateway-grid demo-grid">
        {demoUsers.map((user) => (
          <button
            className="gateway-card"
            key={user.uid}
            onClick={() => {
              actions.setUser(normalizeUserProfile(user));
              actions.navigate(getRoleHome(user));
            }}
          >
            <span className="pill">{roles[user.role]?.label || user.role}</span>
            <h2>{user.name}</h2>
            <p>{user.email} · {user.status}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function GuardedRoute({ path, ctx, children }) {
  const access = resolveAccess(path, ctx.activeUser);
  if (access.allowed) return children;
  if (access.reason === "not-authenticated") return <AuthRequired access={access} actions={ctx.actions} />;
  if (access.reason === "pending-teacher") return <PendingApproval activeUser={ctx.activeUser} actions={ctx.actions} />;
  if (access.reason === "blocked") return <BlockedAccount activeUser={ctx.activeUser} actions={ctx.actions} />;
  return <PortalAccessMessage access={access} activeUser={ctx.activeUser} actions={ctx.actions} />;
}

function AuthRequired({ access, actions }) {
  const label = roles[access.portal]?.label || "Portal";
  return (
    <section className="page-block">
      <div className="section-panel access-panel">
        <p className="eyebrow">{label} gateway</p>
        <h1>Sign in through the {label.toLowerCase()} gateway.</h1>
        <p>This workspace is protected. Use the correct gateway before continuing.</p>
        <button className="primary" onClick={() => actions.navigate(portalLogin[access.portal])}>Open {label.toLowerCase()} login</button>
      </div>
    </section>
  );
}

function PendingApproval({ activeUser, actions }) {
  return (
    <section className="page-block">
      <div className="section-panel access-panel">
        <p className="eyebrow">Teacher approval pending</p>
        <h1>Your teacher account is waiting for admin approval.</h1>
        <p>{activeUser?.name || "This account"} can sign in, but publishing access opens only after approval.</p>
        <div className="inline-actions">
          <button className="secondary" onClick={() => actions.navigate("/")}>Back to gateways</button>
          <button className="ghost" onClick={actions.signOut}>Sign out</button>
        </div>
      </div>
    </section>
  );
}

function BlockedAccount({ activeUser, actions }) {
  return (
    <section className="page-block">
      <div className="section-panel access-panel">
        <p className="eyebrow">Access blocked</p>
        <h1>This account cannot enter Ledgr Test right now.</h1>
        <p>{activeUser?.email || "The signed-in account"} is marked blocked. Contact the admin before trying again.</p>
        <button className="ghost" onClick={actions.signOut}>Sign out</button>
      </div>
    </section>
  );
}

function PortalAccessMessage({ access, activeUser, actions }) {
  const targetHome = access.roleHome || getRoleHome(activeUser);
  const portalLabel = roles[access.portal]?.label || "this";
  const userLabel = roles[activeUser?.role]?.label || "assigned";
  const isAdminDenial = access.reason === "non-admin";

  return (
    <section className="section-panel access-panel">
      <p className="eyebrow">{isAdminDenial ? "Admin access denied" : "Wrong portal"}</p>
      <h1>{isAdminDenial ? "This direct route is admin-only." : `This is the ${portalLabel.toLowerCase()} portal.`}</h1>
      <p>
        {isAdminDenial
          ? "The signed-in account is not a seeded Ledgr Test admin."
          : `${activeUser?.name || "This account"} belongs to the ${userLabel.toLowerCase()} portal.`}
      </p>
      <div className="inline-actions">
        {targetHome && targetHome !== "/" && <button className="primary" onClick={() => actions.navigate(targetHome)}>Open assigned portal</button>}
        <button className="ghost" onClick={actions.signOut}>Sign out</button>
      </div>
    </section>
  );
}

function StudentDashboard({ state, activeUser, actions }) {
  const visibleTests = getVisibleTests(state.tests, state.batches, activeUser);
  const ownAttempts = state.attempts.filter((attempt) => attempt.studentUid === activeUser.uid && isSubmittedAttempt(attempt));
  const draftAttempts = state.attempts.filter((attempt) => attempt.studentUid === activeUser.uid && isDraftAttempt(attempt));

  return (
    <PortalLayout title="Student Portal" subtitle="Take tests, review attempts and continue NDA practice." role="student" actions={actions}>
      <div className="metric-strip">
        <Metric label="Available tests" value={visibleTests.length} />
        <Metric label="Completed attempts" value={ownAttempts.length} />
        <Metric label="Best score" value={ownAttempts.length ? Math.max(...ownAttempts.map((a) => a.score.score)) : 0} />
        <Metric label="In progress" value={draftAttempts.length} />
      </div>
      <StudentTests state={state} activeUser={activeUser} actions={actions} embedded />
      <RecentAttempts attempts={ownAttempts} actions={actions} />
    </PortalLayout>
  );
}

function StudentTests({ state, activeUser, actions, embedded = false }) {
  const visibleTests = getVisibleTests(state.tests, state.batches, activeUser);
  const attemptsByTest = state.attempts.filter((attempt) => attempt.studentUid === activeUser.uid && isSubmittedAttempt(attempt));

  return (
    <section className={embedded ? "block" : "page-block"}>
      {!embedded && <PageTitle eyebrow="Student tests" title="Choose a mock or practice set." />}
      <div className="test-grid">
        {visibleTests.map((test) => {
          const policy = canStartAttempt({ test, previousAttempts: attemptsByTest });
          const exam = examCatalog[test.examId];
          const draft = state.attempts.find((attempt) => attempt.studentUid === activeUser.uid && attempt.testId === test.id && isDraftAttempt(attempt));
          return (
            <article className="test-card" key={test.id}>
              <span className="pill">{exam?.label || test.examId}</span>
              <h3>{test.title}</h3>
              <p>{test.mode} · {test.visibility} · {describeTiming(test)}</p>
              <p>{describeAttemptPolicy(test)} · results {test.resultRelease.type}</p>
              {draft && <p className="notice">Saved draft from {new Date(draft.updatedAt || draft.startedAt).toLocaleString()}.</p>}
              <button className="primary" disabled={!draft && !policy.allowed} onClick={() => actions.navigate(`/student/attempt/${test.id}`)}>
                {draft ? "Resume test" : policy.allowed ? "Start test" : "Attempt limit reached"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function AttemptRunner({ testId, state, activeUser, actions }) {
  const test = state.tests.find((item) => item.id === testId);
  const questions = test ? hydrateTestQuestions(test, state.questions) : [];
  const existingDraft = state.attempts.find((item) => item.testId === testId && item.studentUid === activeUser.uid && isDraftAttempt(item));
  const durationSeconds = test ? getTestDurationSeconds(test) : null;
  const [attemptId] = useState(existingDraft?.id || `attempt-${Date.now()}`);
  const [startedAt] = useState(existingDraft?.startedAt || new Date().toISOString());
  const [index, setIndex] = useState(existingDraft?.currentIndex || 0);
  const [responses, setResponses] = useState(existingDraft?.responses || {});
  const [marked, setMarked] = useState(existingDraft?.marked || {});
  const [events, setEvents] = useState(existingDraft?.integrityEvents || []);
  const [remaining, setRemaining] = useState(() => {
    if (durationSeconds === null) return null;
    if (typeof existingDraft?.remainingSeconds === "number") return existingDraft.remainingSeconds;
    const elapsedSeconds = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
    return Math.max(0, durationSeconds - elapsedSeconds);
  });

  useEffect(() => {
    if (remaining === null) return undefined;
    const timer = setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          clearInterval(timer);
          submitAttempt("timeout");
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [remaining]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        setEvents((current) => {
          const nextEvents = [...current, { type: "tab-hidden", at: new Date().toISOString() }];
          persistDraft({ nextEvents });
          return nextEvents;
        });
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  if (!test) return <Missing title="Test not found" />;
  if (!questions.length) return <Missing title="This test has no available questions" />;

  const question = questions[index];

  function buildDraft({ nextResponses = responses, nextMarked = marked, nextEvents = events, nextIndex = index } = {}) {
    return {
      id: attemptId,
      testId: test.id,
      studentUid: activeUser.uid,
      status: "in-progress",
      responses: nextResponses,
      marked: nextMarked,
      currentIndex: nextIndex,
      integrityEvents: nextEvents,
      startedAt,
      updatedAt: new Date().toISOString(),
      remainingSeconds: remaining
    };
  }

  function persistDraft(next = {}) {
    if (!test) return;
    actions.saveAttempt(buildDraft(next));
  }

  function updateAnswer(questionId, value) {
    const nextResponses = { ...responses, [questionId]: value };
    setResponses(nextResponses);
    persistDraft({ nextResponses });
  }

  function goToQuestion(nextIndex) {
    setIndex(nextIndex);
    persistDraft({ nextIndex });
  }

  function toggleMarked(questionId) {
    const nextMarked = { ...marked, [questionId]: !marked[questionId] };
    setMarked(nextMarked);
    persistDraft({ nextMarked });
  }

  function submitAttempt(reason = "submitted") {
    const score = scoreAttempt({ test, questions, responses });
    const attempt = {
      id: attemptId,
      testId: test.id,
      studentUid: activeUser.uid,
      status: "submitted",
      responses,
      marked,
      score,
      integrityEvents: events,
      submitReason: reason,
      startedAt,
      submittedAt: new Date().toISOString(),
      remainingSeconds: remaining,
      resultReleased: test.resultRelease.type === "immediate"
    };
    actions.saveAttempt(attempt);
    setTimeout(() => actions.navigate(`/student/results/${attemptId}`), 0);
  }

  return (
    <section className="attempt-layout">
      <aside className="attempt-sidebar">
        <span className="pill">{examCatalog[test.examId]?.label}</span>
        <h2>{test.title}</h2>
        <Timer seconds={remaining} />
        <div className="palette">
          {questions.map((item, itemIndex) => (
            <button
              key={item.id}
              className={`${itemIndex === index ? "active" : ""} ${responses[item.id] ? "answered" : ""} ${marked[item.id] ? "marked" : ""}`}
              onClick={() => goToQuestion(itemIndex)}
            >
              {itemIndex + 1}
            </button>
          ))}
        </div>
        <button className="primary danger" onClick={() => submitAttempt("submitted")}>Submit test</button>
        <p className="muted">{events.length} integrity event(s) logged.</p>
      </aside>
      <section className="question-panel">
        <div className="question-topline">
          <span>Question {index + 1} of {questions.length}</span>
          <button className="ghost" onClick={() => toggleMarked(question.id)}>
            {marked[question.id] ? "Unmark" : "Mark for review"}
          </button>
        </div>
        <RichText html={question.stemHtml} />
        <AnswerControl question={question} value={responses[question.id]} onChange={(value) => updateAnswer(question.id, value)} />
        <div className="question-actions">
          <button className="secondary" disabled={index === 0} onClick={() => goToQuestion(index - 1)}>Previous</button>
          <button className="primary" disabled={index === questions.length - 1} onClick={() => goToQuestion(index + 1)}>Save and next</button>
        </div>
      </section>
    </section>
  );
}

function ResultView({ attemptId, state, activeUser, actions }) {
  const submittedAttempts = state.attempts.filter(isSubmittedAttempt);
  const attempt = submittedAttempts.find((item) => item.id === attemptId) || submittedAttempts[0];
  if (!attempt) return <Missing title="No attempt found" />;
  const test = state.tests.find((item) => item.id === attempt.testId);
  const questions = test ? hydrateTestQuestions(test, state.questions) : [];
  const showResult = test ? shouldShowResult(test, attempt) : true;

  return (
    <section className="page-block">
      <PageTitle eyebrow="Result" title={test?.title || "Attempt result"} />
      {!showResult ? (
        <div className="section-panel"><h2>Result not released yet.</h2><p>Admin controls result release for this test.</p></div>
      ) : (
        <>
          <div className="metric-strip">
            <Metric label="Score" value={`${attempt.score.score}/${attempt.score.maxScore}`} />
            <Metric label="Accuracy" value={`${attempt.score.accuracy}%`} />
            <Metric label="Correct" value={attempt.score.correct} />
            <Metric label="Wrong" value={attempt.score.wrong} />
          </div>
          <div className="review-list">
            {questions.map((question, index) => {
              const response = attempt.responses[question.id];
              return (
                <article className="review-item" key={question.id}>
                  <span className="pill">Q{index + 1}</span>
                  <RichText html={question.stemHtml} />
                  <p>Your answer: <strong>{formatAnswer(response) || "Not attempted"}</strong></p>
                  <p>Correct answer: <strong>{formatAnswer(question.correctAnswer)}</strong></p>
                  <p className="muted">{question.solutionHtml}</p>
                </article>
              );
            })}
          </div>
        </>
      )}
      <button className="secondary" onClick={() => actions.navigate("/student/tests")}>Back to tests</button>
    </section>
  );
}

function TeacherDashboard({ state, activeUser, actions }) {
  const teacherQuestions = getTeacherQuestions(state.questions, activeUser);
  return (
    <PortalLayout title="Teacher Portal" subtitle="Import, review and publish subject-bank questions." role="teacher" actions={actions}>
      <div className="metric-strip">
        <Metric label="Subject-bank questions" value={teacherQuestions.length} />
        <Metric label="Imports" value={state.imports.filter((item) => item.createdBy === activeUser.uid).length} />
        <Metric label="Flags" value={state.flags.length} />
        <Metric label="Status" value={activeUser.status} />
      </div>
      <div className="portal-grid">
        <button className="portal-card" onClick={() => actions.navigate("/teacher/import")}><span>Import</span><strong>Paste text or upload DOCX/PDF.</strong></button>
        <button className="portal-card" onClick={() => actions.navigate("/teacher/questions")}><span>Question bank</span><strong>Review subject-wide published questions.</strong></button>
      </div>
    </PortalLayout>
  );
}

function TeacherImport({ activeUser, actions }) {
  const [defaults, setDefaults] = useState({
    examId: "nda",
    subjectId: "nda-math",
    chapterId: "Algebra",
    difficulty: "medium",
    marks: 4,
    negativeMarks: 1.33,
    authorUid: activeUser.uid
  });
  const [text, setText] = useState(samplePaste);
  const [parsed, setParsed] = useState(null);
  const [message, setMessage] = useState("");

  const subjects = subjectCatalog[defaults.examId] || [];
  const activeSubject = subjects.find((subject) => subject.id === defaults.subjectId) || subjects[0];

  function parseText(value = text) {
    const result = parseMcqText(value, defaults);
    setParsed(result);
    setMessage(`${result.questions.length} question(s) parsed at ${Math.round(result.confidence * 100)}% confidence.`);
  }

  async function handleFile(file) {
    if (!file) return;
    try {
      setMessage(`Reading ${file.name}...`);
      const extracted = await extractTextFromFile(file);
      setText(extracted);
      const result = parseMcqText(extracted, defaults);
      setParsed(result);
      setMessage(`${file.name}: ${result.questions.length} question(s) parsed.`);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="page-block">
      <PageTitle eyebrow="Teacher import" title="Paste or upload MCQs into the subject bank." />
      <div className="import-layout">
        <div className="section-panel">
          <h3>Batch defaults</h3>
          <Field label="Exam">
            <select value={defaults.examId} onChange={(event) => setDefaults({ ...defaults, examId: event.target.value, subjectId: subjectCatalog[event.target.value][0].id })}>
              {Object.values(examCatalog).map((exam) => <option key={exam.id} value={exam.id}>{exam.label}</option>)}
            </select>
          </Field>
          <Field label="Subject">
            <select value={defaults.subjectId} onChange={(event) => setDefaults({ ...defaults, subjectId: event.target.value, chapterId: (subjects.find((s) => s.id === event.target.value)?.chapters[0] || "") })}>
              {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
            </select>
          </Field>
          <Field label="Chapter">
            <select value={defaults.chapterId} onChange={(event) => setDefaults({ ...defaults, chapterId: event.target.value })}>
              {(activeSubject?.chapters || []).map((chapter) => <option key={chapter} value={chapter}>{chapter}</option>)}
            </select>
          </Field>
          <div className="two-col-form">
            <Field label="Marks"><input type="number" value={defaults.marks} onChange={(event) => setDefaults({ ...defaults, marks: Number(event.target.value) })} /></Field>
            <Field label="Negative"><input type="number" value={defaults.negativeMarks} onChange={(event) => setDefaults({ ...defaults, negativeMarks: Number(event.target.value) })} /></Field>
          </div>
        </div>
        <div className="section-panel">
          <h3>Source text or file</h3>
          <textarea value={text} onChange={(event) => setText(event.target.value)} rows={14} />
          <div className="inline-actions">
            <button className="primary" onClick={() => parseText()}>Parse preview</button>
            <label className="file-button">Upload DOCX/PDF/TXT<input type="file" accept=".docx,.pdf,.txt" onChange={(event) => handleFile(event.target.files?.[0])} /></label>
          </div>
          {message && <p className="notice">{message}</p>}
        </div>
      </div>
      {parsed && <ImportPreview parsed={parsed} onPublish={() => actions.publishQuestions(parsed.questions, "teacher-import")} />}
    </section>
  );
}

function ImportPreview({ parsed, onPublish }) {
  return (
    <section className="section-panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">Preview</p>
          <h2>{parsed.questions.length} parsed question(s)</h2>
        </div>
        <button className="primary" disabled={!parsed.questions.length} onClick={onPublish}>Publish parsed questions</button>
      </div>
      {parsed.warnings.length > 0 && <div className="warning-list">{parsed.warnings.map((warning) => <p key={warning}>{warning}</p>)}</div>}
      <div className="review-list">
        {parsed.questions.map((question, index) => (
          <article className="review-item" key={question.id}>
            <span className="pill">Draft {index + 1}</span>
            <RichText html={question.stemHtml} />
            <ol type="A">{question.options.map((option) => <li key={option.id}>{option.text}</li>)}</ol>
            <p>Answer: <strong>{formatAnswer(question.correctAnswer) || "Missing"}</strong></p>
            <p className="muted">{question.solutionHtml || "No explanation detected."}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function TeacherQuestions({ state, activeUser, actions }) {
  const questions = getTeacherQuestions(state.questions, activeUser);
  return (
    <section className="page-block">
      <PageTitle eyebrow="Teacher question bank" title="Subject-wide published questions." />
      <QuestionTable questions={questions} onFlag={(question) => actions.addFlag({ questionId: question.id, createdBy: activeUser.uid, reason: "Teacher review flag", status: "open" })} />
    </section>
  );
}

function AdminDashboard({ state, actions }) {
  return (
    <PortalLayout title="Admin Portal" subtitle="Single-admin control center for tests, users, batches and exports." role="admin" actions={actions}>
      <div className="metric-strip">
        <Metric label="Questions" value={state.questions.length} />
        <Metric label="Tests" value={state.tests.length} />
        <Metric label="Submitted attempts" value={state.attempts.filter(isSubmittedAttempt).length} />
        <Metric label="Flags" value={state.flags.length} />
      </div>
      <div className="schema-grid">
        {firestoreCollections.map((collectionName) => <span key={collectionName}>{collectionName}</span>)}
      </div>
    </PortalLayout>
  );
}

function AdminTests({ state, actions }) {
  const [draft, setDraft] = useState({
    title: "NDA Full Mock - Demo",
    examId: "nda",
    mode: "mock",
    visibility: "public",
    maxAttempts: 1,
    resultRelease: "immediate",
    timingMode: "whole-test",
    durationMinutes: 120,
    selected: state.questions.filter((q) => q.examId === "nda").map((q) => q.id)
  });

  function createTest() {
    const selectedQuestions = draft.selected;
    actions.createTest({
      title: draft.title,
      examId: draft.examId,
      mode: draft.mode,
      visibility: draft.visibility,
      batchIds: [],
      attemptPolicy: { type: "limited", maxAttempts: Number(draft.maxAttempts) },
      resultRelease: { type: draft.resultRelease },
      timing: { mode: draft.timingMode, durationMinutes: Number(draft.durationMinutes) },
      integrity: { tabSwitchWarnings: true, copyPasteWarning: true },
      sections: [{ id: "section-1", title: "Section 1", durationMinutes: draft.timingMode === "section" ? Number(draft.durationMinutes) : null, questionIds: selectedQuestions }],
      createdBy: "admin-demo"
    });
  }

  const questions = state.questions.filter((question) => question.examId === draft.examId && question.status === "published");

  return (
    <section className="page-block">
      <PageTitle eyebrow="Admin test builder" title="Create configurable mocks from the bank." />
      <div className="builder-layout">
        <div className="section-panel">
          <Field label="Test title"><input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></Field>
          <Field label="Exam">
            <select value={draft.examId} onChange={(event) => setDraft({ ...draft, examId: event.target.value, selected: [] })}>
              {Object.values(examCatalog).map((exam) => <option key={exam.id} value={exam.id}>{exam.label}</option>)}
            </select>
          </Field>
          <div className="two-col-form">
            <Field label="Visibility">
              <select value={draft.visibility} onChange={(event) => setDraft({ ...draft, visibility: event.target.value })}>
                <option value="public">Public</option>
                <option value="assigned">Assigned batches</option>
              </select>
            </Field>
            <Field label="Attempts">
              <input type="number" min="1" value={draft.maxAttempts} onChange={(event) => setDraft({ ...draft, maxAttempts: event.target.value })} />
            </Field>
          </div>
          <div className="two-col-form">
            <Field label="Timer mode">
              <select value={draft.timingMode} onChange={(event) => setDraft({ ...draft, timingMode: event.target.value })}>
                <option value="whole-test">Whole test</option>
                <option value="section">Section timer</option>
                <option value="none">No strict timer</option>
              </select>
            </Field>
            <Field label="Minutes">
              <input type="number" value={draft.durationMinutes} onChange={(event) => setDraft({ ...draft, durationMinutes: event.target.value })} />
            </Field>
          </div>
          <Field label="Result release">
            <select value={draft.resultRelease} onChange={(event) => setDraft({ ...draft, resultRelease: event.target.value })}>
              <option value="immediate">Immediate</option>
              <option value="after-window">After test window</option>
              <option value="manual">Manual</option>
            </select>
          </Field>
          <button className="primary" onClick={createTest}>Publish test</button>
        </div>
        <div className="section-panel">
          <h3>Question selection</h3>
          <div className="question-picker">
            {questions.map((question) => (
              <label key={question.id}>
                <input
                  type="checkbox"
                  checked={draft.selected.includes(question.id)}
                  onChange={(event) => {
                    const selected = event.target.checked
                      ? [...draft.selected, question.id]
                      : draft.selected.filter((id) => id !== question.id);
                    setDraft({ ...draft, selected });
                  }}
                />
                <span>{stripText(question.stemHtml).slice(0, 92)}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="test-grid">
        {state.tests.map((test) => <article className="test-card" key={test.id}><span className="pill">{examCatalog[test.examId]?.label}</span><h3>{test.title}</h3><p>{describeTiming(test)} · {describeAttemptPolicy(test)}</p></article>)}
      </div>
    </section>
  );
}

function AdminResults({ state }) {
  const submittedAttempts = state.attempts.filter(isSubmittedAttempt);
  const csv = buildAttemptsCsv(submittedAttempts, state.tests, state.users);
  return (
    <section className="page-block">
      <PageTitle eyebrow="Admin results" title="Attempts, analytics and CSV export." />
      <a className="primary link-button" download="ledgr-test-attempts.csv" href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}>Export CSV</a>
      <div className="review-list">
        {submittedAttempts.map((attempt) => {
          const test = state.tests.find((item) => item.id === attempt.testId);
          const user = state.users.find((item) => item.uid === attempt.studentUid);
          return (
            <article className="review-item" key={attempt.id}>
              <span className="pill">{user?.name || attempt.studentUid}</span>
              <h3>{test?.title || attempt.testId}</h3>
              <p>Score {attempt.score.score}/{attempt.score.maxScore} · Accuracy {attempt.score.accuracy}% · {attempt.submitReason}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function AdminUsers({ state, actions }) {
  return (
    <section className="page-block">
      <PageTitle eyebrow="Admin users" title="Role and status management." />
      <div className="user-table">
        {state.users.map((user) => (
          <article className="user-row" key={user.uid}>
            <div><strong>{user.name}</strong><span>{user.email}</span></div>
            <select value={user.role} onChange={(event) => actions.updateUser(user.uid, { role: event.target.value })}>
              {Object.keys(roles).map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
            <select value={user.status} onChange={(event) => actions.updateUser(user.uid, { status: event.target.value })}>
              <option value="active">active</option>
              <option value="approved">approved</option>
              <option value="pending">pending</option>
              <option value="blocked">blocked</option>
            </select>
          </article>
        ))}
      </div>
    </section>
  );
}

function NdaResources() {
  return (
    <section className="page-block">
      <PageTitle eyebrow="NDA resources" title="Defence Sprouts content lives here now." />
      <div className="resource-grid">
        {ndaResources.map((resource) => (
          <article className="resource-panel" key={resource.title}>
            <h3>{resource.title}</h3>
            <p>{resource.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function PortalLayout({ title, subtitle, role, actions, children }) {
  return (
    <section className="page-block">
      <div className="portal-title">
        <div>
          <p className="eyebrow">{role} workspace</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <div className="inline-actions">
          {role === "student" && <button className="secondary" onClick={() => actions.navigate("/student/tests")}>Tests</button>}
          {role === "teacher" && <button className="secondary" onClick={() => actions.navigate("/teacher/import")}>Import</button>}
          {role === "admin" && <button className="secondary" onClick={() => actions.navigate("/admin/tests")}>Test builder</button>}
        </div>
      </div>
      {children}
    </section>
  );
}

function AnswerControl({ question, value, onChange }) {
  if (question.type === "numeric") {
    return <input className="numeric-answer" placeholder="Enter numeric answer" value={value || ""} onChange={(event) => onChange(event.target.value)} />;
  }

  if (question.type === "multiple") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="option-list">
        {question.options.map((option) => (
          <label key={option.id}>
            <input
              type="checkbox"
              checked={selected.includes(option.id)}
              onChange={(event) => {
                const next = event.target.checked ? [...selected, option.id] : selected.filter((item) => item !== option.id);
                onChange(next);
              }}
            />
            <span>{option.id}</span>
            {option.text}
          </label>
        ))}
      </div>
    );
  }

  return (
    <div className="option-list">
      {question.options.map((option) => (
        <label key={option.id}>
          <input type="radio" name={question.id} checked={value === option.id} onChange={() => onChange(option.id)} />
          <span>{option.id}</span>
          {option.text}
        </label>
      ))}
    </div>
  );
}

function RichText({ html }) {
  return <div className="rich-text" dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />;
}

function sanitizeHtml(html = "") {
  return String(html)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "");
}

function QuestionTable({ questions, onFlag }) {
  return (
    <div className="question-table">
      {questions.map((question) => (
        <article className="question-row" key={question.id}>
          <span className="pill">{examCatalog[question.examId]?.label}</span>
          <div>
            <strong>{stripText(question.stemHtml)}</strong>
            <p>{question.subjectId} · {question.chapterId} · {question.type} · {question.difficulty}</p>
          </div>
          <button className="ghost" onClick={() => onFlag(question)}>Flag</button>
        </article>
      ))}
    </div>
  );
}

function RecentAttempts({ attempts, actions }) {
  if (!attempts.length) return <section className="section-panel"><h3>No attempts yet</h3><p>Take a public NDA diagnostic to see analytics here.</p></section>;
  return (
    <section className="section-panel">
      <h3>Recent attempts</h3>
      <div className="review-list">
        {attempts.slice(0, 4).map((attempt) => (
          <button className="attempt-row" key={attempt.id} onClick={() => actions.navigate(`/student/results/${attempt.id}`)}>
            <span>{new Date(attempt.submittedAt).toLocaleString()}</span>
            <strong>{attempt.score.score}/{attempt.score.maxScore}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}

function PageTitle({ eyebrow, title }) {
  return (
    <div className="page-title">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function Timer({ seconds }) {
  if (seconds === null) return <div className="timer">Untimed</div>;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return <div className="timer">{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</div>;
}

function Missing({ title }) {
  return <section className="page-block"><div className="section-panel"><h1>{title}</h1><p>Return to a portal and try again.</p></div></section>;
}

function getVisibleTests(tests, batches, user) {
  if (user.role === "admin") return tests;
  return tests.filter((test) => {
    if (test.status !== "published") return false;
    if (test.visibility === "public") return true;
    const assignedBatchIds = batches.filter((batch) => batch.studentIds.includes(user.uid)).map((batch) => batch.id);
    return test.batchIds?.some((batchId) => assignedBatchIds.includes(batchId));
  });
}

function hydrateTestQuestions(test, questions) {
  const byId = new Map(questions.map((question) => [question.id, question]));
  return test.sections.flatMap((section) => section.questionIds.map((id) => byId.get(id)).filter(Boolean));
}

function getTeacherQuestions(questions, user) {
  if (user.role === "admin") return questions;
  const subjects = new Set(user.teacherSubjectIds || []);
  return questions.filter((question) => subjects.has(question.subjectId));
}

function describeTiming(test) {
  if (test.timing?.mode === "none") return "untimed";
  if (test.timing?.mode === "section") return "section timers";
  return `${test.timing?.durationMinutes || 0} min`;
}

function describeAttemptPolicy(test) {
  if (test.attemptPolicy?.type === "unlimited") return "unlimited attempts";
  return `${test.attemptPolicy?.maxAttempts || 1} attempt(s)`;
}

function isSubmittedAttempt(attempt) {
  return attempt?.status === "submitted" || Boolean(attempt?.submittedAt);
}

function isDraftAttempt(attempt) {
  return attempt?.status === "in-progress" && !attempt?.submittedAt;
}

function formatAnswer(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (value === null || value === undefined) return "";
  return String(value);
}

function stripText(value) {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function buildAttemptsCsv(attempts, tests, users) {
  const rows = [["attemptId", "student", "test", "score", "maxScore", "accuracy", "submittedAt"]];
  attempts.forEach((attempt) => {
    rows.push([
      attempt.id,
      users.find((user) => user.uid === attempt.studentUid)?.email || attempt.studentUid,
      tests.find((test) => test.id === attempt.testId)?.title || attempt.testId,
      attempt.score.score,
      attempt.score.maxScore,
      attempt.score.accuracy,
      attempt.submittedAt
    ]);
  });
  return rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
}

const samplePaste = `1. The National Defence Academy is located at which place?
A) Dehradun, Uttarakhand
B) Khadakwasla, Pune
C) Wellington, Tamil Nadu
D) Secunderabad, Telangana
Answer: B
Explanation: NDA is located at Khadakwasla near Pune.

2. Choose the correctly spelled word.
A) Accomodate
B) Acommodate
C) Accommodate
D) Acomodate
Answer: C
Explanation: The correct spelling is accommodate.`;

createRoot(document.getElementById("root")).render(<App />);
