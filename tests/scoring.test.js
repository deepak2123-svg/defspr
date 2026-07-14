import { describe, expect, it } from "vitest";
import { canStartAttempt, getTestDurationSeconds, scoreAttempt, scoreQuestion, shouldShowResult } from "../src/lib/scoring.js";

const questions = [
  { id: "q1", type: "single", correctAnswer: "B", marks: 4, negativeMarks: 1 },
  { id: "q2", type: "multiple", correctAnswer: ["A", "C"], marks: 4, negativeMarks: 1 },
  { id: "q3", type: "numeric", correctAnswer: 42, marks: 4, negativeMarks: 1 }
];

const test = {
  id: "t1",
  sections: [
    { id: "s1", title: "One", durationMinutes: 30, questionIds: ["q1", "q2"] },
    { id: "s2", title: "Two", durationMinutes: 20, questionIds: ["q3"] }
  ],
  attemptPolicy: { type: "limited", maxAttempts: 1 },
  resultRelease: { type: "immediate" },
  timing: { mode: "section" }
};

describe("scoring", () => {
  it("scores single, multiple and numeric answers", () => {
    expect(scoreQuestion(questions[0], "B")).toEqual({ state: "correct", marks: 4, correct: true });
    expect(scoreQuestion(questions[1], ["C", "A"]).state).toBe("correct");
    expect(scoreQuestion(questions[2], "42").state).toBe("correct");
  });

  it("applies negative marking and unattempted rules", () => {
    expect(scoreQuestion(questions[0], "A").marks).toBe(-1);
    expect(scoreQuestion(questions[0], "").marks).toBe(0);
  });

  it("summarizes attempt analytics by section", () => {
    const result = scoreAttempt({
      test,
      questions,
      responses: { q1: "B", q2: ["A"], q3: "42" }
    });

    expect(result.score).toBe(7);
    expect(result.correct).toBe(2);
    expect(result.wrong).toBe(1);
    expect(result.breakdown).toHaveLength(2);
  });

  it("enforces attempt limits", () => {
    expect(canStartAttempt({ test, previousAttempts: [] }).allowed).toBe(true);
    expect(canStartAttempt({ test, previousAttempts: [{ testId: "t1" }] }).allowed).toBe(false);
    expect(canStartAttempt({ test, previousAttempts: [{ testId: "t1", status: "in-progress" }] }).allowed).toBe(true);
  });

  it("calculates section timers and result release", () => {
    expect(getTestDurationSeconds(test)).toBe(3000);
    expect(shouldShowResult(test, { resultReleased: false })).toBe(true);
    expect(shouldShowResult({ ...test, resultRelease: { type: "manual" } }, { resultReleased: false })).toBe(false);
  });
});
