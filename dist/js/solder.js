// A soldering simulator and a joint-inspection trainer.
//
// The model is simple but captures the lessons that matter: the pad and the
// lead must both be above the solder's melting point for it to wet them;
// big copper areas heat slowly; flux burns away if you dwell; too much heat
// for too long lifts the pad; and the iron must leave after the solder does.

import { progress } from "./progress.js";
import { clamp } from "./format.js";

const MELT = 217; // °C, lead-free SAC305
const AMBIENT = 25;
const CX = 300; // the joint's lead
const NX = 430; // the neighbouring pin
const PAD_TOP = 244;

// ---------- drawing ----------

const f = (n) => +n.toFixed(1);

// The solder on a pad around a lead at x, described by a few numbers.
export function filletPath(x, { amount = 1, wet = 1, cold = 0 } = {}) {
  if (amount <= 0.02) return "";
  const a = Math.min(amount, 2.4);
  if (cold > 0.45 || wet < 0.35) {
    // Balled: surface tension wins, the solder sits as a lump that hasn't wetted.
    const r = 12 + 10 * Math.sqrt(a);
    const cx = x - 9;
    const cy = PAD_TOP - r * 0.78;
    return `M${f(cx - r * 0.62)} ${f(PAD_TOP - 1)}A${f(r)} ${f(r)} 0 1 1 ${f(cx + r * 0.62)} ${f(PAD_TOP - 1)}Z`;
  }
  const reach = 40 * clamp(0.35 + 0.65 * wet, 0, 1) * clamp(0.55 + 0.45 * Math.min(a, 1), 0, 1);
  const h = 9 + 24 * Math.min(a, 1.8) * clamp(wet, 0.3, 1);
  const convex = a > 1.25;
  const k = convex ? Math.min(1, (a - 1.25) / 0.6) : 0;
  const side = (s) => {
    const base = x + s * (4 + reach);
    const top = x + s * 4;
    // Concave: control point tucked into the corner. Convex: pushed outward.
    const cxp = convex ? x + s * (4 + reach * (0.95 + 0.4 * k)) : x + s * (4 + reach * 0.18);
    const cyp = convex ? PAD_TOP - h * (0.95 + 0.3 * k) : PAD_TOP - h * 0.22;
    return { base, top, cxp, cyp };
  };
  const L = side(-1);
  const R = side(1);
  return `M${f(L.base)} ${PAD_TOP}Q${f(L.cxp)} ${f(L.cyp)} ${f(L.top)} ${f(PAD_TOP - h)}L${f(R.top)} ${f(PAD_TOP - h)}Q${f(R.cxp)} ${f(R.cyp)} ${f(R.base)} ${PAD_TOP}Z`;
}

function bridgePath() {
  return `M${CX - 40} ${PAD_TOP}Q${CX - 30} ${PAD_TOP - 48} ${CX} ${PAD_TOP - 46}C${CX + 40} ${PAD_TOP - 40} ${NX - 40} ${PAD_TOP - 40} ${NX} ${PAD_TOP - 44}Q${NX + 30} ${PAD_TOP - 46} ${NX + 40} ${PAD_TOP}Z`;
}

