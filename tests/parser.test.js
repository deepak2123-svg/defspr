import { describe, expect, it } from "vitest";
import { buildDedupeHash, parseMcqText } from "../src/lib/parser.js";

describe("parser", () => {
  it("parses strict pasted MCQs", () => {
    const result = parseMcqText(
      `1. Where is NDA located?
A) Delhi
B) Pune
C) Mumbai
D) Kochi
Answer: B
Explanation: NDA is at Khadakwasla, Pune.`,
      { examId: "nda", subjectId: "nda-gat-gs", chapterId: "Defence Awareness", marks: 4, negativeMarks: 1.33 }
    );

    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].options).toHaveLength(4);
    expect(result.questions[0].correctAnswer).toBe("B");
    expect(result.warnings).toHaveLength(0);
  });

  it("marks multi-answer keys as multiple type", () => {
    const result = parseMcqText(
      `1. Select constitutional bodies.
A) ECI
B) NITI Aayog
C) UPSC
D) Finance Commission
Answer: ACD`,
      { examId: "nda", subjectId: "nda-gat-gs", chapterId: "Polity" }
    );

    expect(result.questions[0].type).toBe("multiple");
    expect(result.questions[0].correctAnswer).toEqual(["A", "C", "D"]);
  });

  it("warns on low quality imports", () => {
    const result = parseMcqText("This is not a useful MCQ.");
    expect(result.questions).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("creates stable duplicate hashes from stems", () => {
    const a = buildDedupeHash({ examId: "nda", subjectId: "math", stemHtml: "What is 2 + 2?" });
    const b = buildDedupeHash({ examId: "nda", subjectId: "math", stemHtml: "What is 2 + 2?" });
    expect(a).toBe(b);
  });
});
