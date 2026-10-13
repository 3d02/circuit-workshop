// Small interactive labs for the physics-first chapters:
//   ohmLab       – discover Ohm's law: record V and I for a mystery part, plot them,
//                  read the resistance off the slope; then try an LED, which isn't ohmic
//   dischargeLab – battery voltage as it discharges, for three chemistries and any load
//   prefixLadder – one value written with every SI prefix
// The battery model at the top is pure, so it can be tested under Node.

import { Figure } from "./figure.js";
import { progress } from "./progress.js";
import { si } from "./format.js";
import { toDisplayUnit, sig } from "./quantity.js";

// ---------- battery model (approximate, shaped on typical datasheet curves) ----------

export const CHEMISTRIES = {
  alkaline: {
    name: "Alkaline AA",
    nominal: 1.5,
    cutoff: 0.9,
    // Alkaline cells deliver much less charge at high currents.
    capacity: (I) => 2.85 / (1 + 1.2 * I),
    ocv: (x) => 1.58 - 0.45 * x - 0.25 * x ** 3,
    r: (x) => 0.12 + 0.25 * x,
  },
  nimh: {
    name: "NiMH AA rechargeable",
    nominal: 1.2,
    cutoff: 1.0,
    capacity: (I) => 2.0 * (1 - 0.04 * I),
    ocv: (x) => 1.33 - 0.13 * x - 0.3 * Math.max(0, (x - 0.86) / 0.14) ** 2,
    r: () => 0.03,
  },
  liion: {
    name: "Li-ion 18650",
    nominal: 3.6,
    cutoff: 3.0,
    capacity: (I) => 3.0 * (1 - 0.03 * I),
    ocv: (x) => 4.15 - 0.5 * x - 0.62 * Math.max(0, (x - 0.84) / 0.16) ** 2,
    r: () => 0.05,
  },
};

// Terminal voltage of one cell after a fraction x of its (current-dependent) capacity is used.
export const cellVoltage = (chem, x, I) => CHEMISTRIES[chem].ocv(x) - I * CHEMISTRIES[chem].r(x);

// Discharge at a constant current: points [hours, volts per pack], the runtime to cutoff
// (or to `needs`, a minimum pack voltage), and the energy delivered.
export function discharge(chem, I, cells = 1, needs = 0) {
  const c = CHEMISTRIES[chem];
  const Ah = c.capacity(I);
  const stop = Math.max(c.cutoff * cells, needs);
  const pts = [];
  let runtime = null;
  let wh = 0;
  const N = 200;
  for (let k = 0; k <= N; k++) {
    const x = k / N;
    const v = cellVoltage(chem, x, I) * cells;
    const t = (x * Ah) / I;
    pts.push([t, v]);
    if (runtime === null && v < stop) runtime = t;
    if (runtime === null && k > 0) wh += v * I * ((Ah / I) / N);
  }
  return { pts, runtime: runtime ?? Ah / I, wh, Ah, stop };
}

// ---------- shared bits ----------

