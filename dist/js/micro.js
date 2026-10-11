// Inside the wire: three simulations for the chapter on charges and fields.
//
// 1. wireZoom  – free electrons and fixed ions in a slice of copper (a Drude-style
//                picture): fast random motion, a slow drift when a field is applied,
//                and collisions that turn the field's work into heat.
// 2. fieldRace – a full-size loop: the field spreads in nanoseconds, the electrons
//                take hours, shown on a zoomable clock.
// 3. fieldMap  – where the field comes from (surface charge), how strong it is in
//                each part of the loop, and where the energy flows.
//
// The models at the top are pure, so they can be tested under Node.

import { progress } from "./progress.js";
import { clamp } from "./format.js";

// ---------- shared numbers (real copper) ----------

export const E_CHARGE = 1.602e-19; // coulombs per electron
export const N_COPPER = 8.5e28; // free electrons per cubic metre
export const FERMI_SPEED = 1.57e6; // m/s: how fast free electrons move at random
export const SIGNAL_SPEED = 2e8; // m/s: how fast the field spreads along typical wiring

// Drift speed (m/s) for a current (A) through a wire of cross-section area (mm²).
export const driftSpeed = (amps, mm2) => amps / (N_COPPER * mm2 * 1e-6 * E_CHARGE);

// ---------- model 1: electrons in a metal ----------

export const V_RANDOM = 170; // px/s, the animation's stand-in for the random speed
const PUSH = 240; // px/s² of drift acceleration at full field
const AMPLITUDE = [1, 3.5, 7]; // ion vibration at cold, room, hot
const SCATTER = [0.8, 1.6, 3.2]; // extra random scatterings per second (vibrations, impurities)

function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeWire({ width, height, spacing = 46, margin = 30, seed = 7 }) {
  const rand = rng(seed);
  const top = margin;
  const bottom = height - margin;
  const rows = Math.max(2, Math.floor((bottom - top) / spacing));
  const y0 = top + (bottom - top - (rows - 1) * spacing) / 2;
  const cols = Math.max(4, Math.round(width / spacing));
  const sx = width / cols; // ions tile exactly, so the wire wraps around seamlessly
  const ions = [];
  // A slightly irregular lattice, so there are no perfectly straight corridors between rows.
  const jig = spacing * 0.12;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) ions.push({ x: (i + 0.5) * sx + (rand() - 0.5) * 2 * jig, y: y0 + j * spacing + (rand() - 0.5) * 2 * jig, phase: rand() * 6.283, freq: 8 + rand() * 6, glow: 0 });
  // One free electron per copper atom, as in real copper.
  const electrons = [];
  while (electrons.length < ions.length) {
    const x = rand() * width;
    const y = top + 4 + rand() * (bottom - top - 8);
    if (ions.some((o) => Math.hypot(o.x - x, o.y - y) < 18)) continue;
    const a = rand() * 6.283;
    electrons.push({ x, y, vx: Math.cos(a) * V_RANDOM, vy: Math.sin(a) * V_RANDOM, trail: [] });
  }
  return { width, height, top, bottom, sx, spacing, y0, rows, cols, ions, electrons, rand, t: 0, crossings: [], totalRight: 0, totalLeft: 0, heat: 0, heatRate: 0, drift: 0, amp: AMPLITUDE[1] };
}

// Where an ion is right now (it vibrates about its place in the lattice).
export function ionAt(w, ion) {
  return [ion.x + w.amp * Math.sin(ion.phase + ion.freq * w.t), ion.y + w.amp * Math.cos(ion.phase * 1.3 + ion.freq * 0.8 * w.t)];
}

