// A live, interactive circuit figure.
//
// Visual language, used everywhere in the course:
//   wire colour  = voltage (grey-green at 0 V, warming to amber as it rises)
//   moving dots  = current (conventional, + to −); speed is proportional to current
// Hover or tap anything to read its numbers. Switches and buttons are clickable.

import { Netlist, pointKey, normalizeCut } from "./netlist.js";
import { COMPONENTS, attr } from "./components.js";
import { si, clamp, esc, segDist } from "./format.js";
import { progress } from "./progress.js";
import { Meter } from "./meter.js";

const DOT_GAP = 20; // must divide the grid size so dots line up around corners
const MAX_SPEED = 300; // px/s; faster dots strobe

// --- colour scale for voltages (interpolated in OKLab) ---

const lin = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const unlin = (c) => Math.round(clamp(c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055, 0, 1) * 255);
function toLab(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16)));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
function fromLab([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  return "#" + rgb.map((c) => unlin(c).toString(16).padStart(2, "0")).join("");
}
function ramp(from, to, n = 48) {
  const a = toLab(from);
  const b = toLab(to);
  return Array.from({ length: n + 1 }, (_, i) => fromLab(a.map((x, k) => x + ((b[k] - x) * i) / n)));
}
export const VOLT_ZERO = "#7f998b";
export const VOLT_HIGH = "#ffcc4d";
export const VOLT_NEG = "#86adff";
const POS = ramp(VOLT_ZERO, VOLT_HIGH);
const NEG = ramp(VOLT_ZERO, VOLT_NEG);
export function voltColor(v, vmax) {
  const t = v / vmax;
  return t >= 0 ? POS[Math.round(Math.min(t, 1) * 48)] : NEG[Math.round(Math.min(-t, 1) * 48)];
}

// --- one animation loop for every figure on the page ---

const live = new Set();
let raf = 0;
let last = 0;
const reduceMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || 1 / 60);
  last = now;
  for (const fig of live) if (fig.visible) fig.frame(dt);
  raf = live.size ? requestAnimationFrame(tick) : 0;
}

export function destroyFigures() {
  for (const fig of [...live]) fig.destroy();
}

let uid = 0;

export class Figure {
  constructor(host, spec) {
    this.host = host;
    this.spec = spec;
    this.uid = `fig${++uid}`;
    this.G = spec.grid || 40;
    this.timeScale = spec.timeScale ?? 1;
    this.xray = spec.xray ?? true;
    this.maxDt = spec.maxDt ?? 1 / 240;
    this.dotScale = 80 / (spec.iScale ?? 0.02);
    this.visible = true;
    this.goalState = new Map();
    this.sticky = null;
    this.alertAge = 0;
    this.slowClock = 1;
    this.extras = [];
    this.listeners = new Set();
    host.classList.add("fig");
    if (spec.layout) host.classList.add(`fig-${spec.layout}`);
    this.init();
    spec.setup?.(this);
    this.observer = new IntersectionObserver(([e]) => (this.visible = e.isIntersecting), { rootMargin: "120px" });
    this.observer.observe(host);
    live.add(this);
    if (!raf) raf = requestAnimationFrame(tick);
  }

  init() {
    this.net = new Netlist(this.spec);
    const batteries = this.net.parts.filter((p) => p.type === "battery" || p.type === "pulse");
    this.vmax = this.spec.vmax ?? Math.max(1, ...batteries.map((b) => b.v));
    this.render();
    this.net.build();
    this.frame(0);
  }

  // Start over from the original circuit.
  reset() {
    for (const x of this.extras) x.destroy?.();
    this.extras = [];
    this.meter?.destroy();
    this.meter = null;
    this.sticky = null;
    this.init();
    this.emit("reset");
  }

  destroy() {
    live.delete(this);
    this.observer.disconnect();
    for (const x of this.extras) x.destroy?.();
    this.meter?.destroy();
    removeEventListener("pointerup", this.release);
    removeEventListener("pointercancel", this.release);
  }

  on(fn) {
    this.listeners.add(fn);
  }

  emit(type, data) {
    for (const fn of this.listeners) fn(type, data);
  }

