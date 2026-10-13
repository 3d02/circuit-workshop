// Lesson blocks added for the physics-first course:
//   formula  – a formula card: the equation, every symbol with its unit, where it
//              comes from, where you meet it, and a worked example
//   problems – "Get a pencil": problems worked on paper, answers typed in and checked
//   bench    – "At the meter": an exercise on the learner's own BM235
//   scene    – a 3D WebGL scene, loaded on demand from js/scenes/

import { progress } from "./progress.js";
import { check, feedback } from "./quantity.js";

const LEVELS = { 1: "Warm-up", 2: "Standard", 3: "Stretch" };

// ---------- formula cards ----------

export function renderFormula(el, b) {
  el.className = "prose formula-card";
  el.id = `f-${b.id}`;
  el.innerHTML = `
    <div class="fc-top">
      <div class="fc-eqbox">
        <div class="fc-name">${b.name}</div>
        <div class="fc-eq${b.eq.replace(/<[^>]+>/g, "").length > 16 ? " long" : ""}">${b.eq}</div>
        ${b.alt?.length ? `<div class="fc-alt">${b.alt.map((a) => `<span>${a}</span>`).join("")}</div>` : ""}
      </div>
      <dl class="fc-vars">${b.vars.map(([sym, what, unit]) => `<div><dt>${sym}</dt><dd>${what}${unit ? `<span>${unit}</span>` : ""}</dd></div>`).join("")}</dl>
    </div>
    ${b.why || b.use ? `<div class="fc-cols">${b.why ? `<div><h4>Where it comes from</h4>${b.why}</div>` : ""}${b.use ? `<div><h4>Where you'll meet it</h4>${b.use}</div>` : ""}</div>` : ""}
    ${b.example ? `<details class="fc-example"><summary>Worked example</summary><div class="fc-example-body">${b.example}</div></details>` : ""}`;
}

// ---------- pencil-and-paper problems ----------

export function renderProblems(el, b, onDone) {
  el.className = "prose problems";
  el.innerHTML = `
    <div class="pencil-card">
      <div class="pc-head">
        <span class="pc-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 20l1.2-4.6L16.6 4a2 2 0 012.8 0l.6.6a2 2 0 010 2.8L8.6 18.8z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14.5 6l3.5 3.5" stroke="currentColor" stroke-width="1.8"/></svg></span>
        <div><div class="eyebrow">Get a pencil</div><h3>${b.title || "Work it out on paper"}</h3></div>
      </div>
      <p class="pc-intro">${b.intro || "Work each one out on paper first, then type your answer. A bare number is read in the unit shown; you can also type your own unit, like <code>0.02 A</code>."}</p>
      <ol class="pc-list"></ol>
    </div>`;
  const list = el.querySelector(".pc-list");
  b.items.forEach((p, i) => list.append(problem(p, i, onDone)));
}

function problem(p, i, onDone) {
  const li = document.createElement("li");
  li.className = "pc-item";
  const inputId = `pc-${p.id}`;
  li.innerHTML = `
    <div class="pc-q"><span class="pc-num">${i + 1}</span><div>${p.level ? `<span class="pc-level l${p.level}">${LEVELS[p.level]}</span>` : ""}${p.q}</div></div>
    <form class="pc-form" novalidate>
      <label for="${inputId}" class="visually-hidden">Your answer</label>
      <span class="unit-input pc-input"><input id="${inputId}" inputmode="text" autocomplete="off" spellcheck="false" placeholder="your answer">${p.unit ? `<em>${p.unit}</em>` : ""}</span>
      <button type="submit" class="btn small">Check</button>
    </form>
    <p class="pc-feedback" role="status" aria-live="polite"></p>
    <div class="pc-help">
      ${p.hints?.length ? `<button type="button" class="linkish pc-hint">Show a hint</button>` : ""}
      <button type="button" class="linkish pc-show">Show the worked solution</button>
    </div>
    <ol class="pc-hints" hidden></ol>
    <div class="pc-solution" hidden><div class="eyebrow">Worked solution</div>${p.solution}</div>`;
  const input = li.querySelector("input");
  const fb = li.querySelector(".pc-feedback");
  const sol = li.querySelector(".pc-solution");
  const hints = li.querySelector(".pc-hints");
  const hintBtn = li.querySelector(".pc-hint");
  const showBtn = li.querySelector(".pc-show");
  let shown = 0;

  const solved = (value) => {
    li.classList.add("solved");
    fb.className = "pc-feedback good";
    fb.textContent = `Right${value ? `: ${value}` : ""}.`;
    sol.hidden = false;
    showBtn.hidden = true;
    if (hintBtn) hintBtn.hidden = true;
  };

  li.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    const raw = input.value.trim();
    if (!raw) return;
    const r = check(raw, p);
    if (r.ok) {
      solved(`${raw}${/[a-zA-ZΩ%°µ]/.test(raw) || !p.unit ? "" : ` ${p.unit}`}`);
      progress.answer(p.id, raw, true);
      onDone();
    } else {
      li.classList.remove("solved");
      fb.className = "pc-feedback bad";
      fb.textContent = feedback(r, p.unit);
      li.classList.remove("shake");
      void li.offsetWidth;
      li.classList.add("shake");
    }
  });
  hintBtn?.addEventListener("click", () => {
    hints.hidden = false;
    hints.insertAdjacentHTML("beforeend", `<li>${p.hints[shown]}</li>`);
    shown++;
    if (shown >= p.hints.length) hintBtn.hidden = true;
    else hintBtn.textContent = "Another hint";
  });
  showBtn.addEventListener("click", () => {
    sol.hidden = false;
    showBtn.hidden = true;
  });

  const prior = progress.answerOf(p.id);
  if (prior?.correct) {
    input.value = prior.choice;
    solved("");
  }
  return li;
}

