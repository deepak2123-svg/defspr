import React, { useMemo, useState } from "react";
import { roles } from "../data/catalog.js";
import { signInWithEmail, signUpWithEmail } from "../lib/firebase.js";
import { normalizeUserProfile } from "../lib/access.js";
import { canReadInstitute, getPrimaryAdminMembership, isSuperAdmin } from "../lib/memberships.js";
import {
  getInviteStatus,
  makeId,
  parseInstituteCsv,
  summarizeBillingAccounts
} from "../lib/superAdmin.js";

const blankGroup = { name: "", code: "" };
const blankInstitute = {
  name: "",
  code: "",
  city: "",
  state: "",
  address: "",
  contactName: "",
  contactPhone: "",
  contactEmail: ""
};

const superAdminModules = [
  { id: "dashboard", label: "Overview", icon: "dashboard" },
  { id: "clients", label: "Clients", icon: "clients" },
  { id: "invites", label: "Invites", icon: "invites" },
  { id: "billing", label: "Billing", icon: "billing" },
  { id: "audit", label: "Audit", icon: "audit" }
];

const iconPaths = {
  dashboard: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>
  ),
  clients: (
    <>
      <circle cx="8" cy="8" r="3" />
      <circle cx="16" cy="8" r="3" />
      <path d="M3.5 19c.8-3.2 2.5-5 4.5-5s3.7 1.8 4.5 5" />
      <path d="M11.5 19c.8-3.2 2.5-5 4.5-5s3.7 1.8 4.5 5" />
    </>
  ),
  invites: (
    <>
      <rect x="4" y="5" width="16" height="13" rx="2" />
      <path d="m5 7 7 6 7-6" />
    </>
  ),
  billing: (
    <>
      <rect x="5" y="4" width="14" height="16" rx="2" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      <path d="M8 16h4" />
    </>
  ),
  audit: (
    <>
      <path d="M9 5h6" />
      <path d="M9 9h6" />
      <path d="M9 13h3" />
      <path d="M6 5h.01" />
      <path d="M6 9h.01" />
      <path d="M6 13h.01" />
      <path d="M17 17l3 3" />
      <circle cx="15" cy="15" r="3" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="5" />
      <path d="m15 15 4 4" />
    </>
  ),
  signout: (
    <>
      <path d="M10 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4" />
      <path d="M15 8l4 4-4 4" />
      <path d="M8 12h11" />
    </>
  )
};

function RailIcon({ name }) {
  return (
    <svg className="admin-module-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {iconPaths[name]}
    </svg>
  );
}

function getInitials(user) {
  const source = user?.name || user?.email || "Ledgr Admin";
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "LA";
}

function buildClientRows(state, billing) {
  const billingByInstitute = new Map(billing.filter((account) => account.instituteId).map((account) => [account.instituteId, account]));
  const groups = new Map(state.instituteGroups.map((group) => [group.id, group]));
  return state.institutes.map((institute) => {
    const account = billingByInstitute.get(institute.id);
    const purchased = Number(account?.purchasedCredits || 0);
    const remaining = Number(account?.remainingCredits || 0);
    const used = Math.max(0, purchased - remaining);
    const completion = purchased ? Math.round((used / purchased) * 100) : 0;
    const group = institute.groupId ? groups.get(institute.groupId) : null;
    return {
      id: institute.id,
      name: institute.name,
      meta: [institute.city || group?.name || "Setup pending", institute.status || "active"].filter(Boolean).join(" · "),
      used,
      purchased,
      completion
    };
  });
}

function normalizeAdminState(state = {}) {
  return {
    ...state,
    users: Array.isArray(state.users) ? state.users : [],
    instituteGroups: Array.isArray(state.instituteGroups) ? state.instituteGroups : [],
    institutes: Array.isArray(state.institutes) ? state.institutes : [],
    invites: Array.isArray(state.invites) ? state.invites : [],
    billingAccounts: Array.isArray(state.billingAccounts) ? state.billingAccounts : [],
    creditLedger: Array.isArray(state.creditLedger) ? state.creditLedger : [],
    auditLogs: Array.isArray(state.auditLogs) ? state.auditLogs : [],
    platformSettings: state.platformSettings || {}
  };
}

