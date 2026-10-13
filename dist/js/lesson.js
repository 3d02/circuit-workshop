// Renders a chapter: prose interleaved with live figures, predictions,
// callouts and a short end-of-chapter check.

import { Figure } from "./figure.js";
import { progress } from "./progress.js";
import { esc } from "./format.js";
import { renderFormula, renderProblems, renderBench, renderScene } from "./blocks.js";
import { linkTerms } from "./terms.js";

const NOTE_KINDS = {
  myth: { icon: "✕", title: "Common misconception" },
  safety: { icon: "!", title: "Safety" },
  repair: { icon: "⚒", title: "Repair tip" },
  build: { icon: "⌁", title: "Try it for real" },
  deeper: { icon: "+", title: "Going deeper" },
  analogy: { icon: "≈", title: "A picture to hold on to" },
};

// Every trackable task in a chapter: goals, predictions, quizzes, custom activities.
export function chapterTasks(chapter) {
  const ids = [];
  for (const b of chapter.blocks) {
    if (b.type === "figure") for (const g of b.spec.goals || []) ids.push(g.id);
    if (b.type === "predict" || b.type === "quiz") ids.push(b.id);
    if ((b.type === "custom" || b.type === "scene") && b.tasks) ids.push(...b.tasks);
    if (b.type === "problems") ids.push(...b.items.map((p) => p.id));
    if (b.type === "bench") ids.push(b.id);
  }
  return ids;
}

// "{{ch:voltage}}" in lesson text becomes a link reading "chapter 3" (or "Chapter 3" for {{Ch:…}}).
export function resolveRefs(text, chapters) {
  return text.replace(/\{\{(ch|Ch):([\w-]+)\}\}/g, (_, word, id) => {
    const target = chapters.find((c) => c.id === id);
    return target ? `<a href="#${id}">${word === "Ch" ? "Chapter" : "chapter"} ${target.num}</a>` : id;
  });
}

// Chapter links and tappable terms, in every piece of text a block carries.
// Figure specs are left alone: they hold functions and live part objects.
function withRefs(block, chapters) {
  const walk = (v, key) => {
    if (typeof v === "string") return key === "id" || key === "type" || key === "scene" ? v : linkTerms(resolveRefs(v, chapters));
    if (Array.isArray(v)) return v.map((x) => walk(x));
    if (v && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype) {
      const out = {};
      for (const [k, x] of Object.entries(v)) out[k] = k === "spec" || typeof x === "function" ? x : walk(x, k);
      return out;
    }
    return v;
  };
  return walk(block);
}

