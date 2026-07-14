import "./styles.css";
import {
  calendarEvents,
  educationOptions,
  exams,
  faqs,
  officialLinks,
  pages,
  paperArchive,
  practiceQuestions,
  progressItems
} from "./data.js";

const pageKey = document.body.dataset.page || "home";
let currentExam = document.body.dataset.defaultExam || "nda";
let currentQuestion = 0;

function $(selector, root = document) {
  return root.querySelector(selector);
}

function $all(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

function pagePath(path) {
  if (path === "/") return "/";
  return path.replace(".html", "");
}

function renderHeader() {
  const header = $("[data-site-header]");
  if (!header) return;

  header.innerHTML = `
    <div class="site-header-inner">
      <a class="brand" href="/" aria-label="Defence Sprouts home">
        <span>Defence</span>
        <strong>Sprouts</strong>
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
      <nav class="site-nav" id="site-nav" aria-label="Primary navigation">
        ${pages
          .map(
            (page) => `
              <a class="${page.key === pageKey ? "active" : ""}" href="${page.href}" data-nav-link="${page.key}">
                ${page.label}
              </a>
            `
          )
          .join("")}
      </nav>
    </div>
  `;

  const toggle = $(".nav-toggle", header);
  const nav = $(".site-nav", header);
  toggle?.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}

function renderFooter() {
  const footer = $("[data-site-footer]");
  if (!footer) return;

  footer.innerHTML = `
    <div class="footer-inner">
      <div>
        <a class="brand footer-brand" href="/">
          <span>Defence</span>
          <strong>Sprouts</strong>
        </a>
        <p>Structured preparation for NDA, TES, CDS, AFCAT and CAPF aspirants.</p>
      </div>
      <div class="footer-links">
        <a href="/resources.html">Official sources</a>
        <a href="https://upsc.gov.in" target="_blank" rel="noreferrer">UPSC</a>
        <a href="https://afcat.cdac.in" target="_blank" rel="noreferrer">AFCAT</a>
        <a href="https://joinindianarmy.nic.in" target="_blank" rel="noreferrer">Join Indian Army</a>
      </div>
      <p class="footer-note">
        Educational resource only. Reviewed against available public sources on 14 Jul 2026.
        Verify active notifications before applying.
      </p>
    </div>
  `;
}

function renderExamSwitchers() {
  $all("[data-exam-switcher]").forEach((container) => {
    container.classList.add("exam-switcher");
    container.innerHTML = Object.entries(exams)
      .map(
        ([key, exam]) => `
          <button class="chip ${key === currentExam ? "active" : ""}" type="button" data-exam-key="${key}">
            ${exam.label}
          </button>
        `
      )
      .join("");
  });

  $all("[data-exam-key]").forEach((button) => {
    button.addEventListener("click", () => {
      setCurrentExam(button.dataset.examKey);
    });
  });
}

function setCurrentExam(key) {
  if (!exams[key]) return;
  currentExam = key;
  renderExamViews();
}

function syncExamButtons() {
  $all("[data-exam-key]").forEach((button) => {
    button.classList.toggle("active", button.dataset.examKey === currentExam);
  });
}

function renderExamViews() {
  const exam = exams[currentExam] || exams.nda;

  const label = $("[data-exam-label]");
  if (label) label.textContent = exam.label;

  const title = $("[data-exam-title]");
  if (title) title.textContent = exam.full;

  const summary = $("[data-exam-summary]");
  if (summary) summary.textContent = exam.summary;

  const note = $("[data-exam-note]");
  if (note) note.textContent = exam.note;

  renderJourney(exam);
  renderScheme(exam);
  renderSubjects(exam);
  renderCutoffs(exam);
  syncExamButtons();
}

function renderJourney(exam) {
  const container = $("[data-journey]");
  if (!container) return;

  container.innerHTML = `
    <ol class="journey-list">
      ${exam.journey
        .map(
          (step, index) => `
            <li>
              <span>${String(index + 1).padStart(2, "0")}</span>
              <p>${step}</p>
            </li>
          `
        )
        .join("")}
    </ol>
  `;
}

function renderScheme(exam) {
  const container = $("[data-scheme]");
  if (!container) return;

  container.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Stage</th>
            <th>Subject / Component</th>
            <th>Marks</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          ${exam.scheme
            .map(
              (row) => `
                <tr>
                  <td>${row.paper}</td>
                  <td>${row.subject}</td>
                  <td>${row.marks}</td>
                  <td>${row.duration}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
    <p class="source-note">${exam.note}</p>
  `;
}

function renderSubjects(exam) {
  const container = $("[data-subjects]");
  if (!container) return;

  container.innerHTML = exam.subjects
    .map(
      (subject, index) => `
        <article class="subject-card">
          <span class="card-kicker">${String(index + 1).padStart(2, "0")}</span>
          <h3>${subject.name}</h3>
          <strong>${subject.weight}</strong>
          <p>${subject.topics}</p>
        </article>
      `
    )
    .join("");
}

function renderCutoffs(exam) {
  const container = $("[data-cutoffs]");
  if (!container) return;

  container.innerHTML = `
    <div class="cutoff-grid">
      ${exam.cutoffs
        .map(
          (item) => `
            <article class="cutoff-card">
              <span>${item.label}</span>
              <strong>${item.value}</strong>
              <p>${item.detail}</p>
            </article>
          `
        )
        .join("")}
    </div>
    <p class="source-note">Benchmarks are preparation targets, not a promise of current official cut-offs.</p>
  `;
}

function renderEligibility() {
  const container = $("[data-eligibility]");
  if (!container) return;

  container.innerHTML = `
    <form class="eligibility-form">
      <label>
        <span>Date of birth</span>
        <input type="date" name="dob" required />
      </label>
      <label>
        <span>Education stream</span>
        <select name="education">
          ${educationOptions.map((option) => `<option value="${option.value}">${option.label}</option>`).join("")}
        </select>
      </label>
    </form>
    <div class="eligibility-results" data-eligibility-results>
      <p class="empty-state">Enter your details to compare all tracked defence entries.</p>
    </div>
  `;

  const form = $(".eligibility-form", container);
  form.addEventListener("input", () => updateEligibility(container));
  form.addEventListener("change", () => updateEligibility(container));
}

function ageInYears(dob) {
  const now = new Date();
  return (now.getTime() - dob.getTime()) / (365.2425 * 24 * 60 * 60 * 1000);
}

function updateEligibility(container) {
  const form = $(".eligibility-form", container);
  const results = $("[data-eligibility-results]", container);
  const dobValue = form.elements.dob.value;
  const education = form.elements.education.value;

  if (!dobValue || !education) {
    results.innerHTML = `<p class="empty-state">Add date of birth and stream to see the comparison.</p>`;
    return;
  }

  const age = ageInYears(new Date(`${dobValue}T00:00:00`));
  results.innerHTML = `
    <div class="result-summary">Current age: <strong>${age.toFixed(1)} years</strong></div>
    <div class="result-grid">
      ${Object.values(exams)
        .map((exam) => {
          const streamOk = exam.accepts.includes(education);
          let state = "Eligible window";
          let tone = "good";
          if (!streamOk) {
            state = "Stream mismatch";
            tone = "muted";
          } else if (age < exam.minAge) {
            state = "Too early";
            tone = "warn";
          } else if (age > exam.maxAge) {
            state = "Window closed";
            tone = "danger";
          }
          return `
            <article class="elig-result ${tone}">
              <span>${exam.label}</span>
              <strong>${state}</strong>
              <p>${exam.minAge}-${exam.maxAge} years</p>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderCalendar() {
  const full = $("[data-calendar]");
  const preview = $("[data-calendar-preview]");
  if (full) full.innerHTML = calendarMarkup(calendarEvents);
  if (preview) preview.innerHTML = calendarMarkup(calendarEvents.slice(0, 3), true);
}

function calendarMarkup(events, compact = false) {
  return `
    <div class="${compact ? "timeline-grid compact-grid" : "timeline-grid"}">
      ${events
        .map(
          (event) => `
            <article class="event-card">
              <span class="status-pill">${event.exam}</span>
              <h3>${event.title}</h3>
              <dl>
                <div><dt>Notification</dt><dd>${event.notification}</dd></div>
                <div><dt>Last date</dt><dd>${event.lastDate}</dd></div>
                <div><dt>Exam</dt><dd>${event.examDate}</dd></div>
              </dl>
              <p>${event.status}</p>
              <a class="text-link" href="${event.href}" target="_blank" rel="noreferrer">Official link</a>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderPaperArchive() {
  const container = $("[data-paper-archive]");
  if (!container) return;

  container.innerHTML = `
    <div class="paper-grid">
      ${paperArchive
        .map(
          (paper) => `
            <article class="paper-card">
              <span class="status-pill">${paper.exam}</span>
              <h3>${paper.title}</h3>
              <div class="tag-row">${paper.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>
              <a class="btn compact" href="${paper.href}" target="_blank" rel="noreferrer">Open source</a>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderTopicPractice() {
  const container = $("[data-topic-practice]");
  if (!container) return;

  const question = practiceQuestions[currentQuestion];
  container.innerHTML = `
    <span class="card-kicker">Question ${currentQuestion + 1} of ${practiceQuestions.length}</span>
    <h3>${question.prompt}</h3>
    <div class="option-list">
      ${question.options
        .map(
          (option, index) => `
            <button type="button" data-answer="${index}">
              <span>${String.fromCharCode(65 + index)}</span>
              ${option}
            </button>
          `
        )
        .join("")}
    </div>
    <p class="quiz-feedback" data-quiz-feedback></p>
    <button class="btn compact" type="button" data-next-question>Next prompt</button>
  `;

  $all("[data-answer]", container).forEach((button) => {
    button.addEventListener("click", () => {
      const chosen = Number(button.dataset.answer);
      const correct = chosen === question.answer;
      $all("[data-answer]", container).forEach((item) => item.classList.remove("correct", "wrong"));
      button.classList.add(correct ? "correct" : "wrong");
      $("[data-quiz-feedback]", container).textContent = correct ? question.explanation : `Not quite. ${question.explanation}`;
    });
  });

  $("[data-next-question]", container).addEventListener("click", () => {
    currentQuestion = (currentQuestion + 1) % practiceQuestions.length;
    renderTopicPractice();
  });
}

function progressKey(item) {
  return `defspr-progress-${item}`;
}

function renderProgressBoard() {
  const container = $("[data-progress-board]");
  if (!container) return;

  container.innerHTML = progressItems
    .map((item) => {
      const checked = localStorage.getItem(progressKey(item)) === "1";
      return `
        <label class="progress-item">
          <input type="checkbox" ${checked ? "checked" : ""} data-progress-item="${item}" />
          <span>${item}</span>
        </label>
      `;
    })
    .join("");

  $all("[data-progress-item]", container).forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      localStorage.setItem(progressKey(checkbox.dataset.progressItem), checkbox.checked ? "1" : "0");
    });
  });

  $("[data-reset-progress]")?.addEventListener("click", () => {
    progressItems.forEach((item) => localStorage.removeItem(progressKey(item)));
    renderProgressBoard();
  });
}

function initTabs() {
  $all("[data-tabs]").forEach((tabs) => {
    $all("[data-tab-button]", tabs).forEach((button) => {
      button.addEventListener("click", () => {
        const tab = button.dataset.tabButton;
        $all("[data-tab-button]", tabs).forEach((item) => item.classList.toggle("active", item === button));
        $all("[data-tab-panel]", tabs).forEach((panel) => panel.classList.toggle("active", panel.dataset.tabPanel === tab));
      });
    });
  });
}

function renderOfficialLinks() {
  const container = $("[data-official-links]");
  if (!container) return;

  container.innerHTML = officialLinks
    .map(
      (link, index) => `
        <a class="feature-card" href="${link.href}" target="_blank" rel="noreferrer">
          <span class="card-kicker">${String(index + 1).padStart(2, "0")}</span>
          <h3>${link.title}</h3>
          <p>${link.label}</p>
        </a>
      `
    )
    .join("");
}

function renderFaqs() {
  const container = $("[data-faqs]");
  if (!container) return;

  container.innerHTML = faqs
    .map(
      (item) => `
        <details>
          <summary>${item.q}</summary>
          <p>${item.a}</p>
        </details>
      `
    )
    .join("");
}

function boot() {
  renderHeader();
  renderFooter();
  renderExamSwitchers();
  renderExamViews();
  renderEligibility();
  renderCalendar();
  renderPaperArchive();
  renderTopicPractice();
  renderProgressBoard();
  renderOfficialLinks();
  renderFaqs();
  initTabs();

  document.documentElement.style.setProperty("--active-page", pagePath(window.location.pathname));
}

boot();
