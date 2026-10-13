// Labs for the "how your meter works" chapter:
//   meterDiagram – one voltmeter does everything: how each function becomes a small DC voltage
//   accuracyLab  – a reading on your BM235, and the band the true value lies in
//   rmsLab       – peak, true RMS and what an average-responding meter would show, per waveform
//   ghostLab     – a disconnected wire next to a live one: 10 MΩ input against AutoV
// The waveform maths at the top is pure, so it can be tested under Node.

import { ACCURACY, accuracy, parseReading, ghost } from "./data/bm235.js";
import { si } from "./format.js";

// ---------- waveforms ----------

const N = 2000;
const TAU = Math.PI * 2;
// Each waveform is one cycle, as a function of phase 0..1, with a 325 V peak (230 V mains).
export const WAVES = {
  sine: { name: "Mains: a clean sine wave", f: (p) => Math.sin(TAU * p) },
  dimmer: { name: "Through a dimmer, at half power", f: (p) => ((p % 0.5) >= 0.25 ? Math.sin(TAU * p) : 0) },
  square: { name: "Square wave", f: (p) => (p < 0.5 ? 1 : -1) },
  modified: { name: "Cheap inverter: “modified sine”", f: (p) => (p % 0.5 < 0.125 || p % 0.5 >= 0.375 ? 0 : p < 0.5 ? 1 : -1) },
  pulses: { name: "Narrow pulses (like the current a phone charger draws)", f: (p) => { const d = Math.min(Math.abs(p - 0.25), Math.abs(p - 0.75)); return d < 0.05 ? Math.sign(Math.sin(TAU * p)) * Math.cos((d / 0.05) * (Math.PI / 2)) ** 2 : 0; } },
  triangle: { name: "Triangle wave", f: (p) => (p < 0.25 ? 4 * p : p < 0.75 ? 2 - 4 * p : 4 * p - 4) },
};

// Peak, true RMS, rectified average, and what an average-responding meter shows
// (it measures the rectified average and multiplies by 1.111, which is only right for a sine).
export function waveStats(fn, peak = 325) {
  let sq = 0;
  let abs = 0;
  let max = 0;
  for (let i = 0; i < N; i++) {
    const v = fn((i + 0.5) / N) * peak;
    sq += v * v;
    abs += Math.abs(v);
    max = Math.max(max, Math.abs(v));
  }
  const rms = Math.sqrt(sq / N);
  const avg = abs / N;
  const FORM = Math.PI / (2 * Math.SQRT2); // 1.1107: RMS ÷ average for a sine
  return { peak: max, rms, avg, avgReading: avg * FORM, crest: rms ? max / rms : 0 };
}

// ---------- one voltmeter does everything ----------

export function meterDiagram(el) {
  const rows = [
    ["Volts", "V Ω jack", "a chain of resistors totalling 10 MΩ divides it down", "a fraction of the voltage"],
    ["Current", "mA µA or A jack", "the current flows through a small, precise shunt resistor", "I × R<sub>shunt</sub>"],
    ["Resistance", "V Ω jack", "the meter pushes its own known current through the part", "I<sub>test</sub> × R"],
    ["Capacitance", "V Ω jack", "it charges the capacitor with a known current and times it", "a voltage ramp to time"],
    ["AC anything", "as above", "it samples the waveform and calculates its RMS value", "a steady equivalent"],
  ];
  el.innerHTML = `
    <figure class="md">
      <figcaption class="md-cap">Every function turns what you're measuring into a small DC voltage. One converter measures that, about five times a second.</figcaption>
      <div class="md-grid" role="table" aria-label="How each function reaches the converter">
        <div class="md-head" role="row"><span role="columnheader">You measure</span><span role="columnheader">Red lead in</span><span role="columnheader">Inside the meter</span><span role="columnheader">The converter sees</span></div>
        ${rows.map(([a, b, c, d]) => `<div class="md-row" role="row"><span class="md-what" role="cell">${a}</span><span role="cell">${b}</span><span role="cell">${c}</span><span class="md-out" role="cell">${d}</span></div>`).join("")}
      </div>
      <div class="md-chain" aria-hidden="true">
        <span class="md-box">small DC voltage</span><span class="md-arrow">→</span>
        <span class="md-box strong">converter (ADC)<small>counts to 6,000</small></span><span class="md-arrow">→</span>
        <span class="md-box">display<small>scaled by the range</small></span>
      </div>
    </figure>`;
}