// ---------- at the meter ----------

const METER_ICON = `<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="7" y="2.5" width="18" height="27" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><rect x="10.5" y="6" width="11" height="6" rx="1.2" fill="currentColor" opacity=".35"/><circle cx="16" cy="18.5" r="3.6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 18.5l2-2.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="11.5" cy="25.5" r="1.3" fill="currentColor"/><circle cx="16" cy="25.5" r="1.3" fill="currentColor"/><circle cx="20.5" cy="25.5" r="1.3" fill="currentColor"/></svg>`;

export function renderBench(el, b, onDone) {
  el.className = "prose bench";
  const setup = b.setup || {};
  el.innerHTML = `
    <div class="bench-card">
      <div class="bench-head">
        <span class="bench-icon">${METER_ICON}</span>
        <div><div class="eyebrow">At the meter · your BM235</div><h3>${b.title}</h3></div>
      </div>
      ${b.intro ? `<p>${b.intro}</p>` : ""}
      ${Object.keys(setup).length ? `<div class="bench-setup">${setup.dial ? `<span><b>Dial</b>${setup.dial}</span>` : ""}${setup.leads ? `<span><b>Leads</b>${setup.leads}</span>` : ""}${setup.need ? `<span><b>You need</b>${setup.need}</span>` : ""}</div>` : ""}
      ${b.safety ? `<div class="bench-safety"><strong>Safety</strong> ${b.safety}</div>` : ""}
      <ol class="bench-steps">${b.steps.map((s) => `<li>${s}</li>`).join("")}</ol>
      ${b.record?.length ? `<div class="bench-record">${b.record.map((r, i) => recordRow(b.id, r, i)).join("")}</div>` : ""}
      ${b.expect ? `<details class="bench-expect"><summary>What you should see, and why</summary><div>${b.expect}</div></details>` : ""}
      <div class="bench-foot"><button type="button" class="btn small outline bench-done" aria-pressed="false">I did this</button><span class="bench-note">Ticks your progress. It's on your honour.</span></div>
    </div>`;
  el.querySelectorAll(".bench-record input").forEach((inp) => {
    const r = b.record[+inp.dataset.i];
    const out = inp.closest(".rec-row").querySelector(".rec-out");
    inp.addEventListener("input", () => {
      const res = check(inp.value, { answer: 0, unit: r.unit, abs: Infinity });
      if (!inp.value.trim()) return (out.textContent = "");
      if (res.why === "number" || res.why === "unit") return (out.textContent = feedback(res, r.unit));
      const v = res.value;
      out.className = `rec-out ${v < r.min ? "low" : v > r.max ? "high" : "ok"}`;
      out.textContent = v < r.min ? r.low : v > r.max ? r.high : r.ok;
    });
  });
  const btn = el.querySelector(".bench-done");
  const mark = () => {
    btn.classList.add("on");
    btn.setAttribute("aria-pressed", "true");
    btn.textContent = "✓ Done";
  };
  if (progress.done(b.id)) mark();
  btn.addEventListener("click", () => {
    if (progress.mark(b.id)) onDone();
    mark();
  });
}

function recordRow(id, r, i) {
  const inputId = `rec-${id}-${i}`;
  return `<div class="rec-row"><label for="${inputId}">${r.label}</label><span class="unit-input"><input id="${inputId}" data-i="${i}" inputmode="decimal" autocomplete="off" placeholder="reading"><em>${r.unit}</em></span><span class="rec-out" aria-live="polite"></span></div>`;
}

// ---------- 3D scenes ----------

export function renderScene(el, b, ctx) {
  el.className = "custom-wrap wide scene-wrap";
  el.innerHTML = `<div class="scene-loading">Loading the 3D view…</div>`;
  let cleanup = null;
  let gone = false;
  import(`./scenes/${b.scene}.js`)
    .then((m) => {
      if (gone) return;
      el.innerHTML = "";
      cleanup = m.default(el, ctx, b) || null;
    })
    .catch((err) => {
      console.error(err);
      el.innerHTML = `<div class="scene-loading">The 3D view couldn't load here. ${b.fallback || ""}</div>`;
    });
  return () => {
    gone = true;
    cleanup?.();
  };
}