const NS = "http://www.w3.org/2000/svg";
function svgEl(tag, attrs = {}, parent) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  parent?.append(el);
  return el;
}
const niceMax = (v) => {
  const p = 10 ** Math.floor(Math.log10(v || 1));
  return [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map((m) => m * p).find((m) => m >= v) || v;
};
function goalsList(goals) {
  return `<div class="fig-goals"><div class="goals-head">Try this</div><ul>${goals.map((g) => `<li data-goal="${g.id}" class="${progress.done(g.id) ? "done" : ""}"><span class="tick"></span><span>${g.text}</span></li>`).join("")}</ul></div>`;
}
function complete(el, id) {
  const li = el.querySelector(`[data-goal="${id}"]`);
  if (li && !li.classList.contains("done")) li.classList.add("done", "just-done");
  if (progress.mark(id)) el.dispatchEvent(new CustomEvent("task", { bubbles: true }));
}

// A round step that gives four or five ticks across a span.
const niceStep = (span) => {
  const p = 10 ** Math.floor(Math.log10(span / 4 || 1));
  return [1, 2, 2.5, 5, 10].map((m) => m * p).find((st) => span / st <= 5);
};

// A simple x–y chart: axes with round-numbered ticks, then whatever the caller draws in data space.
// The axis maximum is rounded up to a whole number of ticks.
function chart(svg, { w, h, pad = [16, 18, 36, 54], x, y }) {
  svg.innerHTML = "";
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  const [pt, pr, pb, pl] = pad;
  const y0 = y.min || 0;
  const xs = niceStep(x.max);
  const ys = niceStep(y.max - y0);
  const xMax = Math.ceil(x.max / xs - 1e-9) * xs;
  const yMax = y0 + Math.ceil((y.max - y0) / ys - 1e-9) * ys;
  const sx = (v) => pl + (v / xMax) * (w - pl - pr);
  const sy = (v) => h - pb - ((v - y0) / (yMax - y0)) * (h - pt - pb);
  const g = svgEl("g", { class: "grid" }, svg);
  for (let yv = y0; yv <= yMax + 1e-9; yv += ys) {
    svgEl("line", { x1: pl, x2: w - pr, y1: sy(yv), y2: sy(yv) }, g);
    svgEl("text", { x: pl - 8, y: sy(yv) + 4, "text-anchor": "end", class: "tick" }, g).textContent = y.fmt(+yv.toPrecision(6));
  }
  for (let xv = 0; xv <= xMax + 1e-9; xv += xs) svgEl("text", { x: sx(xv), y: h - pb + 18, "text-anchor": "middle", class: "tick" }, g).textContent = x.fmt(+xv.toPrecision(6));
  svgEl("path", { class: "axis", d: `M${pl} ${pt}V${h - pb}H${w - pr}` }, svg);
  svgEl("text", { x: w - pr, y: h - 4, "text-anchor": "end", class: "axis-label" }, svg).textContent = x.label;
  svgEl("text", { x: 0, y: 0, class: "axis-label", "text-anchor": "middle", transform: `translate(13 ${(h - pb + pt) / 2}) rotate(-90)` }, svg).textContent = y.label;
  return { sx, sy, xMax, yMax };
}

// ---------- Ohm's law lab ----------

const OHM_R = 330;
const ohmSpec = (led) => ({
  title: led ? "Mystery part swapped for an LED" : "A mystery resistor",
  layout: "compact",
  iScale: 0.02,
  parts: [
    { id: "B1", type: "battery", a: [1, 2], b: [1, 4], v: 3, r: 0.05, label: (p) => `${p.v} V`, labelSide: "left" },
    { id: "A1", type: "ammeter", a: [3, 0], b: [5, 0], labelSide: "above" },
    ...(led
      ? [
          { id: "R0", type: "resistor", a: [6, 0], b: [8, 0], r: 220, label: "220 Ω" },
          { id: "X1", type: "led", a: [10, 1.5], b: [10, 3.5], color: "red", imax: 0.06, labelSide: "left" },
        ]
      : [{ id: "X1", type: "resistor", a: [10, 1.5], b: [10, 3.5], r: OHM_R, label: "?", labelSide: "left" }]),
    { id: "V1", type: "voltmeter", a: [12, 1.5], b: [12, 3.5], labelSide: "right" },
  ],
  wires: led
    ? ["1,2 1,0 3,0", "5,0 6,0", "8,0 10,0 10,1.5", "10,0 12,0 12,1.5", "10,3.5 10,5 1,5 1,4", "12,3.5 12,5 10,5"]
    : ["1,2 1,0 3,0", "5,0 10,0 10,1.5", "10,0 12,0 12,1.5", "10,3.5 10,5 1,5 1,4", "12,3.5 12,5 10,5"],
  controls: [{ label: "Battery voltage", part: "B1", prop: "v", min: 0.5, max: 9, step: 0.5, unit: "V" }],
  readouts: [
    { label: "Voltmeter", value: (q) => q.across("X1"), unit: "V" },
    { label: "Ammeter", value: (q) => q.i("X1"), unit: "A" },
  ],
});

export function ohmLab(el) {
  const goals = [
    { id: "ohm-lab-five", text: "Record at least five readings, from under 2 V to over 7 V" },
    { id: "ohm-lab-led", text: "Swap in the LED and record four readings. Is it a straight line?" },
  ];
  el.innerHTML = `
    <div class="lab">
      <div class="lab-fig"></div>
      <div class="lab-data">
        <div class="lab-actions">
          <button type="button" class="btn small rec-btn">Record this reading</button>
          <button type="button" class="btn small outline swap-btn" aria-pressed="false">Swap in an LED</button>
          <button type="button" class="linkish clear-btn">Clear</button>
        </div>
        <div class="lab-grid">
          <div class="lab-table-wrap"><table class="lab-table"><thead><tr><th>V across</th><th>I through</th><th>V ÷ I</th></tr></thead><tbody></tbody></table><p class="lab-empty">Set a voltage, then record. Change the voltage and record again.</p></div>
          <div class="lab-plot"><svg role="img" aria-label="Current against voltage for your readings"></svg><p class="lab-fit" aria-live="polite"></p></div>
        </div>
        ${goalsList(goals)}
      </div>
    </div>`;
  const host = el.querySelector(".lab-fig");
  const svg = el.querySelector("svg");
  const tbody = el.querySelector("tbody");
  const fit = el.querySelector(".lab-fit");
  const data = { r: [], led: [] };
  let led = false;
  let fig = new Figure(host, ohmSpec(false));

  const draw = () => {
    const pts = data[led ? "led" : "r"];
    tbody.innerHTML = pts.map(([v, i]) => `<tr><td>${v.toFixed(2)} V</td><td>${si(i, "A")}</td><td>${i > 1e-6 ? si(v / i, "Ω") : "–"}</td></tr>`).join("");
    el.querySelector(".lab-empty").hidden = pts.length > 0;
    const all = [...data.r, ...data.led];
    const xMax = niceMax(Math.max(3, ...all.map((p) => p[0])) * 1.05);
    const yMax = niceMax(Math.max(0.005, ...all.map((p) => p[1])) * 1.1);
    const narrow = el.clientWidth < 560;
    const { sx, sy, xMax: xEnd } = chart(svg, { w: narrow ? 340 : 420, h: 250, x: { max: xMax, label: "voltage across, V", fmt: (v) => +v.toFixed(1) }, y: { max: yMax, label: "current, mA", fmt: (v) => +(v * 1000).toFixed(1) } });
    // Best line through the origin for the resistor: slope = Σvi / Σv².
    let text = "";
    if (data.r.length >= 2) {
      const k = data.r.reduce((a, [v, i]) => a + v * i, 0) / data.r.reduce((a, [v]) => a + v * v, 0);
      const xTop = Math.min(xEnd, yMax / k);
      svgEl("line", { class: "lab-line", x1: sx(0), y1: sy(0), x2: sx(xTop), y2: sy(k * xTop) }, svg);
      text = `Resistor: a straight line through zero. Slope = ${si(k, "A")} per volt.`;
    }
    for (const [key, cls] of [["r", "pt-r"], ["led", "pt-led"]]) {
      if (key === "led" && data.led.length > 1) {
        const sorted = [...data.led].sort((a, b) => a[0] - b[0]);
        svgEl("polyline", { class: "lab-curve", points: [[0, 0], ...sorted].map(([v, i]) => `${sx(v)},${sy(i)}`).join(" ") }, svg);
      }
      for (const [v, i] of data[key]) svgEl("circle", { class: `lab-pt ${cls}`, cx: sx(v), cy: sy(i), r: 5 }, svg);
    }
    if (data.led.length >= 2) text += `${text ? " " : ""}LED: no current at all until about 1.7 V, then it shoots up. Not a straight line, so not ohmic.`;
    fit.textContent = text;
    const vs = data.r.map((p) => p[0]);
    if (data.r.length >= 5 && Math.min(...vs) < 2 && Math.max(...vs) > 7) complete(el, "ohm-lab-five");
    if (data.led.length >= 4) complete(el, "ohm-lab-led");
  };

  el.querySelector(".rec-btn").onclick = () => {
    const q = fig.query();
    const v = Math.abs(q.across("X1"));
    const i = Math.abs(q.i("X1"));
    const list = data[led ? "led" : "r"];
    if (list.some(([pv]) => Math.abs(pv - v) < 0.02)) {
      fit.textContent = "You already have that one. Change the battery voltage first.";
      return;
    }
    list.push([v, i]);
    draw();
  };
  el.querySelector(".swap-btn").onclick = (e) => {
    led = !led;
    e.target.textContent = led ? "Back to the mystery resistor" : "Swap in an LED";
    e.target.setAttribute("aria-pressed", String(led));
    fig.destroy();
    host.innerHTML = "";
    fig = new Figure(host, ohmSpec(led));
    draw();
  };
  el.querySelector(".clear-btn").onclick = () => {
    data[led ? "led" : "r"] = [];
    draw();
  };
  draw();
  return () => fig.destroy();
}

// ---------- battery discharge lab ----------

export function dischargeLab(el, { cells = 1, chem = "alkaline", current = 0.1, needs = 0, needsLabel = "", lock = false } = {}) {
  el.innerHTML = `
    <div class="lab lab-battery">
      <div class="lab-data">
        <div class="lab-controls">
          <label class="ctl"><span class="ctl-top"><span>Battery</span></span><select class="b-chem" ${lock ? "disabled" : ""}>${Object.entries(CHEMISTRIES).map(([k, c]) => `<option value="${k}" ${k === chem ? "selected" : ""}>${c.name}</option>`).join("")}</select></label>
          <label class="ctl"><span class="ctl-top"><span>Cells in series</span><output class="o-cells"></output></span><input type="range" class="b-cells" min="1" max="4" step="1" value="${cells}"></label>
          <label class="ctl"><span class="ctl-top"><span>Load current</span><output class="o-i"></output></span><input type="range" class="b-i" min="0" max="100" value="${Math.round(Math.log10(current / 0.02) * 50)}"></label>
        </div>
        <div class="lab-plot wide-plot"><svg role="img" aria-label="Battery voltage against time"></svg></div>
        <div class="fig-readouts lab-readouts">
          <div class="readout"><span>Runs for</span><strong class="r-time">–</strong></div>
          <div class="readout"><span>Charge used</span><strong class="r-ah">–</strong></div>
          <div class="readout"><span>Energy delivered</span><strong class="r-wh">–</strong></div>
          <div class="readout"><span>Stops at</span><strong class="r-stop">–</strong></div>
        </div>
        <p class="small-note lab-note"></p>
      </div>
    </div>`;
  const $ = (s) => el.querySelector(s);
  const svg = $("svg");
  const run = () => {
    const ch = $(".b-chem").value;
    const n = +$(".b-cells").value;
    const I = 0.02 * 10 ** (+$(".b-i").value / 50);
    $(".o-cells").textContent = String(n);
    $(".o-i").textContent = si(I, "A", 2);
    const d = discharge(ch, I, n, needs);
    const tMax = niceMax(d.pts.at(-1)[0]);
    const vTop = niceMax(CHEMISTRIES[ch].ocv(0) * n * 1.05);
    const narrow = el.clientWidth < 560;
    const { sx, sy, xMax: tEnd } = chart(svg, {
      w: narrow ? 360 : 760,
      h: 260,
      x: { max: tMax, label: "time, hours", fmt: (v) => +v.toFixed(2) },
      y: { min: 0, max: vTop, label: "battery voltage, V", fmt: (v) => +v.toFixed(1) },
    });
    const live = d.pts.filter(([t]) => t <= d.runtime + 1e-9);
    const rest = d.pts.filter(([t]) => t >= d.runtime - 1e-9);
    svgEl("polyline", { class: "lab-curve used", points: live.map(([t, v]) => `${sx(t)},${sy(Math.max(0, v))}`).join(" ") }, svg);
    svgEl("polyline", { class: "lab-curve unused", points: rest.map(([t, v]) => `${sx(t)},${sy(Math.max(0, v))}`).join(" ") }, svg);
    svgEl("line", { class: "lab-stop", x1: sx(0), x2: sx(tEnd), y1: sy(d.stop), y2: sy(d.stop) }, svg);
    svgEl("text", { class: "lab-stop-label", x: sx(tEnd) - 4, y: sy(d.stop) - 6, "text-anchor": "end" }, svg).textContent = needs && d.stop === needs ? needsLabel || `needs ${needs} V` : `flat at ${+(CHEMISTRIES[ch].cutoff * n).toFixed(2)} V`;
    svgEl("circle", { class: "lab-pt pt-r", cx: sx(d.runtime), cy: sy(d.stop), r: 5 }, svg);
    $(".r-time").textContent = d.runtime >= 1 ? `${d.runtime.toFixed(d.runtime < 10 ? 1 : 0)} h` : `${Math.round(d.runtime * 60)} min`;
    $(".r-ah").textContent = `${Math.round(d.runtime * I * 1000).toLocaleString("en-GB")} mAh`;
    $(".r-wh").textContent = si(d.wh, "Wh", 2);
    $(".r-stop").textContent = `${d.stop.toFixed(2)} V`;
    const left = 1 - (d.runtime * I) / d.Ah;
    $(".lab-note").textContent =
      left > 0.05
        ? `About ${Math.round(left * 100)}% of the charge is still in the battery when the voltage gets too low to use: the grey part of the curve.`
        : ch === "alkaline" && I > 0.3
          ? "At high currents an alkaline cell gives up much less charge than its label suggests: try 50 mA, then 1 A."
          : "Approximate curves, shaped on typical datasheet figures. Real cells vary with brand, age and temperature.";
  };
  el.querySelectorAll("select, input").forEach((x) => (x.oninput = run));
  run();
  const ro = new ResizeObserver(() => run());
  ro.observe(el);
  return () => ro.disconnect();
}

// ---------- prefix ladder ----------

const LADDER = [
  ["G", 1e9],
  ["M", 1e6],
  ["k", 1e3],
  ["", 1],
  ["m", 1e-3],
  ["µ", 1e-6],
  ["n", 1e-9],
  ["p", 1e-12],
];

export function prefixLadder(el) {
  el.innerHTML = `
    <div class="ladder">
      <div class="ladder-in">
        <label for="ladder-v">Type any value</label>
        <div class="ladder-row"><input id="ladder-v" value="0.0191" autocomplete="off" spellcheck="false" inputmode="text"><select id="ladder-u" aria-label="Unit">${["A", "V", "Ω", "F", "W", "s", "Hz"].map((u) => `<option>${u}</option>`).join("")}</select></div>
        <p class="small-note">Try 0.0191 A, 4700 Ω, 0.0000001 F or 1.6e-19.</p>
      </div>
      <ol class="ladder-list" aria-live="polite"></ol>
    </div>`;
  const input = el.querySelector("input");
  const unit = el.querySelector("select");
  const list = el.querySelector(".ladder-list");
  const run = () => {
    const r = toDisplayUnit(input.value, unit.value);
    if (r.value === undefined || !Number.isFinite(r.value)) {
      list.innerHTML = `<li class="ladder-bad">Type a number, like 0.0191 or 4.7k.</li>`;
      return;
    }
    const v = r.value;
    const best = LADDER.find(([, m]) => Math.abs(v) >= m * 0.9995) || LADDER.at(-1);
    list.innerHTML = LADDER.map(([p, m]) => {
      const n = v / m;
      const text = sig(n, 4);
      const exp = Math.round(Math.log10(m));
      return `<li class="${p === best[0] ? "best" : ""}"><span class="ladder-exp">10${exp ? String(exp).replace(/./g, (c) => ({ "-": "⁻" })[c] || "⁰¹²³⁴⁵⁶⁷⁸⁹"[c]) : "⁰"}</span><span class="ladder-val">${text} ${p}${unit.value}</span>${p === best[0] ? `<span class="ladder-tag">easiest to read</span>` : ""}</li>`;
    }).join("");
  };
  input.oninput = run;
  unit.onchange = run;
  run();
}