// ---------- accuracy ----------

const LAB_FNS = ["dcv", "acv", "ohm", "dca", "cap"];

export function accuracyLab(el) {
  const fns = ACCURACY.filter((f) => LAB_FNS.includes(f.id));
  el.innerHTML = `
    <div class="acc">
      <div class="acc-in">
        <label class="ctl" for="acc-fn"><span class="ctl-top"><span>Function</span></span></label>
        <select id="acc-fn">${fns.map((f) => `<option value="${f.id}">${f.label}</option>`).join("")}</select>
        <label for="acc-v" class="acc-label">What the display shows</label>
        <div class="unit-input"><input id="acc-v" autocomplete="off" spellcheck="false" inputmode="decimal"><em class="acc-unit"></em></div>
      </div>
      <div class="acc-out" aria-live="polite">
        <div class="acc-big"></div>
        <div class="acc-bar"><i class="acc-band"></i><b class="acc-mark"></b></div>
        <div class="acc-ends"><span class="acc-lo"></span><span class="acc-hi"></span></div>
        <p class="acc-why"></p>
      </div>
    </div>`;
  const $ = (s) => el.querySelector(s);
  const pick = () => fns.find((f) => f.id === $("#acc-fn").value);
  const syncFn = () => {
    const fn = pick();
    $("#acc-v").value = fn.example;
    $(".acc-unit").textContent = fn.input[0];
    run();
  };
  const run = () => {
    const fn = pick();
    const value = parseReading($("#acc-v").value, fn.input[1]);
    const a = value === null ? null : accuracy(fn.id, value);
    if (!a || a.ol) {
      $(".acc-big").textContent = a?.ol ? "OL: too big for any range" : "–";
      $(".acc-why").textContent = "";
      $(".acc-lo").textContent = $(".acc-hi").textContent = "";
      return;
    }
    const u = a.range.unit;
    const d = a.range.dec;
    $(".acc-big").innerHTML = `${a.shown.toFixed(d)} ${u} <span>± ${a.err.toFixed(d + 1)} ${u}</span>`;
    $(".acc-lo").textContent = `${a.lo.toFixed(d)} ${u}`;
    $(".acc-hi").textContent = `${a.hi.toFixed(d)} ${u}`;
    const span = a.hi - a.lo || 1;
    // The bar shows the band, centred, at a scale where it fills about 60%.
    $(".acc-band").style.cssText = `left:20%;width:60%`;
    $(".acc-mark").style.left = `${20 + ((a.shown - a.lo) / span) * 60}%`;
    $(".acc-why").innerHTML = `On the <b>${a.range.label}</b> range one digit is ${a.digit.toFixed(d)} ${u}. ±(${a.pct}% + ${a.dig} digits) = ${a.pct}% × ${Math.abs(a.shown).toFixed(d)} + ${a.dig} × ${a.digit.toFixed(d)} = ${a.fromPct.toFixed(d + 1)} + ${a.fromDigits.toFixed(d)} = <b>±${a.err.toFixed(d + 1)} ${u}</b>. The true value lies somewhere from ${a.lo.toFixed(d)} to ${a.hi.toFixed(d)} ${u}.${a.warn ? ` ${a.warn}` : ""}`;
  };
  $("#acc-fn").onchange = syncFn;
  $("#acc-v").oninput = run;
  syncFn();
}

// ---------- RMS ----------

