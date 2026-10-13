// A field guide to one real meter, the Brymen BM235: an interactive front panel
// for every dial position and button, how it works inside (with calculators),
// and useful jobs around the house.

import { POSITIONS, FEATURES, ITEMS, JACKS, MUST, USES, ACCURACY, SOURCES, SHUNTS, GHOST, LOZ_FLOOR, accuracy, parseReading, ghost, burden, dischargeTime } from "../data/bm235.js";
import { CHAPTERS } from "../chapters/index.js";
import { resolveRefs } from "../lesson.js";
import { si } from "../format.js";
import { PANEL_KEY } from "./bm235-guide.js";

const refs = (html) => resolveRefs(html, CHAPTERS);
const minus = (s) => String(s).replace(/-/g, "−");
const SHORT = { autov: "AutoV", off: "OFF", v: "V", ohm: "Ω •)))", mv: "mV °C", capdiode: "Cap ▶|", amA: "A mA", ua: "µA" };

// ---------- the front panel ----------
const CX = 160;
const CY = 306;
const JACK_AT = { A: [64, 412], V: [256, 412], mA: [124, 452], COM: [196, 452] };
// The little backlight sun printed above SELECT.
const SUN = `<g class="bm-sun"><circle cx="72" cy="156" r="2.6"/><path d="M72 150.5v-1.5m0 14v-1.5m-5.5-5.5h-1.5m14 0h-1.5m-9.4-3.9-1-1m10.9 10.9-1-1m0-8.9 1-1m-10.9 10.9 1-1"/></g>`;
const KEYS = [
  ["select", "SELECT", 46, SUN],
  ["range", "RANGE", 104, "Level"],
  ["rec", "REC", 162, ""],
  ["hold", "HOLD", 220, "Δ"],
];

function meterSvg() {
  const polar = (deg, rad) => [CX + rad * Math.sin((deg * Math.PI) / 180), CY - rad * Math.cos((deg * Math.PI) / 180)];
  const positions = POSITIONS.map((p) => {
    const [x1, y1] = polar(p.angle, 57);
    const [x2, y2] = polar(p.angle, 64);
    const [x, y] = polar(p.angle, 90);
    const dy = p.dial[1] ? -2 : 4;
    return `<g class="bm-pos" data-id="${p.id}">
      <line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="bm-tick"/>
      ${p.dial[0] === "⊣⊢" ? `<path d="M${(x - 9).toFixed(1)} ${(y - 6).toFixed(1)}h6m0-6v12m4-12v12m0-6h6" class="bm-pos-cap"/>` : `<text x="${x.toFixed(1)}" y="${(y + dy).toFixed(1)}" class="bm-pos-main">${p.dial[0]}</text>`}
      ${p.dial[1] ? `<text x="${x.toFixed(1)}" y="${(y + 10).toFixed(1)}" class="bm-pos-sub">${p.dial[1]}</text>` : ""}
      <circle cx="${x.toFixed(1)}" cy="${(y + 2).toFixed(1)}" r="20" class="bm-hit"/>
    </g>`;
  }).join("");
  const keys = KEYS.map(
    ([id, label, x, over]) => `<g class="bm-key" data-id="${id}">
      ${over.startsWith("<") ? over : over ? `<text x="${x + 26}" y="160" class="bm-key-over">${over}</text>` : ""}
      <rect x="${x}" y="166" width="52" height="24" rx="12"/>
      <text x="${x + 26}" y="182">${label}</text>
    </g>`,
  ).join("");
  const round = (id, label, x) => `<g class="bm-key" data-id="${id}"><circle cx="${x}" cy="216" r="15"/><text x="${x}" y="220">${label}</text></g>`;
  const jack = (id, label, sub, lx, ly) => {
    const [x, y] = JACK_AT[id];
    return `<g class="bm-jack" data-jack="${id}">
      <circle cx="${x}" cy="${y}" r="17" class="bm-jack-ring"/>
      <circle cx="${x}" cy="${y}" r="8" class="bm-jack-hole"/>
      <text x="${lx}" y="${ly}" class="bm-jack-label">${label}</text>
      ${sub ? `<text x="${lx}" y="${ly + 11}" class="bm-jack-sub">${sub}</text>` : ""}
    </g>`;
  };
  return `<svg class="bm-svg" viewBox="0 0 320 530" aria-hidden="true">
    <rect x="8" y="8" width="304" height="514" rx="44" class="bm-holster"/>
    <rect x="26" y="26" width="268" height="478" rx="28" class="bm-face"/>
    <rect x="44" y="44" width="232" height="104" rx="12" class="bm-bezel"/>
    <rect x="52" y="52" width="216" height="88" rx="6" class="bm-lcd"/>
    <text x="62" y="70" class="bm-lcd-flags"></text>
    <g class="bm-lcd-bars">${[0, 1, 2, 3, 4].map((i) => `<rect x="${64 + i * 14}" y="122" width="10" height="8" rx="1"/>`).join("")}</g>
    <text x="230" y="126" class="bm-lcd-value"></text>
    <text x="236" y="126" class="bm-lcd-unit"></text>
    ${keys}
    ${round("hz", "Hz", 52)}
    ${round("ef", "EF", 268)}
    <circle cx="${CX}" cy="${CY}" r="54" class="bm-dial-ring"/>
    ${positions}
    <g class="bm-knob">
      <rect x="${CX - 10}" y="${CY - 62}" width="20" height="124" rx="10" class="bm-knob-bar"/>
      <rect x="${CX - 2.5}" y="${CY - 58}" width="5" height="26" rx="2.5" class="bm-knob-mark"/>
      <circle cx="${CX}" cy="${CY}" r="9" class="bm-knob-hub"/>
    </g>
    ${jack("A", "A", "10 A max", 64, 444)}
    ${jack("V", "V Ω", "", 256, 444)}
    ${jack("mA", "mA µA", "600 mA max", 124, 484)}
    ${jack("COM", "COM", "", 196, 484)}
    <text x="252" y="478" class="bm-cat">CAT IV 300 V</text>
    <text x="252" y="490" class="bm-cat">CAT III 600 V</text>
  </svg>`;
}

