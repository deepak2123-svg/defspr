const OPTION_RE = /^([A-D])[\).:\-]\s+(.+)$/i;
const ANSWER_RE = /^(answer|ans|correct)\s*[:\-]\s*(.+)$/i;
const EXPLANATION_RE = /^(explanation|solution)\s*[:\-]\s*(.+)$/i;
const QUESTION_START_RE = /^(?:q(?:uestion)?\.?\s*)?(\d+)[\).:\-]\s*(.+)$/i;

export function stripHtml(value = "") {
  return String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function buildDedupeHash(question) {
  const base = `${question.examId || ""}|${question.subjectId || ""}|${stripHtml(question.stemHtml || "")}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base.slice(0, 180);
}

export function parseMcqText(input, defaults = {}) {
  const lines = String(input || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const questions = [];
  let current = null;
  let confidenceHits = 0;

  const pushCurrent = () => {
    if (!current) return;
    current.stemHtml = current.stemHtml.trim();
    if (current.stemHtml && (current.options.length || current.type === "numeric")) {
      current.dedupeHash = buildDedupeHash(current);
      questions.push(current);
    }
  };

  for (const line of lines) {
    const questionMatch = line.match(QUESTION_START_RE);
    const optionMatch = line.match(OPTION_RE);
    const answerMatch = line.match(ANSWER_RE);
    const explanationMatch = line.match(EXPLANATION_RE);

    if (questionMatch && (!current || current.options.length || current.correctAnswer || current.stemHtml.length > 140)) {
      pushCurrent();
      current = createDraftQuestion({ ...defaults, stemHtml: questionMatch[2] });
      confidenceHits += 1;
      continue;
    }

    if (!current) {
      current = createDraftQuestion({ ...defaults, stemHtml: line });
      continue;
    }

    if (optionMatch) {
      current.options.push({ id: optionMatch[1].toUpperCase(), text: optionMatch[2] });
      confidenceHits += 1;
      continue;
    }

    if (answerMatch) {
      const answer = answerMatch[2].replace(/[,\s]+/g, "").toUpperCase();
      current.correctAnswer = answer.length > 1 ? answer.split("") : answer;
      current.type = Array.isArray(current.correctAnswer) ? "multiple" : current.type;
      confidenceHits += 1;
      continue;
    }

    if (explanationMatch) {
      current.solutionHtml = explanationMatch[2];
      confidenceHits += 1;
      continue;
    }

    if (current.correctAnswer && current.solutionHtml) {
      current.solutionHtml += ` ${line}`;
    } else {
      current.stemHtml += ` ${line}`;
    }
  }

  pushCurrent();

  const possibleSignals = Math.max(1, questions.length * 4);
  const confidence = Math.max(0.15, Math.min(0.98, confidenceHits / possibleSignals));

  return {
    questions,
    confidence,
    warnings: buildParseWarnings(questions, confidence)
  };
}

function createDraftQuestion(defaults) {
  return {
    id: `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    examId: defaults.examId || "nda",
    subjectId: defaults.subjectId || "",
    chapterId: defaults.chapterId || "",
    type: defaults.type || "single",
    stemHtml: defaults.stemHtml || "",
    options: [],
    correctAnswer: "",
    solutionHtml: "",
    difficulty: defaults.difficulty || "medium",
    marks: Number(defaults.marks ?? 4),
    negativeMarks: Number(defaults.negativeMarks ?? 1),
    status: "draft",
    authorUid: defaults.authorUid || "",
    mediaRefs: []
  };
}

function buildParseWarnings(questions, confidence) {
  const warnings = [];
  if (!questions.length) warnings.push("No questions were detected. Try a stricter format or paste selectable text.");
  if (confidence < 0.55) warnings.push("Low confidence import. Review every parsed question before publishing.");
  questions.forEach((question, index) => {
    if (!question.correctAnswer) warnings.push(`Question ${index + 1} has no detected answer.`);
    if (question.type !== "numeric" && question.options.length < 2) warnings.push(`Question ${index + 1} has fewer than two options.`);
  });
  return warnings;
}

export async function extractTextFromFile(file) {
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".txt")) return file.text();
  if (lower.endsWith(".docx")) return extractDocxText(file);
  if (lower.endsWith(".pdf")) return extractPdfText(file);
  throw new Error("Unsupported file type. Upload TXT, DOCX, or selectable-text PDF.");
}

async function extractDocxText(file) {
  const mammothModule = await import("mammoth/mammoth.browser");
  const mammoth = mammothModule.default || mammothModule;
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function extractPdfText(file) {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const pdfWorkerUrl = new URL("pdfjs-dist/legacy/build/pdf.worker.mjs", import.meta.url).toString();
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    pages.push(textContent.items.map((item) => item.str).join(" "));
  }

  const text = pages.join("\n").trim();
  if (text.length < 50) {
    const error = new Error("This looks like a scanned or image-only PDF. Use manual OCR before import.");
    error.code = "SCANNED_PDF";
    throw error;
  }
  return text;
}