  color(v) {
    return this.xray === false ? "#93a89b" : voltColor(v, this.vmax);
  }

  // --- rendering ---

  bounds() {
    if (this.spec.view) return this.spec.view.map((n) => n * this.G);
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const pt of this.net.points.values()) {
      x0 = Math.min(x0, pt.x);
      y0 = Math.min(y0, pt.y);
      x1 = Math.max(x1, pt.x);
      y1 = Math.max(y1, pt.y);
    }
    const G = this.G;
    return [x0 * G - 100, y0 * G - 46, x1 * G + 110, y1 * G + 50];
  }

  render() {
    const spec = this.spec;
    const [x0, y0, x1, y1] = this.bounds();
    const badges = [spec.badge, this.timeScale < 0.5 ? `Slow motion ×${Math.round(1 / this.timeScale)}` : ""].filter(Boolean);
    this.host.innerHTML = `
      <div class="fig-stage">
        <div class="fig-bar"><span class="fig-title">${spec.title || ""}</span>${badges.map((b) => `<span class="pill">${b}</span>`).join("")}</div>
        <div class="fig-canvas">
          <svg class="circuit" viewBox="${x0} ${y0} ${x1 - x0} ${y1 - y0}" role="img" aria-label="${esc(spec.alt || spec.title || "Interactive circuit")}">
            <g class="layer-wires"></g><g class="layer-parts"></g><g class="layer-junctions"></g><g class="layer-over"></g>
          </svg>
          <div class="tip" hidden></div>
        </div>
        <div class="fig-status" role="status" aria-live="polite"></div>
        <div class="fig-legend" aria-hidden="true">${this.xray ? "" : `<span>No X-ray vision here: on a real board you can't see voltage or current. Use the meter.</span>`}${this.xray ? `<span class="legend-volt"><i style="background:linear-gradient(90deg,${VOLT_ZERO},${VOLT_HIGH})"></i>0 → ${si(this.vmax, "V")}</span><span class="legend-dots"><i></i>current</span>${spec.cuttable ? `<span>Click a wire to cut it</span>` : `<span>Hover or tap for values</span>`}` : ""}</div>
      </div>
      <div class="fig-side">
        <div class="fig-controls"></div>
        <div class="fig-readouts"></div>
        <div class="fig-goals"></div>
      </div>
      <div class="fig-extras"></div>`;
    const $ = (s) => this.host.querySelector(s);
    this.svg = $("svg");
    this.tip = $(".tip");
    this.statusEl = $(".fig-status");
    this.canvas = $(".fig-canvas");
    this.layers = { wires: $(".layer-wires"), parts: $(".layer-parts"), junctions: $(".layer-junctions"), over: $(".layer-over") };
    this.renderWires();
    this.layers.parts.innerHTML = this.net.parts.map((p) => `<g class="part part-${p.type}" data-part="${p.id}"></g>`).join("");
    for (const p of this.net.parts) this.drawPart(p);
    this.layers.junctions.innerHTML = this.net.junctions.map((j) => `<circle class="junction" cx="${j.x * this.G}" cy="${j.y * this.G}" r="4.5"/>`).join("");
    this.junctionEls = [...this.layers.junctions.children];
    this.renderControls();
    this.renderReadouts();
    this.renderGoals();
    this.bindEvents();
    if (spec.meter) {
      this.meter = new Meter(this, spec.meter);
      $(".fig-side").prepend(this.meter.el);
      this.net.extra = this.meter;
    }
    for (const make of spec.extras || []) {
      const x = make(this);
      if (!x) continue;
      (x.where === "side" ? $(".fig-side") : $(".fig-extras")).append(x.el);
      this.extras.push(x);
    }
    const side = $(".fig-side");
    const filled = [...side.children].filter((c) => c.children.length || c.textContent.trim());
    if (!filled.length) side.remove();
    else if (filled.length === 1 && filled[0].classList.contains("fig-goals")) this.host.classList.add("goals-only");
    else this.host.classList.add("has-side");
  }

  renderWires() {
    const G = this.G;
    this.layers.wires.innerHTML = this.net.edges
      .map((e) => {
        const [x1, y1, x2, y2] = [e.x1 * G, e.y1 * G, e.x2 * G, e.y2 * G];
        return `<g class="edge"><path class="wire"/><path class="wire"/><path class="dots" d="M${x1} ${y1}L${x2} ${y2}"/><g class="snip" visibility="hidden" transform="translate(${(x1 + x2) / 2} ${(y1 + y2) / 2})"><path d="M-6 -6L6 6M-6 6L6 -6"/></g></g>`;
      })
      .join("");
    this.edgeEls = [...this.layers.wires.children].map((g) => {
      const [wa, wb, dots, snip] = g.children;
      return { wa, wb, dots, snip };
    });
    this.net.edges.forEach((e, i) => this.shapeEdge(e, this.edgeEls[i]));
  }

  // Draw an edge whole, or as two stubs with a gap if it has been cut.
  shapeEdge(e, el) {
    const G = this.G;
    const [x1, y1, x2, y2] = [e.x1 * G, e.y1 * G, e.x2 * G, e.y2 * G];
    const cut = this.net.cuts.has(e.key);
    const len = Math.hypot(x2 - x1, y2 - y1);
    const gap = cut ? Math.min(9, len / 3) / len : 0;
    const mx = (t) => x1 + (x2 - x1) * t;
    const my = (t) => y1 + (y2 - y1) * t;
    attr(el.wa, "d", `M${x1} ${y1}L${mx(0.5 - gap)} ${my(0.5 - gap)}`);
    attr(el.wb, "d", `M${mx(0.5 + gap)} ${my(0.5 + gap)}L${x2} ${y2}`);
    attr(el.snip, "visibility", cut ? "visible" : "hidden");
    attr(el.dots, "visibility", cut ? "hidden" : "visible");
  }

  drawPart(p) {
    const g = this.layers.parts.querySelector(`[data-part="${p.id}"]`);
    const def = COMPONENTS[p.type];
    g.innerHTML = def.draw(p, this.G, `${this.uid}-${p.id}`);
    p.__refs = Object.fromEntries([...g.querySelectorAll("[data-ref]")].map((el) => [el.dataset.ref, el]));
    p.__dots = [...g.querySelectorAll("[data-flow]")].map((el) => ({ el, k: +el.dataset.flow }));
    p.__off = [];
    const interactive = def.interactive && p.interactive !== false && !this.spec.locked?.includes(p.id);
    g.classList.toggle("interactive", !!interactive);
    g.classList.toggle("absent", !!p.absent);
    if (interactive) {
      g.setAttribute("tabindex", "0");
      g.setAttribute("role", "button");
      g.setAttribute("aria-label", def.ariaLabel(p));
    }
  }

  // --- changing the circuit (used by controls, predictions and lessons) ---

  part(id) {
    return this.net.byId.get(id);
  }

  set(id, prop, value) {
    const p = this.part(id);
    if (p[prop] === value) return;
    this.net.syncAll();
    p[prop] = value;
    this.drawPart(p);
    this.net.build({ sync: false });
    this.syncControls();
    this.emit("change", { id, prop, value });
  }

  toggle(id) {
    const p = this.part(id);
    COMPONENTS[p.type].toggle?.(p);
    this.drawPart(p);
    this.net.build();
    this.syncControls();
    this.emit("change", { id, prop: "closed" });
  }

  flip(id) {
    const p = this.part(id);
    [p.a, p.b] = [p.b, p.a];
    this.drawPart(p);
    this.net.layout();
    this.renderWires();
    this.net.build();
    this.emit("change", { id, prop: "flip" });
  }

  cut(key, on = !this.net.cuts.has(key)) {
    if (on) this.net.cuts.add(key);
    else this.net.cuts.delete(key);
    const i = this.net.edges.findIndex((e) => e.key === key);
    if (i >= 0) this.shapeEdge(this.net.edges[i], this.edgeEls[i]);
    this.net.build();
    this.emit("cut", { key, on });
  }

  cutWire(path, on) {
    this.cut(normalizeCut(path), on);
  }

  repairAll() {
    for (const p of this.net.parts) {
      if (!p.burnt) continue;
      p.burnt = false;
      p.damage = 0;
      this.drawPart(p);
    }
    this.sticky = null;
    this.net.build();
    this.emit("repair");
  }

  highlight(id, on = true) {
    this.layers.parts.querySelector(`[data-part="${id}"]`)?.classList.toggle("highlight", on);
  }

  query() {
    return this.net.query();
  }

  // --- the per-frame update ---

  frame(dtReal) {
    const net = this.net;
    if (dtReal > 0 && !this.paused) {
      const samplers = this.extras.filter((x) => x.sample);
      const q0 = samplers.length ? net.query() : null;
      const alerts = net.advance(dtReal * this.timeScale, this.maxDt, samplers.length ? () => samplers.forEach((x) => x.sample(q0)) : null);
      this.handleAlerts(alerts, dtReal);
      if (alerts.some((a) => a.burnt)) for (const a of alerts) if (a.burnt) this.drawPart(a.part);
    }
    net.wireCurrents();
    this.slowClock += dtReal;
    const slow = this.slowClock >= 0.12 || dtReal === 0;
    if (slow) this.slowClock = 0;
    const v = net.sim.v;
    const move = reduceMotion ? 0 : dtReal;
    const threshold = (80 / this.dotScale) * 0.003; // ignore trickles far below this figure's typical current

    net.edges.forEach((e, i) => {
      const el = this.edgeEls[i];
      const va = v[net.points.get(e.a).node];
      const vb = v[net.points.get(e.b).node];
      attr(el.wa, "stroke", this.color(va));
      attr(el.wb, "stroke", this.color(vb));
      e.off = this.advanceDots(e.off, e.i, move);
      attr(el.dots, "stroke-dashoffset", (-e.off).toFixed(1));
      attr(el.dots, "opacity", this.xray && Math.abs(e.i) > threshold ? "1" : "0");
    });
    this.net.junctions.forEach((j, i) => attr(this.junctionEls[i], "fill", this.color(v[j.node])));

    const ctx = {
      v,
      color: (x) => this.color(x),
      flow: (p) => COMPONENTS[p.type].through(p, net.sim) * (p.__swapped ? -1 : 1),
      power: (p) => net.power(p),
      dtReal: move,
      slow,
    };
    for (const p of net.parts) {
      const def = COMPONENTS[p.type];
      if (!def.update || !p.__refs) continue;
      def.update(p, p.__refs, ctx);
      if (p.__dots.length && p.els) {
        const sign = p.__swapped ? -1 : 1;
        const flows = def.flows(p, net.sim).map((i) => i * sign);
        flows.forEach((i, k) => (p.__off[k] = this.advanceDots(p.__off[k] || 0, i, move)));
        for (const { el, k } of p.__dots) {
          attr(el, "stroke-dashoffset", (-p.__off[k]).toFixed(1));
          attr(el, "opacity", this.xray && Math.abs(flows[k]) > threshold ? "1" : "0");
        }
      }
    }

    const q = net.query();
    this.meter?.frame(q, dtReal, slow);
    for (const x of this.extras) x.frame?.(q, dtReal, slow);
    if (slow) {
      this.updateReadouts(q);
      this.checkGoals(q, 0.12);
      this.updateStatus(q);
      if (this.hovered) this.showTip(this.hovered);
      this.spec.onSlow?.(this, q);
    }
  }

  advanceDots(off, current, dt) {
    const speed = clamp(current * this.dotScale, -MAX_SPEED, MAX_SPEED);
    return (((off + speed * dt) % DOT_GAP) + DOT_GAP) % DOT_GAP;
  }

  handleAlerts(alerts, dt) {
    const burnt = alerts.find((a) => a.burnt);
    if (burnt) {
      this.sticky = burnt;
      this.emit("burnt", burnt);
    }
    const worst = alerts.find((a) => a.level === "bad") || alerts.find((a) => a.level === "warn");
    if (worst) {
      this.alert = worst;
      this.alertAge = 0;
    } else if ((this.alertAge += dt) > 0.6) this.alert = null;
  }

  updateStatus(q) {
    const s = this.sticky;
    let html = "";
    let level = "";
    if (s) {
      html = `${s.text} <button class="linkish" data-action="repair">Replace it</button>`;
      level = "bad";
    } else if (this.alert) {
      html = this.alert.text;
      level = this.alert.level;
    } else if (this.message && performance.now() < this.messageUntil) {
      html = this.message;
      level = this.messageLevel || "";
    } else if (this.spec.status) {
      const out = this.spec.status(q, this);
      html = out?.text ?? out ?? "";
      level = out?.level || "";
    }
    if (this.statusEl.__html !== html) {
      this.statusEl.__html = html;
      this.statusEl.innerHTML = html;
    }
    this.statusEl.className = `fig-status ${level}`;
  }

  say(html, level = "", seconds = 6) {
    this.message = html;
    this.messageLevel = level;
    this.messageUntil = performance.now() + seconds * 1000;
  }

  // --- controls, readouts, goals ---

  renderControls() {
    const box = this.host.querySelector(".fig-controls");
    const controls = this.spec.controls || [];
    box.innerHTML = controls
      .map((c, i) => {
        const id = `${this.uid}-c${i}`;
        if (c.type === "toggle") return `<label class="ctl-toggle"><input type="checkbox" id="${id}" data-c="${i}"><span>${c.label}</span></label>`;
        if (c.type === "select")
          return `<label class="ctl" for="${id}"><span class="ctl-top"><span>${c.label}</span></span><select id="${id}" data-c="${i}">${c.options.map(([v, n]) => `<option value="${v}">${n}</option>`).join("")}</select></label>`;
        if (c.type === "button") return `<button class="btn small ${c.primary ? "" : "outline"}" data-c="${i}" type="button">${c.label}</button>`;
        if (c.type === "reset") return `<button class="btn small outline" data-c="${i}" type="button">${c.label || "↺ Start over"}</button>`;
        const n = c.values ? c.values.length - 1 : c.log ? 1000 : (c.max - c.min) / c.step;
        return `<label class="ctl" for="${id}"><span class="ctl-top"><span>${c.label}</span><output data-out="${i}"></output></span><input type="range" id="${id}" data-c="${i}" min="0" max="${Math.round(n)}" step="1"></label>`;
      })
      .join("");
    box.oninput = box.onchange = (ev) => {
      const i = ev.target.dataset.c;
      if (i === undefined) return;
      const c = controls[i];
      if (c.type === "toggle") this.applyControl(c, ev.target.checked ? (c.on ?? true) : (c.off ?? false));
      else if (c.type === "select") this.applyControl(c, typeof c.options[0][0] === "number" ? +ev.target.value : ev.target.value);
      else if (!c.type || c.type === "slider") this.applyControl(c, this.sliderValue(c, +ev.target.value));
    };
    box.onclick = (ev) => {
      const b = ev.target.closest("button[data-c]");
      if (!b) return;
      const c = controls[b.dataset.c];
      if (c.type === "reset") this.reset();
      else c.run?.(this);
    };
    this.syncControls();
  }

  sliderValue(c, raw) {
    if (c.values) return c.values[raw];
    if (c.log) return +(c.min * (c.max / c.min) ** (raw / 1000)).toPrecision(3);
    return +(c.min + raw * c.step).toFixed(6);
  }

  sliderRaw(c, value) {
    if (c.values) {
      let best = 0;
      c.values.forEach((v, i) => Math.abs(v - value) < Math.abs(c.values[best] - value) && (best = i));
      return best;
    }
    if (c.log) return Math.round((Math.log(value / c.min) / Math.log(c.max / c.min)) * 1000);
    return Math.round((value - c.min) / c.step);
  }

  controlValue(c) {
    if (c.get) return c.get(this);
    return this.part(c.part)[c.prop];
  }

  applyControl(c, value) {
    if (c.set) c.set(this, value);
    else this.set(c.part, c.prop, value);
    this.syncControls();
  }

  syncControls() {
    const box = this.host.querySelector(".fig-controls");
    if (!box) return;
    (this.spec.controls || []).forEach((c, i) => {
      const input = box.querySelector(`[data-c="${i}"]`);
      if (!input || c.type === "button" || c.type === "reset") return;
      const value = this.controlValue(c);
      if (c.type === "toggle") input.checked = value === (c.on ?? true);
      else if (c.type === "select") input.value = String(value);
      else {
        input.value = this.sliderRaw(c, value);
        const out = box.querySelector(`[data-out="${i}"]`);
        out.textContent = c.format ? c.format(value) : si(value, c.unit || "");
      }
      if (c.disabled) input.disabled = !!c.disabled(this);
    });
  }

  renderReadouts() {
    const box = this.host.querySelector(".fig-readouts");
    box.innerHTML = (this.spec.readouts || []).map((r) => `<div class="readout"><span>${r.label}</span><strong></strong></div>`).join("");
    this.readoutEls = [...box.querySelectorAll("strong")];
  }

  updateReadouts(q) {
    (this.spec.readouts || []).forEach((r, i) => {
      let value;
      try {
        value = r.value(q, this);
      } catch {
        value = NaN;
      }
      const text = r.format ? r.format(value) : si(r.abs ? Math.abs(value) : value, r.unit || "", r.digits || 3);
      if (this.readoutEls[i].textContent !== text) this.readoutEls[i].textContent = text;
    });
  }

  renderGoals() {
    const box = this.host.querySelector(".fig-goals");
    const goals = this.spec.goals || [];
    if (!goals.length) return;
    box.innerHTML = `<div class="goals-head">Your challenge${goals.length > 1 ? "s" : ""}</div><ul>${goals.map((g) => `<li data-goal="${g.id}" class="${progress.done(g.id) ? "done" : ""}"><span class="tick" aria-hidden="true"></span><span>${g.text}</span></li>`).join("")}</ul>`;
  }

  checkGoals(q, dt) {
    for (const g of this.spec.goals || []) {
      if (this.goalState.get(g.id) === "done") continue;
      let ok = false;
      try {
        ok = g.test(q, this);
      } catch {}
      const held = ok ? (this.goalState.get(g.id) || 0) + dt : 0;
      this.goalState.set(g.id, held);
      if (ok && held >= (g.hold ?? 0.4)) {
        this.goalState.set(g.id, "done");
        const li = this.host.querySelector(`[data-goal="${g.id}"]`);
        const fresh = !li.classList.contains("done");
        li.classList.add("done");
        progress.mark(g.id);
        if (fresh) {
          li.classList.add("just-done");
          if (g.success) this.say(`✓ ${g.success}`, "good");
        }
        this.emit("goal", g);
      }
    }
  }

  // --- pointer & keyboard ---

  toSvg(ev) {
    const pt = this.svg.createSVGPoint();
    pt.x = ev.clientX;
    pt.y = ev.clientY;
    return pt.matrixTransform(this.svg.getScreenCTM().inverse());
  }

  hitTest(x, y, { parts = true, edges = true } = {}) {
    const G = this.G;
    for (const p of parts ? this.net.parts : []) {
      const def = COMPONENTS[p.type];
      if (!def.info) continue;
      if (def.hit) {
        const h = def.hit(p, G);
        if (Math.hypot(x - h.x, y - h.y) < h.r) return { part: p };
      } else if (p.a && p.b) {
        const d = segDist(x, y, p.a[0] * G, p.a[1] * G, p.b[0] * G, p.b[1] * G);
        if (d.dist < 16 && d.t > 0.12 && d.t < 0.88) return { part: p };
      }
    }
    if (!edges) return null;
    let best = null;
    for (const e of this.net.edges) {
      const d = segDist(x, y, e.x1 * G, e.y1 * G, e.x2 * G, e.y2 * G);
      if (d.dist < 10 && (!best || d.dist < best.dist)) best = { edge: e, dist: d.dist, t: d.t };
    }
    return best;
  }

  // The node a point on an edge belongs to (each half of a cut edge is separate).
  edgeNode(edge, t) {
    const key = this.net.cuts.has(edge.key) && t > 0.5 ? edge.b : edge.a;
    return { node: this.net.points.get(key).node, key };
  }

  bindEvents() {
    const svg = this.svg;
    svg.onpointermove = (ev) => {
      if (ev.pointerType === "touch") return;
      const { x, y } = this.toSvg(ev);
      const hit = this.hitTest(x, y);
      svg.style.cursor = this.picking && hit?.part ? "copy" : hit?.part && this.isInteractive(hit.part) ? "pointer" : hit?.edge && this.spec.cuttable ? "crosshair" : "";
      this.hovered = hit ? { ...hit, x, y } : null;
      this.hovered ? this.showTip(this.hovered) : this.hideTip();
    };
    svg.onpointerleave = () => {
      this.hovered = null;
      this.hideTip();
    };
    svg.onpointerdown = (ev) => {
      const { x, y } = this.toSvg(ev);
      const hit = this.hitTest(x, y);
      if (this.picking) {
        if (hit?.part) this.picking(hit.part);
        return;
      }
      if (hit?.part && this.isInteractive(hit.part)) {
        ev.preventDefault();
        this.press(hit.part);
      } else if (hit?.edge && this.spec.cuttable) {
        this.cut(hit.edge.key);
      } else if (ev.pointerType === "touch") {
        this.hovered = hit ? { ...hit, x, y } : null;
        this.hovered ? this.showTip(this.hovered) : this.hideTip();
      }
    };
    this.release = () => {
      for (const p of this.net.parts) {
        if (COMPONENTS[p.type].momentary && p.closed) {
          p.closed = false;
          this.drawPart(p);
          this.net.build();
          this.emit("change", { id: p.id, prop: "closed" });
        }
      }
    };
    addEventListener("pointerup", this.release);
    addEventListener("pointercancel", this.release);
    this.layers.parts.onkeydown = (ev) => {
      const g = ev.target.closest("[data-part]");
      if (!g || (ev.key !== "Enter" && ev.key !== " ") || ev.repeat) return;
      ev.preventDefault();
      this.press(this.part(g.dataset.part));
      g.focus();
    };
    this.layers.parts.onkeyup = (ev) => {
      if (ev.key === "Enter" || ev.key === " ") this.release();
    };
    this.statusEl.onclick = (ev) => {
      if (ev.target.closest('[data-action="repair"]')) this.repairAll();
    };
  }

  isInteractive(p) {
    return COMPONENTS[p.type].interactive && p.interactive !== false && !this.spec.locked?.includes(p.id);
  }

  press(p) {
    const def = COMPONENTS[p.type];
    if (def.momentary) {
      p.closed = true;
      this.drawPart(p);
      this.net.build();
      this.emit("change", { id: p.id, prop: "closed" });
    } else this.toggle(p.id);
    const g = this.layers.parts.querySelector(`[data-part="${p.id}"]`);
    g?.setAttribute("aria-label", def.ariaLabel(p));
  }

  showTip(h) {
    if (!this.xray && !(h.part && this.isInteractive(h.part))) return this.hideTip();
    const q = this.net.query();
    let html;
    if (h.part) html = COMPONENTS[h.part.type].info(h.part, q);
    else if (h.edge) {
      const { node } = this.edgeNode(h.edge, h.t);
      html = `<b>Wire</b>${(this.net.sim.v[node]).toFixed(2)} V above ground (0 V)${this.net.cuts.has(h.edge.key) ? "<br><i>This wire is cut</i>" : ""}`;
    }
    if (!html) return this.hideTip();
    if (this.tip.__html !== html) {
      this.tip.__html = html;
      this.tip.innerHTML = html;
    }
    this.tip.hidden = false;
    const ctm = this.svg.getScreenCTM();
    const box = this.canvas.getBoundingClientRect();
    const sx = ctm.a * h.x + ctm.e - box.left;
    const sy = ctm.d * h.y + ctm.f - box.top;
    const w = this.tip.offsetWidth;
    this.tip.style.left = `${clamp(sx - w / 2, 4, box.width - w - 4)}px`;
    this.tip.style.top = `${sy + 18 + this.tip.offsetHeight > box.height ? sy - this.tip.offsetHeight - 14 : sy + 18}px`;
  }

  hideTip() {
    this.tip.hidden = true;
  }
}

export { pointKey, segDist };
