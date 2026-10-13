// The formula sheet: every formula card in the course, grouped by chapter, with
// the units and prefixes you need to use them. Built from the chapters themselves,
// so it can never disagree with them.

import { CHAPTERS, PARTS_OF_COURSE } from "../chapters/index.js";
import { resolveRefs } from "../lesson.js";
import { linkTerms } from "../terms.js";

const UNITS = [
  ["Charge", "Q", "coulomb", "C", "= A·s"],
  ["Current", "I", "ampere", "A", "= C/s"],
  ["Voltage", "V", "volt", "V", "= J/C"],
  ["Resistance", "R", "ohm", "Ω", "= V/A"],
  ["Power", "P", "watt", "W", "= J/s = V·A"],
  ["Energy", "E", "joule", "J", "= W·s"],
  ["Capacitance", "C", "farad", "F", "= C/V"],
  ["Inductance", "L", "henry", "H", "= V·s/A"],
  ["Time", "t", "second", "s", ""],
  ["Frequency", "f", "hertz", "Hz", "= 1/s"],
];

const PREFIXES = [
  ["G", "giga", "10⁹", "1 GHz"],
  ["M", "mega", "10⁶", "1 MΩ"],
  ["k", "kilo", "10³", "4.7 kΩ"],
  ["m", "milli", "10⁻³", "20 mA"],
  ["µ", "micro", "10⁻⁶", "100 µF"],
  ["n", "nano", "10⁻⁹", "100 nF"],
  ["p", "pico", "10⁻¹²", "22 pF"],
];

export function formulas(main) {
  const groups = PARTS_OF_COURSE.map((part) => ({
    part,
    chapters: CHAPTERS.filter((c) => part.ids.includes(c.id))
      .map((c) => ({ c, list: c.blocks.filter((b) => b.type === "formula") }))
      .filter((x) => x.list.length),
  })).filter((g) => g.chapters.length);
  const count = groups.reduce((n, g) => n + g.chapters.reduce((m, x) => m + x.list.length, 0), 0);
  const fix = (s) => linkTerms(resolveRefs(s, CHAPTERS));

  main.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">Reference</div>
      <h1>Formulas</h1>
      <p class="lede">All ${count} formulas in the course on one page, in the order you meet them. Each links back to the chapter that explains where it comes from.</p>
    </div>
    <div class="fs-layout">
      <section class="fs-units" aria-label="Units and prefixes">
        <div class="white-card">
          <h2>Units</h2>
          <table class="fs-table">
            <thead><tr><th>Quantity</th><th>Symbol</th><th>Unit</th></tr></thead>
            <tbody>${UNITS.map(([q, s, u, us, eq]) => `<tr><td>${q}</td><td class="sym">${s}</td><td><b>${us}</b> ${u}${eq ? `<br><span class="muted">${eq}</span>` : ""}</td></tr>`).join("")}</tbody>
          </table>
        </div>
        <div class="white-card">
          <h2>Prefixes</h2>
          <table class="fs-table">
            <tbody>${PREFIXES.map(([p, n, x, e]) => `<tr><td class="sym">${p}</td><td>${n}</td><td>× ${x}</td><td class="muted">${e}</td></tr>`).join("")}</tbody>
          </table>
          <p class="small-note">Case matters: m is milli, M is mega. Convert to base units (V, A, Ω, F, s) before you calculate, and back again at the end.</p>
        </div>
      </section>
      <div class="fs-groups">
        ${groups
          .map(
            (g) => `<section class="fs-group">
              <div class="eyebrow">${g.part.name}</div>
              ${g.chapters
                .map(
                  ({ c, list }) => `<div class="fs-chapter">
                    <h2><a href="#${c.id}">Chapter ${c.num} · ${c.title}</a></h2>
                    <div class="fs-cards">${list
                      .map(
                        (f) => `<article class="fs-card">
                          <div class="fs-name">${f.name}</div>
                          <div class="fs-eq${f.eq.replace(/<[^>]+>/g, "").length > 16 ? " long" : ""}">${f.eq}</div>
                          ${f.alt?.length ? `<div class="fs-alt">${f.alt.join(" · ")}</div>` : ""}
                          <dl>${f.vars.map(([s, w, u]) => `<div><dt>${s}</dt><dd>${fix(w)}${u ? ` <span>${u}</span>` : ""}</dd></div>`).join("")}</dl>
                        </article>`,
                      )
                      .join("")}</div>
                  </div>`,
                )
                .join("")}
            </section>`,
          )
          .join("")}
      </div>
    </div>`;
}