export function SuperAdminPortal({ state, activeUser, actions, adminScope }) {
  const adminState = useMemo(() => normalizeAdminState(state), [state]);
  const superAdmin = isSuperAdmin(activeUser);
  const [tab, setTab] = useState("dashboard");
  const [clientSearch, setClientSearch] = useState("");
  const billing = useMemo(() => summarizeBillingAccounts(adminState.billingAccounts, adminState.creditLedger), [adminState.billingAccounts, adminState.creditLedger]);
  const activeModule = superAdminModules.find((module) => module.id === tab) || superAdminModules[0];
  const clientRows = useMemo(() => buildClientRows(adminState, billing), [adminState, billing]);
  const visibleClientRows = clientRows.filter((row) => `${row.name} ${row.meta}`.toLowerCase().includes(clientSearch.trim().toLowerCase())).slice(0, 18);
  const teacherRecordCount = adminState.users.filter((user) => user.role === "teacher").length;

  if (!superAdmin) {
    return <ScopedAdminDashboard state={adminState} activeUser={activeUser} billing={billing} />;
  }

  return (
    <section className="admin-reference-shell">
      <header className="admin-reference-topbar">
        <div className="admin-reference-brand">
          <span className="admin-product-mark">L</span>
          <strong>{activeModule.label}</strong>
        </div>
        <div className="admin-reference-actions">
          <button className="admin-report-button" onClick={() => setTab("audit")}>
            <RailIcon name="billing" />
            <span>Ledgr Report</span>
          </button>
          <span className="admin-avatar">{getInitials(activeUser)}</span>
          <strong className="admin-user-name">{activeUser?.name || "Ledgr Admin"}</strong>
        </div>
      </header>

      <aside className="admin-reference-rail" aria-label="Super Admin modules">
        {superAdminModules.map((module) => (
          <button key={module.id} className={tab === module.id ? "active" : ""} onClick={() => setTab(module.id)} title={module.label}>
            <RailIcon name={module.icon} />
            <strong>{module.label}</strong>
          </button>
        ))}
        <span className="admin-rail-spacer" aria-hidden="true" />
        <button className="admin-rail-action" onClick={actions.signOut} title="Sign out">
          <RailIcon name="signout" />
          <strong>Sign out</strong>
        </button>
      </aside>

      <aside className="admin-client-panel">
        <div className="admin-panel-topline">
          <strong>{adminState.institutes.length} institutes · today</strong>
          <span>{activeModule.label}</span>
        </div>
        <label className="admin-search-box">
          <RailIcon name="search" />
          <input value={clientSearch} onChange={(event) => setClientSearch(event.target.value)} placeholder="Search institutes" />
        </label>
        <div className="admin-panel-chip">Choose an institute to load</div>
        <div className="admin-client-list">
          {visibleClientRows.map((row) => (
            <button className="admin-client-row" key={row.id}>
              <span className="admin-client-dot" />
              <span className="admin-client-copy">
                <strong>{row.name}</strong>
                <small>{row.meta}</small>
              </span>
              <span className="admin-client-count">{row.used}/{row.purchased || 0}</span>
              <span className="admin-client-percent">{row.completion}%</span>
            </button>
          ))}
          {!visibleClientRows.length && <p className="admin-empty-note">No institutes match this scope yet.</p>}
        </div>
      </aside>

      <aside className="admin-context-panel">
        <div className="admin-context-intro">
          <p className="eyebrow">Overview</p>
          <h2>No institute selected</h2>
          <p>Choose an institute from the left to load classes, teachers, and timeline.</p>
        </div>
        <div className="admin-context-cards">
          <Metric label="Institutes" value={filterInstitutes(adminState, adminScope).length} />
          <Metric label="Teacher records" value={teacherRecordCount} />
          <Metric label="Loaded now" value={teacherRecordCount} />
          <Metric label="Detail records" value={adminState.auditLogs.length} />
        </div>
        <button className="admin-context-report" onClick={() => setTab("audit")}>
          <RailIcon name="billing" />
          <span>Open Ledgr Report</span>
        </button>
      </aside>

      <main className="admin-main-panel">
        {tab === "dashboard" && <SuperAdminDashboard state={adminState} adminScope={adminScope} teacherRecordCount={teacherRecordCount} />}
        {tab === "clients" && <ModuleSurface eyebrow="Clients" title="Groups and institutes"><ClientManager state={adminState} actions={actions} /></ModuleSurface>}
        {tab === "invites" && <ModuleSurface eyebrow="Invites" title="Admin invite links"><InviteManager state={adminState} actions={actions} /></ModuleSurface>}
        {tab === "billing" && <ModuleSurface eyebrow="Billing" title="Credit and payment ledger"><BillingManager state={adminState} actions={actions} billing={billing} /></ModuleSurface>}
        {tab === "audit" && <ModuleSurface eyebrow="Audit" title="Important Super Admin actions"><AuditLog state={adminState} /></ModuleSurface>}
      </main>
    </section>
  );
}

