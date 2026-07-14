export const pages = [
  { key: "home", label: "Home", href: "/" },
  { key: "written", label: "Written", href: "/written.html" },
  { key: "ssb", label: "SSB", href: "/ssb.html" },
  { key: "physical", label: "Physical", href: "/physical.html" },
  { key: "calendar", label: "Dates", href: "/calendar.html" },
  { key: "practice", label: "Practice", href: "/practice.html" },
  { key: "resources", label: "Resources", href: "/resources.html" }
];

export const exams = {
  nda: {
    label: "NDA",
    full: "National Defence Academy",
    minAge: 16.5,
    maxAge: 19.5,
    accepts: ["pcm_12", "other_12"],
    summary:
      "Best for 10+2 aspirants targeting Army, Navy or Air Force. The written paper is followed by a 900-mark SSB interview and medical examination.",
    note:
      "Army wing accepts any 10+2 stream. Navy and Air Force wings require Physics and Mathematics at 10+2 level.",
    journey: [
      "Check age, education and marital eligibility",
      "Apply on UPSC during the notification window",
      "Clear Mathematics and General Ability Test papers",
      "Attend the five-day SSB interview",
      "Clear medicals and join NDA Khadakwasla"
    ],
    scheme: [
      { paper: "Paper I", subject: "Mathematics", marks: "300", duration: "2.5 hrs" },
      { paper: "Paper II", subject: "General Ability Test", marks: "600", duration: "2.5 hrs" },
      { paper: "Stage II", subject: "SSB Interview", marks: "900", duration: "5 days" },
      { paper: "Total", subject: "Written + SSB", marks: "1800", duration: "Merit" }
    ],
    subjects: [
      { name: "Mathematics", weight: "300 marks", topics: "Algebra, trigonometry, calculus, vectors, statistics" },
      { name: "English", weight: "Part of GAT", topics: "Grammar, comprehension, vocabulary, usage" },
      { name: "General Science", weight: "Part of GAT", topics: "Physics, chemistry, biology and applied science" },
      { name: "General Studies", weight: "Part of GAT", topics: "History, geography, polity, economy and defence awareness" }
    ],
    cutoffs: [
      { label: "Written benchmark", value: "300-360 / 900", detail: "Recent NDA written cut-offs usually sit in this band." },
      { label: "Final benchmark", value: "650-720 / 1800", detail: "Final merit combines written marks and SSB performance." }
    ]
  },
  tes: {
    label: "TES",
    full: "Technical Entry Scheme",
    minAge: 16.5,
    maxAge: 19.5,
    accepts: ["pcm_12"],
    summary:
      "A 10+2 PCM route into the Army technical stream. There is no written exam; shortlisting is based on PCM merit and the SSB carries the real selection weight.",
    note: "Requires 10+2 Physics, Chemistry and Mathematics. Current Army notifications should be checked for batch-specific percentage criteria.",
    journey: [
      "Check PCM percentage and age window",
      "Apply on Join Indian Army",
      "Wait for merit-based SSB shortlisting",
      "Clear SSB interview and medicals",
      "Join training for the technical entry route"
    ],
    scheme: [
      { paper: "Stage I", subject: "PCM merit shortlisting", marks: "Merit", duration: "Batch specific" },
      { paper: "Stage II", subject: "SSB Interview", marks: "Selection", duration: "5 days" },
      { paper: "Stage III", subject: "Medical examination", marks: "Qualifying", duration: "Board" }
    ],
    subjects: [
      { name: "PCM Merit", weight: "Shortlisting", topics: "Physics, chemistry, mathematics aggregate" },
      { name: "SSB Readiness", weight: "Selection", topics: "OIR, PPDT, psychology, GTO, interview" },
      { name: "Medical Standards", weight: "Qualifying", topics: "Army height, weight, vision and general fitness" }
    ],
    cutoffs: [
      { label: "Shortlisting", value: "PCM merit", detail: "Varies by batch and applicant pool." },
      { label: "Written paper", value: "None", detail: "TES goes straight from merit shortlisting to SSB." }
    ]
  },
  cds: {
    label: "CDS",
    full: "Combined Defence Services",
    minAge: 19,
    maxAge: 25,
    accepts: ["grad_any", "grad_pcm"],
    summary:
      "A graduate route to IMA, INA, AFA and OTA. The written papers differ by academy, with OTA excluding Mathematics.",
    note:
      "AFA and some Navy routes require specific science or engineering background. OTA is the broadest graduate route.",
    journey: [
      "Pick academy preference and verify age range",
      "Apply through UPSC",
      "Clear English, GK and Mathematics where applicable",
      "Attend SSB interview",
      "Clear medicals and join the allotted academy"
    ],
    scheme: [
      { paper: "Paper I", subject: "English", marks: "100", duration: "2 hrs" },
      { paper: "Paper II", subject: "General Knowledge", marks: "100", duration: "2 hrs" },
      { paper: "Paper III", subject: "Elementary Mathematics", marks: "100", duration: "2 hrs" },
      { paper: "OTA", subject: "English + GK only", marks: "200", duration: "4 hrs total" },
      { paper: "SSB", subject: "Interview board", marks: "300", duration: "5 days" }
    ],
    subjects: [
      { name: "English", weight: "100 marks", topics: "Comprehension, grammar, vocabulary, ordering and spotting errors" },
      { name: "General Knowledge", weight: "100 marks", topics: "Current affairs, history, geography, polity, science" },
      { name: "Elementary Mathematics", weight: "100 marks", topics: "Arithmetic, algebra, geometry, trigonometry, statistics" }
    ],
    cutoffs: [
      { label: "IMA written benchmark", value: "115-135 / 300", detail: "A useful target band for recent IMA-oriented attempts." },
      { label: "OTA written benchmark", value: "80-105 / 200", detail: "OTA excludes Mathematics and has a separate merit track." }
    ]
  },
  afcat: {
    label: "AFCAT",
    full: "Air Force Common Admission Test",
    minAge: 20,
    maxAge: 26,
    accepts: ["grad_any", "grad_pcm"],
    summary:
      "A graduate route into Indian Air Force flying and ground duty branches. Flying branch has stricter age, education and medical filters.",
    note:
      "Flying branch generally needs Physics and Mathematics at 10+2 level plus graduation criteria. Technical branches require engineering fit.",
    journey: [
      "Verify branch-wise education and age",
      "Apply on AFCAT portal",
      "Clear AFCAT written paper",
      "Attend AFSB interview",
      "Clear medicals and branch allocation"
    ],
    scheme: [
      { paper: "AFCAT", subject: "General Awareness", marks: "84", duration: "Combined 2 hrs" },
      { paper: "AFCAT", subject: "Verbal Ability", marks: "60", duration: "Combined 2 hrs" },
      { paper: "AFCAT", subject: "Numerical Ability", marks: "48", duration: "Combined 2 hrs" },
      { paper: "AFCAT", subject: "Reasoning and Military Aptitude", marks: "108", duration: "Combined 2 hrs" },
      { paper: "AFSB", subject: "Interview board", marks: "Selection", duration: "5 days" }
    ],
    subjects: [
      { name: "General Awareness", weight: "84 marks", topics: "Current affairs, defence, history, geography, science" },
      { name: "Verbal Ability", weight: "60 marks", topics: "Reading, grammar, synonyms, antonyms" },
      { name: "Numerical Ability", weight: "48 marks", topics: "Arithmetic, percentages, ratio, time and work" },
      { name: "Military Aptitude", weight: "108 marks", topics: "Spatial ability, verbal reasoning, non-verbal reasoning" }
    ],
    cutoffs: [
      { label: "Written benchmark", value: "120-155 / 300", detail: "Recent AFCAT cut-offs often move inside this range." },
      { label: "Final merit", value: "Branch-wise", detail: "Final joining depends on AFSB, medical fitness and vacancies." }
    ]
  },
  capf: {
    label: "CAPF",
    full: "Central Armed Police Forces (Assistant Commandant)",
    minAge: 20,
    maxAge: 25,
    accepts: ["grad_any", "grad_pcm"],
    summary:
      "A graduate route to Assistant Commandant posts in BSF, CRPF, CISF, ITBP and SSB. Written, physical, medical and interview stages all matter.",
    note:
      "Age is generally counted as on 1 August of the exam year, with relaxations where applicable.",
    journey: [
      "Check age, degree and nationality conditions",
      "Apply through UPSC",
      "Clear Paper I and Paper II",
      "Clear PET, PST and medicals",
      "Attend personality test and join allotted force"
    ],
    scheme: [
      { paper: "Paper I", subject: "General Ability and Intelligence", marks: "250", duration: "2 hrs" },
      { paper: "Paper II", subject: "Essay, Precis and Comprehension", marks: "200", duration: "3 hrs" },
      { paper: "PET/PST", subject: "Physical tests", marks: "Qualifying", duration: "Board" },
      { paper: "Interview", subject: "Personality Test", marks: "150", duration: "Final stage" }
    ],
    subjects: [
      { name: "Paper I", weight: "250 marks", topics: "Aptitude, reasoning, science, current events, polity, history, geography" },
      { name: "Paper II", weight: "200 marks", topics: "Essay, precis, comprehension, arguments and grammar" },
      { name: "Physical Stage", weight: "Qualifying", topics: "PET, PST and medical standards" }
    ],
    cutoffs: [
      { label: "Written benchmark", value: "150-180 / 450", detail: "A broad preparation target before interview and final merit." },
      { label: "Final benchmark", value: "270-310 / 600", detail: "Final marks include the 150-mark interview." }
    ]
  }
};

