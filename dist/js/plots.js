// Small live charts that sit under a circuit figure.

import { attr } from "./components.js";
import { si, clamp } from "./format.js";
import { VOLT_ZERO, VOLT_HIGH, voltColor } from "./figure.js";
import { LEDS, VT } from "./sim.js";

const NS = "http://www.w3.org/2000/svg";
const f = (n) => (Number.isFinite(n) ? +n.toFixed(1) : 0);

const narrow = () => typeof matchMedia === "function" && matchMedia("(max-width: 600px)").matches;

class Plot {
  constructor({ w = narrow() ? 460 : 900, h = 210, pad = [18, 16, 34, 56], x, y, title, note }) {
    Object.assign(this, { w, h, pad, x, y });
    this.el = document.createElement("div");
    this.el.className = "plot";
    this.el.innerHTML = `${title ? `<div class="plot-title">${title}</div>` : ""}<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${title || "Chart"}"></svg>${note ? `<p class="plot-note">${note}</p>` : ""}`;
    this.svg = this.el.querySelector("svg");
    this.drawAxes();
  }
  get x0() {
    return this.pad[3];
  }
  get x1() {
    return this.w - this.pad[1];
  }
  get y0() {
    return this.h - this.pad[2];
  }
  get y1() {
    return this.pad[0];
  }
  sx(v) {
    return this.x0 + ((v - this.x.min) / (this.x.max - this.x.min)) * (this.x1 - this.x0);
  }
  sy(v) {
    return this.y0 - ((v - this.y.min) / (this.y.max - this.y.min)) * (this.y0 - this.y1);
  }
  add(tag, attrs = {}, parent = this.svg) {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    parent.append(el);
    return el;
  }
  drawAxes() {
    const { x, y } = this;
    const grid = this.add("g", { class: "grid" });
    for (const t of ticks(y)) {
      this.add("line", { x1: this.x0, x2: this.x1, y1: f(this.sy(t)), y2: f(this.sy(t)) }, grid);
      this.add("text", { x: this.x0 - 8, y: f(this.sy(t)) + 4, "text-anchor": "end", class: "tick" }, grid).textContent = y.fmt ? y.fmt(t) : si(t, y.unit || "", 2);
    }
    for (const t of ticks(x)) {
      this.add("line", { x1: f(this.sx(t)), x2: f(this.sx(t)), y1: this.y0, y2: this.y0 + 5 }, grid);
      this.add("text", { x: f(this.sx(t)), y: this.y0 + 18, "text-anchor": "middle", class: "tick" }, grid).textContent = x.fmt ? x.fmt(t) : si(t, x.unit || "", 2);
    }
    this.add("path", { class: "axis", d: `M${this.x0} ${this.y1}V${this.y0}H${this.x1}` });
    if (x.label) this.add("text", { x: this.x1, y: this.h - 2, "text-anchor": "end", class: "axis-label" }).textContent = x.label;
    if (y.label) this.add("text", { x: 0, y: 0, class: "axis-label", "text-anchor": "middle", transform: `translate(12 ${(this.y0 + this.y1) / 2}) rotate(-90)` }).textContent = y.label;
  }
}

function ticks({ min, max, ticks: list, step }) {
  if (list) return list;
  const span = max - min;
  step ||= [1, 2, 2.5, 5, 10].map((m) => m * 10 ** Math.floor(Math.log10(span / 4))).find((s) => span / s <= 5);
  const out = [];
  for (let t = Math.ceil(min / step - 1e-9) * step; t <= max + 1e-9; t += step) out.push(+t.toPrecision(6));
  return out;
}