export function stepWire(w, dt, { field = 0, temp = 1, follow = -1 } = {}) {
  w.amp = AMPLITUDE[temp];
  const reach = 11 + w.amp * 0.9; // hotter ions vibrate more and get in the way more
  const accel = -PUSH * field; // the field points right, so electrons are pushed left
  const steps = Math.ceil(dt / (1 / 240));
  const h = dt / steps;
  const mid = w.width / 2;
  let heat = 0;
  for (let s = 0; s < steps; s++) {
    w.t += h;
    for (let k = 0; k < w.electrons.length; k++) {
      const e = w.electrons[k];
      e.vx += accel * h;
      const px = e.x;
      e.x += e.vx * h;
      e.y += e.vy * h;
      if (e.y < w.top + 3) {
        e.y = w.top + 3;
        e.vy = Math.abs(e.vy);
      } else if (e.y > w.bottom - 3) {
        e.y = w.bottom - 3;
        e.vy = -Math.abs(e.vy);
      }
      if (px < mid && e.x >= mid) {
        w.crossings.push([w.t, 1]);
        w.totalRight++;
      } else if (px >= mid && e.x < mid) {
        w.crossings.push([w.t, -1]);
        w.totalLeft++;
      }
      if (e.x < 0) e.x += w.width;
      else if (e.x >= w.width) e.x -= w.width;

      const i = clamp(Math.floor(e.x / w.sx), 0, w.cols - 1);
      const j = clamp(Math.round((e.y - w.y0) / w.spacing), 0, w.rows - 1);
      const ion = w.ions[j * w.cols + i];
      const [ix, iy] = ionAt(w, ion);
      const dx = e.x - ix;
      const dy = e.y - iy;
      const d = Math.hypot(dx, dy);
      if (d < reach && d > 1e-6) {
        const nx = dx / d;
        const ny = dy / d;
        const vn = e.vx * nx + e.vy * ny;
        if (vn < 0) {
          // Bounce off in a slightly random direction...
          let vx = e.vx - 2 * vn * nx;
          let vy = e.vy - 2 * vn * ny;
          const turn = (w.rand() - 0.5) * 1.4;
          [vx, vy] = [vx * Math.cos(turn) - vy * Math.sin(turn), vx * Math.sin(turn) + vy * Math.cos(turn)];
          // ...and hand any energy picked up from the field to the metal. That's heat.
          const speed = Math.hypot(vx, vy);
          const extra = 0.5 * (speed * speed - V_RANDOM * V_RANDOM);
          heat += extra;
          if (extra > 0) ion.glow = Math.min(1, ion.glow + extra / 9000);
          e.vx = (vx / speed) * V_RANDOM;
          e.vy = (vy / speed) * V_RANDOM;
        }
        e.x = ix + nx * reach;
        e.y = iy + ny * reach;
      }
      // Scattering also happens between ion hits: real metals have vibrations and imperfections everywhere.
      if (w.rand() < SCATTER[temp] * h) {
        const speed = Math.hypot(e.vx, e.vy);
        const extra = 0.5 * (speed * speed - V_RANDOM * V_RANDOM);
        heat += extra;
        if (extra > 0) ion.glow = Math.min(1, ion.glow + extra / 9000);
        const a = w.rand() * 6.283;
        e.vx = Math.cos(a) * V_RANDOM;
        e.vy = Math.sin(a) * V_RANDOM;
      }
      if (k === follow) {
        e.trail.push([e.x, e.y]);
        if (e.trail.length > 900) e.trail.shift();
      }
    }
  }
  for (const ion of w.ions) ion.glow *= Math.exp(-dt * 2.2);
  w.crossings = w.crossings.filter(([t]) => t > w.t - 4);
  let mean = 0;
  for (const e of w.electrons) mean += e.vx;
  mean /= w.electrons.length;
  const k = Math.min(1, dt * 0.35);
  w.drift += (mean - w.drift) * k;
  w.heatRate += (heat / Math.max(dt, 1e-6) - w.heatRate) * Math.min(1, dt * 0.6);
  w.heat += heat;
}

export function crossingRates(w) {
  const span = Math.min(4, w.t) || 1;
  const right = w.crossings.filter(([, d]) => d > 0).length / span;
  const left = w.crossings.filter(([, d]) => d < 0).length / span;
  return { right, left, net: right - left };
}

// ---------- model 2: the race between field and electrons ----------

export const RACE = { wireMetres: 0.3, amps: 0.3, mm2: 0.5 };
export const raceTimes = () => ({
  field: RACE.wireMetres / SIGNAL_SPEED,
  electron: RACE.wireMetres / driftSpeed(RACE.amps, RACE.mm2),
});

export function formatDuration(t) {
  if (t < 1e-6) return `${(t * 1e9).toFixed(t < 1e-8 ? 2 : 1)} ns`;
  if (t < 1e-3) return `${(t * 1e6).toFixed(1)} µs`;
  if (t < 1) return `${(t * 1e3).toFixed(1)} ms`;
  if (t < 60) return `${t.toFixed(1)} s`;
  if (t < 3600) return `${Math.floor(t / 60)} min ${Math.floor(t % 60)} s`;
  return `${Math.floor(t / 3600)} h ${Math.floor((t % 3600) / 60)} min`;
}

// ---------- model 3: potential, field and surface charge around a loop ----------

// The loop, in the direction conventional current flows (from the + terminal).
const LOOP = [
  { kind: "wire", pts: [[110, 140], [110, 60], [300, 60]] },
  { kind: "switch", pts: [[300, 60], [360, 60]] },
  { kind: "wire", pts: [[360, 60], [620, 60], [620, 140]] },
  { kind: "lamp", pts: [[620, 140], [620, 200]] },
  { kind: "wire", pts: [[620, 200], [620, 270], [110, 270], [110, 200]] },
];
const R_PER_PX = { wire: 1, switch: 1, lamp: 450 }; // the filament resists hundreds of times more per length

// Sample the loop every few pixels: position, direction, part, potential, field strength.
export function loopProfile({ closed = true, volts = 9, step = 6 } = {}) {
  const samples = [];
  for (const seg of LOOP) {
    for (let p = 0; p < seg.pts.length - 1; p++) {
      const [x1, y1] = seg.pts[p];
      const [x2, y2] = seg.pts[p + 1];
      const len = Math.hypot(x2 - x1, y2 - y1);
      for (let d = 0; d < len; d += step) samples.push({ x: x1 + ((x2 - x1) * d) / len, y: y1 + ((y2 - y1) * d) / len, ux: (x2 - x1) / len, uy: (y2 - y1) / len, kind: seg.kind === "switch" ? (closed ? "wire" : "gap") : seg.kind });
    }
  }
  const resist = samples.map((s) => (s.kind === "gap" ? Infinity : R_PER_PX[s.kind] * step));
  const total = resist.reduce((a, b) => a + b, 0);
  const current = Number.isFinite(total) ? volts / total : 0;
  let v = volts;
  const gapSize = samples.filter((s) => s.kind === "gap").length;
  for (let i = 0; i < samples.length; i++) {
    const drop = samples[i].kind === "gap" ? volts / gapSize : current * resist[i];
    samples[i].v = v;
    samples[i].field = drop / step; // volts per pixel, pointing along the loop
    v -= drop;
  }
  return { samples, current, volts };
}