function detailHtml(item) {
  const isPos = POSITIONS.includes(item);
  const leads = item.leads
    ? `<p class="bm-leads"><span class="bm-lead red"></span>Red: ${item.leads.red.map((j) => JACKS[j]).join(" or ")}<span class="bm-lead black"></span>Black: ${JACKS[item.leads.black]}</p>`
    : "";
  const list = (xs, cls = "") => `<ul${cls ? ` class="${cls}"` : ""}>${xs.map((x) => `<li>${x}</li>`).join("")}</ul>`;
  return `
    <div class="eyebrow">${isPos ? "Dial position" : "Button"}</div>
    <h3>${item.name}</h3>
    <p class="bm-what">${item.what}</p>
    ${item.select?.length ? `<div class="bm-select"><span>SELECT steps through</span>${item.select.map((s) => `<b>${s}</b>`).join("")}</div>` : ""}
    ${item.selectNote ? `<p class="small-note">${item.selectNote}</p>` : ""}
    ${leads}
    ${item.leadsNote ? `<p class="small-note">${item.leadsNote}</p>` : ""}
    ${item.specs?.length ? `<dl class="bm-specs">${item.specs.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>` : ""}
    ${item.how ? `<h4>How it works</h4>${refs(item.how)}` : ""}
    ${item.use?.length ? `<h4>${item.useTitle || "Use it for"}</h4>${list(item.use)}` : ""}
    ${item.watch?.length ? `<h4>Watch out</h4>${list(item.watch, "bm-watch")}` : ""}`;
}

// ---------- page ----------
export function bm235(main) {
  main.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">Your meter · field guide</div>
      <h1>Brymen BM235</h1>
      <p class="lede">A 6000-count, true-RMS meter built for real electrical work. Here's every dial position and button, how it works inside, the habits that keep you and the meter safe, and useful jobs around the house.</p>
      <div class="bm-facts">
        <span>6000 counts, 5 readings/s</span><span>True RMS</span><span>10 MΩ input · LoZ</span><span>CAT III 600 V · CAT IV 300 V</span><span>Ceramic HRC fuses</span><span>2 × AAA</span>
      </div>
      <p class="bm-guide-link"><a class="btn small" href="#bm235-guide">The complete guide: every function in depth →</a></p>
      <nav class="bm-toc" aria-label="On this page">
        <button type="button" data-go="bm-must">Must-knows</button>
        <button type="button" data-go="bm-panel">Every mode</button>
        <button type="button" data-go="bm-inside">How it works</button>
        <button type="button" data-go="bm-house">Around the house</button>
        <button type="button" data-go="bm-sources">Sources</button>
      </nav>
    </div>

    <section class="bm-section" id="bm-must">
      <div class="note note-myth bm-version">
        <div class="note-head"><span class="note-icon">?</span>Which BM235 do you have?</div>
        <div class="note-body"><p>Earlier units, including the EEVblog edition, are also rated CAT II 1000 V and have a 1000 V range. Brymen's current manual (2023) lists 600 V as the top range, rated CAT III 600 V and CAT IV 300 V. The label beside the COM jack tells you which one you have. This page uses the current figures and mentions the older ones where they differ.</p></div>
      </div>
      <h2>Must-knows</h2>
      <ol class="bm-must">${MUST.map(([t, d]) => `<li><strong>${t}</strong><p>${d}</p></li>`).join("")}</ol>
      <p class="small-note bm-practice">New to meters? Practise on the simulated one in ${refs("{{ch:multimeter}}")} first. Blowing its fuse is free.</p>
    </section>

    <section class="bm-section" id="bm-panel">
      <h2>Every mode</h2>
      <p class="bm-intro">Turn the dial or press a button, either on the drawing or with the controls below it. The jacks you need light up: <span class="bm-lead red"></span>red lead, <span class="bm-lead black"></span>black lead.</p>
      <div class="bm-panel">
        <div class="bm-meter">
          ${meterSvg()}
          <div class="bm-controls">
            <div class="bm-ctl-label">Dial</div>
            <div class="bm-dial" role="radiogroup" aria-label="Dial position">${POSITIONS.map((p) => `<button type="button" role="radio" aria-checked="false" data-id="${p.id}">${SHORT[p.id]}</button>`).join("")}</div>
            <div class="bm-ctl-label">Buttons</div>
            <div class="bm-keys">${FEATURES.map((f) => `<button type="button" aria-pressed="false" data-id="${f.id}">${f.key}</button>`).join("")}</div>
          </div>
        </div>
        <div class="bm-detail" aria-live="polite"></div>
      </div>
    </section>

    <section class="bm-section" id="bm-inside">
      <h2>How it works</h2>
      <p class="bm-intro">Whatever the dial says, everything ends up as a small DC voltage measured by one converter, about five times a second. Each function only changes what sits in front of it:</p>
      <div class="bm-table-wrap"><table class="bm-table">
        <thead><tr><th>You measure</th><th>The front end</th><th>The converter sees</th></tr></thead>
        <tbody>
          <tr><td>Voltage</td><td>A 10 MΩ divider scales it down (bypassed on mV)</td><td>A fraction of your voltage</td></tr>
          <tr><td>AC</td><td>A true-RMS stage works out the heating value</td><td>The equivalent DC</td></tr>
          <tr><td>Current</td><td>Your current flows through a shunt: 100 Ω, 1.9 Ω or 0.04 Ω</td><td>The shunt's voltage drop</td></tr>
          <tr><td>Resistance, continuity, diode</td><td>The meter becomes the source, pushing a known small current</td><td>The voltage across the part</td></tr>
          <tr><td>Capacitance</td><td>A known current charges and discharges the part</td><td>How long the voltage takes to change</td></tr>
          <tr><td>Temperature</td><td>A thermocouple makes about 41 µV/°C; a sensor inside measures the sockets' temperature</td><td>Microvolts, plus a correction</td></tr>
        </tbody>
      </table></div>

      <div class="bm-grid">
        <div class="tool-card bm-calc-acc">
          <div class="eyebrow">Counts, digits and accuracy</div>
          <h3>What does ±(0.4% + 2 d) mean?</h3>
          <p>6000 counts means the display goes up to 5999 before it moves to the next range. Accuracy is a percentage of the reading plus a number of steps of the last digit. Pick a function and a reading to see the band the true value lies in.</p>
          <div class="calc-rows bm-acc-rows">
            <label>Function<select class="acc-fn">${ACCURACY.map((f) => `<option value="${f.id}">${f.label}</option>`).join("")}</select></label>
            <label>Reading <span class="unit-input"><input class="acc-in" spellcheck="false" autocomplete="off"><em class="acc-unit"></em></span></label>
          </div>
          <div class="bm-ranges" role="radiogroup" aria-label="Range"></div>
          <div class="tool-answer small-answer acc-answer"></div>
          <p class="small-note acc-why"></p>
          <p class="small-note">Specified at 23 ± 5 °C. Outside that, add 0.15 × the spec for every degree.</p>
        </div>

        <div class="tool-card bm-calc-ghost">
          <div class="eyebrow">Input impedance and ghost voltages</div>
          <h3>Why a dead wire can read 100 V</h3>
          <p>A disconnected wire running alongside a live one picks up voltage through the capacitance between them. That's a source with an enormous internal impedance, so the 10 MΩ input reads a convincing voltage, while AutoV's few kilohms pull it down to a few volts.</p>
          ${ghostSvg()}
          <label class="bm-slider">Length of cable run: <output class="gh-len"></output><input type="range" class="gh-in" min="1" max="50" step="1" value="10"></label>
          <div class="bm-bars">
            <div><span>Disconnected wire, V position (10 MΩ)</span><i><b class="gh-bar-high"></b></i><strong class="gh-high"></strong></div>
            <div><span>Disconnected wire, AutoV (LoZ)</span><i><b class="gh-bar-low"></b></i><strong class="gh-low"></strong></div>
            <div><span>A wire that's really live, either way</span><i><b style="width:100%"></b></i><strong>${GHOST.mains} V</strong></div>
          </div>
          <p class="small-note">A simplified model: about ${GHOST.cPerMetre * 1e12} pF per metre to each neighbouring conductor, and AutoV's impedance curve from Brymen's manual. Real cables vary; the size of the difference is the point. The same 10 MΩ also loads high-resistance circuits: measuring the middle of two 1 MΩ resistors reads about 5% low.</p>
        </div>

        <div class="tool-card bm-calc-burden">
          <div class="eyebrow">Shunts and burden voltage</div>
          <h3>What the meter takes from your circuit</h3>
          <p>In current mode the meter puts its shunt in series with your circuit, and the voltage across it is lost to the circuit. Dave Jones's example: a 3.3 V circuit drawing 500 mA, measured on the mA jack.</p>
          <div class="calc-rows">
            <label>Supply <span class="unit-input"><input type="number" class="bu-v" value="3.3" step="0.1" min="0.1"><em>V</em></span></label>
            <label>Current without the meter <span class="unit-input"><input type="number" class="bu-i" value="500" step="1" min="0.001"><em>mA</em></span></label>
            <label>Red lead in<select class="bu-shunt">${Object.entries(SHUNTS).map(([k, s]) => `<option value="${k}"${k === "ma" ? " selected" : ""}>${s.label}</option>`).join("")}</select></label>
          </div>
          <div class="tool-answer small-answer bu-answer"></div>
          <p class="small-note bu-why"></p>
        </div>

        <div class="tool-card">
          <div class="eyebrow">True RMS and bandwidth</div>
          <h3>Why “true RMS” matters, and where it stops</h3>
          <p>A cheaper average-responding meter rectifies AC, averages it and multiplies by 1.11. That's only right for a perfect sine wave. The current drawn by chargers, LED lamps, dimmers and inverters is far from a sine, and an average-responding meter can be tens of percent off.</p>
          <p>The BM235 works out the true RMS, the DC value that would heat a resistor equally, within two limits:</p>
          <ul class="kit-list">
            <li><strong>Bandwidth</strong>: AC volts are specified for 45–440 Hz. HKJ found 1 V AC reading 5% low at 1.6 kHz. As Dave Jones puts it, “true RMS” doesn't mean “high frequency”.</li>
            <li><strong>Crest factor</strong> (peak ÷ RMS): under 2 at full scale, under 4 at half scale. A sine is 1.41; spiky waveforms are higher, so measure them on a range where they sit well below full scale.</li>
          </ul>
        </div>

        <div class="tool-card">
          <div class="eyebrow">Safety ratings</div>
          <h3>CAT ratings, surges and fuses</h3>
          <p>Measurement categories are about surviving the brief spikes that ride on the mains, caused by lightning and switching, not just the steady voltage. The higher the category, the closer to the supply and the bigger the possible spike:</p>
          <ul class="kit-list">
            <li><strong>CAT IV 300 V</strong>: the origin of the installation, such as the incoming supply, the electricity meter and the main fuse. 300 V covers 230 V from live to earth.</li>
            <li><strong>CAT III 600 V</strong>: the fixed installation, such as the fuse board, breakers, wiring, sockets and switches. 600 V covers 400 V between the phases of a three-phase supply.</li>
            <li><strong>CAT II</strong>: things plugged into a socket, such as appliances and tools.</li>
          </ul>
          <p>The inputs withstand a 6 kV lightning-style surge (1.2/50 µs). The fuses are sand-filled ceramic HRC types rated at 1000 V with 20–30 kA breaking capacity: if a supply is shorted through the current input, the arc is quenched inside the fuse rather than in your hand. The probes count too. CAT III and IV need no more than 4 mm of exposed tip, which is what the tip caps are for.</p>
          <p class="small-note">Brymen's manual treats anything above 30 V AC or 60 V DC as able to give you a shock.</p>
        </div>
      </div>
    </section>

    <section class="bm-section" id="bm-house">
      <h2>Around the house</h2>
      <p class="bm-intro">Useful jobs, grouped by where you'll do them. The tags show which dial position or button to use; tap one to see that mode.</p>
      ${USES.map(
        (g) => `<div class="bm-group">
          <h3>${g.group}</h3>
          ${g.intro ? `<div class="note note-safety"><div class="note-head"><span class="note-icon">!</span>Before you start</div><div class="note-body"><p>${g.intro}</p></div></div>` : ""}
          ${g.note ? `<p class="small-note">${g.note}</p>` : ""}
          <div class="bm-uses">${g.items
            .map(
              (u) => `<article class="bm-use">
                <div class="bm-chips">${u.modes.map((m) => `<button type="button" class="bm-chip" data-mode="${m}">${chipLabel(m)}</button>`).join("")}</div>
                <h4>${u.title}</h4>
                ${u.html}
                ${u.calc ? calcHtml(u.calc) : ""}
              </article>`,
            )
            .join("")}</div>
        </div>`,
      ).join("")}
    </section>

    <section class="bm-section" id="bm-sources">
      <h2>Sources</h2>
      <p class="bm-intro">Specifications are from the manuals below. Where a figure comes from an independent measurement rather than Brymen, the text says so.</p>
      <ul class="bm-sources">${SOURCES.map((s) => `<li><a href="${s.href}" target="_blank" rel="noopener">${s.title}</a><span>${s.note}</span></li>`).join("")}</ul>
    </section>`;

  // ---- panel ----
  const $ = (s) => main.querySelector(s);
  const svg = $(".bm-svg");
  const detail = $(".bm-detail");
  let position = POSITIONS.find((p) => p.id === "v");

  const show = (id) => {
    const item = ITEMS.find((x) => x.id === id);
    if (!item) return;
    if (POSITIONS.includes(item)) position = item;
    svg.querySelector(".bm-knob").style.transform = `rotate(${position.angle}deg)`;
    svg.querySelectorAll(".bm-pos").forEach((g) => g.classList.toggle("on", g.dataset.id === position.id));
    svg.querySelectorAll(".bm-key").forEach((g) => g.classList.toggle("on", g.dataset.id === item.id));
    main.querySelectorAll(".bm-dial button").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.id === position.id)));
    main.querySelectorAll(".bm-keys button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.id === item.id)));
    const leads = position.leads;
    svg.querySelectorAll(".bm-jack").forEach((g) => {
      const j = g.dataset.jack;
      const red = leads?.red.includes(j);
      g.classList.toggle("red", !!red && leads.red.length === 1);
      g.classList.toggle("alt", !!red && leads.red.length > 1);
      g.classList.toggle("black", leads?.black === j);
    });
    const lcd = item.lcd || position.lcd;
    svg.querySelector(".bm-lcd-value").textContent = lcd.value;
    svg.querySelector(".bm-lcd-unit").textContent = lcd.unit;
    svg.querySelector(".bm-lcd-flags").textContent = lcd.flags.map((f) => ({ AC: "~", DC: "⎓" })[f] || f).join("  ");
    svg.querySelectorAll(".bm-lcd-bars rect").forEach((r, i) => r.classList.toggle("lit", i < (lcd.bars || 0)));
    detail.innerHTML = detailHtml(item);
  };

  svg.addEventListener("click", (ev) => {
    const hit = ev.target.closest("[data-id]");
    if (hit) show(hit.dataset.id);
  });
  main.querySelectorAll(".bm-controls button").forEach((b) => (b.onclick = () => show(b.dataset.id)));
  main.querySelectorAll(".bm-chip").forEach(
    (b) =>
      (b.onclick = () => {
        show(b.dataset.mode);
        $("#bm-panel").scrollIntoView({ behavior: "smooth", block: "start" });
      }),
  );
  // In-page links can't use #fragments: the router owns the hash.
  main.querySelectorAll(".bm-toc button").forEach((b) => (b.onclick = () => main.querySelector(`#${b.dataset.go}`).scrollIntoView({ behavior: "smooth", block: "start" })));
  show("v");
  // Arriving from the complete guide's "See it on the front panel" link.
  let pending = null;
  try {
    pending = sessionStorage.getItem(PANEL_KEY);
    sessionStorage.removeItem(PANEL_KEY);
  } catch {
    // No storage: start on V.
  }
  if (pending) {
    show(pending);
    requestAnimationFrame(() => $("#bm-panel").scrollIntoView({ block: "start" }));
  }

  // ---- accuracy ----
  let pick = null;
  const accFn = () => ACCURACY.find((f) => f.id === $(".acc-fn").value);
  const drawRanges = () => {
    const fn = accFn();
    $(".bm-ranges").innerHTML = fn.auto
      ? `<span class="small-note">Auto-ranging only.</span>`
      : [`<button type="button" role="radio" data-i="">Auto</button>`, ...fn.ranges.map((rg, i) => `<button type="button" role="radio" data-i="${i}">${rg.label}</button>`)].join("");
    $(".bm-ranges")
      .querySelectorAll("button")
      .forEach(
        (b) =>
          (b.onclick = () => {
            pick = b.dataset.i === "" ? null : +b.dataset.i;
            acc();
          }),
      );
  };
  const acc = () => {
    const fn = accFn();
    const value = parseReading($(".acc-in").value, fn.input[1]);
    const res = value === null ? null : accuracy(fn.id, value, pick);
    $(".bm-ranges")
      .querySelectorAll("button")
      .forEach((b) => {
        const on = pick === null ? b.dataset.i === "" : b.dataset.i === String(pick);
        b.setAttribute("aria-checked", String(on));
        b.classList.toggle("auto-pick", pick === null && res?.index === +b.dataset.i && b.dataset.i !== "");
      });
    const answer = $(".acc-answer");
    const why = $(".acc-why");
    if (!res) {
      answer.textContent = "–";
      why.textContent = `Type a reading, like ${fn.example}${fn.input[0] === "Ω" ? "" : ` ${fn.input[0]}`}.`;
      return;
    }
    if (res.ol) {
      answer.textContent = "OL";
      why.textContent = res.range ? `Too big for the ${res.range.label} range, so the meter shows OL. Pick a higher range or Auto.` : "Beyond the meter's top range.";
      return;
    }
    const { range: rg, shown } = res;
    const f = (x, extra = 0) => minus(x.toFixed(rg.dec + extra));
    answer.textContent = `${f(res.lo)} to ${f(res.hi)} ${rg.unit}`;
    why.textContent =
      `The meter shows ${f(shown)} ${rg.unit} on the ${rg.label} range${rg.where ? ` (${rg.where})` : ""}, where one digit is ${minus(res.digit.toFixed(rg.dec))} ${rg.unit}. ` +
      `${res.pct}% of the reading is ${f(res.fromPct, 1)} ${rg.unit}, and ${res.dig} digits add ${f(res.fromDigits)} ${rg.unit}: ±${f(res.err, 1)} ${rg.unit} in all.` +
      `${res.warn ? ` ${res.warn}` : ""}${fn.note ? ` ${fn.note}` : ""}`;
  };
  $(".acc-fn").onchange = () => {
    const fn = accFn();
    pick = null;
    $(".acc-in").value = fn.example;
    $(".acc-unit").textContent = fn.input[0];
    drawRanges();
    acc();
  };
  $(".acc-in").oninput = acc;
  $(".acc-fn").onchange();

  // ---- ghost voltage ----
  const gh = () => {
    const m = +$(".gh-in").value;
    const g = ghost(m);
    $(".gh-len").textContent = `${m} m`;
    $(".gh-high").textContent = `${g.highZ.toFixed(0)} V`;
    $(".gh-low").textContent = `≈ ${g.lowZ.toFixed(0)} V`;
    $(".gh-bar-high").style.width = `${(100 * g.highZ) / GHOST.mains}%`;
    $(".gh-bar-low").style.width = `${(100 * g.lowZ) / GHOST.mains}%`;
  };
  $(".gh-in").oninput = gh;
  gh();

  // ---- burden ----
  const bu = () => {
    const v = +$(".bu-v").value;
    const i = +$(".bu-i").value / 1000;
    const key = $(".bu-shunt").value;
    if (!(v > 0) || !(i > 0)) {
      $(".bu-answer").textContent = "–";
      $(".bu-why").textContent = "Enter a supply voltage and a current.";
      return;
    }
    const b = burden(v, i, key);
    if (b.over) {
      $(".bu-answer").textContent = "OL";
      $(".bu-why").textContent = `The meter shows OL: this input only goes up to ${si(SHUNTS[key].max, "A")}. Use the next jack up.`;
      return;
    }
    $(".bu-answer").textContent = `Reads ${si(b.reading, "A")}`;
    $(".bu-why").textContent =
      `The shunt takes ${si(b.drop, "V")}, so the circuit gets ${si(b.left, "V")} instead of ${si(v, "V")}, and the reading is ${(100 * b.error).toFixed(b.error < 0.01 ? 2 : 0)}% lower than the current without the meter. ` +
      `(Treating the circuit as a resistor; a regulated gadget may instead keep drawing the same current and misbehave on the lower voltage.)` +
      `${key === "ma" && b.reading > 0.4 ? " Above 400 mA you're past the fuse's rating: fine for a short measurement, not for hours." : ""}`;
  };
  main.querySelectorAll(".bu-v, .bu-i, .bu-shunt").forEach((x) => (x.oninput = bu));
  bu();

  // ---- small calculators inside the house cards ----
  const element = main.querySelector(".calc-element");
  if (element) {
    const run = () => {
      const p = +element.querySelector(".el-p").value;
      const v = +element.querySelector(".el-v").value;
      element.querySelector(".el-out").textContent = p > 0 ? `Expect about ${si((v * v) / p, "Ω")}` : "–";
    };
    element.querySelectorAll("input, select").forEach((x) => (x.oninput = run));
    run();
  }
  const discharge = main.querySelector(".calc-discharge");
  if (discharge) {
    const run = () => {
      const c = +discharge.querySelector(".dc-c").value * 1e-6;
      const v = +discharge.querySelector(".dc-v").value;
      const out = discharge.querySelector(".dc-out");
      const why = discharge.querySelector(".dc-why");
      if (!(c > 0) || !(v > 0)) {
        out.textContent = "–";
        why.textContent = "";
      } else if (v > 600) {
        out.textContent = "Don't";
        why.textContent = "That's above the meter's 600 V rating (1000 V on older units). Use a proper discharge tool.";
      } else if (v <= LOZ_FLOOR) {
        out.textContent = "Use a resistor";
        why.textContent = "AutoV's low impedance doesn't work below about 8 V. That's no shock risk; a 1 kΩ resistor empties it in a few seconds.";
      } else {
        out.textContent = `About ${seconds(dischargeTime(c, v))}`;
        why.textContent = `To drain it to about ${LOZ_FLOOR} V, where the low impedance switches off. It stores ${si(0.5 * c * v * v, "J")} to begin with. A rough estimate from the impedances in Brymen's manual. The big capacitor in a mains power supply is typically 47–470 µF charged to about 325 V.`;
      }
    };
    discharge.querySelectorAll("input").forEach((x) => (x.oninput = run));
    run();
  }
  const battery = main.querySelector(".calc-battery");
  if (battery) {
    const run = () => {
      const mah = +battery.querySelector(".bt-c").value;
      const ua = +battery.querySelector(".bt-i").value;
      battery.querySelector(".bt-out").textContent = mah > 0 && ua > 0 ? `About ${duration((mah * 1000) / ua)}` : "–";
    };
    battery.querySelectorAll("input").forEach((x) => (x.oninput = run));
    run();
  }
}

function chipLabel(id) {
  const item = ITEMS.find((x) => x.id === id);
  return POSITIONS.includes(item) ? `Dial: ${SHORT[id]}` : item.key;
}

function calcHtml(kind) {
  if (kind === "element")
    return `<div class="bm-mini calc-element">
      <label>Power <span class="unit-input"><input type="number" class="el-p" value="2200" min="1" step="100"><em>W</em></span></label>
      <label>Mains <select class="el-v"><option value="230">230 V</option><option value="120">120 V</option></select></label>
      <strong class="el-out"></strong>
    </div>`;
  if (kind === "discharge")
    return `<div class="bm-mini calc-discharge">
      <label>Capacitor <span class="unit-input"><input type="number" class="dc-c" value="470" min="0.01" step="10"><em>µF</em></span></label>
      <label>Charged to <span class="unit-input"><input type="number" class="dc-v" value="325" min="1" step="5"><em>V</em></span></label>
      <strong class="dc-out"></strong>
      <p class="small-note dc-why"></p>
    </div>`;
  if (kind === "battery")
    return `<div class="bm-mini calc-battery">
      <label>Battery <span class="unit-input"><input type="number" class="bt-c" value="220" min="1" step="10"><em>mAh</em></span></label>
      <label>Standby <span class="unit-input"><input type="number" class="bt-i" value="5" min="0.1" step="0.5"><em>µA</em></span></label>
      <strong class="bt-out"></strong>
      <p class="small-note">220 mAh is a CR2032 coin cell. Beyond a few years, the battery's own self-discharge sets the limit instead.</p>
    </div>`;
  return "";
}

function seconds(s) {
  if (s < 1) return "under a second";
  if (s < 90) return `${Math.round(s)} s`;
  return `${Math.round(s / 60)} minutes`;
}

function duration(hours) {
  if (hours < 48) return `${Math.round(hours)} hours`;
  if (hours < 24 * 60) return `${Math.round(hours / 24)} days`;
  if (hours < 24 * 365 * 2) return `${Math.round(hours / (24 * 30.4))} months`;
  return `${(hours / (24 * 365)).toFixed(hours < 24 * 365 * 10 ? 1 : 0)} years`;
}

// A disconnected wire between a live conductor and an earthed one, with the
// meter at the end of it.
function ghostSvg() {
  const caps = (xs, y1, y2) =>
    xs
      .map(
        (x) => `<path d="M${x} ${y1}v${(y2 - y1) / 2 - 4}m-9 0h18m-18 8h18m-9 0V${y2}" class="gh-cap"/>`,
      )
      .join("");
  return `<svg class="bm-ghost" viewBox="0 0 360 132" role="img" aria-label="A disconnected wire coupled by capacitance to a live wire above it and an earthed wire below it, with a meter measuring it">
    <path d="M10 22H300" class="gh-live"/>
    <path d="M10 66H312" class="gh-float"/>
    <path d="M10 110H312" class="gh-earth"/>
    ${caps([140, 200, 260], 22, 66)}
    ${caps([170, 230, 290], 66, 110)}
    <text x="10" y="14" class="gh-label">Live, 230 V</text>
    <text x="10" y="58" class="gh-label">Disconnected wire</text>
    <text x="10" y="126" class="gh-label">Neutral or earth</text>
    <rect x="312" y="52" width="40" height="72" rx="8" class="gh-meter"/>
    <text x="332" y="94" class="gh-meter-text">V</text>
  </svg>`;
}
