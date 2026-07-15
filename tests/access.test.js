import { describe, expect, it } from "vitest";
import { getPortalFromPath, normalizeUserProfile, resolveAccess } from "../src/lib/access.js";

const student = { uid: "s1", role: "student", status: "active", name: "Student" };
const teacher = { uid: "t1", role: "teacher", status: "approved", name: "Teacher" };
const pendingTeacher = { uid: "t2", role: "teacher", status: "pending", name: "Pending" };
const admin = { uid: "a1", role: "admin", status: "active", name: "Admin" };
const groupAdmin = {
  uid: "g1",
  role: "group_admin",
  status: "active",
  name: "Group Admin",
  memberships: [{ role: "group_admin", scopeType: "group", groupId: "group-zee", status: "active" }]
};

describe("gateway access", () => {
  it("keeps login and public pages outside protected portals", () => {
    expect(getPortalFromPath("/")).toBe(null);
    expect(getPortalFromPath("/student-login")).toBe(null);
    expect(getPortalFromPath("/teacher-login")).toBe(null);
    expect(getPortalFromPath("/admin-login")).toBe(null);
    expect(getPortalFromPath("/nda/resources")).toBe(null);
  });

  it("requires the matching gateway for unauthenticated users", () => {
    expect(resolveAccess("/student/tests", null)).toMatchObject({
      allowed: false,
      portal: "student",
      loginPath: "/student-login"
    });
    expect(resolveAccess("/teacher/import", null)).toMatchObject({
      allowed: false,
      portal: "teacher",
      loginPath: "/teacher-login"
    });
  });

  it("allows active students only into student routes", () => {
    expect(resolveAccess("/student", student).allowed).toBe(true);
    expect(resolveAccess("/teacher", student)).toMatchObject({
      allowed: false,
      reason: "wrong-portal",
      roleHome: "/student"
    });
    expect(resolveAccess("/admin", student).reason).toBe("non-admin");
  });

  it("requires teacher approval before teacher routes open", () => {
    expect(resolveAccess("/teacher/questions", teacher).allowed).toBe(true);
    expect(resolveAccess("/teacher/questions", pendingTeacher)).toMatchObject({
      allowed: false,
      reason: "pending-teacher"
    });
  });

  it("lets admins enter every protected portal", () => {
    expect(resolveAccess("/student/tests", admin).allowed).toBe(true);
    expect(resolveAccess("/teacher/import", admin).allowed).toBe(true);
    expect(resolveAccess("/admin/results", admin).allowed).toBe(true);
  });

  it("keeps scoped admins inside the admin portal only", () => {
    expect(resolveAccess("/admin", groupAdmin).allowed).toBe(true);
    expect(resolveAccess("/student/tests", groupAdmin)).toMatchObject({
      allowed: false,
      reason: "wrong-portal",
      roleHome: "/admin"
    });
  });

  it("normalizes Firebase and demo profiles with safe defaults", () => {
    expect(normalizeUserProfile({ uid: "x", email: "new@ledgr.test" }, "teacher")).toMatchObject({
      uid: "x",
      role: "teacher",
      status: "pending",
      name: "new",
      batchIds: [],
      teacherSubjectIds: []
    });
  });
});
