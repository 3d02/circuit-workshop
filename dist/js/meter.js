// A virtual multimeter with two draggable probes.
//
// It works on any circuit because it measures the live simulation:
//   V  – voltage between the probes (ideal voltmeter: draws no current)
//   A  – current through the meter (a 0.05 Ω shunt, protected by a fuse)
//   Ω  – resistance, by pushing a small test current through the circuit
//   🔊 – continuity (beeps below 30 Ω)
//   ▶| – diode test (shows the forward voltage at about 1 mA)

import { Resistor, Source } from "./sim.js";
import { attr } from "./components.js";
import { esc, segDist } from "./format.js";

const MODES = {
  V: { name: "DC volts", short: "V⎓" },
  A: { name: "DC current", short: "A⎓" },
  R: { name: "Resistance", short: "Ω" },
  C: { name: "Continuity", short: "🔊" },
  D: { name: "Diode test", short: "▶|" },
};
const SHUNT = 0.05;
const TEST_V = 3;
const TEST_R = 3000;
const FUSE = 0.5;

export class Meter {
  constructor(fig, opts = {}) {
    this.fig = fig;
    this.opts = opts;
    this.modes = opts.modes || ["V", "A", "R", "C", "D"];
    this.mode = opts.mode || this.modes[0];
    this.fuseBlown = false;
    this.fuseHeat = 0;
    this.reading = { mode: this.mode, value: NaN, text: "", attached: false };
    this.probes = {
      red: { name: "red", at: null, ...this.parkSpot("red") },
      black: { name: "black", at: null, ...this.parkSpot("black") },
    };
    for (const [name, where] of Object.entries(opts.start || {})) this.placeAtPoint(this.probes[name], where);
    this.renderPanel();
    this.renderProbes();
  }

  parkSpot(name) {
    const [x0, y0, w, h] = this.fig.svg.viewBox.baseVal ? [this.fig.svg.viewBox.baseVal.x, this.fig.svg.viewBox.baseVal.y, this.fig.svg.viewBox.baseVal.width, this.fig.svg.viewBox.baseVal.height] : [0, 0, 400, 300];
    const k = this.probeScale();
    return { x: name === "red" ? x0 + w - 30 * k : x0 + w - 70 * k, y: y0 + h - 16 };
  }

  // On small screens the drawing shrinks; keep the probes big enough to grab with a finger.
  probeScale() {
    const onScreen = this.fig.svg.clientWidth / this.fig.svg.viewBox.baseVal.width || 1;
    return Math.min(2.4, Math.max(1, 0.85 / onScreen));
  }

  // --- simulation hooks (called by the netlist) ---

  build(sim, net) {
    this.dev = null;
    const r = this.nodeOf(this.probes.red);
    const b = this.nodeOf(this.probes.black);
    this.redNode = r;
    this.blackNode = b;
    if (r === null || b === null) return;
    if (this.mode === "A" && !this.fuseBlown) this.dev = sim.add(new Resistor(r, b, SHUNT));
    if (this.mode === "R" || this.mode === "C" || this.mode === "D") this.dev = sim.add(new Source(r, b, TEST_V, TEST_R));
  }

  injections() {
    if (!this.dev) return [];
    const sim = this.fig.net.sim;
    // Current flowing out of the circuit into the red probe and back in at the black one.
    const i = this.dev instanceof Source ? -this.dev.current(sim.v, sim.t) : this.dev.current(sim.v);
    return [
      [this.probes.red.key, -i],
      [this.probes.black.key, i],
    ];
  }

  nodeOf(probe) {
    if (!probe.at) return null;
    const pt = this.fig.net.points.get(probe.key);
    return pt ? pt.node : null;
  }

  // --- per frame ---

