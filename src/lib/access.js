export const portalHome = {
  student: "/student",
  teacher: "/teacher",
  admin: "/admin"
};

export const portalLogin = {
  student: "/student-login",
  teacher: "/teacher-login",
  admin: "/admin-login"
};

const approvedTeacherStatuses = new Set(["approved", "active"]);

export function normalizePath(path = "/") {
  const clean = String(path || "/").split("?")[0].split("#")[0];
  if (clean.length > 1 && clean.endsWith("/")) return clean.slice(0, -1);
  return clean || "/";
}

export function getPortalFromPath(path) {
  const clean = normalizePath(path);
  if (clean === "/student" || clean.startsWith("/student/")) return "student";
  if (clean === "/teacher" || clean.startsWith("/teacher/")) return "teacher";
  if (clean === "/admin" || clean.startsWith("/admin/")) return "admin";
  return null;
}

export function getRoleHome(user) {
  return portalHome[user?.role] || "/";
}

export function normalizeUserProfile(user, fallbackRole = "student") {
  const role = user?.role || fallbackRole;
  const status = user?.status || (role === "teacher" ? "pending" : "active");

  return {
    uid: user?.uid || user?.id || "",
    role,
    status,
    name: user?.name || user?.displayName || user?.email?.split("@")[0] || "Ledgr user",
    email: user?.email || "",
    batchIds: Array.isArray(user?.batchIds) ? user.batchIds : [],
    teacherSubjectIds: Array.isArray(user?.teacherSubjectIds) ? user.teacherSubjectIds : []
  };
}

export function isAdmin(user) {
  return user?.role === "admin" && user?.status !== "blocked";
}

export function isActiveStudent(user) {
  return user?.role === "student" && user?.status === "active";
}

export function isApprovedTeacher(user) {
  return user?.role === "teacher" && approvedTeacherStatuses.has(user?.status);
}

export function resolveAccess(path, user) {
  const portal = getPortalFromPath(path);
  if (!portal) return { allowed: true, portal: null, reason: "public" };

  if (!user) {
    return {
      allowed: false,
      portal,
      reason: "not-authenticated",
      loginPath: portalLogin[portal]
    };
  }

  const profile = normalizeUserProfile(user);
  if (profile.status === "blocked") {
    return {
      allowed: false,
      portal,
      reason: "blocked",
      roleHome: getRoleHome(profile)
    };
  }

  if (isAdmin(profile)) {
    return {
      allowed: true,
      portal,
      reason: portal === "admin" ? "admin" : "admin-override"
    };
  }

  if (portal === "student") {
    if (isActiveStudent(profile)) return { allowed: true, portal, reason: "student" };
    return {
      allowed: false,
      portal,
      reason: "wrong-portal",
      roleHome: getRoleHome(profile)
    };
  }

  if (portal === "teacher") {
    if (isApprovedTeacher(profile)) return { allowed: true, portal, reason: "teacher" };
    if (profile.role === "teacher" && profile.status === "pending") {
      return {
        allowed: false,
        portal,
        reason: "pending-teacher",
        roleHome: "/teacher-login"
      };
    }
    return {
      allowed: false,
      portal,
      reason: "wrong-portal",
      roleHome: getRoleHome(profile)
    };
  }

  return {
    allowed: false,
    portal,
    reason: "non-admin",
    roleHome: getRoleHome(profile)
  };
}
