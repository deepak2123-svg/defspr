import {
  demoUsers,
  seedAuditLogs,
  seedBatches,
  seedBillingAccounts,
  seedCreditLedger,
  seedInstituteGroups,
  seedInstitutes,
  seedInvites,
  seedMemberships,
  seedPlatformSettings,
  seedQuestions,
  seedTests
} from "../data/catalog.js";

export function createSeedState(overrides = {}) {
  return {
    questions: seedQuestions,
    tests: seedTests,
    attempts: [],
    imports: [],
    users: demoUsers,
    memberships: seedMemberships,
    instituteGroups: seedInstituteGroups,
    institutes: seedInstitutes,
    invites: seedInvites,
    billingAccounts: seedBillingAccounts,
    creditLedger: seedCreditLedger,
    platformSettings: seedPlatformSettings,
    auditLogs: seedAuditLogs,
    batches: seedBatches,
    flags: [],
    ...overrides
  };
}

export function upsertById(items, item) {
  if (!item?.id) return items;
  return [item, ...items.filter((current) => current.id !== item.id)];
}

export function replaceByUid(users, uid, patch) {
  return users.map((user) => (user.uid === uid ? { ...user, ...patch } : user));
}

export function isDemoUser(user) {
  return demoUsers.some((demoUser) => demoUser.uid === user?.uid);
}

export function shouldUseFirestoreData(user, firebaseConfigured) {
  return Boolean(firebaseConfigured && user?.uid && !isDemoUser(user));
}

export function mergeRemoteState(remoteState, activeUser) {
  const seed = createSeedState();
  const users = remoteState.users?.length ? remoteState.users : activeUser ? [activeUser] : seed.users;

  return {
    questions: remoteState.questions?.length ? remoteState.questions : seed.questions,
    tests: remoteState.tests?.length ? remoteState.tests : seed.tests,
    attempts: remoteState.attempts || [],
    imports: remoteState.imports || [],
    users,
    memberships: remoteState.memberships || seed.memberships,
    instituteGroups: remoteState.instituteGroups || seed.instituteGroups,
    institutes: remoteState.institutes || seed.institutes,
    invites: remoteState.invites || [],
    billingAccounts: remoteState.billingAccounts || seed.billingAccounts,
    creditLedger: remoteState.creditLedger || seed.creditLedger,
    platformSettings: remoteState.platformSettings || seed.platformSettings,
    auditLogs: remoteState.auditLogs || seed.auditLogs,
    batches: remoteState.batches || [],
    flags: remoteState.flags || []
  };
}