// ---------- widgets ----------

function goalsBox(goals) {
  return `<div class="fig-goals"><div class="goals-head">Try this</div><ul>${goals.map((g) => `<li data-goal="${g.id}" class="${progress.done(g.id) ? "done" : ""}"><span class="tick"></span><span>${g.text}</span></li>`).join("")}</ul></div>`;
}

function completer(el) {
  return (id) => {
    const li = el.querySelector(`[data-goal="${id}"]`);
    if (li && !li.classList.contains("done")) li.classList.add("done", "just-done");
    if (progress.mark(id)) el.dispatchEvent(new CustomEvent("task", { bubbles: true }));
  };
}

function animate(el, step) {
  let raf = 0;
  let last = performance.now();
  let visible = true;
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: "100px" });
  io.observe(el);
  const tick = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (visible) step(dt);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
  };
}

const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

// 1. A slice of copper wire.
export function wireZoom(el) {
  const goals = [
    { id: "wire-net", text: "Connect the battery and compare the counts each way" },
    { id: "wire-follow", text: "Follow one electron with the battery connected. Does it ever go the “wrong” way?" },
    { id: "wire-hot", text: "Heat the wire up while connected. What happens to the drift?" },
  ];
  el.innerHTML = `
    <div class="micro">
      <div class="micro-stage">
        <div class="fig-bar"><span class="fig-title">Inside a copper wire</span><span class="pill">magnified about 100 million times</span></div>
        <div class="micro-ends"><span>to the battery's <b>+</b></span><span>to the battery's <b>−</b></span></div>
        <canvas class="micro-canvas" role="img" aria-label="Copper ions in a fixed grid and free electrons moving around them. Readouts beside the drawing describe what is happening."></canvas>
        <div class="micro-key"><span><i class="k-ion"></i>copper ion (+), fixed in place</span><span><i class="k-electron"></i>free electron (−)</span><span><i class="k-line"></i>counting line</span><span class="k-field-wrap"><i class="k-field"></i>electric field</span></div>
        <div class="fig-status micro-status" role="status" aria-live="polite"></div>
      </div>
      <div class="micro-side">
        <button type="button" class="btn big battery-btn" aria-pressed="false">Connect a battery</button>
        <label class="ctl"><span class="ctl-top"><span>Battery voltage</span><output class="o-volts"></output></span><input type="range" class="volts" min="0" max="100" value="50" disabled></label>
        <label class="ctl"><span class="ctl-top"><span>Temperature of the wire</span><output class="o-temp"></output></span><input type="range" class="temp" min="0" max="2" value="1" step="1"></label>
        <label class="ctl-toggle"><input type="checkbox" class="follow"><span>Follow one electron</span></label>
        <div class="micro-readouts">
          <div class="readout"><span>Electrons that crossed the line since your last change</span><strong class="r-cross">→ 0 · ← 0</strong></div>
          <div class="readout"><span>Net flow to the left: this is the current</span><strong class="r-net">0</strong><svg class="tally-chart" viewBox="0 0 240 64" preserveAspectRatio="none" aria-hidden="true"><line class="tally-zero" x1="0" x2="240" y1="32" y2="32"/><polyline class="tally-line" points=""/></svg><small class="tally-note">running total over time</small></div>
          <div class="readout"><span>Average drift</span><strong class="r-drift">0</strong></div>
          <div class="readout"><span>Heat handed to the metal</span><div class="heat-bar"><i></i></div></div>
        </div>
        ${goalsBox(goals)}
      </div>
    </div>`;
  const $ = (s) => el.querySelector(s);
  const canvas = $("canvas");
  const ctx = canvas.getContext("2d");
  const done = completer(el);
  const state = { field: false, volts: 0.5, temp: 1, follow: false, paused: reducedMotion() };
  let w = null;
  let onFor = 0;
  let followFor = 0;
  let hotFor = 0;

  let tally = { right: 0, left: 0, since: 0, points: [] };
  const setup = () => {
    const width = canvas.clientWidth || 600;
    const height = width < 500 ? 240 : 370;
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    w = makeWire({ width, height, spacing: width < 500 ? 40 : 46 });
    tally = { right: 0, left: 0, since: 0, points: [] };
  };
  setup();
  const ro = new ResizeObserver(() => {
    if (Math.abs((canvas.clientWidth || 0) - w.width) > 4) setup();
  });
  ro.observe(canvas);

  const resetTally = () => (tally = { right: w.totalRight, left: w.totalLeft, since: w.t, points: [] });
  const syncControls = () => {
    resetTally();
    $(".battery-btn").setAttribute("aria-pressed", String(state.field));
    $(".battery-btn").textContent = state.field ? "Disconnect the battery" : "Connect a battery";
    $(".battery-btn").classList.toggle("on", state.field);
    $(".volts").disabled = !state.field;
    $(".o-volts").textContent = state.field ? `${Math.round(state.volts * 100)}%` : "off";
    $(".o-temp").textContent = ["cold", "room temperature", "hot"][state.temp];
    $(".k-field-wrap").style.visibility = state.field ? "visible" : "hidden";
  };
  $(".battery-btn").onclick = () => {
    state.field = !state.field;
    syncControls();
  };
  $(".volts").oninput = (e) => {
    state.volts = +e.target.value / 100;
    syncControls();
  };
  $(".temp").oninput = (e) => {
    state.temp = +e.target.value;
    syncControls();
  };
  $(".follow").onchange = (e) => {
    state.follow = e.target.checked;
    for (const el of w.electrons) el.trail = [];
  };
  syncControls();

  let slow = 0;
  const stop = animate(el, (dt) => {
    const field = state.field ? state.volts : 0;
    if (!state.paused) stepWire(w, dt, { field, temp: state.temp, follow: state.follow ? 0 : -1 });
    draw(field);
    slow += dt;
    if (slow > 0.25) {
      slow = 0;
      const elapsed = Math.max(0.001, w.t - tally.since);
      const right = w.totalRight - tally.right;
      const left = w.totalLeft - tally.left;
      const net = left - right;
      tally.points.push([elapsed, net]);
      if (tally.points.length > 240) tally.points.shift();
      $(".r-cross").textContent = `→ ${right} · ← ${left}`;
      $(".r-net").textContent = elapsed < 3 ? "counting…" : `${net > 0 ? "+" : ""}${net} electrons, about ${(net / elapsed).toFixed(1)} per second`;
      const span = Math.max(20, elapsed);
      const top = Math.max(15, ...tally.points.map(([, n]) => Math.abs(n)));
      $(".tally-line").setAttribute("points", tally.points.map(([t, n]) => `${((t / span) * 240).toFixed(1)},${(32 - (n / top) * 30).toFixed(1)}`).join(" "));
      const pct = Math.round((Math.abs(w.drift) / V_RANDOM) * 100);
      $(".r-drift").textContent = pct < 2 ? "none" : `${pct}% of their random speed, ${w.drift < 0 ? "←" : "→"}`;
      $(".heat-bar i").style.width = `${clamp(w.heatRate / 9e5, 0, 1) * 100}%`;
      $(".micro-status").textContent = !state.field
        ? "No battery. The electrons race around in every direction, about as many crossing the line each way as the other. Lots of motion, but no net flow: no current."
        : state.temp === 2
          ? "Hot: the ions shake harder and get in the way more often. More collisions mean less drift for the same push. That's why a metal's resistance rises as it heats up."
          : "Battery connected. Between collisions, the field gives every electron a nudge to the left. Each one still zigzags at high speed, but the whole swarm slowly drifts: that drift is the current.";
      if (state.field) onFor += 0.25;
      else onFor = 0;
      followFor = state.field && state.follow ? followFor + 0.25 : 0;
      hotFor = state.field && state.temp === 2 ? hotFor + 0.25 : 0;
      if (onFor >= 3) done("wire-net");
      if (followFor >= 8) done("wire-follow");
      if (hotFor >= 3) done("wire-hot");
    }
  });

  function draw(field) {
    const { width, height, top, bottom } = w;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#1f4a40";
    ctx.fillRect(0, top, width, bottom - top);
    ctx.strokeStyle = "#5f8273";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, top);
    ctx.lineTo(width, top);
    ctx.moveTo(0, bottom);
    ctx.lineTo(width, bottom);
    ctx.stroke();
    // the field: arrows pointing from + (left) toward − (right)
    if (field > 0) {
      ctx.strokeStyle = `rgba(255, 204, 77, ${0.18 + 0.35 * field})`;
      ctx.lineWidth = 2;
      const len = 10 + 18 * field;
      for (let j = 0; j < w.rows - 1; j++) {
        const y = w.y0 + (j + 0.5) * w.spacing;
        for (let x = w.sx; x < width; x += w.sx * 2) {
          ctx.beginPath();
          ctx.moveTo(x - len / 2, y);
          ctx.lineTo(x + len / 2, y);
          ctx.lineTo(x + len / 2 - 5, y - 4);
          ctx.moveTo(x + len / 2, y);
          ctx.lineTo(x + len / 2 - 5, y + 4);
          ctx.stroke();
        }
      }
    }
    // counting line
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "rgba(214, 237, 153, 0.7)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(width / 2, top - 8);
    ctx.lineTo(width / 2, bottom + 8);
    ctx.stroke();
    ctx.setLineDash([]);
    // ions
    for (const ion of w.ions) {
      const [x, y] = ionAt(w, ion);
      const g = ion.glow;
      if (g > 0.02) {
        ctx.fillStyle = `rgba(255, 170, 60, ${0.45 * g})`;
        ctx.beginPath();
        ctx.arc(x, y, 9 + 10 * g, 0, 6.283);
        ctx.fill();
      }
      ctx.fillStyle = mix("#c98a4a", "#ffd27a", g);
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 6.283);
      ctx.fill();
      ctx.strokeStyle = "#3a2410";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x - 3.5, y);
      ctx.lineTo(x + 3.5, y);
      ctx.moveTo(x, y - 3.5);
      ctx.lineTo(x, y + 3.5);
      ctx.stroke();
    }
    // electrons
    ctx.fillStyle = "#9fc0ff";
    for (let k = 0; k < w.electrons.length; k++) {
      if (state.follow && k === 0) continue;
      const e = w.electrons[k];
      ctx.beginPath();
      ctx.arc(e.x, e.y, 3, 0, 6.283);
      ctx.fill();
    }
    if (state.follow) {
      const e = w.electrons[0];
      ctx.strokeStyle = "rgba(255, 138, 101, 0.75)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      e.trail.forEach(([x, y], i) => {
        const prev = e.trail[i - 1];
        if (!prev || Math.abs(prev[0] - x) > width / 2) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.fillStyle = "#ff8a65";
      ctx.beginPath();
      ctx.arc(e.x, e.y, 5, 0, 6.283);
      ctx.fill();
    }
    // labels
    ctx.font = "600 12px 'Space Grotesk', monospace";
    ctx.fillStyle = "#cfdccb";
    if (field > 0) {
      ctx.fillText("electric field →", 10, top - 10);
      ctx.textAlign = "right";
      ctx.fillStyle = "#9fc0ff";
      ctx.fillText("← electrons drift", width - 10, bottom + 20);
      ctx.textAlign = "left";
    } else {
      ctx.fillText("no field", 10, top - 10);
    }
  }

  return () => {
    stop();
    ro.disconnect();
  };
}