// The whole bench scene: board cross-section, two pins, and (optionally) iron and solder wire.
export function scene({ joint = {}, lifted = false, bridge = false, liquid = false, dull = 0, neighbourJoint = true, tools = true, idPrefix = "s" } = {}) {
  const labels = tools;
  const shine = `${idPrefix}-shine`;
  const matte = `${idPrefix}-matte`;
  const fill = liquid ? `url(#${shine})` : dull > 0.45 ? `url(#${matte})` : `url(#${shine})`;
  const padTilt = lifted ? `transform="rotate(-9 ${CX + 45} ${PAD_TOP + 3})"` : "";
  return `
    <defs>
      <linearGradient id="${shine}" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#f4f7f8"/><stop offset=".45" stop-color="#b9c3c8"/><stop offset="1" stop-color="#e3e9ec"/></linearGradient>
      <pattern id="${matte}" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#8f979a"/><circle cx="2" cy="2" r="1.1" fill="#7d8588"/><circle cx="5" cy="4.5" r=".9" fill="#a3aaad"/></pattern>
      <pattern id="${idPrefix}-fr4" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><rect width="10" height="10" fill="#2f6b4f"/><path d="M0 5h10" stroke="#3a7a5b" stroke-width="2"/></pattern>
    </defs>
    <rect x="70" y="250" width="500" height="34" rx="3" fill="url(#${idPrefix}-fr4)"/>
    ${labels ? `<text x="566" y="238" class="sol-label" text-anchor="end">circuit board,</text><text x="566" y="252" class="sol-label" text-anchor="end">seen edge-on</text>` : ""}
    <!-- plated holes -->
    ${[CX, NX].map((x) => `<rect x="${x - 9}" y="250" width="18" height="34" fill="#1f2a25"/><rect x="${x - 9}" y="250" width="3" height="34" fill="#c98a4a"/><rect x="${x + 6}" y="250" width="3" height="34" fill="#c98a4a"/><rect x="${x - 34}" y="284" width="68" height="5" rx="1" fill="#c98a4a"/>`).join("")}
    <!-- the neighbouring pin and its (good) joint -->
    <rect x="${NX - 34}" y="${PAD_TOP}" width="68" height="6" rx="1" fill="#c98a4a"/>
    <rect x="${NX - 4}" y="150" width="8" height="160" rx="3" fill="#aab4b8"/>
    ${neighbourJoint ? `<path d="${filletPath(NX, { amount: 1, wet: 1 })}" fill="url(#${shine})" stroke="#7f8a8e" stroke-width="1"/>` : ""}
    <!-- our pad and lead -->
    <g ${padTilt}><rect x="${CX - 45}" y="${PAD_TOP}" width="90" height="6" rx="1" fill="#d08f4c" class="pad"/></g>
    ${lifted ? `<path d="M${CX + 46} ${PAD_TOP + 6}l10 -2 8 3" stroke="#1f2a25" stroke-width="2" fill="none"/>` : ""}
    <rect x="${CX - 4}" y="118" width="8" height="200" rx="3" fill="#b9c3c6" class="lead"/>
    <path d="M${CX} 312v12q0 8 -8 8h-70" stroke="#b9c3c6" stroke-width="8" fill="none" stroke-linecap="round"/>
    <rect x="140" y="320" width="76" height="26" rx="12" fill="#d9c08a"/><rect x="156" y="320" width="7" height="26" fill="#7a4a2a"/><rect x="170" y="320" width="7" height="26" fill="#1d1d1d"/><rect x="184" y="320" width="7" height="26" fill="#c43c2c"/><rect x="200" y="320" width="5" height="26" fill="#c9a24a"/>
    ${labels ? `<text x="314" y="336" class="sol-label">component, under the board</text>` : ""}
    <g class="joint-solder" ${padTilt}>
      ${bridge ? `<path d="${bridgePath()}" fill="${fill}" stroke="#7f8a8e" stroke-width="1"/>` : `<path class="fillet" d="${filletPath(CX, joint)}" fill="${fill}" stroke="#7f8a8e" stroke-width="1"/>`}
    </g>
    ${tools ? toolsSvg() : ""}`;
}

function toolsSvg() {
  return `
    <g class="iron" transform="translate(-70 -90)">
      <g transform="translate(${CX - 12} ${PAD_TOP - 5}) rotate(38)">
        <path d="M0 0L-6 -14H-46V14H-6Z" fill="#9aa3a6" transform="translate(0 0) scale(1 .6)"/>
        <rect x="-150" y="-6" width="106" height="12" rx="3" fill="#c3c9cb"/>
        <rect x="-300" y="-15" width="150" height="30" rx="14" fill="#2b3833"/>
        <rect x="-170" y="-11" width="24" height="22" rx="4" fill="#3f5a4f"/>
        <circle class="tip-glow" r="10" fill="#ff7a2e" opacity="0"/>
      </g>
    </g>
    <g class="wire" transform="translate(60 -70)">
      <path d="M${CX + 10} ${PAD_TOP - 6}L${CX + 210} ${PAD_TOP - 150}" stroke="#c9cfd2" stroke-width="7" stroke-linecap="round"/>
      <path d="M${CX + 10} ${PAD_TOP - 6}L${CX + 210} ${PAD_TOP - 150}" stroke="#eef2f3" stroke-width="2" stroke-linecap="round" opacity=".7"/>
    </g>
    <g class="fumes" opacity="0">
      ${[0, 1, 2].map((i) => `<path class="fume f${i}" d="M${CX - 14 + i * 12} ${PAD_TOP - 40}c-8 -12 8 -18 0 -30c-8 -12 8 -18 0 -30" stroke="#dfe6e2" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/>`).join("")}
    </g>`;
}

