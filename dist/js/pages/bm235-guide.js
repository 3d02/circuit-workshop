// The complete BM235 guide: every function and feature in turn, with how to
// select it, its specifications, how it works, and expected uses, unexpected
// uses, and surprises. The field guide (#bm235) has the interactive front panel.

import { GROUPS, SECTIONS, SOURCES } from "../data/bm235-guide.js";
import { CHAPTERS } from "../chapters/index.js";
import { resolveRefs } from "../lesson.js";
import { autoTerms, GO_KEY } from "../terms.js";

// Hands a front-panel selection to the field guide (a bare #word is all a route can carry).
export const PANEL_KEY = "bm235-show";

const table = (t) =>
  `<div class="bm-table-wrap"><table class="bm-table">${
    t.head.some(Boolean) ? `<thead><tr>${t.head.map((h) => `<th>${h}</th>`).join("")}</tr></thead>` : ""
  }<tbody>${t.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;

const list = (cls, icon, title, items) =>
  items?.length ? `<div class="bmg-list ${cls}"><h3><span aria-hidden="true">${icon}</span>${title}</h3><ul>${items.map((x) => `<li>${x}</li>`).join("")}</ul></div>` : "";

function sectionHtml(s) {
  if (!s.setup) {
    return `<article class="bmg-sec" id="bmg-${s.id}">
      <h2>${s.name}</h2>
      ${s.html || ""}${s.table ? table(s.table) : ""}${s.after || ""}
    </article>`;
  }
  const { dial, select, red, black = "COM" } = s.setup;
  return `<article class="bmg-sec bmg-fn" id="bmg-${s.id}">
    <h2>${s.name}</h2>
    <div class="bmg-setup">
      <span><b>Dial</b>${dial}</span>
      <span><b>Select</b>${select}</span>
      ${red ? `<span><b>Leads</b><i class="bm-lead red"></i>${red}${black ? `<i class="bm-lead black"></i>${black}` : ""}</span>` : ""}
    </div>
    <dl class="bm-specs">${s.specs.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>
    <h3 class="bmg-how">How it works</h3>
    ${s.how}
    <div class="bmg-uses">
      ${list("exp", "✓", "Expected uses", s.expected)}
      ${list("unexp", "✦", "Unexpected uses", s.unexpected)}
      ${list("traps", "!", "Surprises and traps", s.traps)}
    </div>
    ${s.panel ? `<button type="button" class="linkish bmg-panel" data-panel="${s.panel}">See it on the front panel →</button>` : ""}
  </article>`;
}

export function bm235Guide(main) {
  const fns = SECTIONS.filter((s) => s.setup).length;
  main.innerHTML = `
    <div class="page-head bmg-head">
      <div class="eyebrow">Your meter · the complete guide</div>
      <h1>Brymen BM235, function by function</h1>
      <p class="lede">Everything this meter can do, in ${fns} functions and features. For each one: how to select it, what it measures and how precisely, how it works inside, what it's for, the uses you might not expect, and the surprises.</p>
      <div class="bmg-key">
        <span class="exp"><i>✓</i>Expected uses</span>
        <span class="unexp"><i>✦</i>Unexpected uses</span>
        <span class="traps"><i>!</i>Surprises and traps</span>
      </div>
      <p class="bmg-links"><a class="btn small outline" href="#bm235">The field guide: front panel, calculators and jobs around the house →</a></p>
    </div>
    <div class="bmg-layout">
      <details class="bmg-toc">
        <summary>Contents</summary>
        <nav aria-label="Contents">
          ${GROUPS.map(
            (g) => `<div class="bmg-toc-group"><span>${g.name}</span>${SECTIONS.filter((s) => s.group === g.id)
              .map((s) => `<button type="button" data-go="bmg-${s.id}">${s.name}</button>`)
              .join("")}</div>`,
          ).join("")}
          <div class="bmg-toc-group"><button type="button" data-go="bmg-sources">Sources</button></div>
        </nav>
      </details>
      <div class="bmg-body">
        ${GROUPS.map(
          (g) => `<section class="bmg-group" aria-label="${g.name}">
            <div class="eyebrow bmg-group-name">${g.name}</div>
            ${SECTIONS.filter((s) => s.group === g.id).map(sectionHtml).join("")}
          </section>`,
        ).join("")}
        <section class="bmg-group">
          <article class="bmg-sec" id="bmg-sources">
            <h2>Sources</h2>
            <p>Specifications are Brymen's unless a line says otherwise. Measurements credited to HKJ come from an independent review and teardown, and Dave Jones's tips come from the EEVblog edition of the manual.</p>
            <ul class="bm-sources">${SOURCES.map(([t, href]) => `<li><a href="${href}" target="_blank" rel="noopener">${t}</a></li>`).join("")}</ul>
            <p class="small-note">New to meters? Start with ${resolveRefs("{{ch:multimeter}}", CHAPTERS)}, where the simulated meter lets you make every mistake for free.</p>
          </article>
        </section>
      </div>
    </div>`;

  const toc = main.querySelector(".bmg-toc");
  const wide = matchMedia("(min-width: 1000px)");
  toc.open = wide.matches;

  // In-page links can't use #fragments: the router owns the hash.
  main.querySelectorAll("[data-go]").forEach(
    (b) =>
      (b.onclick = () => {
        main.querySelector(`#${b.dataset.go}`).scrollIntoView({ behavior: "smooth", block: "start" });
        if (!wide.matches) toc.open = false;
      }),
  );
  main.querySelectorAll("[data-panel]").forEach(
    (b) =>
      (b.onclick = () => {
        try {
          sessionStorage.setItem(PANEL_KEY, b.dataset.panel);
        } catch {
          // Without storage the link still opens the field guide.
        }
        location.hash = "#bm235";
      }),
  );

  // Highlight the section being read in the contents: the last one whose top has
  // passed just under the sticky header.
  const buttons = [...main.querySelectorAll(".bmg-toc [data-go]")];
  const sections = buttons.map((b) => main.querySelector(`#${b.dataset.go}`));
  let frame = 0;
  const mark = () => {
    frame = 0;
    let current = 0;
    sections.forEach((s, i) => s.getBoundingClientRect().top <= 140 && (current = i));
    buttons.forEach((b, i) => (i === current ? b.setAttribute("aria-current", "true") : b.removeAttribute("aria-current")));
  };
  const onScroll = () => (frame ||= requestAnimationFrame(mark));
  addEventListener("scroll", onScroll, { passive: true });
  mark();

  autoTerms(main.querySelector(".bmg-body"), "article");
  // Arriving from a term's "On your BM235" link: go straight to that function.
  let go = null;
  try {
    go = sessionStorage.getItem(GO_KEY);
    sessionStorage.removeItem(GO_KEY);
  } catch {
    // No storage: open at the top.
  }
  const target = go && main.querySelector(`#bmg-${go}`);
  if (target) requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
  return () => {
    removeEventListener("scroll", onScroll);
    cancelAnimationFrame(frame);
  };
}
