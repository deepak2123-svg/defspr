import { describe, expect, it } from "vitest";
import { createSeedState, isDemoUser, shouldUseFirestoreData, upsertById } from "../src/lib/appState.js";

describe("app state helpers", () => {
  it("creates the local preview seed state", () => {
    const state = createSeedState();
    expect(state.questions.length).toBeGreaterThan(0);
    expect(state.tests.length).toBeGreaterThan(0);
    expect(state.users.length).toBeGreaterThan(0);
  });

  it("upserts records without duplicating ids", () => {
    const items = [{ id: "a", value: 1 }, { id: "b", value: 2 }];
    expect(upsertById(items, { id: "a", value: 3 })).toEqual([{ id: "a", value: 3 }, { id: "b", value: 2 }]);
  });

  it("keeps demo users local even when Firebase is configured", () => {
    expect(isDemoUser({ uid: "student-demo" })).toBe(true);
    expect(shouldUseFirestoreData({ uid: "student-demo" }, true)).toBe(false);
    expect(shouldUseFirestoreData({ uid: "real-user" }, true)).toBe(true);
  });
});