export function rmsLab(el) {
  el.innerHTML = `
    <div class="lab rms">
      <div class="lab-data">
        <label class="ctl" for="rms-w"><span class="ctl-top"><span>Waveform (all with a 325 V peak)</span></span></label>
        <select id="rms-w">${Object.entries(WAVES).map(([k, w]) => `<option value="${k}">${w.name}</option>`).join("")}</select>
        <div class="lab-plot wide-plot"><svg viewBox="0 0 760 200" role="img" aria-label="The chosen waveform over one cycle"></svg></div>
        <div class="fig-readouts lab-readouts">
          <div class="readout"><span>Peak</span><strong class="r-peak">–</strong></div>
          <div class="readout"><span>True RMS: your BM235 shows</span><strong class="r-rms">–</strong></div>
          <div class="readout"><span>A cheap average-responding meter shows</span><strong class="r-avg">–</strong></div>
          <div class="readout"><span>Crest factor (peak ÷ RMS)</span><strong class="r-crest">–</strong></div>
        </div>
        <p class="small-note r-note"></p>
      </div>
    </div>`;
  const svg = el.querySelector("svg");
  const run = () => {
    const key = el.querySelector("#rms-w").value;
    const w = WAVES[key];
    const st = waveStats(w.f);
    const W = 760;
    const H = 200;
    const sx = (p) => 40 + p * (W - 60);
    const sy = (v) => H / 2 - (v / 325) * (H / 2 - 16);
    let d = "";
    for (let i = 0; i <= 400; i++) {
      const p = i / 400;
      d += `${i ? "L" : "M"}${sx(p).toFixed(1)} ${sy(w.f(p) * 325).toFixed(1)}`;
    }
    const line = (v, cls, text) => `<line class="${cls}" x1="40" x2="${W - 20}" y1="${sy(v)}" y2="${sy(v)}"/><text class="${cls}-label" x="${W - 22}" y="${sy(v) - 5}" text-anchor="end">${text}</text>`;
    svg.innerHTML = `<g class="grid"><line x1="40" x2="${W - 20}" y1="${sy(0)}" y2="${sy(0)}"/></g>
      <text class="tick" x="34" y="${sy(325) + 4}" text-anchor="end">325</text><text class="tick" x="34" y="${sy(0) + 4}" text-anchor="end">0</text><text class="tick" x="34" y="${sy(-325) + 4}" text-anchor="end">−325</text>
      ${line(st.rms, "rms-line", `true RMS ${Math.round(st.rms)} V`)}
      <path class="lab-curve used" d="${d}"/>`;
    el.querySelector(".r-peak").textContent = `${Math.round(st.peak)} V`;
    el.querySelector(".r-rms").textContent = `${st.rms.toFixed(1)} V`;
    el.querySelector(".r-avg").textContent = `${st.avgReading.toFixed(1)} V`;
    el.querySelector(".r-crest").textContent = st.crest.toFixed(2);
    const err = (st.avgReading / st.rms - 1) * 100;
    el.querySelector(".r-note").textContent =
      Math.abs(err) < 0.5
        ? "For a pure sine both kinds of meter agree: that's the only waveform average-responding meters are calibrated for."
        : `The average-responding meter is ${Math.abs(err).toFixed(0)}% ${err < 0 ? "low" : "high"} here.${st.crest > 2 ? " The crest factor is also high: your BM235 stays within spec only up to a crest factor of 2 at full scale, 4 at half scale." : ""}`;
  };
  el.querySelector("#rms-w").onchange = run;
  run();
}

// ---------- ghost voltages ----------

export function ghostLab(el) {
  el.innerHTML = `
    <div class="lab ghost">
      <div class="lab-data">
        <label class="ctl"><span class="ctl-top"><span>Length of cable alongside the live wire</span><output class="o-len"></output></span><input type="range" class="g-len" min="1" max="40" value="10"></label>
        <div class="fig-readouts lab-readouts">
          <div class="readout"><span>Coupling capacitance to the live wire</span><strong class="r-c">–</strong></div>
          <div class="readout"><span>On V (10 MΩ input)</span><strong class="r-high">–</strong></div>
          <div class="readout"><span>On AutoV (LoZ, about 2 kΩ)</span><strong class="r-low">–</strong></div>
        </div>
        <p class="small-note">A disconnected wire, in a cable alongside a live one and an earthed one, with 50 pF of capacitance per metre to each. The model is Brymen's impedance figures and some simple AC circuit maths.</p>
      </div>
    </div>`;
  const run = () => {
    const m = +el.querySelector(".g-len").value;
    const g = ghost(m);
    el.querySelector(".o-len").textContent = `${m} m`;
    el.querySelector(".r-c").textContent = si(g.coupling, "F");
    el.querySelector(".r-high").textContent = `${g.highZ.toFixed(0)} V`;
    el.querySelector(".r-low").textContent = `${g.lowZ.toFixed(1)} V`;
  };
  el.querySelector(".g-len").oninput = run;
  run();
}
