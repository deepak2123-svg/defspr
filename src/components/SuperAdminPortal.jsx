import React, { useMemo, useState } from "react";
import { roles } from "../data/catalog.js";
import { signInWithEmail, signUpWithEmail } from "../lib/firebase.js";
import { normalizeUserProfile } from "../lib/access.js";
import { canReadInstitute, getPrimaryAdminMembership, isSuperAdmin } from "../lib/memberships.js";
import {
  getInviteStatus,
  getScopeLabel,
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

export function SuperAdminPortal({ state, activeUser, actions, adminScope }) {
  const superAdmin = isSuperAdmin(activeUser);
  const [tab, setTab] = useState("dashboard");
  const billing = useMemo(() => summarizeBillingAccounts(state.billingAccounts, state.creditLedger), [state.billingAccounts, state.creditLedger]);

  if (!superAdmin) {
    return <ScopedAdminDashboard state={state} activeUser={activeUser} billing={billing} />;
  }

  return (
    <section className="page-block super-admin-page">
      <div className="portal-title super-admin-title">
        <div>
          <p className="eyebrow">Super Admin foundation</p>
          <h1>Ledgr control center</h1>
          <p>Groups, institutes, admin invites, prepaid credits and important audit history.</p>
        </div>
        <ScopeSwitcher state={state} adminScope={adminScope} actions={actions} />
      </div>
      <div className="scope-banner">
        <strong>Current scope:</strong>
        <span>{getScopeLabel(adminScope, state.instituteGroups, state.institutes)}</span>
      </div>
      <div className="segmented-control admin-tabs" aria-label="Super Admin modules">
        {[
          ["dashboard", "Dashboard"],
          ["clients", "Clients"],
          ["invites", "Invites"],
          ["billing", "Billing"],
          ["audit", "Audit"]
        ].map(([id, label]) => (
          <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      {tab === "dashboard" && <SuperAdminDashboard state={state} billing={billing} adminScope={adminScope} />}
      {tab === "clients" && <ClientManager state={state} actions={actions} />}
      {tab === "invites" && <InviteManager state={state} actions={actions} />}
      {tab === "billing" && <BillingManager state={state} actions={actions} billing={billing} />}
      {tab === "audit" && <AuditLog state={state} />}
    </section>
  );
}

function ScopeSwitcher({ state, adminScope, actions }) {
  const value = scopeValue(adminScope);
  const instituteOptions = state.institutes.map((institute) => [scopeValue({ scopeType: "institute", groupId: institute.groupId || null, instituteId: institute.id }), institute.name]);
  return (
    <label className="field compact-field">
      <span>View scope</span>
      <select value={value} onChange={(event) => actions.setAdminScope(parseScopeValue(event.target.value, state.institutes))}>
        <option value="platform">All Ledgr</option>
        {state.instituteGroups.map((group) => (
          <option key={group.id} value={scopeValue({ scopeType: "group", groupId: group.id })}>{group.name}</option>
        ))}
        {instituteOptions.map(([optionValue, label]) => (
          <option key={optionValue} value={optionValue}>{label}</option>
        ))}
      </select>
    </label>
  );
}

function SuperAdminDashboard({ state, billing, adminScope }) {
  const scopedInstitutes = filterInstitutes(state, adminScope);
  const scopedGroups = filterGroups(state, adminScope);
  const scopedBilling = filterBilling(state, adminScope, billing);
  const remainingCredits = scopedBilling.reduce((sum, account) => sum + Number(account.remainingCredits || 0), 0);
  const activeInvites = state.invites.filter((invite) => getInviteStatus(invite) === "active").length;
  const lowCredit = scopedBilling.filter((account) => account.purchasedCredits > 0 && account.remainingCredits / account.purchasedCredits <= 0.2).length;

  return (
    <>
      <div className="metric-strip">
        <Metric label="Groups" value={scopedGroups.length} />
        <Metric label="Institutes" value={scopedInstitutes.length} />
        <Metric label="Credits left" value={remainingCredits} />
        <Metric label="Active invites" value={activeInvites} />
        <Metric label="Low credit clients" value={lowCredit} />
      </div>
      <div className="admin-grid two">
        <section className="section-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Clients</p>
              <h2>Groups and institutes</h2>
            </div>
          </div>
          <div className="mini-table">
            {scopedGroups.map((group) => (
              <div className="mini-row" key={group.id}><strong>{group.name}</strong><span>{state.institutes.filter((item) => item.groupId === group.id).length} institutes</span></div>
            ))}
            {state.institutes.filter((item) => !item.groupId).map((institute) => (
              <div className="mini-row" key={institute.id}><strong>{institute.name}</strong><span>standalone institute</span></div>
            ))}
          </div>
        </section>
        <section className="section-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Billing</p>
              <h2>Credit status</h2>
            </div>
          </div>
          <div className="mini-table">
            {scopedBilling.map((account) => (
              <div className="mini-row" key={account.id}>
                <strong>{billingOwnerLabel(account, state)}</strong>
                <span>{account.remainingCredits}/{account.purchasedCredits} left</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
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

function scopeValue(scope = { scopeType: "platform" }) {
  if (scope.scopeType === "group") return `group:${scope.groupId}`;
  if (scope.scopeType === "institute") return `institute:${scope.instituteId}`;
  return "platform";
}

function parseScopeValue(value, institutes) {
  if (value.startsWith("group:")) return { scopeType: "group", groupId: value.slice(6), instituteId: null };
  if (value.startsWith("institute:")) {
    const instituteId = value.slice(10);
    const institute = institutes.find((item) => item.id === instituteId);
    return { scopeType: "institute", groupId: institute?.groupId || null, instituteId };
  }
  return { scopeType: "platform", groupId: null, instituteId: null };
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
