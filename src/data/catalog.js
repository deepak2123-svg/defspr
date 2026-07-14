export const roles = {
  student: {
    label: "Student",
    home: "/student",
    description: "Take public and assigned tests, review analytics, and continue practice."
  },
  teacher: {
    label: "Teacher",
    home: "/teacher",
    description: "Import MCQs, publish questions to subject banks, and flag quality issues."
  },
  admin: {
    label: "Admin",
    home: "/admin",
    description: "Create tests, manage users, review results, batches, and exports."
  }
};

export const examCatalog = {
  nda: {
    id: "nda",
    label: "NDA",
    fullName: "National Defence Academy",
    status: "Live",
    accent: "#3f6b4b",
    defaultMarks: 4,
    defaultNegativeMarks: 1.33,
    scoring: "positive-negative",
    summary: "NDA is the first live vertical with Mathematics, GAT, SSB and defence resources."
  },
  neet: {
    id: "neet",
    label: "NEET",
    fullName: "National Eligibility cum Entrance Test",
    status: "Shell",
    accent: "#256f8f",
    defaultMarks: 4,
    defaultNegativeMarks: 1,
    scoring: "positive-negative",
    summary: "NEET shell is ready for Biology, Physics and Chemistry question banks."
  },
  jeeMain: {
    id: "jeeMain",
    label: "JEE Main",
    fullName: "Joint Entrance Examination Main",
    status: "Shell",
    accent: "#7c5f1d",
    defaultMarks: 4,
    defaultNegativeMarks: 1,
    scoring: "positive-negative",
    summary: "JEE Main shell supports MCQ and numeric-answer question types."
  },
  jeeAdvanced: {
    id: "jeeAdvanced",
    label: "JEE Advanced",
    fullName: "Joint Entrance Examination Advanced",
    status: "Shell",
    accent: "#9b4b32",
    defaultMarks: 3,
    defaultNegativeMarks: 1,
    scoring: "configurable",
    summary: "JEE Advanced shell supports section-specific rules and flexible question types."
  }
};

export const subjectCatalog = {
  nda: [
    {
      id: "nda-math",
      name: "Mathematics",
      chapters: ["Algebra", "Trigonometry", "Calculus", "Vectors", "Statistics", "Matrices"]
    },
    {
      id: "nda-gat-english",
      name: "GAT English",
      chapters: ["Grammar", "Vocabulary", "Comprehension", "Spotting Errors"]
    },
    {
      id: "nda-gat-science",
      name: "GAT Science",
      chapters: ["Physics", "Chemistry", "Biology", "General Science"]
    },
    {
      id: "nda-gat-gs",
      name: "GAT General Studies",
      chapters: ["History", "Geography", "Polity", "Economy", "Current Affairs", "Defence Awareness"]
    }
  ],
  neet: [
    { id: "neet-physics", name: "Physics", chapters: ["Mechanics", "Thermodynamics", "Optics", "Modern Physics"] },
    { id: "neet-chemistry", name: "Chemistry", chapters: ["Physical Chemistry", "Organic Chemistry", "Inorganic Chemistry"] },
    { id: "neet-biology", name: "Biology", chapters: ["Botany", "Zoology", "Human Physiology", "Genetics"] }
  ],
  jeeMain: [
    { id: "jm-physics", name: "Physics", chapters: ["Mechanics", "Electromagnetism", "Optics", "Modern Physics"] },
    { id: "jm-chemistry", name: "Chemistry", chapters: ["Physical", "Organic", "Inorganic"] },
    { id: "jm-math", name: "Mathematics", chapters: ["Algebra", "Calculus", "Coordinate Geometry", "Vectors"] }
  ],
  jeeAdvanced: [
    { id: "ja-physics", name: "Physics", chapters: ["Mechanics", "Waves", "Electricity", "Modern Physics"] },
    { id: "ja-chemistry", name: "Chemistry", chapters: ["Physical", "Organic", "Inorganic"] },
    { id: "ja-math", name: "Mathematics", chapters: ["Algebra", "Calculus", "Geometry", "Combinatorics"] }
  ]
};

