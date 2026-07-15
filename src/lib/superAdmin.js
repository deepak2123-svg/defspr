import { membershipKey, normalizeMembership, withMembership } from "./memberships.js";

export const defaultPricing = {
  id: "pricing",
  pricePerStudent: 149,
  currency: "INR",
  updatedAt: "2026-07-15T00:00:00.000Z",
  updatedBy: "seed"
};

export function slugify(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function makeId(prefix, label = "", now = Date.now()) {
  const slug = slugify(label).slice(0, 42) || "item";
  return `${prefix}-${slug}-${now}`;
}

export function createAuditLog({ actor, action, targetType, targetId, scope = {}, metadata = {}, now = new Date().toISOString() }) {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    actorUid: actor?.uid || "system",
    actorName: actor?.name || actor?.email || "System",
    action,
    targetType,
    targetId,
    scope,
    metadata,
    createdAt: now
  };
}

export function createBillingAccount({ ownerType, groupId = null, instituteId = null, validityStart = "", validityEnd = "", status = "active", now = new Date().toISOString() }) {
  const ownerId = ownerType === "group" ? groupId : instituteId;
  return {
    id: `billing-${ownerType}-${ownerId}`,
    ownerType,
    groupId,
    instituteId,
    purchasedCredits: 0,
    usedCredits: 0,
    remainingCredits: 0,
    validityStart,
    validityEnd,
    status,
    createdAt: now,
    updatedAt: now
  };
}

export function createCreditLedgerEntry({
  billingAccountId,
  type = "purchase",
  quantity = 0,
  amount = 0,
  paymentReference = "",
  note = "",
  actor,
  now = new Date().toISOString()
}) {
  return {
    id: `credit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    billingAccountId,
    type,
    quantity: Number(quantity) || 0,
    amount: Number(amount) || 0,
    paymentReference,
    note,
    createdBy: actor?.uid || "system",
    createdAt: now
  };
}

export function summarizeBillingAccount(account, ledger = []) {
  const entries = ledger.filter((entry) => entry.billingAccountId === account.id);
  const purchasedCredits = entries
    .filter((entry) => ["purchase", "adjustment"].includes(entry.type))
    .reduce((sum, entry) => sum + Number(entry.quantity || 0), 0);
  const refundedCredits = entries
    .filter((entry) => entry.type === "refund")
    .reduce((sum, entry) => sum + Number(entry.quantity || 0), 0);
  const usedCredits = entries
    .filter((entry) => entry.type === "activation")
    .reduce((sum, entry) => sum + Number(entry.quantity || 0), 0);
  const netPurchased = purchasedCredits - refundedCredits;

  return {
    ...account,
    purchasedCredits: netPurchased,
    usedCredits,
    remainingCredits: Math.max(0, netPurchased - usedCredits)
  };
}

export function summarizeBillingAccounts(accounts = [], ledger = []) {
  return accounts.map((account) => summarizeBillingAccount(account, ledger));
}

export function getInviteStatus(invite, now = new Date()) {
  if (!invite) return "missing";
  if (invite.status === "claimed") return "claimed";
  if (invite.status === "revoked") return "revoked";
  if (invite.expiresAt && new Date(invite.expiresAt).getTime() <= now.getTime()) return "expired";
  return invite.status || "active";
}

export function createInvite({
  role,
  scopeType,
  groupId = null,
  instituteId = null,
  createdBy,
  now = new Date(),
  token = ""
}) {
  const safeToken = token || (globalThis.crypto?.randomUUID?.() || `invite-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const createdAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  return {
    id: safeToken,
    token: safeToken,
    role,
    scopeType,
    groupId,
    instituteId,
    status: "active",
    createdBy: createdBy?.uid || "system",
    createdAt,
    expiresAt,
    claimedBy: null,
    claimedAt: null,
    revokedAt: null
  };
}

export function claimInviteForUser(invite, user, now = new Date()) {
  const status = getInviteStatus(invite, now);
  if (status !== "active") return { ok: false, reason: status };
  if (!["super_admin", "group_admin", "institute_admin"].includes(invite.role)) {
    return { ok: false, reason: "unsupported-role" };
  }

  const claimedAt = now.toISOString();
  const membership = normalizeMembership({
    id: `membership-${user.uid}-${invite.id}`,
    userId: user.uid,
    role: invite.role,
    scopeType: invite.scopeType,
    groupId: invite.groupId || null,
    instituteId: invite.instituteId || null,
    status: "active",
    createdAt: claimedAt,
    inviteToken: invite.id
  }, user);
  const nextUser = withMembership({ ...user, status: "active" }, membership);

  return {
    ok: true,
    invite: {
      ...invite,
      status: "claimed",
      claimedBy: user.uid,
      claimedAt
    },
    membership,
    user: {
      ...nextUser,
      lastClaimedInviteToken: invite.id,
      scopeKeys: [...new Set([...(nextUser.scopeKeys || []), membershipKey(membership)])]
    }
  };
}

export function revokeInvite(invite, now = new Date().toISOString()) {
  if (!invite || invite.status === "claimed") return invite;
  return { ...invite, status: "revoked", revokedAt: now };
}

export function parseCsv(text = "") {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const input = String(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if (char === "\n" && !quoted) {
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

export function parseInstituteCsv(text = "", existingInstitutes = [], groupId = null) {
  const rows = parseCsv(text);
  if (!rows.length) return { valid: [], invalid: [], duplicates: [] };
  const headers = rows[0].map((header) => slugify(header).replace(/-/g, ""));
  const required = headers.includes("name");
  const seen = new Set(
    existingInstitutes
      .filter((institute) => (groupId ? institute.groupId === groupId : !institute.groupId))
      .map((institute) => instituteDuplicateKey(institute))
  );
  const valid = [];
  const invalid = [];
  const duplicates = [];

  if (!required) {
    return {
      valid: [],
      duplicates: [],
      invalid: [{ rowNumber: 1, reason: "CSV must include a name column.", raw: rows[0] }]
    };
  }

  rows.slice(1).forEach((row, index) => {
    const record = {};
    headers.forEach((header, cellIndex) => {
      record[header] = row[cellIndex] || "";
    });
    const institute = {
      name: record.name || "",
      code: record.code || "",
      city: record.city || "",
      state: record.state || "",
      address: record.address || "",
      contactName: record.contactname || "",
      contactPhone: record.contactphone || "",
      contactEmail: record.contactemail || "",
      groupId
    };
    const rowNumber = index + 2;
    if (!institute.name.trim()) {
      invalid.push({ rowNumber, reason: "Name is required.", raw: row });
      return;
    }
    const key = instituteDuplicateKey(institute);
    if (seen.has(key)) {
      duplicates.push({ rowNumber, reason: "Duplicate institute for this group.", institute });
      return;
    }
    seen.add(key);
    valid.push({ rowNumber, institute });
  });

  return { valid, invalid, duplicates };
}

export function instituteDuplicateKey(institute = {}) {
  if (institute.code) return `code:${slugify(institute.code)}`;
  return `name:${slugify(institute.name)}:${slugify(institute.city)}`;
}

export function getScopeLabel(scope, groups = [], institutes = []) {
  if (!scope || scope.scopeType === "platform") return "All Ledgr";
  if (scope.scopeType === "group") return groups.find((group) => group.id === scope.groupId)?.name || "Selected group";
  if (scope.scopeType === "institute") return institutes.find((institute) => institute.id === scope.instituteId)?.name || "Selected institute";
  return "Current scope";
}
