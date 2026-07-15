export const adminRoles = ["super_admin", "group_admin", "institute_admin"];

export const roleLabels = {
  super_admin: "Super Admin",
  group_admin: "Group Admin",
  institute_admin: "Institute Admin",
  teacher: "Teacher",
  student: "Student"
};

export function normalizeRole(role = "student") {
  return role === "admin" ? "super_admin" : role;
}

export function membershipKey(membership = {}) {
  const role = normalizeRole(membership.role);
  if (membership.scopeType === "platform") return `platform:${role}`;
  if (membership.scopeType === "group") return `group:${membership.groupId}:${role}`;
  if (membership.scopeType === "institute") return `institute:${membership.instituteId}:${role}`;
  return `own:${role}`;
}

export function normalizeMembership(membership = {}, user = {}) {
  const role = normalizeRole(membership.role || user.role);
  const scopeType = membership.scopeType || (role === "super_admin" ? "platform" : "own");
  return {
    id: membership.id || `${user.uid || user.id || "user"}-${membershipKey({ ...membership, role, scopeType })}`,
    userId: membership.userId || user.uid || user.id || "",
    role,
    scopeType,
    groupId: membership.groupId || null,
    instituteId: membership.instituteId || null,
    status: membership.status || user.status || "active",
    createdAt: membership.createdAt || user.createdAt || null,
    inviteToken: membership.inviteToken || null
  };
}

export function legacyMembershipForUser(user = {}) {
  const role = normalizeRole(user.role || "student");
  const base = {
    userId: user.uid || user.id || "",
    role,
    status: user.status || (role === "teacher" ? "pending" : "active")
  };

  if (role === "super_admin") return normalizeMembership({ ...base, scopeType: "platform" }, user);
  if (role === "group_admin") return normalizeMembership({ ...base, scopeType: "group", groupId: user.groupId || null }, user);
  if (role === "institute_admin") {
    return normalizeMembership({ ...base, scopeType: "institute", groupId: user.groupId || null, instituteId: user.instituteId || null }, user);
  }
  return normalizeMembership({ ...base, scopeType: "own" }, user);
}

export function getMemberships(user = {}) {
  const explicit = Array.isArray(user.memberships) ? user.memberships.map((membership) => normalizeMembership(membership, user)) : [];
  const legacy = legacyMembershipForUser(user);
  const byKey = new Map([legacy, ...explicit].filter(Boolean).map((membership) => [membershipKey(membership), membership]));
  return [...byKey.values()];
}

export function getActiveMemberships(user = {}) {
  return getMemberships(user).filter((membership) => membership.status !== "blocked" && membership.status !== "revoked");
}

export function hasRole(user, role) {
  const normalized = normalizeRole(role);
  return getActiveMemberships(user).some((membership) => membership.role === normalized);
}

export function isSuperAdmin(user) {
  return hasRole(user, "super_admin");
}

export function isAdminUser(user) {
  return getActiveMemberships(user).some((membership) => adminRoles.includes(membership.role));
}

export function getPrimaryAdminMembership(user) {
  return getActiveMemberships(user).find((membership) => adminRoles.includes(membership.role)) || null;
}

export function membershipScopeKeys(user = {}) {
  return getActiveMemberships(user).map(membershipKey);
}

export function withMembership(user = {}, membership = {}) {
  const normalized = normalizeMembership(membership, user);
  const memberships = getMemberships(user).filter((current) => membershipKey(current) !== membershipKey(normalized));
  const role = normalizeRole(user.role || normalized.role);
  const nextRole = adminRoles.includes(normalized.role) ? normalized.role : role;
  return {
    ...user,
    role: nextRole,
    status: user.status || "active",
    memberships: [...memberships, normalized],
    scopeKeys: membershipScopeKeys({ ...user, memberships: [...memberships, normalized] })
  };
}

export function canReadGroup(user, groupId) {
  if (isSuperAdmin(user)) return true;
  return getActiveMemberships(user).some((membership) => membership.role === "group_admin" && membership.groupId === groupId);
}

export function canReadInstitute(user, institute = {}) {
  if (isSuperAdmin(user)) return true;
  return getActiveMemberships(user).some((membership) => {
    if (membership.role === "group_admin") return membership.groupId && membership.groupId === institute.groupId;
    if (membership.role === "institute_admin") return membership.instituteId === institute.id;
    return false;
  });
}

export function getRoleHomeForUser(user) {
  if (!user) return "/";
  const role = normalizeRole(user.role);
  if (adminRoles.includes(role) || isAdminUser(user)) return "/admin";
  if (role === "teacher") return "/teacher";
  if (role === "student") return "/student";
  return "/";
}