// An oscilloscope: traces against time, sampled on every simulation step.
export function scope({ title, window = 5, y, traces, markers = [], note, height = 210, xfmt, xstep, trigger = false }) {
  return (fig) => {
    const plot = new Plot({ h: height, x: { min: 0, max: window, unit: "s", label: "time →", fmt: xfmt, step: xstep }, y, title, note });
    const lines = traces.map((t, i) => plot.add("polyline", { class: `trace trace-${i}`, fill: "none", stroke: t.color || ["#d6ed99", "#ffb35c", "#86adff"][i] }));
    const legend = document.createElement("div");
    legend.className = "plot-legend";
    legend.innerHTML = traces.map((t, i) => `<span><i style="background:${t.color || ["#d6ed99", "#ffb35c", "#86adff"][i]}"></i>${t.label}</span>`).join("");
    plot.el.append(legend);
    const markerEls = markers.map((m) => {
      const g = plot.add("g", { class: "marker" });
      plot.add("line", { y1: plot.y1, y2: plot.y0 }, g);
      plot.add("text", { y: plot.y1 + 12 }, g).textContent = m.label;
      return { m, g };
    });
    let buf = [];
    let t0 = null;
    let held = false;
    const minGap = window / 1500;
    const holdNote = document.createElement("span");
    holdNote.className = "scope-hold";
    if (trigger) legend.append(holdNote);
    const state = {
      el: plot.el,
      sample(q) {
        const t = q.t;
        if (t0 === null) t0 = t;
        if (held) return;
        if (trigger && t - t0 > window) {
          // Single sweep: keep the finished trace on screen until something changes.
          held = true;
          holdNote.textContent = "Trace held. Flip a switch to start a new one.";
          return;
        }
        if (buf.length && t - buf[buf.length - 1][0] < minGap) {
          // Keep peaks: replace the last sample if this one is more extreme.
          const last = buf[buf.length - 1];
          const vals = traces.map((tr) => tr.value(q));
          if (vals.some((v, i) => Math.abs(v) > Math.abs(last[i + 1]))) buf[buf.length - 1] = [last[0], ...vals.map((v, i) => (Math.abs(v) > Math.abs(last[i + 1]) ? v : last[i + 1]))];
          return;
        }
        buf.push([t, ...traces.map((tr) => tr.value(q))]);
      },
      frame(q) {
        if (!buf.length) return;
        const now = buf[buf.length - 1][0];
        // Sweep like a real scope: start a fresh screen when the window fills.
        if (!trigger && now - t0 > window) {
          t0 = now;
          buf = buf.slice(-1);
        }
        lines.forEach((line, i) => {
          attr(line, "points", buf.map((s) => `${f(plot.sx(s[0] - t0))},${f(plot.sy(clamp(s[i + 1], y.min - (y.max - y.min) * 0.05, y.max + (y.max - y.min) * 0.05)))}`).join(" "));
        });
        for (const { m, g } of markerEls) {
          const at = m.at(q, t0);
          const visible = Number.isFinite(at) && at >= 0 && at <= window;
          attr(g, "visibility", visible ? "visible" : "hidden");
          if (visible) attr(g, "transform", `translate(${f(plot.sx(at))} 0)`);
        }
      },
      clear() {
        buf = [];
        t0 = null;
        held = false;
        holdNote.textContent = "";
      },
    };
    fig.on((type) => (type === "reset" || type === "clear-scope" || (trigger && type === "change")) && state.clear());
    return state;
  };
}

// The "voltage landscape": walk once around a loop and plot how high you are.
// `path` lists the parts in order, each as [id, fromPin, toPin].
export function landscape({ path, title = "Walk around the loop: voltage at each point", names = {}, vmax }) {
  return (fig) => {
    const top = vmax ?? fig.vmax;
    const W = 34;
    const segments = [];
    path.forEach(([id, from, to], i) => {
      segments.push({ kind: "wire", w: 1 });
      segments.push({ kind: "part", id, from, to, w: 2, name: names[id] || id });
    });
    segments.push({ kind: "wire", w: 1 });
    const total = segments.reduce((s, x) => s + x.w, 0);
    const plot = new Plot({ h: 250, pad: [30, 16, 46, 60], x: { min: 0, max: total, ticks: [] }, y: { min: 0, max: top * 1.05, unit: "V", label: "voltage (height)", ticks: ticks({ min: 0, max: top }) }, title });
    const area = plot.add("path", { class: "land-area" });
    const line = plot.add("path", { class: "land-line" });
    let x = 0;
    for (const s of segments) {
      s.x0 = x;
      s.x1 = x += s.w;
      if (s.kind === "part") {
        plot.add("rect", { class: "land-band", x: f(plot.sx(s.x0)), y: plot.y1 - 20, width: f(plot.sx(s.x1) - plot.sx(s.x0)), height: plot.y0 - plot.y1 + 20 });
        plot.add("text", { class: "land-name", x: f(plot.sx((s.x0 + s.x1) / 2)), y: plot.y0 + 18, "text-anchor": "middle" }).textContent = s.name;
        s.delta = plot.add("text", { class: "land-delta", x: f(plot.sx((s.x0 + s.x1) / 2)), y: plot.y1 - 6, "text-anchor": "middle" });
      }
    }
    plot.svg.append(area, line);
    plot.add("text", { class: "land-name wire-name", x: f(plot.sx(0.5)), y: plot.y0 + 34, "text-anchor": "middle" }).textContent = "wire";
    const sum = document.createElement("p");
    sum.className = "plot-note";
    plot.el.append(sum);
    return {
      el: plot.el,
      frame(q, dt, slow) {
        if (!slow) return;
        const pts = [];
        let v = 0;
        const deltas = [];
        for (const s of segments) {
          if (s.kind === "wire") {
            pts.push([s.x0, v], [s.x1, v]);
            continue;
          }
          const a = q.pinV(s.id, s.from);
          const b = q.pinV(s.id, s.to);
          v = a;
          pts.push([s.x0, a]);
          // Inside a resistor the drop is spread evenly; draw it as a slope.
          pts.push([s.x1, b]);
          v = b;
          const d = b - a;
          deltas.push(d);
          s.delta.textContent = `${d >= 0 ? "+" : "−"}${Math.abs(d).toFixed(2)} V`;
          s.delta.setAttribute("class", `land-delta ${d > 0.005 ? "up" : d < -0.005 ? "down" : ""}`);
        }
        const d = pts.map(([px, py], i) => `${i ? "L" : "M"}${f(plot.sx(px))} ${f(plot.sy(py))}`).join("");
        attr(line, "d", d);
        attr(area, "d", `${d}L${f(plot.sx(total))} ${plot.y0}L${f(plot.sx(0))} ${plot.y0}Z`);
        attr(line, "stroke", voltColor(Math.max(...pts.map((p) => p[1])), fig.vmax));
        const ups = deltas.filter((x) => x > 0).reduce((a, b) => a + b, 0);
        const downs = -deltas.filter((x) => x < 0).reduce((a, b) => a + b, 0);
        const text = `Total climbed: ${ups.toFixed(2)} V · total dropped: ${downs.toFixed(2)} V. You always end up back where you started.`;
        if (sum.textContent !== text) sum.textContent = text;
      },
    };
  };
}

