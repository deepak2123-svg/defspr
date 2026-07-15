export const roles = {
  super_admin: {
    label: "Super Admin",
    home: "/admin",
    description: "Create institute groups, standalone institutes, admin invites, pricing, credits and audit views."
  },
  group_admin: {
    label: "Group Admin",
    home: "/admin",
    description: "View one institute group, its institutes, credit usage and setup status."
  },
  institute_admin: {
    label: "Institute Admin",
    home: "/admin",
    description: "View one institute setup, credit status and invited admin scope."
  },
  admin: {
    label: "Super Admin",
    home: "/admin",
    description: "Legacy admin alias mapped to Super Admin membership."
  },
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
    role: "super_admin",
    status: "active",
    name: "Deepak Admin",
    email: "admin@ledgr.test",
    batchIds: [],
    teacherSubjectIds: [],
    memberships: [
      {
        id: "membership-admin-demo-platform",
        userId: "admin-demo",
        role: "super_admin",
        scopeType: "platform",
        groupId: null,
        instituteId: null,
        status: "active",
        createdAt: "2026-07-15T00:00:00.000Z"
      }
    ],
    scopeKeys: ["platform:super_admin"]
  },
  {
    uid: "zee-group-admin-demo",
    role: "group_admin",
    status: "active",
    name: "ZEE Group Admin",
    email: "group.admin@zee.test",
    batchIds: [],
    teacherSubjectIds: [],
    memberships: [
      {
        id: "membership-zee-group-admin-demo",
        userId: "zee-group-admin-demo",
        role: "group_admin",
        scopeType: "group",
        groupId: "group-zee",
        instituteId: null,
        status: "active",
        createdAt: "2026-07-15T00:00:00.000Z"
      }
    ],
    scopeKeys: ["group:group-zee:group_admin"]
  },
  {
    uid: "zee-delhi-admin-demo",
    role: "institute_admin",
    status: "active",
    name: "ZEE Delhi Admin",
    email: "delhi.admin@zee.test",
    batchIds: [],
    teacherSubjectIds: [],
    memberships: [
      {
        id: "membership-zee-delhi-admin-demo",
        userId: "zee-delhi-admin-demo",
        role: "institute_admin",
        scopeType: "institute",
        groupId: "group-zee",
        instituteId: "inst-zee-delhi",
        status: "active",
        createdAt: "2026-07-15T00:00:00.000Z"
      }
    ],
    scopeKeys: ["institute:inst-zee-delhi:institute_admin"]
  }
];

export const seedInstituteGroups = [
  {
    id: "group-zee",
    name: "ZEE Group",
    code: "ZEE",
    status: "active",
    createdAt: "2026-07-15T00:00:00.000Z",
    updatedAt: "2026-07-15T00:00:00.000Z"
  }
];

export const seedInstitutes = [
  {
    id: "inst-zee-delhi",
    groupId: "group-zee",
    name: "ZEE Delhi",
    code: "ZEE-DEL",
    city: "Delhi",
    state: "Delhi",
    address: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    status: "active",
    createdAt: "2026-07-15T00:00:00.000Z",
    updatedAt: "2026-07-15T00:00:00.000Z"
  },
  {
    id: "inst-zee-pune",
    groupId: "group-zee",
    name: "ZEE Pune",
    code: "ZEE-PUN",
    city: "Pune",
    state: "Maharashtra",
    address: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    status: "active",
    createdAt: "2026-07-15T00:00:00.000Z",
    updatedAt: "2026-07-15T00:00:00.000Z"
  },
  {
    id: "inst-defence-sprouts",
    groupId: null,
    name: "Defence Sprouts",
    code: "DS",
    city: "Pune",
    state: "Maharashtra",
    address: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    status: "active",
    createdAt: "2026-07-15T00:00:00.000Z",
    updatedAt: "2026-07-15T00:00:00.000Z"
  }
];

export const seedMemberships = demoUsers.flatMap((user) => user.memberships || []);

export const seedBillingAccounts = [
  {
    id: "billing-group-group-zee",
    ownerType: "group",
    groupId: "group-zee",
    instituteId: null,
    purchasedCredits: 10000,
    usedCredits: 7420,
    remainingCredits: 2580,
    validityStart: "2026-04-01",
    validityEnd: "2027-03-31",
    status: "active",
    createdAt: "2026-07-15T00:00:00.000Z",
    updatedAt: "2026-07-15T00:00:00.000Z"
  },
  {
    id: "billing-institute-inst-defence-sprouts",
    ownerType: "institute",
    groupId: null,
    instituteId: "inst-defence-sprouts",
    purchasedCredits: 500,
    usedCredits: 0,
    remainingCredits: 500,
    validityStart: "2026-04-01",
    validityEnd: "2027-03-31",
    status: "active",
    createdAt: "2026-07-15T00:00:00.000Z",
    updatedAt: "2026-07-15T00:00:00.000Z"
  }
];

export const seedCreditLedger = [
  {
    id: "credit-zee-purchase",
    billingAccountId: "billing-group-group-zee",
    type: "purchase",
    quantity: 10000,
    amount: 1490000,
    paymentReference: "seed-zee",
    note: "Initial ZEE group prepaid credits",
    createdBy: "admin-demo",
    createdAt: "2026-07-15T00:00:00.000Z"
  },
  {
    id: "credit-zee-activation-sample",
    billingAccountId: "billing-group-group-zee",
    type: "activation",
    quantity: 7420,
    amount: 0,
    paymentReference: "",
    note: "Sample active student usage",
    createdBy: "system",
    createdAt: "2026-07-15T00:00:00.000Z"
  },
  {
    id: "credit-ds-purchase",
    billingAccountId: "billing-institute-inst-defence-sprouts",
    type: "purchase",
    quantity: 500,
    amount: 74500,
    paymentReference: "seed-ds",
    note: "Initial standalone institute credits",
    createdBy: "admin-demo",
    createdAt: "2026-07-15T00:00:00.000Z"
  }
];

export const seedInvites = [];

export const seedAuditLogs = [
  {
    id: "audit-seed-setup",
    actorUid: "system",
    actorName: "System",
    action: "seed.super_admin_foundation",
    targetType: "platform",
    targetId: "ledgr",
    scope: { scopeType: "platform" },
    metadata: { groups: 1, institutes: 3 },
    createdAt: "2026-07-15T00:00:00.000Z"
  }
];

export const seedPlatformSettings = {
  pricing: {
    id: "pricing",
    pricePerStudent: 149,
    currency: "INR",
    updatedAt: "2026-07-15T00:00:00.000Z",
    updatedBy: "seed"
  }
};

export const seedBatches = [
  {
    id: "beta-a",
    name: "Small Beta A",
    studentIds: ["student-demo"],
    assignedTestIds: ["test-nda-diagnostic-01"]
  }
];

export const firestoreCollections = [
  "users",
  "memberships",
  "instituteGroups",
  "institutes",
  "invites",
  "billingAccounts",
  "creditLedger",
  "platformSettings",
  "auditLogs",
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