function mix(a, b, t) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((c, i) => Math.round(c + (pb[i] - c) * clamp(t, 0, 1))).join(",")})`;
}

// 2. The race: the field spreads round the loop in nanoseconds; an electron takes hours.
const SPEEDS = [
  [1e-9, "1 second on screen = 1 billionth of a second"],
  [1e-8, "1 second on screen = 10 billionths of a second"],
  [1e-6, "1 second on screen = 1 millionth of a second"],
  [1e-3, "1 second on screen = 1 thousandth of a second"],
  [1, "Real time"],
  [60, "1 second on screen = 1 minute"],
  [600, "1 second on screen = 10 minutes"],
  [3600, "1 second on screen = 1 hour"],
];

export function fieldRace(el) {
  const goals = [
    { id: "race-field", text: "Close the switch and watch the field reach the lamp" },
    { id: "race-electron", text: "Speed up time until your electron reaches the lamp" },
  ];
  // Loop drawn as two wires from the battery to the lamp, 680 px each = 30 cm.
  const PATH_PX = 680;
  const M_PER_PX = RACE.wireMetres / PATH_PX;
  const LAMP_PX = 60;
  const LOOP_PX = PATH_PX * 2 + LAMP_PX;
  const pointAt = (u) => {
    // u runs the way electrons go: out of −, along the bottom, up through the lamp, back along the top to +.
    if (u <= PATH_PX) return along([[90, 180], [90, 250], [630, 250], [630, 180]], u);
    if (u <= PATH_PX + LAMP_PX) return [630, 180 - (u - PATH_PX)];
    return along([[630, 120], [630, 50], [90, 50], [90, 120]], u - PATH_PX - LAMP_PX);
  };
  // When the field arrives at u: it spreads out from both battery terminals.
  const fieldArrives = (u) => {
    const fromTerminal = u <= PATH_PX ? u : u <= PATH_PX + LAMP_PX ? PATH_PX : LOOP_PX - u;
    return (fromTerminal * M_PER_PX) / SIGNAL_SPEED;
  };
  const v = driftSpeed(RACE.amps, RACE.mm2);
  const times = raceTimes();
  const chevrons = [];
  for (let s = 40; s < PATH_PX; s += 56) {
    chevrons.push({ u: LOOP_PX - s, dir: 1 }); // top wire: field points away from +, toward the lamp
    chevrons.push({ u: s, dir: -1 }); // bottom wire: field points from the lamp back toward −
  }
  const electrons = [];
  for (let u = 0; u < LOOP_PX; u += 17) electrons.push(u);

  el.innerHTML = `
    <div class="micro race">
      <div class="micro-stage">
        <div class="fig-bar"><span class="fig-title">The field versus the electrons</span><span class="pill race-clock">0 ns</span></div>
        <svg class="race-svg" viewBox="20 10 690 290" role="img" aria-label="A battery and lamp joined by 30 cm wires. When the switch closes, the field spreads along the wires in nanoseconds; the electrons drift so slowly that one takes hours to reach the lamp.">
          <path class="race-wire" d="M90 120V50H630V120M90 180V250H630V180"/>
          <path class="race-front front-top" d="M90 120V50H630V120"/>
          <path class="race-front front-bottom" d="M90 180V250H630V180"/>
          <g class="race-chevrons">${chevrons.map((c) => `<path data-u="${c.u}" class="chev" d="M-5 -5L3 0L-5 5"/>`).join("")}</g>
          <g class="race-battery"><rect x="72" y="118" width="36" height="64" rx="5"/><text x="90" y="138" text-anchor="middle">+</text><text x="90" y="174" text-anchor="middle">−</text><text x="118" y="154" class="race-label">battery</text></g>
          <g class="race-electrons">${electrons.map((u, i) => `<circle class="${i === 0 ? "e-me" : "e"}" r="${i === 0 ? 6 : 3.5}"/>`).join("")}</g>
          <g class="race-lamp"><circle class="lamp-glow" cx="630" cy="150" r="40" fill="url(#lampglow)" opacity="0"/><circle class="lamp-bulb" cx="630" cy="150" r="22"/><path class="lamp-fil" d="M616 136L644 164M616 164L644 136"/><text x="598" y="154" text-anchor="end" class="race-label">lamp</text></g>
          <text x="360" y="38" text-anchor="middle" class="race-label">30 cm of wire</text>
          <text x="360" y="280" text-anchor="middle" class="race-label">30 cm of wire</text>
          <text class="me-label race-label">your electron</text>
        </svg>
        <div class="fig-status race-status" role="status" aria-live="polite"></div>
      </div>
      <div class="micro-side">
        <button type="button" class="btn big switch-btn">Close the switch</button>
        <label class="ctl"><span class="ctl-top"><span>Speed of time</span></span><input type="range" class="speed" min="0" max="${SPEEDS.length - 1}" value="0" step="1"><span class="speed-text small-note"></span></label>
        <div class="micro-readouts">
          <div class="readout"><span>The field reached the lamp after</span><strong class="r-field">–</strong></div>
          <div class="readout"><span>Your electron reached the lamp after</span><strong class="r-me">–</strong></div>
          <div class="readout"><span>Your electron has moved</span><strong class="r-moved">0 mm</strong></div>
        </div>
        <p class="small-note">The wires carry 0.3 A and are 0.5 mm² copper, so the electrons drift at ${(v * 1000).toFixed(3)} mm per second.</p>
        <button type="button" class="btn small outline reset-btn">↺ Start again</button>
        ${goalsBox(goals)}
      </div>
    </div>`;
  const $ = (s) => el.querySelector(s);
  const done = completer(el);
  const svg = $(".race-svg");
  const circles = [...svg.querySelectorAll(".race-electrons circle")];
  const chevEls = [...svg.querySelectorAll(".chev")];
  const fronts = [svg.querySelector(".front-top"), svg.querySelector(".front-bottom")];
  let t = 0;
  let running = false;
  let fieldAt = null;
  let meAt = null;
  const us = [...electrons];

  const reset = () => {
    t = 0;
    running = false;
    fieldAt = meAt = null;
    us.splice(0, us.length, ...electrons);
    $(".switch-btn").textContent = "Close the switch";
    $(".switch-btn").disabled = false;
    $(".r-field").textContent = "–";
    $(".r-me").textContent = "–";
    $(".speed").value = 0;
    syncSpeed();
  };
  const syncSpeed = () => ($(".speed-text").textContent = SPEEDS[+$(".speed").value][1]);
  $(".speed").oninput = syncSpeed;
  $(".switch-btn").onclick = () => {
    running = true;
    $(".switch-btn").textContent = "Switch closed";
    $(".switch-btn").disabled = true;
  };
  $(".reset-btn").onclick = reset;
  reset();

  let slow = 0;
  const stop = animate(el, (dt) => {
    const rate = SPEEDS[+$(".speed").value][0];
    if (running) {
      const dts = dt * rate;
      t += dts;
      for (let i = 0; i < us.length; i++) {
        if (t < fieldArrives(us[i])) continue;
        const before = us[i];
        us[i] += (v / M_PER_PX) * dts;
        if (i === 0 && before < PATH_PX && us[i] >= PATH_PX && meAt === null) meAt = times.electron;
        if (us[i] >= LOOP_PX) us[i] -= LOOP_PX; // into the battery at +, back out of −
      }
      if (fieldAt === null && t >= times.field) fieldAt = times.field;
    }
    // draw
    const reach = running ? Math.min(PATH_PX, (t * SIGNAL_SPEED) / M_PER_PX) : 0;
    for (const f of fronts) f.style.strokeDasharray = `${reach} 2000`;
    chevEls.forEach((c) => {
      const u = +c.dataset.u;
      const on = running && t >= fieldArrives(u);
      const [x, y, ux, uy] = pointWithDir(u);
      // The field points opposite to the way electrons travel (u increases along their travel).
      c.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${((Math.atan2(uy, ux) * 180) / Math.PI + 180).toFixed(1)})`);
      c.style.opacity = on ? "1" : "0";
    });
    circles.forEach((c, i) => {
      const [x, y] = pointAt(us[i]);
      c.setAttribute("cx", x.toFixed(1));
      c.setAttribute("cy", y.toFixed(1));
    });
    const [mx, my] = pointAt(us[0]);
    const label = svg.querySelector(".me-label");
    // Keep the label inside the loop, beside the electron.
    label.setAttribute("x", (mx + (mx < 360 ? 14 : -14)).toFixed(1));
    label.setAttribute("y", (my >= 240 ? my - 14 : my + 24).toFixed(1));
    label.setAttribute("text-anchor", mx < 360 ? "start" : "end");
    const lit = fieldAt !== null;
    svg.querySelector(".lamp-glow").setAttribute("opacity", lit ? "1" : "0");
    svg.querySelector(".lamp-bulb").classList.toggle("lit", lit);
    slow += dt;
    if (slow > 0.1) {
      slow = 0;
      $(".race-clock").textContent = formatDuration(t);
      if (fieldAt !== null) $(".r-field").textContent = formatDuration(fieldAt);
      if (meAt !== null) $(".r-me").textContent = formatDuration(meAt);
      const moved = (Math.min(us[0], PATH_PX + LAMP_PX) * M_PER_PX) * 1000;
      $(".r-moved").textContent = meAt !== null ? "all the way to the lamp" : moved < 0.01 ? `${(moved * 1000).toFixed(1)} µm` : `${moved.toFixed(moved < 1 ? 3 : 0)} mm`;
      $(".race-status").textContent = !running
        ? "The switch is open: no field in the wires, so nothing flows. Close it."
        : fieldAt === null
          ? "The field is spreading out from both battery terminals at about two-thirds the speed of light. Electrons start to drift as soon as it reaches them."
          : meAt === null
            ? `The lamp lit after ${formatDuration(times.field)}, the moment the field arrived from both sides. Your electron has barely moved. Speed up time to watch it crawl.`
            : `Your electron took ${formatDuration(times.electron)} to reach the lamp. The lamp had been lit for all of that time: it lights when the field arrives, not when the electrons do.`;
      if (fieldAt !== null) done("race-field");
      if (meAt !== null) done("race-electron");
    }
  });

  function pointWithDir(u) {
    const [x1, y1] = pointAt(Math.max(0, u - 1));
    const [x2, y2] = pointAt(Math.min(LOOP_PX - 0.01, u + 1));
    const [x, y] = pointAt(u);
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    return [x, y, (x2 - x1) / len, (y2 - y1) / len];
  }

  return stop;
}