function SuperAdminDashboard({ state, adminScope, teacherRecordCount }) {
  const scopedInstitutes = filterInstitutes(state, adminScope);
  const loadedNow = teacherRecordCount;

  return (
    <section className="admin-overview-panel">
      <div className="admin-overview-heading">
        <p className="eyebrow">Overview</p>
        <h1>Admin dashboard</h1>
        <p>No institute is open. Select an institute from the left to load live class and teacher timelines.</p>
      </div>
      <div className="admin-overview-stats">
        <Metric label="Institutes" value={scopedInstitutes.length} tone="blue" />
        <Metric label="Teacher records" value={teacherRecordCount} tone="blue" />
        <Metric label="Loaded now" value={loadedNow} tone="green" />
        <Metric label="Not loaded" value={Math.max(0, teacherRecordCount - loadedNow)} tone="green" />
      </div>
      <section className="admin-start-card">
        <h2>Choose an institute to begin</h2>
        <p>
          The overview stays lightweight on first load. Once you click an institute, Ledgr loads that institute's
          setup, billing, invite, and admin timeline views.
        </p>
      </section>
    </section>
  );
}

function ModuleSurface({ eyebrow, title, children }) {
  return (
    <section className="admin-module-card">
      <div className="admin-overview-heading">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      {children}
    </section>
  );
}