// ---------- the simulator ----------

export function solderSim(el) {
  el.innerHTML = `
    <div class="solder">
      <div class="solder-stage">
        <div class="fig-bar"><span class="fig-title">Soldering simulator</span><span class="pill solder-clock">0.0 s</span></div>
        <svg class="solder-svg" viewBox="40 60 720 300" role="img" aria-label="Cross-section of a circuit board pad, a component lead, a soldering iron and solder wire">
          ${scene({ idPrefix: "sim" })}
          <g class="thermo" transform="translate(620 90)">
            <text x="0" y="-10" class="sol-label">temperature</text>
            ${["pad", "lead"].map((n, i) => `<g transform="translate(${i * 60} 0)"><rect x="8" y="0" width="22" height="200" rx="11" class="thermo-tube"/><rect class="thermo-${n}" x="11" y="197" width="16" height="0" rx="8"/><text x="19" y="222" text-anchor="middle" class="sol-label">${n}</text><text class="thermo-val-${n} sol-value" x="19" y="240" text-anchor="middle">25°</text></g>`).join("")}
            <line x1="-4" x2="100" y1="${200 - (MELT / 400) * 200}" y2="${200 - (MELT / 400) * 200}" class="melt-line"/>
            <text x="102" y="${204 - (MELT / 400) * 200}" class="sol-label melt-text">melts</text>
          </g>
          <text class="sol-hint" x="60" y="86"></text>
        </svg>
        <div class="solder-result" hidden></div>
        <div class="solder-timeline"><svg viewBox="0 0 720 90" preserveAspectRatio="none"><line class="melt-line" x1="0" x2="720" y1="${90 - (MELT / 400) * 90}" y2="${90 - (MELT / 400) * 90}"/><polyline class="tl-pad" points=""/><polyline class="tl-lead" points=""/><g class="tl-events"></g></svg><div class="tl-legend"><span><i class="pad"></i>pad</span><span><i class="lead"></i>lead</span><span><i class="feed"></i>solder fed</span><span><i class="iron"></i>iron on</span></div></div>
      </div>
      <div class="solder-side">
        <div class="solder-buttons">
          <button type="button" class="btn big iron-btn" aria-pressed="false"><span class="key">I</span> Put the iron on the joint</button>
          <button type="button" class="btn big outline feed-btn"><span class="key">S</span> Hold to feed solder</button>
        </div>
        <label class="ctl"><span class="ctl-top"><span>Iron temperature</span></span><select class="tip-temp"><option value="300">300 °C</option><option value="350" selected>350 °C</option><option value="400">400 °C</option></select></label>
        <label class="ctl"><span class="ctl-top"><span>The pad</span></span><select class="pad-kind"><option value="small">Small pad, thin trace</option><option value="plane">Pad on a big copper area (ground plane)</option></select></label>
        <button type="button" class="btn small outline reset-btn">↺ New joint</button>
        <div class="fig-goals"><div class="goals-head">Your challenges</div><ul>
          <li data-goal="solder-good"><span class="tick"></span><span>Make a good joint on the small pad</span></li>
          <li data-goal="solder-plane"><span class="tick"></span><span>Make a good joint on the big copper area</span></li>
        </ul></div>
      </div>
    </div>`;

  const $ = (s) => el.querySelector(s);
  const svg = $(".solder-svg");
  const fillet = svg.querySelector(".fillet");
  const solderGroup = svg.querySelector(".joint-solder");
  const ironEl = svg.querySelector(".iron");
  const wireEl = svg.querySelector(".wire");
  const fumes = svg.querySelector(".fumes");
  const tipGlow = svg.querySelector(".tip-glow");
  const hint = svg.querySelector(".sol-hint");
  const padEl = svg.querySelector(".pad");
  const ironBtn = $(".iron-btn");
  const feedBtn = $(".feed-btn");
  const result = $(".solder-result");
  const refreshGoals = () => el.querySelectorAll("[data-goal]").forEach((li) => li.classList.toggle("done", progress.done(li.dataset.goal)));
  refreshGoals();

  let s;
  function reset() {
    s = {
      t: 0,
      pad: AMBIENT,
      lead: AMBIENT,
      iron: false,
      feeding: false,
      amount: 0,
      cold: 0,
      wetPad: 0,
      wetLead: 0,
      flux: 0.15,
      dull: 0,
      stress: 0,
      lifted: false,
      stuck: false,
      liquid: false,
      solidAt: null,
      done: false,
      history: [],
      events: [],
      firstFeedTemp: null,
      meltAt: null,
      ironTime: 0,
      feedTime: 0,
      maxPad: AMBIENT,
      bridge: false,
      warnedCold: false,
    };
    result.hidden = true;
    result.innerHTML = "";
    el.querySelector(".tl-events").innerHTML = "";
    padEl.parentElement.removeAttribute("transform");
    solderGroup.removeAttribute("transform");
    setIron(false);
    draw();
  }

  function setIron(on) {
    if (s.done && on) reset();
    s.iron = on;
    ironBtn.setAttribute("aria-pressed", String(on));
    ironBtn.innerHTML = on ? `<span class="key">I</span> Lift the iron away` : `<span class="key">I</span> Put the iron on the joint`;
    ironBtn.classList.toggle("on", on);
    s.events.push({ t: s.t, type: on ? "iron-on" : "iron-off" });
  }

  function setFeed(on) {
    if (s.done) return;
    if (on === s.feeding) return;
    s.feeding = on;
    feedBtn.classList.toggle("on", on);
    s.events.push({ t: s.t, type: on ? "feed-on" : "feed-off" });
  }

  ironBtn.onclick = () => setIron(!s.iron);
  const startFeed = (e) => {
    e.preventDefault();
    if (s.done) reset();
    setFeed(true);
  };
  feedBtn.addEventListener("pointerdown", startFeed);
  for (const ev of ["pointerup", "pointerleave", "pointercancel"]) feedBtn.addEventListener(ev, () => setFeed(false));
  feedBtn.onkeydown = (e) => (e.key === " " || e.key === "Enter") && !e.repeat && startFeed(e);
  feedBtn.onkeyup = (e) => (e.key === " " || e.key === "Enter") && setFeed(false);
  $(".reset-btn").onclick = reset;
  $(".tip-temp").onchange = reset;
  $(".pad-kind").onchange = reset;

  // Keyboard shortcuts while the simulator is on screen: I toggles the iron, hold S feeds.
  const onKey = (e) => {
    if (!isVisible() || e.target.closest("input, select, textarea")) return;
    if (e.key === "i" || e.key === "I") {
      if (e.type === "keydown" && !e.repeat) setIron(!s.iron);
    } else if (e.key === "s" || e.key === "S") {
      if (e.type === "keydown" && !e.repeat) {
        if (s.done) reset();
        setFeed(true);
      }
      if (e.type === "keyup") setFeed(false);
    }
  };
  addEventListener("keydown", onKey);
  addEventListener("keyup", onKey);
  let visible = true;
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
  io.observe(el);
  const isVisible = () => visible;

  function step(dt) {
    const tip = +$(".tip-temp").value;
    const plane = $(".pad-kind").value === "plane";
    s.t += dt;
    const wetJoint = s.amount > 0.1 && s.liquid;
    if (s.iron) {
      s.ironTime += dt;
      const eff = tip - (plane ? 45 : 12);
      const boost = wetJoint ? 0.55 : 1; // molten solder conducts heat into the joint
      s.pad += ((eff - s.pad) * dt) / ((plane ? 4 : 1) * boost);
      s.lead += ((eff - 10 - s.lead) * dt) / (0.75 * boost);
    } else {
      s.pad += ((AMBIENT - s.pad) * dt) / (plane ? 1.4 : 2.2);
      s.lead += ((AMBIENT - s.lead) * dt) / 2.5;
    }
    s.maxPad = Math.max(s.maxPad, s.pad);
    const tj = Math.min(s.pad, s.lead);
    const wasLiquid = s.liquid;
    s.liquid = s.amount > 0 && 0.6 * s.pad + 0.4 * s.lead >= MELT;
    if (s.liquid && !s.meltAt) s.meltAt = s.t;

    if (s.feeding) {
      s.feedTime += dt;
      if (s.firstFeedTemp === null) s.firstFeedTemp = tj;
      if (s.iron || tj >= MELT) {
        const added = 0.55 * dt;
        s.amount += added;
        // Flux-cored solder brings fresh flux, but only if it melts on the joint.
        // Melted on the iron instead, its flux burns off before it lands.
        if (tj >= MELT) s.flux = Math.min(1.2, s.flux + added * 0.9);
        else s.cold += added;
      } else if (!s.warnedCold) {
        s.warnedCold = true;
      }
    }
    if (s.liquid) {
      const fluxOk = s.flux > 0.05;
      const rate = fluxOk ? 1.6 : 0.2;
      if (s.pad >= MELT) s.wetPad = Math.min(1, s.wetPad + rate * dt);
      if (s.lead >= MELT) s.wetLead = Math.min(1, s.wetLead + rate * dt);
      if (tj > MELT + 10 && fluxOk) s.cold = Math.max(0, s.cold - 0.5 * dt); // reheating with flux reflows a cold lump
      if (s.iron) {
        s.flux -= dt * 0.22 * clamp((Math.max(s.pad, s.lead) - 180) / 170, 0.2, 2);
        if (s.flux <= 0) {
          s.flux = 0;
          s.dull = Math.min(1, s.dull + 0.45 * dt);
        }
      }
    }
    if (s.pad > 345) s.stress += (dt * (s.pad - 345)) / 60;
    if (s.stress >= 4 && !s.lifted) s.lifted = true;
    if (s.amount > 2.3) s.bridge = true;

    // Solidifying: the moment the joint freezes, everything is locked in.
    if (wasLiquid && !s.liquid && !s.iron) {
      if (s.feeding) s.stuck = true;
      s.solidAt = s.t;
    }
    if (!s.done && s.solidAt !== null && !s.iron && s.t - s.solidAt > 0.4) finish();
    if (!s.done && s.lifted && s.iron) finish();
    s.history.push([s.t, s.pad, s.lead]);
    if (s.history.length > 900) s.history.shift();
  }

  function finish() {
    s.done = true;
    if (s.feeding) setFeed(false);
    const plane = $(".pad-kind").value === "plane";
    const r = grade(s);
    result.hidden = false;
    result.className = `solder-result ${r.ok ? "good" : "bad"}`;
    result.innerHTML = `<div class="result-mini"><svg viewBox="215 170 250 100">${scene({ joint: jointOf(s), lifted: s.lifted, bridge: s.bridge, dull: s.dull, tools: false, idPrefix: "res" })}</svg></div><div><div class="eyebrow">${r.ok ? "Inspection: pass" : "Inspection: fail"}</div><h3>${r.title}</h3><p>${r.text}</p><p class="small-note">${r.stats}</p><button type="button" class="btn small again">↺ Try another joint</button></div>`;
    result.querySelector(".again").onclick = reset;
    if (r.ok) {
      progress.mark("solder-good");
      if (plane) progress.mark("solder-plane");
      refreshGoals();
      el.dispatchEvent(new CustomEvent("task", { bubbles: true }));
    }
  }

  function draw() {
    const joint = jointOf(s);
    const d = s.bridge ? null : filletPath(CX, joint);
    if (s.bridge) {
      solderGroup.innerHTML = `<path d="${bridgePath()}" fill="url(#sim-shine)" stroke="#7f8a8e" stroke-width="1"/>`;
    } else {
      if (!solderGroup.querySelector(".fillet")) solderGroup.innerHTML = `<path class="fillet" stroke="#7f8a8e" stroke-width="1"/>`;
      const fl = solderGroup.querySelector(".fillet");
      fl.setAttribute("d", d);
      fl.setAttribute("fill", s.dull > 0.45 && !s.liquid ? "url(#sim-matte)" : "url(#sim-shine)");
      fl.classList.toggle("molten", s.liquid);
    }
    if (s.lifted) {
      padEl.parentElement.setAttribute("transform", `rotate(-9 ${CX + 45} ${PAD_TOP + 3})`);
      solderGroup.setAttribute("transform", `rotate(-9 ${CX + 45} ${PAD_TOP + 3})`);
    }
    ironEl.setAttribute("transform", s.iron ? "translate(0 0)" : "translate(-70 -90)");
    const tipHot = clamp((+$(".tip-temp").value - 250) / 150, 0, 1);
    tipGlow.setAttribute("opacity", f(0.25 + 0.35 * tipHot));
    wireEl.setAttribute("transform", s.feeding ? (s.iron || Math.min(s.pad, s.lead) >= MELT ? "translate(0 0)" : "translate(8 -6)") : "translate(60 -70)");
    fumes.setAttribute("opacity", s.iron && s.liquid && s.flux > 0 ? "1" : s.iron && s.liquid ? "0.35" : "0");
    padEl.setAttribute("fill", s.pad > MELT ? "#e0a060" : "#d08f4c");
    for (const n of ["pad", "lead"]) {
      const t = s[n];
      const h = clamp((t / 400) * 194, 0, 194);
      const bar = svg.querySelector(`.thermo-${n}`);
      bar.setAttribute("height", f(h));
      bar.setAttribute("y", f(197 - h));
      bar.setAttribute("fill", t >= MELT ? "#ff8a4c" : "#8fb3c9");
      svg.querySelector(`.thermo-val-${n}`).textContent = `${Math.round(t)}°`;
    }
    $(".solder-clock").textContent = `${s.t.toFixed(1)} s`;
    hint.textContent = hintText(s);
    // timeline
    const span = Math.max(12, s.t);
    const sx = (t) => f((t / span) * 720);
    const sy = (T) => f(90 - (T / 400) * 90);
    el.querySelector(".tl-pad").setAttribute("points", s.history.map(([t, p]) => `${sx(t)},${sy(p)}`).join(" "));
    el.querySelector(".tl-lead").setAttribute("points", s.history.map(([t, , l]) => `${sx(t)},${sy(l)}`).join(" "));
    let evs = "";
    let ironStart = null;
    let feedStart = null;
    for (const e of [...s.events, { t: s.t, type: "now" }]) {
      if (e.type === "iron-on") ironStart = e.t;
      if ((e.type === "iron-off" || e.type === "now") && ironStart !== null) {
        evs += `<rect x="${sx(ironStart)}" y="0" width="${Math.max(1, sx(e.t) - sx(ironStart))}" height="5" class="tl-iron"/>`;
        ironStart = e.type === "now" && s.iron ? ironStart : null;
      }
      if (e.type === "feed-on") feedStart = e.t;
      if ((e.type === "feed-off" || e.type === "now") && feedStart !== null) {
        evs += `<rect x="${sx(feedStart)}" y="7" width="${Math.max(1, sx(e.t) - sx(feedStart))}" height="5" class="tl-feed"/>`;
        feedStart = e.type === "now" && s.feeding ? feedStart : null;
      }
    }
    el.querySelector(".tl-events").innerHTML = evs;
  }

  let raf = 0;
  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (visible && !s.done) {
      step(dt);
      draw();
    }
    raf = requestAnimationFrame(loop);
  };
  reset();
  raf = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    removeEventListener("keydown", onKey);
    removeEventListener("keyup", onKey);
  };
}