  frame(q, dt, slow) {
    const sim = this.fig.net.sim;
    const attached = this.redNode !== null && this.blackNode !== null && this.probes.red.at && this.probes.black.at;
    const vr = attached ? sim.v[this.redNode] - sim.v[this.blackNode] : 0;
    const out = { mode: this.mode, attached, value: NaN, text: "", unit: "", live: false, fuseBlown: this.fuseBlown, red: this.probes.red.key, black: this.probes.black.key, beep: false };

    if (this.mode === "A" && this.dev) {
      const i = this.dev.current(sim.v);
      this.fuseHeat = Math.max(0, this.fuseHeat + dt * ((i / FUSE) ** 2 - 1) * 6);
      if (this.fuseHeat >= 1) {
        this.fuseBlown = true;
        this.fuseHeat = 0;
        this.fig.net.build();
        this.fig.emit("fuse");
      }
    }

    if (this.mode === "V") {
      out.value = vr;
      out.text = attached ? vr.toFixed(Math.abs(vr) < 100 ? 2 : 1) : "– – –";
      out.unit = "V DC";
    } else if (this.mode === "A") {
      const i = this.dev ? this.dev.current(sim.v) : 0;
      out.value = i;
      if (this.fuseBlown) {
        out.text = "0.00";
        out.unit = "mA · FUSE BLOWN";
      } else if (Math.abs(i) < 0.2) {
        out.text = (i * 1000).toFixed(2);
        out.unit = "mA DC";
      } else {
        out.text = i.toFixed(3);
        out.unit = "A DC";
      }
    } else {
      // The circuit is "live" if any of its own sources is pushing current.
      out.live = this.fig.net.parts.some((p) => (p.type === "battery" || p.type === "pulse") && p.els && Math.abs(q.i(p.id)) > 2e-6);
      const it = this.dev ? this.dev.current(sim.v, sim.t) : 0; // test current pushed out of the red probe
      const ohms = it > 1e-9 ? vr / it : Infinity;
      out.value = this.mode === "D" ? vr : ohms;
      if (!attached) {
        out.text = "OL";
        out.value = this.mode === "D" ? Infinity : Infinity;
      } else if (this.mode === "D") {
        out.text = vr > 2.8 ? "OL" : vr.toFixed(3);
        out.value = vr > 2.8 ? Infinity : vr;
      } else if (!Number.isFinite(ohms) || ohms > 40e6 || ohms < 0) out.text = ohms < 0 ? "-?-" : "OL";
      else out.text = formatOhms(ohms);
      out.unit = this.mode === "D" ? "V · diode" : this.mode === "C" ? "Ω · continuity" : "Ω";
      out.beep = this.mode === "C" && attached && ohms < 30 && !out.live;
    }
    this.reading = out;
    this.beep(out.beep);
    if (slow) this.updatePanel(out);
    this.updateProbes(dt);
  }

  // --- the meter body ---

  renderPanel() {
    const el = (this.el = document.createElement("div"));
    el.className = "meter";
    el.innerHTML = `
      <div class="meter-face">
        <div class="lcd" aria-live="polite"><span class="lcd-value">0.00</span><span class="lcd-unit">V DC</span><span class="lcd-beep" aria-hidden="true">🔊</span></div>
        <div class="dial" role="radiogroup" aria-label="Meter mode">${this.modes
          .map((m) => `<button type="button" role="radio" data-mode="${m}" title="${MODES[m].name}" aria-label="${MODES[m].name}">${MODES[m].short}</button>`)
          .join("")}</div>
        <div class="jacks"><span><i class="jack black"></i>COM</span><span><i class="jack red"></i><b class="jack-name">V Ω</b></span></div>
      </div>
      <p class="meter-note"></p>
      <button type="button" class="btn small outline fuse-btn" hidden>Replace the meter's fuse</button>
      <details class="probe-keys"><summary>Place probes with the keyboard</summary>
        ${["red", "black"].map((n) => `<label>${n === "red" ? "Red (+)" : "Black (COM)"} probe <select data-probe="${n}"><option value="">Not touching</option>${[...this.fig.net.names.keys()].map((k) => `<option>${esc(k)}</option>`).join("")}</select></label>`).join("")}
      </details>`;
    el.querySelector(".dial").onclick = (ev) => {
      const b = ev.target.closest("[data-mode]");
      if (b) this.setMode(b.dataset.mode);
    };
    el.querySelector(".fuse-btn").onclick = () => {
      this.fuseBlown = false;
      this.fig.net.build();
    };
    el.querySelectorAll("select[data-probe]").forEach((s) => {
      s.onchange = () => {
        const probe = this.probes[s.dataset.probe];
        if (s.value) this.placeAtPoint(probe, s.value);
        else this.detach(probe);
        this.fig.net.build();
        this.fig.emit("probe", probe);
      };
    });
    this.syncDial();
  }