export const questionTypes = [
  { id: "single", label: "Single correct MCQ" },
  { id: "multiple", label: "Multiple correct MCQ" },
  { id: "numeric", label: "Numeric answer" },
  { id: "paragraph", label: "Paragraph-linked MCQ" }
];

export const seedQuestions = [
  {
    id: "q-nda-001",
    examId: "nda",
    subjectId: "nda-gat-gs",
    chapterId: "Defence Awareness",
    type: "single",
    stemHtml: "The National Defence Academy is located at which place?",
    options: [
      { id: "A", text: "Dehradun, Uttarakhand" },
      { id: "B", text: "Khadakwasla, Pune" },
      { id: "C", text: "Wellington, Tamil Nadu" },
      { id: "D", text: "Secunderabad, Telangana" }
    ],
    correctAnswer: "B",
    solutionHtml: "NDA is located at Khadakwasla near Pune, Maharashtra.",
    difficulty: "easy",
    marks: 4,
    negativeMarks: 1.33,
    status: "published",
    authorUid: "teacher-demo",
    mediaRefs: [],
    dedupeHash: "nda-location-khadakwasla"
  },
  {
    id: "q-nda-002",
    examId: "nda",
    subjectId: "nda-math",
    chapterId: "Algebra",
    type: "single",
    stemHtml: "If x + 1/x = 2, then x^2 + 1/x^2 equals:",
    options: [
      { id: "A", text: "0" },
      { id: "B", text: "1" },
      { id: "C", text: "2" },
      { id: "D", text: "4" }
    ],
    correctAnswer: "C",
    solutionHtml: "(x + 1/x)^2 = x^2 + 2 + 1/x^2. Therefore 4 = x^2 + 2 + 1/x^2, so the value is 2.",
    difficulty: "easy",
    marks: 2.5,
    negativeMarks: 0.83,
    status: "published",
    authorUid: "teacher-demo",
    mediaRefs: [],
    dedupeHash: "algebra-x-reciprocal"
  },
  {
    id: "q-nda-003",
    examId: "nda",
    subjectId: "nda-gat-english",
    chapterId: "Grammar",
    type: "single",
    stemHtml: "Choose the correctly spelled word.",
    options: [
      { id: "A", text: "Accomodate" },
      { id: "B", text: "Acommodate" },
      { id: "C", text: "Accommodate" },
      { id: "D", text: "Acomodate" }
    ],
    correctAnswer: "C",
    solutionHtml: "The correct spelling is accommodate.",
    difficulty: "easy",
    marks: 4,
    negativeMarks: 1.33,
    status: "published",
    authorUid: "teacher-demo",
    mediaRefs: [],
    dedupeHash: "english-spelling-accommodate"
  },
  {
    id: "q-nda-004",
    examId: "nda",
    subjectId: "nda-gat-science",
    chapterId: "Physics",
    type: "numeric",
    stemHtml: "A body moves at 20 m/s for 10 seconds. What distance does it cover in metres?",
    options: [],
    correctAnswer: 200,
    solutionHtml: "Distance = speed x time = 20 x 10 = 200 metres.",
    difficulty: "easy",
    marks: 4,
    negativeMarks: 1.33,
    status: "published",
    authorUid: "teacher-demo",
    mediaRefs: [],
    dedupeHash: "physics-distance-speed-time"
  },
  {
    id: "q-nda-005",
    examId: "nda",
    subjectId: "nda-gat-gs",
    chapterId: "Polity",
    type: "multiple",
    stemHtml: "Which of the following are constitutional bodies in India?",
    options: [
      { id: "A", text: "Election Commission of India" },
      { id: "B", text: "Finance Commission" },
      { id: "C", text: "NITI Aayog" },
      { id: "D", text: "Union Public Service Commission" }
    ],
    correctAnswer: ["A", "B", "D"],
    solutionHtml: "ECI, Finance Commission and UPSC are constitutional bodies. NITI Aayog is not constitutional.",
    difficulty: "medium",
    marks: 4,
    negativeMarks: 1.33,
    status: "published",
    authorUid: "teacher-demo",
    mediaRefs: [],
    dedupeHash: "polity-constitutional-bodies"
  },
  {
    id: "q-nda-006",
    examId: "nda",
    subjectId: "nda-gat-gs",
    chapterId: "History",
    type: "single",
    stemHtml: "The slogan 'Give me blood and I will give you freedom' is associated with:",
    options: [
      { id: "A", text: "Bhagat Singh" },
      { id: "B", text: "Subhas Chandra Bose" },
      { id: "C", text: "Mahatma Gandhi" },
      { id: "D", text: "Bal Gangadhar Tilak" }
    ],
    correctAnswer: "B",
    solutionHtml: "The slogan is associated with Subhas Chandra Bose.",
    difficulty: "easy",
    marks: 4,
    negativeMarks: 1.33,
    status: "published",
    authorUid: "teacher-demo",
    mediaRefs: [],
    dedupeHash: "history-blood-freedom-bose"
  }
];