function along(pts, d) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (d <= len) return [x1 + ((x2 - x1) * d) / len, y1 + ((y2 - y1) * d) / len];
    d -= len;
  }
  return pts.at(-1);
}

// 3. Surface charge, the field inside the conductor, and where the energy goes.
export function fieldMap(el) {
  const goals = [
    { id: "fm-open", text: "Open the switch. Where does the field go?" },
    { id: "fm-energy", text: "Show the energy flow, with the switch closed" },
  ];
  el.innerHTML = `
    <div class="micro fieldmap">
      <div class="micro-stage">
        <div class="fig-bar"><span class="fig-title">What sets up the field</span></div>
        <svg class="fm-svg" viewBox="40 20 680 290" role="img" aria-label="A battery, switch and lamp. Plus and minus signs on the wire surfaces show surface charge; arrows inside the wires show the electric field; optional arrows between the wires show energy flowing to the lamp.">
          <g class="fm-energy"></g>
          <path class="fm-wire" d="M110 140V60H300M360 60H620V140M620 200V270H110V200"/>
          <g class="fm-switch"><circle cx="300" cy="60" r="4"/><circle cx="360" cy="60" r="4"/><line class="fm-lever" x1="300" y1="60" x2="360" y2="60"/></g>
          <path class="fm-filament" d="M620 140l-10 6 20 8-20 8 20 8-20 8 20 8-10 6"/>
          <g class="fm-charges"></g>
          <g class="fm-field"></g>
          <g class="fm-battery"><rect x="92" y="138" width="36" height="64" rx="5"/><text x="110" y="160" text-anchor="middle">+</text><text x="110" y="194" text-anchor="middle">−</text></g>
          <text x="80" y="174" text-anchor="end" class="race-label">9 V</text>
          <text x="330" y="34" text-anchor="middle" class="race-label">switch</text>
          <text x="644" y="174" class="race-label">lamp</text>
          <text x="644" y="190" class="race-label small">filament</text>
        </svg>
        <div class="fig-status fm-status" role="status" aria-live="polite"></div>
      </div>
      <div class="micro-side">
        <label class="ctl-toggle"><input type="checkbox" class="fm-closed" checked><span>Switch closed</span></label>
        <div class="goals-head">Show</div>
        <label class="ctl-toggle"><input type="checkbox" class="fm-show-charges" checked><span>Surface charge (+ and −)</span></label>
        <label class="ctl-toggle"><input type="checkbox" class="fm-show-field" checked><span>Electric field inside the conductor</span></label>
        <label class="ctl-toggle"><input type="checkbox" class="fm-show-energy"><span>Energy flow</span></label>
        <div class="micro-readouts">
          <div class="readout"><span>Voltage across the lamp</span><strong class="r-lamp"></strong></div>
          <div class="readout"><span>Voltage across the switch</span><strong class="r-switch"></strong></div>
        </div>
        ${goalsBox(goals)}
      </div>
    </div>`;
  const $ = (s) => el.querySelector(s);
  const done = completer(el);

  const render = () => {
    const closed = $(".fm-closed").checked;
    const { samples } = loopProfile({ closed, volts: 9, step: 6 });
    const maxField = Math.max(...samples.map((s) => s.field));
    // Surface charge: positive where the conductor sits above the loop's middle voltage, negative below.
    let charges = "";
    samples.forEach((s, i) => {
      if (i % 3 || s.kind === "gap") return;
      const sigma = (s.v - 4.5) / 4.5;
      if (Math.abs(sigma) < 0.06) return;
      const op = (0.25 + 0.75 * Math.abs(sigma)).toFixed(2);
      const size = (9 + 5 * Math.abs(sigma)).toFixed(1);
      for (const side of [-1, 1]) {
        const x = s.x - s.uy * side * 11;
        const y = s.y + s.ux * side * 11;
        charges += `<text class="${sigma > 0 ? "q-plus" : "q-minus"}" x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" font-size="${size}" opacity="${op}" text-anchor="middle">${sigma > 0 ? "+" : "−"}</text>`;
      }
    });
    // The gap's own faces carry the biggest charge when the switch is open.
    if (!closed) charges += `<text class="q-plus" x="296" y="80" text-anchor="middle" font-size="16">+ +</text><text class="q-minus" x="364" y="80" text-anchor="middle" font-size="16">− −</text>`;
    $(".fm-charges").innerHTML = charges;
    // Field arrows, sized on a log scale so the weak field in the wires is still visible.
    let arrows = "";
    samples.forEach((s, i) => {
      if (i % 5 !== 2 || s.field <= 0) return;
      const rel = s.field / maxField;
      const k = clamp(0.25 + 0.75 * ((Math.log10(rel) + 3) / 3), 0.2, 1);
      const len = 6 + 10 * k;
      const ang = (Math.atan2(s.uy, s.ux) * 180) / Math.PI;
      arrows += `<g transform="translate(${s.x.toFixed(1)} ${s.y.toFixed(1)}) rotate(${ang.toFixed(1)})" opacity="${(0.35 + 0.65 * k).toFixed(2)}"><path class="${s.kind === "lamp" || s.kind === "gap" ? "fa-strong" : "fa"}" d="M${-len / 2} 0H${len / 2}M${len / 2 - 4} -3.5L${len / 2} 0L${len / 2 - 4} 3.5" stroke-width="${(1.4 + 1.8 * k).toFixed(1)}"/></g>`;
    });
    $(".fm-field").innerHTML = arrows;
    // Energy flows through the space between the wires, from the battery into the lamp.
    $(".fm-energy").innerHTML = closed
      ? [95, 125, 165, 205, 240]
          .map((y) => `<path class="energy-line" d="M140 ${y}H${560 - Math.abs(y - 170) * 0.3}Q600 ${y} 614 ${170 + (y - 170) * 0.25}"/>`)
          .join("")
      : "";
    el.querySelector(".fm-energy").style.display = $(".fm-show-energy").checked ? "" : "none";
    el.querySelector(".fm-charges").style.display = $(".fm-show-charges").checked ? "" : "none";
    el.querySelector(".fm-field").style.display = $(".fm-show-field").checked ? "" : "none";
    $(".fm-lever").setAttribute("transform", closed ? "" : "rotate(-28 300 60)");
    $(".fm-filament").classList.toggle("lit", closed);
    const lampV = samples.filter((s) => s.kind === "lamp").reduce((a, s) => a + s.field * 6, 0);
    const switchV = closed ? samples.filter((s) => s.kind === "wire" && s.x > 300 && s.x < 360 && s.y === 60).reduce((a, s) => a + s.field * 6, 0) : 9;
    $(".r-lamp").textContent = `${lampV.toFixed(2)} V`;
    $(".r-switch").textContent = `${switchV.toFixed(switchV < 0.1 ? 3 : 2)} V`;
    $(".fm-status").textContent = closed
      ? $(".fm-show-energy").checked
        ? "Energy flows from the battery through the space around the wires, and pours into the lamp, where the field does its work. It doesn't travel inside the wire with the electrons."
        : "A thin layer of charge on the wires' surfaces shapes the field so that inside the conductor it runs along the wire. In the copper the field is weak: copper barely resists. In the filament it's strong: that's where the push is needed, and where the energy goes."
      : "Switch open: the surface charge rearranges in nanoseconds. Now there's no field inside any of the wires or the lamp, so nothing drifts. The whole 9 V is concentrated across the tiny gap in the switch.";
    if (!closed) done("fm-open");
    if (closed && $(".fm-show-energy").checked) done("fm-energy");
  };
  el.querySelectorAll("input").forEach((i) => (i.onchange = render));
  render();
}