export const educationOptions = [
  { value: "", label: "Select education stream" },
  { value: "pcm_12", label: "10+2 with PCM" },
  { value: "other_12", label: "10+2 Arts / Commerce" },
  { value: "grad_any", label: "Graduation - any stream" },
  { value: "grad_pcm", label: "Graduation with PCM background" }
];

export const calendarEvents = [
  {
    key: "nda",
    exam: "NDA",
    title: "NDA and NA II 2026",
    notification: "20 May 2026",
    lastDate: "9 Jun 2026",
    examDate: "13 Sep 2026",
    status: "Applications closed; exam ahead",
    href: "https://www.upsc.gov.in/examinations/National%20Defence%20Academy%20and%20Naval%20Academy%20Examination%20%28II%29%2C%202026"
  },
  {
    key: "cds",
    exam: "CDS",
    title: "CDS II 2026",
    notification: "20 May 2026",
    lastDate: "11 Jun 2026",
    examDate: "13 Sep 2026",
    status: "Applications closed; exam ahead",
    href: "https://www.upsc.gov.in/examinations/Combined%20Defence%20Services%20Examination%20%28II%29%2C%202026"
  },
  {
    key: "capf",
    exam: "CAPF",
    title: "CAPF AC 2026",
    notification: "Listed by UPSC",
    lastDate: "Verify active notice",
    examDate: "2026 cycle",
    status: "Use UPSC active exams page",
    href: "https://www.upsc.gov.in/examinations/active-exams"
  },
  {
    key: "afcat",
    exam: "AFCAT",
    title: "AFCAT 02/2026",
    notification: "IAF portal",
    lastDate: "Verify portal",
    examDate: "2026 cycle",
    status: "Check AFCAT dashboard",
    href: "https://afcat.cdac.in/"
  },
  {
    key: "tes",
    exam: "TES",
    title: "Technical Entry Scheme",
    notification: "Army portal",
    lastDate: "Batch specific",
    examDate: "No written exam",
    status: "Watch Join Indian Army",
    href: "https://joinindianarmy.nic.in/"
  }
];