  setMode(m) {
    this.mode = m;
    this.syncDial();
    this.fig.net.build();
    this.fig.emit("meter-mode", m);
  }

  syncDial() {
    this.el.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.mode === this.mode)));
    this.el.querySelector(".jack-name").textContent = this.mode === "A" ? "mA" : "V Ω";
  }

  updatePanel(out) {
    const $ = (s) => this.el.querySelector(s);
    $(".lcd-value").textContent = out.text;
    $(".lcd-unit").textContent = out.unit;
    $(".lcd").classList.toggle("beeping", out.beep);
    $(".lcd").classList.toggle("alarm", out.live || out.fuseBlown);
    $(".fuse-btn").hidden = !this.fuseBlown;
    let note = "";
    if (out.fuseBlown) note = "The fuse inside the meter blew. In current mode the meter is almost a plain wire, so placing it across a battery is a short circuit.";
    else if (out.live && (this.mode === "R" || this.mode === "C" || this.mode === "D")) note = "⚠ The circuit's own battery is pushing current through the meter, so this reading means nothing (and could damage a real meter). Switch the power off first. Careful: probing across an open power switch puts the battery itself in the path.";
    else if (!out.attached) note = "Drag the red and black probe tips onto the wires.";
    else if (this.mode === "A") note = "Current mode: the meter must be part of the loop, so current flows through it.";
    if ($(".meter-note").textContent !== note) $(".meter-note").textContent = note;
    for (const s of this.el.querySelectorAll("select[data-probe]")) {
      const probe = this.probes[s.dataset.probe];
      const name = [...this.fig.net.names].find(([, k]) => k === probe.key)?.[0] || "";
      if (document.activeElement !== s) s.value = probe.at ? name : "";
    }
  }

  // A real continuity beep, quietly, while the probes see a short path.
  beep(on) {
    if (this.opts.silent) return;
    if (on && !this.osc) {
      try {
        const ctx = (Meter.audio ||= new AudioContext());
        if (ctx.state === "suspended") ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 2700;
        gain.gain.value = 0.03;
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        this.osc = osc;
      } catch {}
    } else if (!on && this.osc) {
      this.osc.stop();
      this.osc = null;
    }
  }

  // --- probes on the drawing ---

  renderProbes() {
    const layer = this.fig.layers.over;
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "probes");
    g.innerHTML = ["black", "red"]
      .map(
        (n) => `<g class="probe probe-${n}" data-probe="${n}">
          <path class="cable"/>
          <g class="handle" tabindex="-1"><g class="probe-art">
            <path class="probe-body" d="${n === "red" ? "M0 0L5 -12L13 -42L23 -40L15 -10Z" : "M0 0L-5 -12L-13 -42L-23 -40L-15 -10Z"}"/>
            <path class="probe-grip" d="${n === "red" ? "M12 -38L22 -36M11 -33L21 -31" : "M-12 -38L-22 -36M-11 -33L-21 -31"}"/>
            <circle class="probe-tip" r="3.2"/>
            <circle class="probe-grab" r="22" cx="${n === "red" ? 12 : -12}" cy="-26"/>
          </g></g>
        </g>`,
      )
      .join("");
    layer.append(g);
    this.probeLayer = g;
    for (const n of ["red", "black"]) {
      const el = g.querySelector(`[data-probe="${n}"]`);
      this.probes[n].el = el;
      el.classList.toggle("attached", !!this.probes[n].at);
      this.bindDrag(this.probes[n], el.querySelector(".handle"));
    }
  }

  bindDrag(probe, handle) {
    handle.onpointerdown = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      handle.setPointerCapture(ev.pointerId);
      const start = this.fig.toSvg(ev);
      const dx = probe.x - start.x;
      const dy = probe.y - start.y;
      probe.dragging = true;
      this.fig.hideTip();
      handle.onpointermove = (e) => {
        const p = this.fig.toSvg(e);
        this.moveTo(probe, p.x + dx, p.y + dy, false);
      };
      handle.onpointerup = handle.onpointercancel = (e) => {
        handle.onpointermove = handle.onpointerup = handle.onpointercancel = null;
        probe.dragging = false;
        const p = this.fig.toSvg(e);
        this.moveTo(probe, p.x + dx, p.y + dy, true);
      };
    };
  }

  // Snap a probe tip to the nearest wire, if one is close enough.
  moveTo(probe, x, y, commit) {
    const hit = this.fig.hitTest(x, y, { parts: false });
    let snapped = null;
    if (hit?.edge && hit.dist < 16) {
      const e = hit.edge;
      const G = this.fig.G;
      const t = Math.min(0.92, Math.max(0.08, hit.t));
      snapped = { x: (e.x1 + (e.x2 - e.x1) * t) * G, y: (e.y1 + (e.y2 - e.y1) * t) * G, key: this.fig.edgeNode(e, t).key };
    } else {
      const G = this.fig.G;
      // Plain-wire parts (which can hide a break) are probed like wires.
      for (const p of this.fig.net.parts) {
        if (p.type !== "link" || snapped) continue;
        const d = segDist(x, y, p.a[0] * G, p.a[1] * G, p.b[0] * G, p.b[1] * G);
        if (d.dist < 16) {
          const t = Math.min(0.92, Math.max(0.08, d.t));
          const end = t < 0.5 ? p.a : p.b;
          snapped = { x: (p.a[0] + (p.b[0] - p.a[0]) * t) * G, y: (p.a[1] + (p.b[1] - p.a[1]) * t) * G, key: `${end[0]},${end[1]}` };
        }
      }
      const near = !snapped && this.nearestPoint(x, y, 16);
      if (near) snapped = { x: near.x * G, y: near.y * G, key: near.key };
    }
    const prevKey = probe.at ? probe.key : null;
    if (snapped) Object.assign(probe, { x: snapped.x, y: snapped.y, at: true, key: snapped.key });
    else Object.assign(probe, { x, y, at: false, key: null });
    probe.el.classList.toggle("attached", !!probe.at);
    if ((probe.at ? probe.key : null) !== prevKey || commit) {
      this.fig.net.build();
      if (commit) this.fig.emit("probe", probe);
    }
  }

  nearestPoint(x, y, within) {
    let best = null;
    const G = this.fig.G;
    for (const pt of this.fig.net.points.values()) {
      const d = Math.hypot(pt.x * G - x, pt.y * G - y);
      if (d < within && (!best || d < best.d)) best = { ...pt, d };
    }
    return best;
  }

  placeAtPoint(probe, name) {
    const key = this.fig.net.names.get(name) || name;
    const pt = this.fig.net.points.get(key);
    if (!pt) return;
    const G = this.fig.G;
    Object.assign(probe, { x: pt.x * G, y: pt.y * G, at: true, key });
    probe.el?.classList.add("attached");
  }

  detach(probe) {
    Object.assign(probe, this.parkSpot(probe.name), { at: false, key: null });
    probe.el?.classList.remove("attached");
  }

  updateProbes() {
    const [x0, y0, w, h] = [this.fig.svg.viewBox.baseVal.x, this.fig.svg.viewBox.baseVal.y, this.fig.svg.viewBox.baseVal.width, this.fig.svg.viewBox.baseVal.height];
    const k = this.probeScale();
    for (const probe of Object.values(this.probes)) {
      const el = probe.el;
      if (!el) continue;
      const side = probe.name === "red" ? 1 : -1;
      attr(el.querySelector(".handle"), "transform", `translate(${probe.x.toFixed(1)} ${probe.y.toFixed(1)})`);
      attr(el.querySelector(".probe-art"), "transform", `scale(${k.toFixed(2)})`);
      // The cable runs from the back of the probe off the bottom edge, toward the meter.
      const bx = probe.x + side * 18 * k;
      const by = probe.y - 41 * k;
      const ex = x0 + w + 10;
      const ey = y0 + h + 10 + (probe.name === "red" ? 0 : 14);
      attr(el.querySelector(".cable"), "d", `M${bx.toFixed(1)} ${by.toFixed(1)}C${(bx + side * 30).toFixed(1)} ${(by - 40).toFixed(1)} ${(ex - 60).toFixed(1)} ${ey.toFixed(1)} ${ex} ${ey}`);
    }
  }

  destroy() {
    this.beep(false);
    this.probeLayer?.remove();
  }
}

function formatOhms(r) {
  if (r < 1000) return `${r.toFixed(1)}`;
  if (r < 1e6) return `${(r / 1000).toFixed(r < 1e4 ? 3 : 2)} k`;
  return `${(r / 1e6).toFixed(3)} M`;
}