function jointOf(s) {
  const wet = Math.min(s.wetPad, s.wetLead);
  return { amount: s.amount, wet: s.amount > 0 ? wet : 1, cold: s.amount > 0 ? s.cold / s.amount : 0 };
}

function hintText(s) {
  if (s.done) return "";
  const tj = Math.min(s.pad, s.lead);
  if (s.feeding && !s.iron && tj < MELT) return "The solder won't melt on a cold joint. Heat it first.";
  if (s.feeding && tj < MELT) return "Careful: the joint is below 217 °C. Solder is melting on the iron, not on the joint.";
  if (s.iron && s.amount === 0 && tj < MELT) return "Heating… wait until both the pad and the lead pass the melting line.";
  if (s.iron && s.amount === 0 && tj >= MELT) return "Hot enough. Feed solder into the joint, on the side opposite the iron.";
  if (s.iron && s.liquid && !s.feeding && s.amount > 0.6) return "Solder has flowed. Lift the iron away now.";
  if (s.iron && s.flux <= 0) return "The flux has burned away: the solder is going dull. Lift the iron!";
  if (s.pad > 360) return "The pad is very hot. Don't linger.";
  return "";
}

function grade(s) {
  const wet = Math.min(s.wetPad, s.wetLead);
  const coldFrac = s.amount > 0 ? s.cold / s.amount : 0;
  const stats = `Iron on for ${s.ironTime.toFixed(1)} s · solder fed for ${s.feedTime.toFixed(1)} s · ${s.meltAt ? `melted at ${s.meltAt.toFixed(1)} s` : "never fully melted"} · hottest pad ${Math.round(s.maxPad)} °C`;
  const firstFeed = s.firstFeedTemp !== null ? Math.round(s.firstFeedTemp) : null;
  if (s.lifted)
    return { ok: false, title: "Lifted pad", stats, text: `The pad reached ${Math.round(s.maxPad)} °C and stayed there too long. The glue holding the copper to the board let go, and the pad peeled up. This is the hardest mistake to fix on a real board. Heat for only as long as it takes the solder to flow (a few seconds), and use a hotter iron or a bigger tip rather than a longer dwell.` };
  if (s.amount < 0.02) return { ok: false, title: "No solder", stats, text: "You heated the joint but never fed any solder in. Next time: heat, then hold “feed solder” once both temperatures pass the melting line." };
  if (s.stuck)
    return { ok: false, title: "Solder wire frozen into the joint", stats, text: "You lifted the iron while still feeding solder, so the joint froze around the wire. Remember the order: <b>solder away first, then the iron</b>." };
  if (s.bridge)
    return { ok: false, title: "Solder bridge", stats, text: "So much solder went in that it flowed across to the neighbouring pin, joining two points that should be separate: a short circuit. Remove the excess with solder wick (and flux), then reheat each joint on its own." };
  if (s.amount < 0.35)
    return { ok: false, title: "Not enough solder", stats, text: "The solder wetted the joint but there's too little of it: a thin film rather than a fillet. It may work for a while and then crack. Feed a little longer, about a second or two on a joint like this." };
  if (coldFrac > 0.45 || wet < 0.35)
    return {
      ok: false,
      title: "Cold joint: the solder balled up",
      stats,
      text: `${firstFeed !== null && firstFeed < MELT ? `You started feeding solder when the joint was only ${firstFeed} °C, below solder's melting point of ${MELT} °C.` : "The pad or the lead never got hot enough."} The solder melted on the iron and dropped onto metal too cold to bond with, so it sits as a lump that isn't really attached. Cold joints often work at first, then fail. Fix: add a touch of flux and reheat until it flows.`,
    };
  if (s.amount > 1.65)
    return { ok: false, title: "Too much solder", stats, text: "The joint is a convex blob instead of a concave fillet. Too much solder can hide a joint that hasn't wetted properly, and gets close to bridging onto neighbouring pins. On a joint this size, about one to two seconds of feeding is plenty." };
  if (s.dull > 0.45)
    return { ok: false, title: "Overcooked: dull and grainy", stats, text: "You kept the iron on long after the solder flowed. The flux burned away and the solder oxidised, leaving a dull, rough surface. Lift the iron as soon as the solder has flowed around the joint. (Lead-free solder is naturally a little less shiny, but not grainy.)" };
  const quick = s.ironTime < 6 ? "Nicely done, and quick." : "A good joint, though you could have been quicker.";
  return { ok: true, title: "A good joint", stats, text: `${quick} The solder flowed onto both the pad and the lead and formed a smooth, concave fillet: the shape of a little volcano, with the lead coming out of the top. That shape tells you the solder <em>wetted</em> both surfaces.` };
}

// ---------- inspection trainer ----------

const SPECIMENS = [
  { id: "good", label: "Good joint", opts: { joint: { amount: 1, wet: 1 } }, why: "Smooth and concave, wetted onto both the pad and the lead. This is the target." },
  { id: "cold", label: "Cold joint (balled)", opts: { joint: { amount: 1, wet: 0.2, cold: 1 } }, why: "A lump sitting on the pad that never bonded with it. The joint wasn't hot enough when the solder arrived." },
  { id: "thin", label: "Not enough solder", opts: { joint: { amount: 0.25, wet: 1 } }, why: "Wetted, but only a thin film. Weak, and likely to crack." },
  { id: "blob", label: "Too much solder", opts: { joint: { amount: 2, wet: 1 } }, why: "Convex and bulging. It can hide a bad joint and risks bridging." },
  { id: "bridge", label: "Solder bridge", opts: { bridge: true }, why: "Solder joining two pins that should be separate: a short circuit." },
  { id: "lifted", label: "Lifted pad", opts: { joint: { amount: 1, wet: 1 }, lifted: true }, why: "The pad has peeled away from the board after too much heat for too long." },
  { id: "dull", label: "Overheated (dull, grainy)", opts: { joint: { amount: 1, wet: 1 }, dull: 1 }, why: "The flux burned off and the solder oxidised: rough and dull." },
];

export function inspectionTrainer(el) {
  const order = [...SPECIMENS].sort(() => Math.random() - 0.5);
  let i = 0;
  let score = 0;
  const render = () => {
    if (i >= order.length) {
      el.innerHTML = `<div class="inspect"><div class="eyebrow">Train your eye</div><h3>${score} of ${order.length} identified correctly</h3><p>${score === order.length ? "A sharp eye. You'll spot these on real boards." : "Have another look through them: the shapes are worth knowing by heart."}</p><button type="button" class="btn small again">↺ Go again</button></div>`;
      el.querySelector(".again").onclick = () => inspectionTrainer(el);
      progress.answer("solder-eye", score, score === order.length);
      el.dispatchEvent(new CustomEvent("task", { bubbles: true }));
      return;
    }
    const sp = order[i];
    el.innerHTML = `<div class="inspect">
      <div class="eyebrow">Train your eye · joint ${i + 1} of ${order.length}</div>
      <h3>What's wrong with this joint, if anything?</h3>
      <div class="inspect-view"><svg viewBox="215 160 260 110" role="img" aria-label="A solder joint to diagnose">${scene({ ...sp.opts, tools: false, neighbourJoint: sp.id !== "bridge", idPrefix: `sp${i}` })}</svg></div>
      <div class="choices">${SPECIMENS.map((x) => `<button type="button" data-id="${x.id}">${x.label}</button>`).join("")}</div>
      <p class="inspect-why" hidden></p>
    </div>`;
    el.querySelectorAll("[data-id]").forEach((b) => {
      b.onclick = () => {
        const ok = b.dataset.id === sp.id;
        if (ok) score++;
        el.querySelectorAll("[data-id]").forEach((x) => {
          x.disabled = true;
          x.classList.toggle("right", x.dataset.id === sp.id);
          x.classList.toggle("wrong", x === b && !ok);
        });
        const why = el.querySelector(".inspect-why");
        why.hidden = false;
        why.innerHTML = `<b>${ok ? "Right." : `It's a ${sp.label.toLowerCase()}.`}</b> ${sp.why} <button type="button" class="btn small next">Next →</button>`;
        why.querySelector(".next").onclick = () => {
          i++;
          render();
        };
      };
    });
  };
  render();
}