export function renderChapter(chapter, main, nav) {
  chapter = { ...chapter, blocks: chapter.blocks.map((b) => withRefs(b, nav.chapters || [])) };
  const figures = new Map();
  const cleanups = [];
  const tasks = chapterTasks(chapter);
  main.innerHTML = `
    <article class="chapter">
      <header class="chapter-head">
        <div class="eyebrow">Chapter ${chapter.num} · ${chapter.part}</div>
        <h1>${chapter.title}</h1>
        <p class="lede">${chapter.lede}</p>
        <div class="chapter-meta"><span>⏱ about ${chapter.minutes} min</span><span class="chapter-count"></span></div>
        ${chapter.goals ? `<div class="learn-list"><strong>By the end you'll be able to</strong><ul>${chapter.goals.map((g) => `<li>${g}</li>`).join("")}</ul></div>` : ""}
      </header>
      <div class="blocks"></div>
      <footer class="chapter-foot"></footer>
    </article>`;
  const blocks = main.querySelector(".blocks");
  blocks.addEventListener("task", () => updateCount());

  for (const b of chapter.blocks) {
    if (typeof b === "string") {
      blocks.insertAdjacentHTML("beforeend", `<div class="prose">${b}</div>`);
      continue;
    }
    const el = document.createElement("section");
    blocks.append(el);
    if (b.type === "h2") {
      el.className = "prose";
      el.innerHTML = `<h2 id="${b.id || slug(b.text)}">${b.text}</h2>`;
    } else if (b.type === "figure") {
      el.className = `figure-wrap ${b.wide === false ? "" : "wide"}`;
      const host = document.createElement("div");
      el.append(host);
      const fig = new Figure(host, b.spec);
      figures.set(b.id, fig);
      if (b.caption) el.insertAdjacentHTML("beforeend", `<p class="caption">${b.caption}</p>`);
      fig.on((type) => type === "goal" && updateCount());
    } else if (b.type === "predict") {
      renderPredict(el, b, figures, updateCount);
    } else if (b.type === "note") {
      const kind = NOTE_KINDS[b.kind] || NOTE_KINDS.deeper;
      el.className = `prose note note-${b.kind}`;
      if (b.kind === "deeper") el.innerHTML = `<details><summary><span class="note-icon">${kind.icon}</span>${b.title || kind.title}</summary><div class="note-body">${b.html}</div></details>`;
      else el.innerHTML = `<div class="note-head"><span class="note-icon">${kind.icon}</span>${b.title || kind.title}</div><div class="note-body">${b.html}</div>`;
    } else if (b.type === "quiz") {
      renderQuiz(el, b, updateCount);
    } else if (b.type === "formula") {
      renderFormula(el, b);
    } else if (b.type === "problems") {
      renderProblems(el, b, updateCount);
    } else if (b.type === "bench") {
      renderBench(el, b, updateCount);
    } else if (b.type === "scene") {
      cleanups.push(renderScene(el, b, { updateCount }));
    } else if (b.type === "custom") {
      el.className = b.wide === false ? "prose" : "custom-wrap wide";
      const done = b.render(el, { figures, updateCount });
      if (typeof done === "function") cleanups.push(done);
    }
  }

  function updateCount() {
    const n = progress.count(tasks);
    main.querySelector(".chapter-count").textContent = tasks.length ? `✓ ${n} of ${tasks.length} activities done` : "";
  }
  updateCount();

  main.querySelector(".chapter-foot").innerHTML = `
    ${nav.prev ? `<a class="foot-link prev" href="#${nav.prev.id}"><small>← Chapter ${nav.prev.num}</small>${nav.prev.title}</a>` : "<span></span>"}
    ${nav.next ? `<a class="foot-link next" href="#${nav.next.id}"><small>Chapter ${nav.next.num} →</small>${nav.next.title}</a>` : `<a class="foot-link next" href="#home"><small>You made it →</small>Back to the course map</a>`}`;

  return () => cleanups.forEach((fn) => fn());
}

function renderPredict(el, b, figures, onDone) {
  el.className = "prose predict";
  el.innerHTML = `
    <div class="predict-card">
      <div class="eyebrow">${b.eyebrow || "Predict first"}</div>
      <h3>${b.q}</h3>
      ${b.detail ? `<p class="predict-detail">${b.detail}</p>` : ""}
      <div class="choices">${b.choices.map((c, i) => `<button type="button" data-i="${i}">${c}</button>`).join("")}</div>
      <div class="predict-result" hidden></div>
    </div>`;
  const result = el.querySelector(".predict-result");
  const buttons = [...el.querySelectorAll(".choices button")];

  const show = (choice, fresh) => {
    const correct = choice === b.answer;
    buttons.forEach((btn, i) => {
      btn.disabled = true;
      btn.classList.toggle("chosen", i === choice);
      btn.classList.toggle("right", i === b.answer);
      btn.classList.toggle("wrong", i === choice && !correct);
    });
    const why = b.why?.[choice];
    result.hidden = false;
    result.innerHTML = `
      <p class="verdict ${correct ? "good" : "bad"}">${correct ? "You predicted it." : "Not quite — and that's useful."} ${why && !correct ? why : ""}</p>
      <div class="explain">${b.explain}</div>
      ${b.reveal ? `<button type="button" class="btn small outline reveal">${b.revealLabel || "Show me in the circuit"} ↑</button>` : ""}`;
    result.querySelector(".reveal")?.addEventListener("click", () => runReveal(true));
    if (fresh) {
      progress.answer(b.id, choice, correct);
      onDone();
      runReveal(true);
    }
  };

  const runReveal = (scroll) => {
    if (!b.reveal) return;
    const fig = figures.get(b.figure);
    if (!fig) return;
    b.reveal(fig);
    if (scroll) {
      const r = fig.host.getBoundingClientRect();
      if (r.bottom < 80 || r.top > innerHeight - 120) fig.host.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
      fig.host.classList.remove("pulse");
      void fig.host.offsetWidth;
      fig.host.classList.add("pulse");
    }
  };

  buttons.forEach((btn) => (btn.onclick = () => show(+btn.dataset.i, true)));
  const prior = progress.answerOf(b.id);
  if (prior) show(prior.choice, false);
}

function renderQuiz(el, b, onDone) {
  el.className = "prose quiz";
  const answers = new Map();
  el.innerHTML = `
    <div class="quiz-card">
      <div class="eyebrow">Check your understanding</div>
      <h3>${b.title || "Quick check"}</h3>
      ${b.questions
        .map(
          (q, qi) => `
        <div class="quiz-q" data-q="${qi}">
          <p class="quiz-text"><span>${qi + 1}</span>${q.q}</p>
          <div class="choices">${q.choices.map((c, i) => `<button type="button" data-i="${i}">${c}</button>`).join("")}</div>
          <p class="quiz-explain" hidden></p>
        </div>`,
        )
        .join("")}
      <p class="quiz-score" hidden></p>
    </div>`;
  el.querySelectorAll(".quiz-q").forEach((box) => {
    const qi = +box.dataset.q;
    const q = b.questions[qi];
    const buttons = [...box.querySelectorAll("button")];
    buttons.forEach((btn) => {
      btn.onclick = () => {
        const i = +btn.dataset.i;
        if (answers.has(qi)) return;
        answers.set(qi, i === q.answer);
        buttons.forEach((x, k) => {
          x.disabled = true;
          x.classList.toggle("right", k === q.answer);
          x.classList.toggle("wrong", k === i && i !== q.answer);
        });
        const ex = box.querySelector(".quiz-explain");
        ex.hidden = false;
        ex.innerHTML = `<strong>${i === q.answer ? "Right." : "Not quite."}</strong> ${q.explain}`;
        if (answers.size === b.questions.length) {
          const score = [...answers.values()].filter(Boolean).length;
          const s = el.querySelector(".quiz-score");
          s.hidden = false;
          s.innerHTML = `${score} of ${b.questions.length} correct. ${score === b.questions.length ? "Solid — on to the next chapter." : "Worth a second look at the figures above before moving on."} <button type="button" class="linkish retry">Try again</button>`;
          s.querySelector(".retry").onclick = () => renderQuiz(el, b, onDone);
          progress.answer(b.id, score, score === b.questions.length);
          onDone();
        }
      };
    });
  });
}

export const slug = (s) =>
  String(s)
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export { esc };