// A quick calculator: how fast do electrons really drift?
export function driftCalc(el) {
  const sizes = [
    [0.05, "0.05 mm² (thin jumper wire)"],
    [0.5, "0.5 mm² (hook-up wire)"],
    [1.5, "1.5 mm² (household lighting cable)"],
    [2.5, "2.5 mm² (household socket cable)"],
  ];
  el.innerHTML = `
    <div class="tool-card drift-card">
      <div class="eyebrow">Work it out</div>
      <h3>How fast do the electrons drift?</h3>
      <div class="drift-inputs">
        <label class="ctl"><span class="ctl-top"><span>Current</span><output class="o-amps"></output></span><input type="range" class="amps" min="0" max="1000" value="500"></label>
        <label class="ctl"><span class="ctl-top"><span>Wire thickness (cross-section)</span></span><select class="size">${sizes.map(([v, n]) => `<option value="${v}" ${v === 0.5 ? "selected" : ""}>${n}</option>`).join("")}</select></label>
      </div>
      <div class="drift-out">
        <div><span>Drift speed</span><strong class="d-speed"></strong></div>
        <div><span>Time to drift 1 metre</span><strong class="d-time"></strong></div>
        <div><span>Electrons passing each second</span><strong class="d-count"></strong></div>
        <div><span>Their random speed (unchanged)</span><strong>about 1,600 km/s</strong></div>
      </div>
      <p class="small-note">Drift speed = current ÷ (free electrons per m³ × area × charge per electron). Copper has 85 billion billion billion free electrons per cubic metre, which is why such a slow drift adds up to a sizeable current.</p>
    </div>`;
  const $ = (s) => el.querySelector(s);
  const update = () => {
    const amps = 0.001 * 10 ** ((+$(".amps").value / 1000) * 4); // 1 mA … 10 A
    const mm2 = +$(".size").value;
    const v = driftSpeed(amps, mm2);
    $(".o-amps").textContent = amps < 1 ? `${(amps * 1000).toPrecision(2)} mA` : `${amps.toPrecision(2)} A`;
    $(".d-speed").textContent = v * 1000 >= 0.01 ? `${(v * 1000).toPrecision(2)} mm/s` : `${(v * 1e6).toPrecision(2)} µm/s`;
    $(".d-time").textContent = formatDuration(1 / v).replace(/ \d+ s$/, "") + (1 / v > 86400 * 2 ? ` (${(1 / v / 86400).toFixed(0)} days)` : "");
    const n = amps / E_CHARGE;
    $(".d-count").textContent = `${(n / 10 ** Math.floor(Math.log10(n))).toFixed(1)} × 10^${Math.floor(Math.log10(n))}`.replace(/\^(\d+)/, (_, e) => [...e].map((d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]).join(""));
  };
  el.querySelectorAll("input, select").forEach((i) => (i.oninput = i.onchange = update));
  update();
}