export const paperArchive = [
  { exam: "NDA", title: "NDA I 2026 - Mathematics and GAT", tags: ["Official", "UPSC", "2026"], href: "https://www.upsc.gov.in/examinations/previous-question-papers" },
  { exam: "CDS", title: "CDS I 2026 - English, GK and Mathematics", tags: ["Official", "UPSC", "2026"], href: "https://www.upsc.gov.in/examinations/previous-question-papers" },
  { exam: "NDA", title: "NDA II 2025 - Mathematics and GAT", tags: ["Official", "UPSC", "2025"], href: "https://www.upsc.gov.in/examinations/previous-question-papers" },
  { exam: "CAPF", title: "CAPF AC papers and answer booklets", tags: ["Official", "UPSC"], href: "https://www.upsc.gov.in/examinations/previous-question-papers" },
  { exam: "AFCAT", title: "AFCAT sample and instructions", tags: ["IAF", "Portal"], href: "https://afcat.cdac.in/" }
];

export const practiceQuestions = [
  {
    prompt: "Which stage comes immediately after the NDA written examination for shortlisted candidates?",
    options: ["Medical board", "SSB interview", "Final merit list", "Academy joining"],
    answer: 1,
    explanation: "Shortlisted candidates attend the SSB interview before medicals and final merit."
  },
  {
    prompt: "Which CDS route normally excludes the Mathematics paper?",
    options: ["IMA", "INA", "AFA", "OTA"],
    answer: 3,
    explanation: "OTA candidates take English and General Knowledge, not Elementary Mathematics."
  },
  {
    prompt: "CAPF Paper II is primarily designed to test which skill group?",
    options: ["Essay and comprehension", "Only mathematics", "Only physical endurance", "Only map reading"],
    answer: 0,
    explanation: "CAPF Paper II covers essay, precis, comprehension and language ability."
  }
];

export const progressItems = [
  "Read current official notification",
  "Solve one previous year paper",
  "Revise weak topics for 90 minutes",
  "Practice 10 SSB psychology responses",
  "Complete one running or strength session",
  "Review mistakes and update next week plan"
];

export const officialLinks = [
  { title: "UPSC Active Examinations", label: "Current UPSC defence notices", href: "https://www.upsc.gov.in/examinations/active-exams" },
  { title: "UPSC Previous Question Papers", label: "Official paper archive", href: "https://www.upsc.gov.in/examinations/previous-question-papers" },
  { title: "AFCAT Portal", label: "Indian Air Force application and selection portal", href: "https://afcat.cdac.in/" },
  { title: "Join Indian Army", label: "TES and Army officer entry notifications", href: "https://joinindianarmy.nic.in/" },
  { title: "UPSC Online", label: "Application portal for UPSC exams", href: "https://upsconline.nic.in/" }
];

export const faqs = [
  {
    q: "Is Defence Sprouts affiliated with UPSC or the armed forces?",
    a: "No. It is an educational resource. Always verify eligibility, dates and rules with the official portal before acting."
  },
  {
    q: "Why keep the site as static pages?",
    a: "The current product is mostly reference and study planning. Static pages are fast, cheap to host and easy to maintain."
  },
  {
    q: "Can this become a logged-in student portal later?",
    a: "Yes. The next natural step is a persistent question bank, saved progress, admin-managed papers and reminders."
  }
];
