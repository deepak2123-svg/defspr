export function normalizeAnswer(value) {
  if (Array.isArray(value)) return value.map(String).sort();
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function isBlankAnswer(answer) {
  if (Array.isArray(answer)) return answer.length === 0;
  return answer === null || answer === undefined || String(answer).trim() === "";
}

export function isCorrectAnswer(question, answer) {
  if (isBlankAnswer(answer)) return false;

  if (question.type === "multiple") {
    const expected = normalizeAnswer(question.correctAnswer);
    const actual = normalizeAnswer(answer);
    return expected.length === actual.length && expected.every((item, index) => item === actual[index]);
  }

  if (question.type === "numeric") {
    const expected = Number(question.correctAnswer);
    const actual = Number(answer);
    if (Number.isNaN(expected) || Number.isNaN(actual)) return false;
    return Math.abs(expected - actual) <= (question.numericTolerance ?? 0.001);
  }

  return normalizeAnswer(question.correctAnswer) === normalizeAnswer(answer);
}

export function scoreQuestion(question, answer) {
  if (isBlankAnswer(answer)) {
    return { state: "unattempted", marks: 0, correct: false };
  }

  const correct = isCorrectAnswer(question, answer);
  if (correct) {
    return { state: "correct", marks: Number(question.marks ?? 0), correct: true };
  }

  return {
    state: "wrong",
    marks: -Math.abs(Number(question.negativeMarks ?? 0)),
    correct: false
  };
}

export function scoreAttempt({ test, questions, responses }) {
  const byId = new Map(questions.map((question) => [question.id, question]));
  const breakdown = [];
  let score = 0;
  let maxScore = 0;
  let correct = 0;
  let wrong = 0;
  let unattempted = 0;

  for (const section of test.sections) {
    const sectionStats = {
      sectionId: section.id,
      title: section.title,
      score: 0,
      maxScore: 0,
      correct: 0,
      wrong: 0,
      unattempted: 0,
      questions: []
    };

    for (const questionId of section.questionIds) {
      const question = byId.get(questionId);
      if (!question) continue;
      const result = scoreQuestion(question, responses[questionId]);
      const maxMarks = Number(question.marks ?? 0);
      maxScore += maxMarks;
      score += result.marks;
      sectionStats.score += result.marks;
      sectionStats.maxScore += maxMarks;
      sectionStats.questions.push({ questionId, ...result });

      if (result.state === "correct") {
        correct += 1;
        sectionStats.correct += 1;
      } else if (result.state === "wrong") {
        wrong += 1;
        sectionStats.wrong += 1;
      } else {
        unattempted += 1;
        sectionStats.unattempted += 1;
      }
    }

    breakdown.push(sectionStats);
  }

  const totalQuestions = correct + wrong + unattempted;
  const attempted = correct + wrong;
  const accuracy = attempted ? Math.round((correct / attempted) * 100) : 0;
  const percent = maxScore ? Math.round((score / maxScore) * 1000) / 10 : 0;

  return {
    score: Math.round(score * 100) / 100,
    maxScore,
    totalQuestions,
    attempted,
    correct,
    wrong,
    unattempted,
    accuracy,
    percent,
    breakdown
  };
}

export function canStartAttempt({ test, previousAttempts = [] }) {
  if (!test?.attemptPolicy || test.attemptPolicy.type === "unlimited") {
    return { allowed: true, remaining: Infinity };
  }

  const maxAttempts = Number(test.attemptPolicy.maxAttempts ?? 1);
  const used = previousAttempts.filter((attempt) => attempt.testId === test.id).length;
  return {
    allowed: used < maxAttempts,
    remaining: Math.max(0, maxAttempts - used)
  };
}

export function shouldShowResult(test, attempt, now = new Date()) {
  const release = test.resultRelease ?? { type: "immediate" };
  if (release.type === "immediate") return true;
  if (release.type === "manual") return attempt.resultReleased === true;
  if (release.type === "after-window") {
    return release.releaseAt ? new Date(release.releaseAt) <= now : false;
  }
  return false;
}

export function getTestDurationSeconds(test) {
  if (!test?.timing || test.timing.mode === "none") return null;
  if (test.timing.mode === "whole-test") return Number(test.timing.durationMinutes ?? 0) * 60;
  const totalMinutes = test.sections.reduce((sum, section) => sum + Number(section.durationMinutes ?? 0), 0);
  return totalMinutes > 0 ? totalMinutes * 60 : null;
}
