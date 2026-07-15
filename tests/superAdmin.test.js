import { describe, expect, it } from "vitest";
import { canReadGroup, canReadInstitute, getRoleHomeForUser, isSuperAdmin, withMembership } from "../src/lib/memberships.js";
import {
  claimInviteForUser,
  createBillingAccount,
  createCreditLedgerEntry,
  createInvite,
  getInviteStatus,
  parseInstituteCsv,
  summarizeBillingAccount
} from "../src/lib/superAdmin.js";

describe("membership model", () => {
  it("maps legacy admin users into super admin access", () => {
    const user = { uid: "a1", role: "admin", status: "active" };
    expect(isSuperAdmin(user)).toBe(true);
    expect(getRoleHomeForUser(user)).toBe("/admin");
  });

  it("keeps group and institute scopes isolated", () => {
    const groupAdmin = withMembership({ uid: "g1", role: "group_admin", status: "active" }, {
      role: "group_admin",
      scopeType: "group",
      groupId: "group-zee",
      status: "active"
    });
    const instituteAdmin = withMembership({ uid: "i1", role: "institute_admin", status: "active" }, {
      role: "institute_admin",
      scopeType: "institute",
      groupId: "group-zee",
      instituteId: "inst-delhi",
      status: "active"
    });

    expect(canReadGroup(groupAdmin, "group-zee")).toBe(true);
    expect(canReadGroup(groupAdmin, "other")).toBe(false);
    expect(canReadInstitute(instituteAdmin, { id: "inst-delhi", groupId: "group-zee" })).toBe(true);
    expect(canReadInstitute(instituteAdmin, { id: "inst-pune", groupId: "group-zee" })).toBe(false);
  });
});

describe("admin invites", () => {
  const now = new Date("2026-07-15T10:00:00.000Z");

  it("creates 24-hour single-use admin invites and claims them", () => {
    const invite = createInvite({
      role: "group_admin",
      scopeType: "group",
      groupId: "group-zee",
      createdBy: { uid: "super" },
      now,
      token: "token-1"
    });
    expect(invite.expiresAt).toBe("2026-07-16T10:00:00.000Z");
    expect(getInviteStatus(invite, now)).toBe("active");

    const result = claimInviteForUser(invite, { uid: "new-admin", email: "admin@zee.test", role: "student", status: "active" }, now);
    expect(result.ok).toBe(true);
    expect(result.invite.status).toBe("claimed");
    expect(result.membership).toMatchObject({ role: "group_admin", groupId: "group-zee", inviteToken: "token-1" });
    expect(result.user.scopeKeys).toContain("group:group-zee:group_admin");
  });

  it("rejects expired and unsupported invite claims", () => {
    const invite = createInvite({
      role: "group_admin",
      scopeType: "group",
      groupId: "group-zee",
      createdBy: { uid: "super" },
      now,
      token: "token-2"
    });
    expect(getInviteStatus(invite, new Date("2026-07-16T10:00:01.000Z"))).toBe("expired");
    expect(claimInviteForUser(invite, { uid: "late" }, new Date("2026-07-16T10:00:01.000Z"))).toMatchObject({
      ok: false,
      reason: "expired"
    });

    expect(claimInviteForUser({ ...invite, role: "student" }, { uid: "bad" }, now)).toMatchObject({
      ok: false,
      reason: "unsupported-role"
    });
  });
});

describe("billing and institute import", () => {
  it("calculates credit balances from the ledger", () => {
    const account = createBillingAccount({ ownerType: "group", groupId: "group-zee" });
    const purchase = createCreditLedgerEntry({ billingAccountId: account.id, type: "purchase", quantity: 1000, amount: 149000 });
    const activation = createCreditLedgerEntry({ billingAccountId: account.id, type: "activation", quantity: 275 });
    const adjustment = createCreditLedgerEntry({ billingAccountId: account.id, type: "adjustment", quantity: 25 });
    const refund = createCreditLedgerEntry({ billingAccountId: account.id, type: "refund", quantity: 50 });

    expect(summarizeBillingAccount(account, [purchase, activation, adjustment, refund])).toMatchObject({
      purchasedCredits: 975,
      usedCredits: 275,
      remainingCredits: 700
    });
  });

  it("validates institute CSV rows and duplicate rules", () => {
    const csv = "name,code,city,state\nZEE Delhi,ZEE-DEL,Delhi,Delhi\n,ZEE-BAD,Delhi,Delhi\nZEE Pune,,Pune,Maharashtra";
    const result = parseInstituteCsv(csv, [{ name: "ZEE Delhi", code: "ZEE-DEL", city: "Delhi", groupId: "group-zee" }], "group-zee");

    expect(result.valid).toHaveLength(1);
    expect(result.invalid).toHaveLength(1);
    expect(result.duplicates).toHaveLength(1);
    expect(result.valid[0].institute.name).toBe("ZEE Pune");
  });
});