export const seedTests = [
  {
    id: "test-nda-diagnostic-01",
    title: "NDA Starter Diagnostic",
    examId: "nda",
    mode: "mock",
    status: "published",
    visibility: "public",
    batchIds: [],
    attemptPolicy: { type: "limited", maxAttempts: 2 },
    resultRelease: { type: "immediate" },
    timing: { mode: "whole-test", durationMinutes: 20 },
    integrity: { tabSwitchWarnings: true, copyPasteWarning: true },
    sections: [
      {
        id: "gat",
        title: "GAT Sample",
        durationMinutes: null,
        questionIds: ["q-nda-001", "q-nda-003", "q-nda-004", "q-nda-005", "q-nda-006"]
      },
      {
        id: "math",
        title: "Mathematics Sample",
        durationMinutes: null,
        questionIds: ["q-nda-002"]
      }
    ],
    createdBy: "admin-demo",
    publishedAt: "2026-07-14T00:00:00.000Z"
  }
];

export const demoUsers = [
  {
    uid: "student-demo",
    role: "student",
    status: "active",
    name: "Aarav Student",
    email: "student@ledgr.test",
    batchIds: ["beta-a"],
    teacherSubjectIds: []
  },
  {
    uid: "teacher-demo",
    role: "teacher",
    status: "approved",
    name: "Meera Teacher",
    email: "teacher@ledgr.test",
    batchIds: [],
    teacherSubjectIds: ["nda-math", "nda-gat-english", "nda-gat-science", "nda-gat-gs"]
  },
  {
    uid: "teacher-pending-demo",
    role: "teacher",
    status: "pending",
    name: "Pending Teacher",
    email: "pending.teacher@ledgr.test",
    batchIds: [],
    teacherSubjectIds: ["nda-math"]
  },
  {
    uid: "admin-demo",
    role: "admin",
    status: "active",
    name: "Deepak Admin",
    email: "admin@ledgr.test",
    batchIds: [],
    teacherSubjectIds: []
  }
];

export const seedBatches = [
  {
    id: "beta-a",
    name: "Small Beta A",
    studentIds: ["student-demo"],
    assignedTestIds: ["test-nda-diagnostic-01"]
  }
];

export const ndaResources = [
  {
    title: "NDA written exam",
    body: "Mathematics carries 300 marks and GAT carries 600 marks. The written score and SSB score combine for final merit."
  },
  {
    title: "SSB overview",
    body: "Shortlisted candidates attend a five-day board covering screening, psychology, GTO tasks, interview and conference."
  },
  {
    title: "Medical readiness",
    body: "Height, weight, vision, dental, ENT and general medical standards should be checked early before the board."
  }
];

export const firestoreCollections = [
  "users",
  "exams",
  "subjects",
  "chapters",
  "questions",
  "imports",
  "tests",
  "attempts",
  "batches",
  "flags"
];
