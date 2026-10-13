// Tap-to-explain terms. [[term]] or [[shown text|term-id]] in lesson text becomes a
// button; autoTerms() finds terms in already-rendered pages (the BM235 guides).
// One popover serves the whole page.

import { findTerm, TERMS } from "./data/glossary.js";

export const GO_KEY = "bmg-go"; // the BM235 guide scrolls to this section when it opens

let chapters = [];
export function setTermChapters(list) {
  chapters = list;
}

const button = (t, text) => `<button type="button" class="term" data-term="${t.id}">${text}</button>`;

export function linkTerms(html) {
  return String(html).replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (whole, text, id) => {
    const t = findTerm(id || text);
    return t ? button(t, text) : text;
  });
}

// Wrap the first use of each glossary term in every `section` under root.
// Skips headings, links, buttons, inputs, tables' header cells and anything already a term.
const SKIP = "a, button, h1, h2, h3, h4, th, dt, label, summary, input, select, textarea, code, .term, .no-terms, svg";
let pattern = null;
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Everyday words that would turn every paragraph into a field of buttons. They are
// still linked where a chapter marks them with [[ ]].
const NOT_AUTO = new Set(["charge", "coulomb", "current", "ampere", "conventional-current", "drift", "field", "voltage", "volt", "ground", "resistance", "ohm", "power", "watt", "joule", "series", "parallel", "short-circuit", "open-circuit", "live", "neutral", "earth", "dc", "ac", "frequency", "range", "hold", "efficiency", "datasheet", "gain", "saturation", "ohms-law", "e12"]);
const autoSpellings = () =>
  TERMS.filter((t) => !NOT_AUTO.has(t.id))
    .flatMap((t) => [t.term, ...(t.also || [])])
    .filter((s) => s.length > 1)
    .sort((a, b) => b.length - a.length);

export function autoTerms(root, sectionSelector = "article, section") {
  // Short all-capital abbreviations must match their case exactly; words match any case.
  pattern ||= new RegExp(`(?<![\\wµΩ-])(${autoSpellings().map(escape).join("|")})(?![\\w-])`, "giu");
  const sections = [...root.querySelectorAll(sectionSelector)];
  for (const section of sections.length ? sections : [root]) {
    if (section.parentElement?.closest(sectionSelector) && sections.length) continue;
    const seen = new Set();
    const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement.closest(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) wrapIn(node, seen);
  }
}

function wrapIn(node, seen) {
  const text = node.nodeValue;
  pattern.lastIndex = 0;
  let m;
  const hits = [];
  while ((m = pattern.exec(text))) {
    const word = m[1];
    const t = findTerm(word);
    if (!t || seen.has(t.id)) continue;
    // Abbreviations (EF, OL, COM, AC…) only in capitals; "ac" inside prose would be wrong.
    if (/^[A-Z]{2,}/.test(t.term) && word !== word.toUpperCase()) continue;
    if (word.length <= 3 && word !== t.term && !(t.also || []).includes(word)) continue;
    seen.add(t.id);
    hits.push([m.index, word, t]);
  }
  if (!hits.length) return;
  const frag = document.createDocumentFragment();
  let at = 0;
  for (const [i, word, t] of hits) {
    frag.append(text.slice(at, i));
    const b = document.createElement("button");
    b.type = "button";
    b.className = "term";
    b.dataset.term = t.id;
    b.textContent = word;
    frag.append(b);
    at = i + word.length;
  }
  frag.append(text.slice(at));
  node.replaceWith(frag);
}

// ---------- the popover ----------

let pop = null;
let openFor = null;

function ensurePop() {
  if (pop) return pop;
  pop = document.createElement("div");
  pop.className = "term-pop";
  pop.setAttribute("role", "dialog");
  pop.hidden = true;
  document.body.append(pop);
  pop.addEventListener("click", (e) => {
    const go = e.target.closest("[data-bm]");
    if (go) {
      try {
        sessionStorage.setItem(GO_KEY, go.dataset.bm);
      } catch {
        // Without storage the guide still opens, at the top.
      }
      close();
    }
    if (e.target.closest(".term-close")) close();
    if (e.target.closest("a[href^='#']")) close();
  });
  return pop;
}

function show(btn) {
  const t = findTerm(btn.dataset.term);
  if (!t) return;
  const p = ensurePop();
  const chapter = chapters.find((c) => c.id === t.ch);
  const here = location.hash.replace("#", "");
  p.innerHTML = `
    <div class="term-pop-head"><strong>${t.term}</strong><button type="button" class="term-close" aria-label="Close">×</button></div>
    <p>${t.def}</p>
    <div class="term-pop-links">
      ${chapter && chapter.id !== here ? `<a href="#${chapter.id}">Explained in chapter ${chapter.num} →</a>` : ""}
      ${t.bm && here !== "bm235-guide" ? `<a href="#bm235-guide" data-bm="${t.bm}">On your BM235 →</a>` : ""}
    </div>`;
  p.setAttribute("aria-label", t.term);
  p.hidden = false;
  openFor?.setAttribute("aria-expanded", "false");
  openFor = btn;
  btn.setAttribute("aria-expanded", "true");
  place(btn);
}

function place(btn) {
  const r = btn.getBoundingClientRect();
  const w = Math.min(340, innerWidth - 24);
  pop.style.width = `${w}px`;
  const left = Math.min(Math.max(12, r.left + r.width / 2 - w / 2), innerWidth - w - 12);
  const below = r.bottom + 10;
  const h = pop.offsetHeight;
  const top = below + h > innerHeight - 12 && r.top - h - 10 > 12 ? r.top - h - 10 : below;
  pop.style.left = `${left + scrollX}px`;
  pop.style.top = `${top + scrollY}px`;
}

function close() {
  if (!pop || pop.hidden) return;
  pop.hidden = true;
  openFor?.setAttribute("aria-expanded", "false");
  const back = openFor;
  openFor = null;
  if (back && document.activeElement && pop.contains(document.activeElement)) back.focus();
}

export function initTerms() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".term");
    if (btn) {
      e.preventDefault();
      if (openFor === btn && !pop.hidden) close();
      else show(btn);
      return;
    }
    if (pop && !pop.hidden && !pop.contains(e.target)) close();
  });
  document.addEventListener("keydown", (e) => e.key === "Escape" && close());
  addEventListener("hashchange", close);
  addEventListener("resize", () => openFor && !pop.hidden && place(openFor));
}