function ClientManager({ state, actions }) {
  const [groupDraft, setGroupDraft] = useState(blankGroup);
  const [standaloneDraft, setStandaloneDraft] = useState(blankInstitute);
  const [groupInstituteDraft, setGroupInstituteDraft] = useState({ ...blankInstitute, groupId: state.instituteGroups[0]?.id || "" });
  const [csvText, setCsvText] = useState("name,code,city,state\nZEE Jaipur,ZEE-JAI,Jaipur,Rajasthan");
  const [csvGroupId, setCsvGroupId] = useState(state.instituteGroups[0]?.id || "");
  const preview = useMemo(() => parseInstituteCsv(csvText, state.institutes, csvGroupId || null), [csvText, state.institutes, csvGroupId]);

  return (
    <div className="admin-grid two">
      <section className="section-panel">
        <p className="eyebrow">Create client</p>
        <h2>Institute group</h2>
        <Field label="Group name"><input value={groupDraft.name} onChange={(event) => setGroupDraft({ ...groupDraft, name: event.target.value })} /></Field>
        <Field label="Code"><input value={groupDraft.code} onChange={(event) => setGroupDraft({ ...groupDraft, code: event.target.value })} /></Field>
        <button className="primary" disabled={!groupDraft.name.trim()} onClick={() => {
          actions.createInstituteGroup(groupDraft);
          setGroupDraft(blankGroup);
        }}>Create group</button>
      </section>

      <section className="section-panel">
        <p className="eyebrow">Standalone client</p>
        <h2>Institute</h2>
        <InstituteFields draft={standaloneDraft} setDraft={setStandaloneDraft} />
        <button className="primary" disabled={!standaloneDraft.name.trim()} onClick={() => {
          actions.createInstitute({ ...standaloneDraft, groupId: null });
          setStandaloneDraft(blankInstitute);
        }}>Create standalone institute</button>
      </section>

      <section className="section-panel">
        <p className="eyebrow">Group branch</p>
        <h2>Add institute under group</h2>
        <Field label="Group">
          <select value={groupInstituteDraft.groupId} onChange={(event) => setGroupInstituteDraft({ ...groupInstituteDraft, groupId: event.target.value })}>
            {state.instituteGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
          </select>
        </Field>
        <InstituteFields draft={groupInstituteDraft} setDraft={setGroupInstituteDraft} />
        <button className="primary" disabled={!groupInstituteDraft.name.trim() || !groupInstituteDraft.groupId} onClick={() => {
          actions.createInstitute(groupInstituteDraft);
          setGroupInstituteDraft({ ...blankInstitute, groupId: groupInstituteDraft.groupId });
        }}>Add institute</button>
      </section>

      <section className="section-panel">
        <p className="eyebrow">CSV import</p>
        <h2>Import group institutes</h2>
        <Field label="Group">
          <select value={csvGroupId} onChange={(event) => setCsvGroupId(event.target.value)}>
            {state.instituteGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
          </select>
        </Field>
        <Field label="CSV">
          <textarea rows={7} value={csvText} onChange={(event) => setCsvText(event.target.value)} />
        </Field>
        <p className="muted">{preview.valid.length} valid, {preview.duplicates.length} duplicate, {preview.invalid.length} invalid row(s).</p>
        <button className="primary" disabled={!preview.valid.length || !csvGroupId} onClick={() => actions.importInstitutes(csvGroupId, preview.valid.map((row) => row.institute))}>
          Import valid institutes
        </button>
      </section>
    </div>
  );
}

function InviteManager({ state, actions }) {
  const [draft, setDraft] = useState({ role: "group_admin", scopeType: "group", groupId: state.instituteGroups[0]?.id || "", instituteId: "" });
  const inviteLink = (invite) => `${window.location.origin}/invite/${invite.id}`;

  function updateRole(role) {
    const scopeType = role === "super_admin" ? "platform" : role === "group_admin" ? "group" : "institute";
    setDraft({ ...draft, role, scopeType });
  }

  return (
    <div className="admin-grid two">
      <section className="section-panel">
        <p className="eyebrow">Admin invite</p>
        <h2>Generate 24-hour link</h2>
        <Field label="Role">
          <select value={draft.role} onChange={(event) => updateRole(event.target.value)}>
            <option value="super_admin">Super Admin</option>
            <option value="group_admin">Group Admin</option>
            <option value="institute_admin">Institute Admin</option>
          </select>
        </Field>
        {draft.scopeType === "group" && (
          <Field label="Group">
            <select value={draft.groupId} onChange={(event) => setDraft({ ...draft, groupId: event.target.value })}>
              {state.instituteGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
            </select>
          </Field>
        )}
        {draft.scopeType === "institute" && (
          <Field label="Institute">
            <select value={draft.instituteId} onChange={(event) => {
              const institute = state.institutes.find((item) => item.id === event.target.value);
              setDraft({ ...draft, instituteId: event.target.value, groupId: institute?.groupId || null });
            }}>
              <option value="">Choose institute</option>
              {state.institutes.map((institute) => <option key={institute.id} value={institute.id}>{institute.name}</option>)}
            </select>
          </Field>
        )}
        <button className="primary" onClick={() => actions.createInvite(draft)}>Create invite link</button>
      </section>

      <section className="section-panel">
        <p className="eyebrow">Invite links</p>
        <h2>Single-use admin invites</h2>
        <div className="mini-table">
          {state.invites.map((invite) => (
            <div className="mini-row stacked" key={invite.id}>
              <strong>{roles[invite.role]?.label || invite.role} · {getInviteStatus(invite)}</strong>
              <span>{inviteScopeLabel(invite, state)} · expires {formatDate(invite.expiresAt)}</span>
              <div className="inline-actions">
                <button className="ghost" onClick={() => navigator.clipboard?.writeText(inviteLink(invite))}>Copy link</button>
                {getInviteStatus(invite) === "active" && <button className="ghost danger-text" onClick={() => actions.revokeInvite(invite.id)}>Revoke</button>}
              </div>
            </div>
          ))}
          {!state.invites.length && <p className="muted">No invites created yet.</p>}
        </div>
      </section>
    </div>
  );
}

function BillingManager({ state, actions, billing }) {
  const [price, setPrice] = useState(state.platformSettings?.pricing?.pricePerStudent || 149);
  const [creditDraft, setCreditDraft] = useState({
    billingAccountId: billing[0]?.id || "",
    quantity: 100,
    amount: 14900,
    paymentReference: "",
    validityStart: "2026-04-01",
    validityEnd: "2027-03-31",
    note: ""
  });

  return (
    <div className="admin-grid two">
      <section className="section-panel">
        <p className="eyebrow">Global price</p>
        <h2>One price only</h2>
        <Field label="Rs per active student/session">
          <input type="number" value={price} onChange={(event) => setPrice(event.target.value)} />
        </Field>
        <button className="primary" onClick={() => actions.savePricing(Number(price))}>Save global price</button>
        <p className="muted">Current: Rs {state.platformSettings?.pricing?.pricePerStudent || 0} per active student/session.</p>
      </section>

      <section className="section-panel">
        <p className="eyebrow">Manual ledger</p>
        <h2>Add prepaid credits</h2>
        <Field label="Billing account">
          <select value={creditDraft.billingAccountId} onChange={(event) => setCreditDraft({ ...creditDraft, billingAccountId: event.target.value })}>
            {billing.map((account) => <option key={account.id} value={account.id}>{billingOwnerLabel(account, state)}</option>)}
          </select>
        </Field>
        <div className="two-col-form">
          <Field label="Credits"><input type="number" value={creditDraft.quantity} onChange={(event) => setCreditDraft({ ...creditDraft, quantity: event.target.value })} /></Field>
          <Field label="Amount"><input type="number" value={creditDraft.amount} onChange={(event) => setCreditDraft({ ...creditDraft, amount: event.target.value })} /></Field>
        </div>
        <div className="two-col-form">
          <Field label="Valid from"><input type="date" value={creditDraft.validityStart} onChange={(event) => setCreditDraft({ ...creditDraft, validityStart: event.target.value })} /></Field>
          <Field label="Valid until"><input type="date" value={creditDraft.validityEnd} onChange={(event) => setCreditDraft({ ...creditDraft, validityEnd: event.target.value })} /></Field>
        </div>
        <Field label="Payment reference"><input value={creditDraft.paymentReference} onChange={(event) => setCreditDraft({ ...creditDraft, paymentReference: event.target.value })} /></Field>
        <button className="primary" disabled={!creditDraft.billingAccountId} onClick={() => actions.addCreditPurchase(creditDraft)}>Add credits</button>
      </section>

      <section className="section-panel wide-panel">
        <p className="eyebrow">Balances</p>
        <h2>Credits left</h2>
        <div className="mini-table">
          {billing.map((account) => (
            <div className="mini-row" key={account.id}>
              <strong>{billingOwnerLabel(account, state)}</strong>
              <span>{account.remainingCredits} left · {account.usedCredits} used · valid until {account.validityEnd || "not set"}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function AuditLog({ state }) {
  return (
    <section className="section-panel">
      <p className="eyebrow">Audit log</p>
      <h2>Important Super Admin actions</h2>
      <div className="mini-table">
        {state.auditLogs.map((entry) => (
          <div className="mini-row stacked" key={entry.id}>
            <strong>{entry.action}</strong>
            <span>{entry.actorName} · {entry.targetType}/{entry.targetId} · {formatDate(entry.createdAt)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ScopedAdminDashboard({ state, activeUser, billing }) {
  const membership = getPrimaryAdminMembership(activeUser);
  const groups = membership?.role === "group_admin"
    ? state.instituteGroups.filter((group) => group.id === membership.groupId)
    : [];
  const institutes = state.institutes.filter((institute) => canReadInstitute(activeUser, institute));
  const visibleBilling = billing.filter((account) => {
    if (membership?.role === "group_admin") return account.groupId === membership.groupId;
    if (membership?.role === "institute_admin") {
      const institute = institutes.find((item) => item.id === membership.instituteId);
      return account.instituteId === membership.instituteId || (institute?.groupId && account.groupId === institute.groupId);
    }
    return false;
  });

  return (
    <section className="page-block">
      <div className="portal-title">
        <div>
          <p className="eyebrow">{roles[membership?.role]?.label || "Admin"} scope</p>
          <h1>{membership?.role === "group_admin" ? groups[0]?.name || "Group dashboard" : institutes[0]?.name || "Institute dashboard"}</h1>
          <p>Minimal scoped dashboard. Full group/institute workflows come in the next milestone.</p>
        </div>
      </div>
      <div className="metric-strip">
        <Metric label="Groups" value={groups.length} />
        <Metric label="Institutes" value={institutes.length} />
        <Metric label="Credits left" value={visibleBilling.reduce((sum, account) => sum + Number(account.remainingCredits || 0), 0)} />
      </div>
      <section className="section-panel">
        <h2>Visible institutes</h2>
        <div className="mini-table">
          {institutes.map((institute) => <div className="mini-row" key={institute.id}><strong>{institute.name}</strong><span>{institute.city || "city pending"}</span></div>)}
        </div>
      </section>
    </section>
  );
}

export function InviteClaim({ token, state, activeUser, actions }) {
  const invite = state.invites.find((item) => item.id === token || item.token === token);
  const status = getInviteStatus(invite);
  const [mode, setMode] = useState("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function authenticateAndClaim() {
    if (!invite || status !== "active") return;
    try {
      let profile = activeUser;
      if (!profile) {
        if (!email || !password) {
          setMessage("Enter an email and password to continue.");
          return;
        }
        const result = mode === "signup"
          ? await signUpWithEmail(email, password, name, invite.role, { createIfMissing: true })
          : await signInWithEmail(email, password, invite.role, { createIfMissing: false });
        profile = normalizeUserProfile(result.profile || result.user, invite.role);
      }
      const result = actions.claimInvite(invite.id, profile);
      if (result?.ok) actions.navigate("/admin");
      else setMessage(`Invite could not be claimed: ${result?.reason || "unknown"}.`);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="login-page">
      <div className="login-hero admin-login">
        <p className="eyebrow">Admin invite</p>
        <h1>Claim your Ledgr admin access.</h1>
        <p className="lede">This link is single-use and valid for 24 hours.</p>
      </div>
      <section className="section-panel">
        {!invite ? (
          <p className="notice">This invite link does not exist.</p>
        ) : status !== "active" ? (
          <p className="notice">This invite is {status}. Ask Super Admin for a fresh link.</p>
        ) : (
          <>
            <div className="section-head">
              <div>
                <p className="eyebrow">{roles[invite.role]?.label || invite.role}</p>
                <h2>{inviteScopeLabel(invite, state)}</h2>
              </div>
              {!activeUser && (
                <div className="segmented-control">
                  <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Sign up</button>
                  <button className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>Sign in</button>
                </div>
              )}
            </div>
            {activeUser ? (
              <p>Claim this invite as <strong>{activeUser.name}</strong> ({activeUser.email}).</p>
            ) : (
              <div className="auth-grid">
                {mode === "signup" && <Field label="Name"><input value={name} onChange={(event) => setName(event.target.value)} /></Field>}
                <Field label="Email"><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></Field>
                <Field label="Password"><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></Field>
              </div>
            )}
            <button className="primary" onClick={authenticateAndClaim}>Claim admin access</button>
            {message && <p className="notice">{message}</p>}
          </>
        )}
      </section>
    </section>
  );
}

function InstituteFields({ draft, setDraft }) {
  return (
    <>
      <Field label="Name"><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></Field>
      <div className="two-col-form">
        <Field label="Code"><input value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value })} /></Field>
        <Field label="City"><input value={draft.city} onChange={(event) => setDraft({ ...draft, city: event.target.value })} /></Field>
      </div>
      <Field label="State"><input value={draft.state} onChange={(event) => setDraft({ ...draft, state: event.target.value })} /></Field>
    </>
  );
}

function Metric({ label, value, tone = "" }) {
  return (
    <div className={`metric${tone ? ` ${tone}` : ""}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function filterGroups(state, scope) {
  if (scope?.scopeType === "group") return state.instituteGroups.filter((group) => group.id === scope.groupId);
  if (scope?.scopeType === "institute") {
    const institute = state.institutes.find((item) => item.id === scope.instituteId);
    return state.instituteGroups.filter((group) => group.id === institute?.groupId);
  }
  return state.instituteGroups;
}

function filterInstitutes(state, scope) {
  if (scope?.scopeType === "group") return state.institutes.filter((institute) => institute.groupId === scope.groupId);
  if (scope?.scopeType === "institute") return state.institutes.filter((institute) => institute.id === scope.instituteId);
  return state.institutes;
}

function filterBilling(state, scope, billing) {
  if (scope?.scopeType === "group") return billing.filter((account) => account.groupId === scope.groupId);
  if (scope?.scopeType === "institute") {
    const institute = state.institutes.find((item) => item.id === scope.instituteId);
    return billing.filter((account) => account.instituteId === scope.instituteId || account.groupId === institute?.groupId);
  }
  return billing;
}

function billingOwnerLabel(account, state) {
  if (account.ownerType === "group") return state.instituteGroups.find((group) => group.id === account.groupId)?.name || "Group billing";
  return state.institutes.find((institute) => institute.id === account.instituteId)?.name || "Institute billing";
}

function inviteScopeLabel(invite, state) {
  if (invite.scopeType === "platform") return "All Ledgr";
  if (invite.scopeType === "group") return state.instituteGroups.find((group) => group.id === invite.groupId)?.name || "Selected group";
  return state.institutes.find((institute) => institute.id === invite.instituteId)?.name || "Selected institute";
}

function formatDate(value) {
  if (!value) return "not set";
  return new Date(value).toLocaleDateString();
}

export function buildGroupFromDraft(draft, actor) {
  const now = new Date().toISOString();
  return {
    id: makeId("group", draft.name),
    name: draft.name.trim(),
    code: draft.code.trim(),
    status: "active",
    createdAt: now,
    updatedAt: now,
    createdBy: actor?.uid || "system"
  };
}

export function buildInstituteFromDraft(draft, actor) {
  const now = new Date().toISOString();
  return {
    id: makeId("inst", draft.name),
    groupId: draft.groupId || null,
    name: draft.name.trim(),
    code: draft.code?.trim() || "",
    city: draft.city?.trim() || "",
    state: draft.state?.trim() || "",
    address: draft.address?.trim() || "",
    contactName: draft.contactName?.trim() || "",
    contactPhone: draft.contactPhone?.trim() || "",
    contactEmail: draft.contactEmail?.trim() || "",
    status: "active",
    createdAt: now,
    updatedAt: now,
    createdBy: actor?.uid || "system"
  };
}