// A general x–y graph with background curves and a live operating point.
// curves(q) returns [{points: [[x,y]...], cls, label}], point(q) returns [x, y].
export function graph({ title, x, y, curves, point, pointLabel, note, height = 240, zones = [], where }) {
  return (fig) => {
    const plot = new Plot({ h: height, x, y, title, note });
    for (const z of zones) {
      plot.add("rect", { class: `zone ${z.cls || ""}`, x: f(plot.sx(z.x0 ?? x.min)), y: f(plot.sy(z.y1 ?? y.max)), width: f(plot.sx(z.x1 ?? x.max) - plot.sx(z.x0 ?? x.min)), height: f(plot.sy(z.y0 ?? y.min) - plot.sy(z.y1 ?? y.max)) });
      if (z.label) plot.add("text", { class: "zone-label", x: f(plot.sx(z.x1 ?? x.max)) - 6, y: f(plot.sy(z.y1 ?? y.max)) + 14, "text-anchor": "end" }).textContent = z.label;
    }
    const clip = `clip-${Math.random().toString(36).slice(2)}`;
    plot.add("rect", { x: plot.x0, y: plot.y1, width: plot.x1 - plot.x0, height: plot.y0 - plot.y1 }, plot.add("clipPath", { id: clip }));
    const curveLayer = plot.add("g", { "clip-path": `url(#${clip})` });
    const guide = plot.add("path", { class: "guide" });
    const dot = plot.add("circle", { class: "op-point", r: 6 });
    const tag = plot.add("text", { class: "op-label" });
    let lastKey = "";
    return {
      el: plot.el,
      where,
      frame(q, dt, slow) {
        if (!slow) return;
        const list = curves(q);
        const key = JSON.stringify(list.map((c) => [c.cls, c.points.length, c.points[0], c.points.at(-1)]));
        if (key !== lastKey) {
          lastKey = key;
          curveLayer.innerHTML = "";
          for (const c of list) {
            plot.add("polyline", { class: `curve ${c.cls || ""}`, fill: "none", points: c.points.map(([px, py]) => `${f(plot.sx(px))},${f(plot.sy(py))}`).join(" ") }, curveLayer);
            if (c.label) {
              const [lx, ly] = c.labelAt || c.points[Math.floor(c.points.length * 0.7)];
              plot.add("text", { class: `curve-label ${c.cls || ""}`, x: f(plot.sx(lx)) + 6, y: f(plot.sy(ly)) - 6 }, curveLayer).textContent = c.label;
            }
          }
        }
        const [px, py] = point(q);
        const cx = clamp(plot.sx(px), plot.x0, plot.x1);
        const cy = clamp(plot.sy(py), plot.y1, plot.y0);
        attr(dot, "cx", f(cx));
        attr(dot, "cy", f(cy));
        attr(guide, "d", `M${f(cx)} ${plot.y0}V${f(cy)}H${plot.x0}`);
        attr(tag, "x", f(Math.min(cx + 10, plot.x1 - 120)));
        attr(tag, "y", f(Math.max(cy - 10, plot.y1 + 12)));
        tag.textContent = pointLabel ? pointLabel(q, px, py) : "";
      },
    };
  };
}

// The I–V curve of an LED (with its internal series resistance), as points.
export function ledCurve(color, imax) {
  const { is, n, rs } = LEDS[color];
  const pts = [];
  for (let k = 0; k <= 120; k++) {
    const i = (imax * 1.2 * k) / 120;
    pts.push([n * VT * Math.log(i / is + 1) + i * rs, i]);
  }
  return pts;
}

export { Plot, VOLT_ZERO, VOLT_HIGH };
