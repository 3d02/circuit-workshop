// The component library: for each part type, how it connects (pins), how it
// behaves (engine elements), how it is drawn, and how it reacts on screen.
// Pins and positions are in grid units; drawing multiplies by the grid size.

import { Resistor, Source, Capacitor, Inductor, Diode, NPN, NMOS, LEDS, DIODES } from "./sim.js";
import { si, clamp } from "./format.js";

const OPEN = Infinity;
const SWITCH_ON = 0.005;

// --- small drawing helpers ---

const f = (n) => +n.toFixed(2);

function geom(p, G) {
  const ax = p.a[0] * G;
  const ay = p.a[1] * G;
  const bx = p.b[0] * G;
  const by = p.b[1] * G;
  const len = Math.hypot(bx - ax, by - ay) || 1;
  const ux = (bx - ax) / len;
  const uy = (by - ay) / len;
  return { ax, ay, bx, by, len, ux, uy, cx: (ax + bx) / 2, cy: (ay + by) / 2, ang: (Math.atan2(uy, ux) * 180) / Math.PI };
}

// Lead wires from each pin to the edge of a body of half-length h.
function leads(g, h) {
  return (
    `<line class="lead" data-ref="lead0" x1="${f(g.ax)}" y1="${f(g.ay)}" x2="${f(g.cx - g.ux * h)}" y2="${f(g.cy - g.uy * h)}"/>` +
    `<line class="lead" data-ref="lead1" x1="${f(g.cx + g.ux * h)}" y1="${f(g.cy + g.uy * h)}" x2="${f(g.bx)}" y2="${f(g.by)}"/>`
  );
}

const body = (g, inner) => `<g transform="translate(${f(g.cx)} ${f(g.cy)}) rotate(${f(g.ang)})">${inner}</g>`;
const dots = (d, flow = 0, ref = "") => `<path class="dots" data-flow="${flow}" ${ref ? `data-ref="${ref}"` : ""} d="${d}"/>`;
const straightDots = (g) => dots(`M${f(g.ax)} ${f(g.ay)}L${f(g.bx)} ${f(g.by)}`);

// Where to put a label beside a two-terminal part.
function labelAt(p, g, off) {
  const horizontal = Math.abs(g.ux) > Math.abs(g.uy);
  const side = p.labelSide || (horizontal ? "above" : "right");
  if (side === "above") return [g.cx, g.cy - off - 6, "middle"];
  if (side === "below") return [g.cx, g.cy + off + 15, "middle"];
  if (side === "left") return [g.cx - off - 4, g.cy + 4, "end"];
  return [g.cx + off + 4, g.cy + 4, "start"];
}

function labelText(p, fallback) {
  if (p.label === false) return "";
  if (typeof p.label === "function") return p.label(p);
  return p.label ?? fallback;
}

function labelSvg(p, g, off, fallback) {
  const text = labelText(p, fallback);
  if (!text) return "";
  const [x, y, anchor] = labelAt(p, g, off);
  return `<text class="lbl" data-ref="label" x="${f(x)}" y="${f(y)}" text-anchor="${anchor}">${text}</text>`;
}

function gradient(g, uid) {
  return `<linearGradient id="${uid}" gradientUnits="userSpaceOnUse" x1="${f(g.ax)}" y1="${f(g.ay)}" x2="${f(g.bx)}" y2="${f(g.by)}"><stop data-ref="stop0" offset="0.25"/><stop data-ref="stop1" offset="0.75"/></linearGradient>`;
}

// Cache attribute writes; most frames change nothing.
export function attr(el, name, value) {
  if (!el) return;
  const cache = (el.__a ||= {});
  if (cache[name] !== value) {
    cache[name] = value;
    el.setAttribute(name, value);
  }
}

function colorLeads(r, ctx, p) {
  attr(r.lead0, "stroke", ctx.color(ctx.v[p.nodes[0]]));
  attr(r.lead1, "stroke", ctx.color(ctx.v[p.nodes[1]]));
}

function colorGradient(r, ctx, p) {
  attr(r.stop0, "stop-color", ctx.color(ctx.v[p.nodes[0]]));
  attr(r.stop1, "stop-color", ctx.color(ctx.v[p.nodes[1]]));
}

const zigzag = "M-24 0L-20 -7L-12 7L-4 -7L4 7L12 -7L20 7L24 0";

// Two-terminal defaults: current through the part flows from pin a to pin b.
const two = {
  pins: (p) => [p.a, p.b],
  terminals(p, sim) {
    const i = this.through(p, sim);
    return [i, -i];
  },
  flows(p, sim) {
    return [this.through(p, sim)];
  },
  across: (p, v) => v[p.nodes[0]] - v[p.nodes[1]],
};

function damage(p, dt, rate) {
  if (rate <= 0) {
    p.damage = Math.max(0, (p.damage || 0) - dt * 0.2);
    return false;
  }
  p.damage = (p.damage || 0) + dt * rate;
  if (p.damage >= 1 && !p.burnt) {
    p.burnt = true;
    return true;
  }
  return false;
}

// --- the parts ---

export const COMPONENTS = {
  battery: {
    ...two,
    defaults: { v: 9, r: 0.5, imax: 2 },
    build(p, [a, b], sim) {
      p.els = [sim.add(new Source(a, b, p.v, p.r))];
    },
    through: (p, sim) => -p.els[0].current(sim.v, sim.t), // into pin a: negative while delivering
    delivered: (p, sim) => p.els[0].current(sim.v, sim.t),
    draw(p, G) {
      const g = geom(p, G);
      const px = g.cx - g.ux * 13 + -g.uy * 18;
      const py = g.cy - g.uy * 13 + g.ux * 18;
      return (
        leads(g, 5) +
        body(
          g,
          `<rect x="-9" y="-22" width="18" height="44" class="mask"/><line class="plate" data-ref="plus" x1="-5" y1="-17" x2="-5" y2="17"/><line class="plate short" data-ref="minus" x1="5" y1="-9" x2="5" y2="9"/>`,
        ) +
        `<text class="sign" x="${f(px)}" y="${f(py + 4)}" text-anchor="middle">+</text>` +
        straightDots(g) +
        labelSvg(p, g, 22, si(p.v, "V"))
      );
    },
    update(p, r, ctx) {
      colorLeads(r, ctx, p);
      attr(r.plus, "stroke", ctx.color(ctx.v[p.nodes[0]]));
      attr(r.minus, "stroke", ctx.color(ctx.v[p.nodes[1]]));
    },
    tick(p, sim) {
      const i = this.delivered(p, sim);
      if (i > p.imax) return { level: "bad", text: `Short circuit: ${si(i, "A")} is pouring out of the battery. It is heating up fast.` };
    },
    info: (p, q) => `<b>Battery ${si(p.v, "V")}</b>Pushing ${si(q.i(p.id), "A")} around the loop<br>Delivering ${si(q.power(p.id), "W")}`,
  },

  resistor: {
    ...two,
    defaults: { r: 1000, pmax: 0.25 },
    build(p, [a, b], sim) {
      p.els = [sim.add(new Resistor(a, b, p.burnt ? OPEN : p.r))];
    },
    through: (p, sim) => p.els[0].current(sim.v),
    draw(p, G, uid) {
      const g = geom(p, G);
      return (
        gradient(g, uid) +
        leads(g, 24) +
        body(
          g,
          `<rect x="-27" y="-11" width="54" height="22" class="mask"/><rect data-ref="heat" class="heat" x="-27" y="-11" width="54" height="22" rx="6"/><path class="zig" data-ref="zig" d="${zigzag}" stroke="url(#${uid})"/>`,
        ) +
        straightDots(g) +
        labelSvg(p, g, 14, si(p.r, "Ω"))
      );
    },
    update(p, r, ctx) {
      colorLeads(r, ctx, p);
      colorGradient(r, ctx, p);
      const ratio = ctx.power(p) / p.pmax;
      attr(r.heat, "opacity", p.burnt ? "0" : f(clamp((ratio - 0.3) * 0.9, 0, 1)));
      attr(r.zig, "class", p.burnt ? "zig burnt" : "zig");
    },
    tick(p, sim, dt, power) {
      const ratio = power / p.pmax;
      if (damage(p, dt, (ratio - 2) * 0.35)) return { level: "bad", text: `The ${si(p.r, "Ω")} resistor burned open: it had to get rid of ${si(power, "W")} but is rated for ${si(p.pmax, "W")}.`, burnt: true };
      if (ratio > 1) return { level: "warn", text: `The ${si(p.r, "Ω")} resistor is turning ${si(power, "W")} into heat — more than its ${si(p.pmax, "W")} rating. It's getting hot.` };
    },
    info: (p, q) =>
      p.burnt
        ? `<b>Burnt resistor</b>Open circuit — no current can pass`
        : `<b>Resistor ${si(p.r, "Ω")}</b>${si(q.across(p.id), "V")} across it<br>${si(q.i(p.id), "A")} through it<br>${si(q.power(p.id), "W")} as heat`,
  },

  // Potentiometer: a resistor with a sliding third contact (the wiper).
  pot: {
    defaults: { r: 10000, pos: 0.5 },
    pins: (p) => [p.a, p.b, p.w],
    build(p, [a, b, w], sim) {
      p.els = [sim.add(new Resistor(a, w, Math.max(1, p.r * p.pos))), sim.add(new Resistor(w, b, Math.max(1, p.r * (1 - p.pos))))];
    },
    terminals(p, sim) {
      const i1 = p.els[0].current(sim.v);
      const i2 = p.els[1].current(sim.v);
      return [i1, -i2, i2 - i1];
    },
    through: (p, sim) => p.els[0].current(sim.v),
    flows(p, sim) {
      const i1 = p.els[0].current(sim.v);
      const i2 = p.els[1].current(sim.v);
      return [i1, i2, i2 - i1];
    },
    across: (p, v) => v[p.nodes[0]] - v[p.nodes[1]],
    draw(p, G, uid) {
      const g = geom(p, G);
      // Wiper position in the part's own (rotated) frame.
      const wx = (p.w[0] * G - g.cx) * g.ux + (p.w[1] * G - g.cy) * g.uy;
      const wy = -(p.w[0] * G - g.cx) * g.uy + (p.w[1] * G - g.cy) * g.ux;
      const s = Math.sign(wy) || -1;
      p.__pot = { wx, wy, s, len: g.len };
      return (
        gradient(g, uid) +
        leads(g, 24) +
        body(
          g,
          `<rect x="-27" y="-11" width="54" height="22" class="mask"/><path class="zig" d="${zigzag}" stroke="url(#${uid})"/>` +
            `<path class="lead" data-ref="wlead"/><path class="arrow" data-ref="arrow" d="M-5 ${f(s * 15)}L0 ${f(s * 8)}L5 ${f(s * 15)}"/>` +
            dots("", 2, "dw") +
            dots("", 0, "d0") +
            dots("", 1, "d1"),
        ) +
        labelSvg(p, g, 14, `${si(p.r, "Ω")} pot`)
      );
    },
    update(p, r, ctx) {
      colorLeads(r, ctx, p);
      colorGradient(r, ctx, p);
      const { wx, wy, s, len } = p.__pot;
      const x = f(-24 + 48 * p.pos);
      attr(r.wlead, "d", `M${f(wx)} ${f(wy)}V${f(s * 18)}H${x}V${f(s * 9)}`);
      attr(r.wlead, "stroke", ctx.color(ctx.v[p.nodes[2]]));
      attr(r.arrow, "transform", `translate(${x} 0)`);
      // Current meets at the wiper: along the track from each end, and down the wiper lead.
      attr(r.dw, "d", `M${f(wx)} ${f(wy)}V${f(s * 18)}H${x}V0`);
      attr(r.d0, "d", `M${f(-len / 2)} 0H${x}`);
      attr(r.d1, "d", `M${x} 0H${f(len / 2)}`);
    },
    info: (p, q) => `<b>Potentiometer ${si(p.r, "Ω")}</b>Wiper at ${Math.round(p.pos * 100)}% of the track<br>Wiper voltage ${si(q.pinV(p.id, 2), "V")}`,
  },

  lamp: {
    ...two,
    defaults: { r: 12, rated: 0.75 },
    build(p, [a, b], sim) {
      p.els = [sim.add(new Resistor(a, b, p.burnt ? OPEN : p.r))];
    },
    through: (p, sim) => p.els[0].current(sim.v),
    draw(p, G) {
      const g = geom(p, G);
      return (
        leads(g, 14) +
        straightDots(g) +
        body(
          g,
          `<circle data-ref="glow" class="glow" r="30" fill="url(#lampglow)"/><circle class="mask" r="14"/><circle data-ref="bulb" class="bulb" r="14"/><path data-ref="filament" class="filament" d="M-10 -10L10 10M-10 10L10 -10"/>`,
        ) +
        labelSvg(p, g, 20, "Lamp")
      );
    },
    update(p, r, ctx) {
      colorLeads(r, ctx, p);
      const b = p.burnt ? 0 : clamp(ctx.power(p) / p.rated, 0, 1.4);
      attr(r.glow, "opacity", f(Math.min(1, b ** 0.5)));
      attr(r.bulb, "fill-opacity", f(Math.min(0.9, b ** 0.55)));
      attr(r.filament, "class", p.burnt ? "filament broken" : "filament");
    },
    tick(p, sim, dt, power) {
      if (damage(p, dt, (power / p.rated - 2.2) * 0.8)) return { level: "bad", text: `Pop — the lamp's filament melted. It was being pushed ${(power / p.rated).toFixed(1)}× past its rating.`, burnt: true };
    },
    info: (p, q) =>
      p.burnt
        ? "<b>Blown lamp</b>The filament is broken: an open circuit"
        : `<b>Lamp</b>${si(q.across(p.id), "V")} across it<br>${si(q.i(p.id), "A")} through it<br>${Math.round((q.power(p.id) / p.rated) * 100)}% of full brightness`,
  },

  led: {
    ...two,
    defaults: { color: "red", rated: 0.02, imax: 0.03 },
    build(p, [a, b], sim) {
      const d = new Diode(a, b, LEDS[p.color]);
      d.open = !!p.burnt;
      p.els = [sim.add(d)];
    },
    through: (p) => p.els[0].current(),
    draw(p, G) {
      const g = geom(p, G);
      return (
        leads(g, 10) +
        straightDots(g) +
        body(
          g,
          `<circle data-ref="glow" class="glow" r="34" fill="${LEDS[p.color].hue}" opacity="0"/><rect class="mask" x="-11" y="-13" width="22" height="26"/><path data-ref="tri" class="tri" d="M-9 -11L-9 11L10 0Z"/><path class="sym" d="M10 -11V11"/><path data-ref="rays" class="rays" d="M2 -15L9 -24M6 -24H9V-21M9 -13L16 -22M13 -22H16V-19"/>`,
        ) +
        labelSvg(p, g, 20, `${LEDS[p.color].name} LED`)
      );
    },
    update(p, r, ctx) {
      colorLeads(r, ctx, p);
      const i = p.burnt ? 0 : Math.max(0, ctx.flow(p));
      const b = clamp(Math.sqrt(i / p.rated), 0, 1.25);
      attr(r.glow, "opacity", f(Math.min(0.85, b * 0.7)));
      attr(r.tri, "fill", p.burnt ? "#1f2a25" : LEDS[p.color].hue);
      attr(r.tri, "fill-opacity", f(p.burnt ? 1 : 0.12 + Math.min(0.88, b)));
      attr(r.rays, "opacity", f(p.burnt ? 0 : Math.min(1, b * 1.4)));
    },
    tick(p, sim, dt) {
      const i = Math.max(0, p.els[0].current());
      if (damage(p, dt, ((i / p.imax) ** 2 - 1) * 2)) return { level: "bad", text: `Pop! ${si(i, "A")} flowed through the LED and destroyed it. It is now an open circuit.`, burnt: true };
      if (i > p.rated * 1.05) return { level: "warn", text: `The LED is carrying ${si(i, "A")}, above its ${si(p.rated, "A")} rating. It's bright, but it won't last.` };
    },
    info: (p, q) =>
      p.burnt
        ? "<b>Dead LED</b>Burned out: it no longer conducts"
        : `<b>${LEDS[p.color].name} LED</b>${si(q.across(p.id), "V")} across it<br>${si(q.i(p.id), "A")} through it`,
  },

  diode: {
    ...two,
    defaults: { kind: "silicon" },
    build(p, [a, b], sim) {
      p.els = [sim.add(new Diode(a, b, DIODES[p.kind]))];
    },
    through: (p) => p.els[0].current(),
    draw(p, G) {
      const g = geom(p, G);
      return (
        leads(g, 10) +
        straightDots(g) +
        body(g, `<rect class="mask" x="-11" y="-12" width="22" height="24"/><path class="tri solid" d="M-9 -10L-9 10L10 0Z"/><path class="sym" d="M10 -10V10"/>`) +
        labelSvg(p, g, 18, "Diode")
      );
    },
    update(p, r, ctx) {
      colorLeads(r, ctx, p);
    },
    info: (p, q) => `<b>Diode</b>${si(q.across(p.id), "V")} across it<br>${si(q.i(p.id), "A")} through it`,
  },

  cap: {
    ...two,
    defaults: { c: 100e-6, vc: 0, polarized: true },
    build(p, [a, b], sim) {
      p.els = [sim.add(new Capacitor(a, b, p.c, p.vc))];
    },
    through: (p) => p.els[0].current(),
    sync(p) {
      p.vc = p.els[0].vc;
    },
    draw(p, G) {
      const g = geom(p, G);
      const bottom = p.polarized ? `<path class="plate" data-ref="pb" d="M8 -15Q3 0 8 15"/>` : `<line class="plate" data-ref="pb" x1="5" y1="-15" x2="5" y2="15"/>`;
      return (
        leads(g, 5) +
        body(g, `<rect class="mask" x="-8" y="-17" width="18" height="34"/><line class="plate" data-ref="pa" x1="-5" y1="-15" x2="-5" y2="15"/>${bottom}`) +
        dots(`M${f(g.ax)} ${f(g.ay)}L${f(g.cx - g.ux * 5)} ${f(g.cy - g.uy * 5)}`) +
        dots(`M${f(g.cx + g.ux * 5)} ${f(g.cy + g.uy * 5)}L${f(g.bx)} ${f(g.by)}`) +
        labelSvg(p, g, 20, si(p.c, "F"))
      );
    },
    update(p, r, ctx) {
      colorLeads(r, ctx, p);
      attr(r.pa, "stroke", ctx.color(ctx.v[p.nodes[0]]));
      attr(r.pb, "stroke", ctx.color(ctx.v[p.nodes[1]]));
    },
    info: (p, q) => `<b>Capacitor ${si(p.c, "F")}</b>Charged to ${si(q.across(p.id), "V")}<br>${si(Math.abs(q.i(p.id)), "A")} ${q.i(p.id) >= 0 ? "flowing in" : "flowing out"}`,
  },

  inductor: {
    ...two,
    defaults: { l: 0.05, il: 0 },
    build(p, [a, b], sim) {
      p.els = [sim.add(new Inductor(a, b, p.l, p.il))];
    },
    through: (p) => p.els[0].current(),
    sync(p) {
      p.il = p.els[0].il;
    },
    draw(p, G, uid) {
      const g = geom(p, G);
      return (
        gradient(g, uid) +
        leads(g, 24) +
        body(g, `<rect class="mask" x="-26" y="-12" width="52" height="16"/><path class="zig" d="M-24 0a6 6 0 0 1 12 0a6 6 0 0 1 12 0a6 6 0 0 1 12 0a6 6 0 0 1 12 0" stroke="url(#${uid})"/>`) +
        straightDots(g) +
        labelSvg(p, g, 14, si(p.l, "H"))
      );
    },
    update(p, r, ctx) {
      colorLeads(r, ctx, p);
      colorGradient(r, ctx, p);
    },
    info: (p, q) => `<b>Coil ${si(p.l, "H")}</b>${si(q.i(p.id), "A")} through it<br>${si(q.across(p.id), "V")} across it`,
  },

  switch: {
    ...two,
    defaults: { closed: false },
    interactive: true,
    build(p, [a, b], sim) {
      p.els = [sim.add(new Resistor(a, b, p.closed ? SWITCH_ON : OPEN))];
    },
    through: (p, sim) => p.els[0].current(sim.v),
    draw(p, G) {
      const g = geom(p, G);
      return (
        leads(g, 16) +
        body(
          g,
          `<rect class="mask" x="-18" y="-18" width="36" height="24"/><circle class="contact" cx="-16" cy="0" r="3"/><circle class="contact" cx="16" cy="0" r="3"/><line class="lever" data-ref="lever" x1="-16" y1="0" x2="16" y2="0"/>`,
        ) +
        dots(`M${f(g.ax)} ${f(g.ay)}L${f(g.bx)} ${f(g.by)}`, 0, "dots") +
        labelSvg(p, g, 20, "")
      );
    },
    update(p, r, ctx) {
      colorLeads(r, ctx, p);
      attr(r.lever, "stroke", ctx.color(ctx.v[p.nodes[0]]));
      attr(r.lever, "transform", p.closed ? "rotate(0 -16 0)" : "rotate(-28 -16 0)");
      attr(r.dots, "visibility", p.closed ? "visible" : "hidden");
    },
    toggle(p) {
      p.closed = !p.closed;
    },
    ariaLabel: (p) => `${p.name || "Switch"}: ${p.closed ? "closed (on)" : "open (off)"}. Activate to ${p.closed ? "open" : "close"} it.`,
    info: (p) => `<b>${p.name || "Switch"}</b>${p.closed ? "Closed: current can pass" : "Open: the path is broken"}<br><i>Click to flip</i>`,
  },

  button: {
    ...two,
    defaults: { closed: false },
    interactive: true,
    momentary: true,
    build(p, [a, b], sim) {
      p.els = [sim.add(new Resistor(a, b, p.closed ? SWITCH_ON : OPEN))];
    },
    through: (p, sim) => p.els[0].current(sim.v),
    draw(p, G) {
      const g = geom(p, G);
      return (
        leads(g, 16) +
        body(
          g,
          `<rect class="mask" x="-18" y="-26" width="36" height="30"/><circle class="contact" cx="-16" cy="0" r="3"/><circle class="contact" cx="16" cy="0" r="3"/><g data-ref="cap"><line class="lever" x1="-18" y1="-9" x2="18" y2="-9"/><line class="sym" x1="0" y1="-9" x2="0" y2="-21"/><line class="sym" x1="-7" y1="-21" x2="7" y2="-21"/></g>`,
        ) +
        dots(`M${f(g.ax)} ${f(g.ay)}L${f(g.bx)} ${f(g.by)}`, 0, "dots") +
        labelSvg(p, g, 24, "Push")
      );
    },
    update(p, r, ctx) {
      colorLeads(r, ctx, p);
      attr(r.cap, "transform", p.closed ? "translate(0 9)" : "translate(0 0)");
      attr(r.dots, "visibility", p.closed ? "visible" : "hidden");
    },
    ariaLabel: (p) => `${p.name || "Push button"}: hold to press.`,
    info: () => "<b>Push button</b>Closed only while you hold it down<br><i>Press and hold</i>",
  },

  // Single-pole, double-throw switch: the common pin c connects to a or b.
  spdt: {
    defaults: { to: "a" },
    interactive: true,
    pins: (p) => [p.c, p.a, p.b],
    build(p, [c, a, b], sim) {
      p.els = [sim.add(new Resistor(c, a, p.to === "a" ? SWITCH_ON : OPEN)), sim.add(new Resistor(c, b, p.to === "b" ? SWITCH_ON : OPEN))];
    },
    terminals(p, sim) {
      const ia = p.els[0].current(sim.v);
      const ib = p.els[1].current(sim.v);
      return [ia + ib, -ia, -ib];
    },
    through: (p, sim) => p.els[0].current(sim.v) + p.els[1].current(sim.v),
    flows(p, sim) {
      return [p.els[0].current(sim.v), p.els[1].current(sim.v)];
    },
    across: (p, v) => v[p.nodes[0]] - v[p.nodes[p.to === "a" ? 1 : 2]],
    draw(p, G) {
      const [cx, cy] = [p.c[0] * G, p.c[1] * G];
      const tip = (q) => [cx + (q[0] * G - cx) * 0.82, cy + (q[1] * G - cy) * 0.82];
      const [ax, ay] = tip(p.a);
      const [bx, by] = tip(p.b);
      p.__tips = { a: [ax, ay], b: [bx, by] };
      const lx = cx + (p.labelDx ?? -10);
      return (
        `<circle class="contact" cx="${cx}" cy="${cy}" r="3"/><circle class="contact" cx="${f(p.a[0] * G)}" cy="${f(p.a[1] * G)}" r="3"/><circle class="contact" cx="${f(p.b[0] * G)}" cy="${f(p.b[1] * G)}" r="3"/>` +
        `<line class="lever" data-ref="lever" x1="${cx}" y1="${cy}" x2="${f(ax)}" y2="${f(ay)}"/>` +
        dots(`M${cx} ${cy}L${f(p.a[0] * G)} ${f(p.a[1] * G)}`, 0, "da") +
        dots(`M${cx} ${cy}L${f(p.b[0] * G)} ${f(p.b[1] * G)}`, 1, "db") +
        (p.label ? `<text class="lbl" x="${lx}" y="${cy - 14}" text-anchor="end">${labelText(p, "")}</text>` : "")
      );
    },
    update(p, r, ctx) {
      const [x, y] = p.__tips[p.to];
      attr(r.lever, "x2", f(x));
      attr(r.lever, "y2", f(y));
      attr(r.lever, "stroke", ctx.color(ctx.v[p.nodes[0]]));
      attr(r.da, "visibility", p.to === "a" ? "visible" : "hidden");
      attr(r.db, "visibility", p.to === "b" ? "visible" : "hidden");
    },
    toggle(p) {
      p.to = p.to === "a" ? "b" : "a";
    },
    hit: (p, G) => ({ x: p.c[0] * G + ((p.a[0] + p.b[0]) / 2 - p.c[0]) * G * 0.5, y: p.c[1] * G + ((p.a[1] + p.b[1]) / 2 - p.c[1]) * G * 0.5, r: G * 0.7 }),
    ariaLabel: (p) => `${p.name || "Selector switch"}: set to ${p.names?.[p.to] || p.to}. Activate to flip.`,
    info: (p) => `<b>${p.name || "Selector switch"}</b>Set to ${p.names?.[p.to] || p.to.toUpperCase()}<br><i>Click to flip</i>`,
  },

  fuse: {
    ...two,
    defaults: { rating: 1 },
    build(p, [a, b], sim) {
      p.els = [sim.add(new Resistor(a, b, p.burnt ? OPEN : 0.05))];
    },
    through: (p, sim) => p.els[0].current(sim.v),
    draw(p, G) {
      const g = geom(p, G);
      return (
        leads(g, 18) +
        body(g, `<rect class="mask" x="-19" y="-8" width="38" height="16"/><rect class="sym" x="-18" y="-7" width="36" height="14" rx="3"/><path data-ref="wire" class="fusewire" d="M-18 0H18"/>`) +
        straightDots(g) +
        labelSvg(p, g, 12, `${si(p.rating, "A")} fuse`)
      );
    },
    update(p, r, ctx) {
      colorLeads(r, ctx, p);
      attr(r.wire, "d", p.burnt ? "M-18 0H-5M5 0H18" : "M-18 0H18");
      attr(r.wire, "stroke", ctx.color(ctx.v[p.nodes[0]]));
    },
    tick(p, sim, dt) {
      const i = Math.abs(p.els[0].current(sim.v));
      if (damage(p, dt, ((i / p.rating) ** 2 - 1) * 0.016)) return { level: "bad", text: `The fuse blew. ${si(i, "A")} tried to pass a ${si(p.rating, "A")} fuse, and it melted open to protect the circuit.`, burnt: true };
    },
    info: (p, q) => (p.burnt ? `<b>Blown fuse</b>Its thin wire melted: open circuit` : `<b>Fuse ${si(p.rating, "A")}</b>${si(q.i(p.id), "A")} passing through`),
  },

  motor: {
    ...two,
    defaults: { r: 10, l: 0.001, il: 0 },
    build(p, [a, b], sim) {
      const mid = sim.node();
      p.els = [sim.add(new Resistor(a, mid, p.r)), sim.add(new Inductor(mid, b, p.l, p.il))];
    },
    through: (p) => p.els[1].current(),
    sync(p) {
      p.il = p.els[1].il;
    },
    draw(p, G) {
      const g = geom(p, G);
      return (
        leads(g, 17) +
        straightDots(g) +
        `<circle class="mask" cx="${f(g.cx)}" cy="${f(g.cy)}" r="17"/><circle class="sym" cx="${f(g.cx)}" cy="${f(g.cy)}" r="17"/>` +
        `<g transform="translate(${f(g.cx)} ${f(g.cy)})"><g data-ref="rotor"><path class="rotor" d="M0 -12V12M-12 0H12"/></g><circle class="hub" r="4"/></g>` +
        labelSvg(p, g, 22, "Motor")
      );
    },
    update(p, r, ctx) {
      colorLeads(r, ctx, p);
      p.angle = ((p.angle || 0) + ctx.flow(p) * ctx.dtReal * 2400) % 360;
      attr(r.rotor, "transform", `rotate(${f(p.angle)})`);
    },
    info: (p, q) => `<b>Motor</b>${si(q.i(p.id), "A")} through it<br>${si(q.across(p.id), "V")} across it`,
  },

  // A square-wave source, like a microcontroller pin running PWM.
  pulse: {
    ...two,
    defaults: { v: 5, freq: 2, duty: 0.5, r: 20 },
    build(p, [a, b], sim) {
      p.els = [sim.add(new Source(a, b, p.v, p.r, (t) => ((t * p.freq) % 1 < p.duty ? p.v : 0)))];
    },
    through: (p, sim) => -p.els[0].current(sim.v, sim.t),
    draw(p, G) {
      const g = geom(p, G);
      return (
        leads(g, 15) +
        straightDots(g) +
        `<circle class="mask" cx="${f(g.cx)}" cy="${f(g.cy)}" r="15"/><circle class="sym" cx="${f(g.cx)}" cy="${f(g.cy)}" r="15"/><path class="sym thin" transform="translate(${f(g.cx)} ${f(g.cy)})" d="M-9 5H-4V-5H2V5H8"/>` +
        labelSvg(p, g, 20, "Pulses")
      );
    },
    update(p, r, ctx) {
      colorLeads(r, ctx, p);
    },
    info: (p, q) => `<b>Pulse output</b>Switching between 0 V and ${si(p.v, "V")}<br>${Math.round(p.duty * 100)}% of the time high`,
  },

  ammeter: {
    ...two,
    build(p, [a, b], sim) {
      p.els = [sim.add(new Resistor(a, b, 0.01))];
    },
    through: (p, sim) => p.els[0].current(sim.v),
    draw(p, G) {
      const g = geom(p, G);
      const [x, y, anchor] = labelAt(p, g, 18);
      return (
        leads(g, 13) +
        straightDots(g) +
        `<circle class="mask" cx="${f(g.cx)}" cy="${f(g.cy)}" r="13"/><circle class="meter-sym" cx="${f(g.cx)}" cy="${f(g.cy)}" r="13"/><text class="meter-letter" x="${f(g.cx)}" y="${f(g.cy + 5)}" text-anchor="middle">A</text>` +
        `<text class="reading" data-ref="reading" x="${f(x)}" y="${f(y)}" text-anchor="${anchor}"></text>`
      );
    },
    update(p, r, ctx) {
      colorLeads(r, ctx, p);
      if (ctx.slow) r.reading.textContent = si(Math.abs(ctx.flow(p)), "A");
    },
    info: (p, q) => `<b>Ammeter</b>Measures the current flowing through it: ${si(Math.abs(q.i(p.id)), "A")}`,
  },

  voltmeter: {
    ...two,
    build(p, [a, b], sim) {
      p.els = [sim.add(new Resistor(a, b, 10e6))];
    },
    through: (p, sim) => p.els[0].current(sim.v),
    draw(p, G) {
      const g = geom(p, G);
      const [x, y, anchor] = labelAt(p, g, 18);
      return (
        leads(g, 13) +
        `<circle class="mask" cx="${f(g.cx)}" cy="${f(g.cy)}" r="13"/><circle class="meter-sym" cx="${f(g.cx)}" cy="${f(g.cy)}" r="13"/><text class="meter-letter" x="${f(g.cx)}" y="${f(g.cy + 5)}" text-anchor="middle">V</text>` +
        `<text class="reading" data-ref="reading" x="${f(x)}" y="${f(y)}" text-anchor="${anchor}"></text>`
      );
    },
    update(p, r, ctx) {
      colorLeads(r, ctx, p);
      if (ctx.slow) r.reading.textContent = `${(ctx.v[p.nodes[0]] - ctx.v[p.nodes[1]]).toFixed(2)} V`;
    },
    info: (p, q) => `<b>Voltmeter</b>Measures the voltage between its two leads: ${q.across(p.id).toFixed(2)} V`,
  },

  npn: {
    defaults: { bf: 100 },
    // `at` is the base pin; collector is up-right, emitter down-right.
    // With `mirror: true` it faces the other way: base on the right, collector up-left.
    pins: (p) => [
      [p.at[0] + (p.mirror ? -1 : 1), p.at[1] - 1],
      p.at,
      [p.at[0] + (p.mirror ? -1 : 1), p.at[1] + 1],
    ],
    build(p, [c, b, e], sim) {
      p.els = [sim.add(new NPN(c, b, e, { bf: p.bf }))];
    },
    terminals(p) {
      const { ic, ib } = p.els[0];
      return [ic, ib, -(ic + ib)];
    },
    through: (p) => p.els[0].ic,
    flows(p) {
      const { ic, ib } = p.els[0];
      return [ic, ib, ic + ib];
    },
    across: (p, v) => v[p.nodes[0]] - v[p.nodes[2]],
    draw(p, G) {
      const x = p.at[0] * G;
      const y = p.at[1] * G;
      const m = p.mirror ? -1 : 1;
      const X = (dx) => f(x + (m * dx * G) / 40);
      const Y = (dy) => f(y + (dy * G) / 40);
      const end = p.mirror ? ' text-anchor="end"' : "";
      return (
        `<circle class="mask" cx="${X(26)}" cy="${Y(0)}" r="${f((21 * G) / 40)}"/><circle class="case" cx="${X(26)}" cy="${Y(0)}" r="${f((21 * G) / 40)}"/>` +
        `<line class="lead" data-ref="lb" x1="${X(0)}" y1="${Y(0)}" x2="${X(16)}" y2="${Y(0)}"/>` +
        `<line class="sym bar" x1="${X(16)}" y1="${Y(-12)}" x2="${X(16)}" y2="${Y(12)}"/>` +
        `<path class="lead" data-ref="lc" d="M${X(16)} ${Y(-6)}L${X(40)} ${Y(-20)}L${X(40)} ${Y(-40)}"/>` +
        `<path class="lead" data-ref="le" d="M${X(16)} ${Y(6)}L${X(40)} ${Y(20)}L${X(40)} ${Y(40)}"/>` +
        `<path class="arrowhead" d="M${X(40)} ${Y(20)}L${X(29)} ${Y(19)}L${X(34)} ${Y(11)}Z"/>` +
        dots(`M${X(40)} ${Y(-40)}L${X(40)} ${Y(-20)}L${X(16)} ${Y(-6)}L${X(16)} ${Y(0)}`, 0) +
        dots(`M${X(0)} ${Y(0)}L${X(16)} ${Y(0)}`, 1) +
        dots(`M${X(16)} ${Y(0)}L${X(16)} ${Y(6)}L${X(40)} ${Y(20)}L${X(40)} ${Y(40)}`, 2) +
        `<text class="pin-lbl" x="${X(46)}" y="${Y(-26)}"${end}>C</text><text class="pin-lbl" x="${X(2)}" y="${Y(-9)}"${end}>B</text><text class="pin-lbl" x="${X(46)}" y="${Y(32)}"${end}>E</text>` +
        (p.label === false ? "" : `<text class="lbl" x="${X(52)}" y="${Y(4)}"${end}>${labelText(p, "NPN")}</text>`)
      );
    },
    update(p, r, ctx) {
      attr(r.lc, "stroke", ctx.color(ctx.v[p.nodes[0]]));
      attr(r.lb, "stroke", ctx.color(ctx.v[p.nodes[1]]));
      attr(r.le, "stroke", ctx.color(ctx.v[p.nodes[2]]));
    },
    hit: (p, G) => ({ x: (p.at[0] + (p.mirror ? -0.6 : 0.6)) * G, y: p.at[1] * G, r: G * 0.6 }),
    info(p, q) {
      const { ic, ib } = p.els[0];
      const vce = q.across(p.id);
      const state = ib < 1e-7 ? "Off" : vce < 0.3 ? "Saturated — fully on" : "Active — partly on";
      return `<b>NPN transistor</b>${state}<br>Base current ${si(ib, "A")}<br>Collector current ${si(ic, "A")}<br>Collector–emitter ${si(vce, "V")}`;
    },
  },

  nmos: {
    defaults: { vth: 2, k: 4, vg: 0, cgs: 2e-9 },
    // `at` is the gate pin; drain is up-right, source down-right.
    pins: (p) => [
      [p.at[0] + 1, p.at[1] - 1],
      p.at,
      [p.at[0] + 1, p.at[1] + 1],
    ],
    build(p, [d, g, s], sim) {
      p.els = [
        sim.add(new NMOS(d, g, s, { vth: p.vth, k: p.k })),
        sim.add(new Capacitor(g, s, p.cgs, p.vg)),
        sim.add(new Diode(s, d, { ...DIODES.silicon, bv: 60 })), // body diode, avalanches at 60 V
      ];
    },
    sync(p) {
      p.vg = p.els[1].vc;
    },
    terminals(p) {
      const id = p.els[0].id + p.els[2].current() * -1;
      const ig = p.els[1].current();
      return [id, ig, -(id + ig)];
    },
    through: (p) => p.els[0].id - p.els[2].current(),
    flows(p) {
      return [p.els[0].id - p.els[2].current()];
    },
    across: (p, v) => v[p.nodes[0]] - v[p.nodes[2]],
    draw(p, G) {
      const x = p.at[0] * G;
      const y = p.at[1] * G;
      const X = (dx) => f(x + (dx * G) / 40);
      const Y = (dy) => f(y + (dy * G) / 40);
      return (
        `<circle class="mask" cx="${X(26)}" cy="${Y(0)}" r="${f((22 * G) / 40)}"/><circle class="case" cx="${X(26)}" cy="${Y(0)}" r="${f((22 * G) / 40)}"/>` +
        `<line class="lead" data-ref="lg" x1="${X(0)}" y1="${Y(0)}" x2="${X(13)}" y2="${Y(0)}"/>` +
        `<line class="sym" data-ref="gate" x1="${X(13)}" y1="${Y(-12)}" x2="${X(13)}" y2="${Y(12)}"/>` +
        `<path class="sym channel" data-ref="channel" d="M${X(19)} ${Y(-14)}V${Y(-6)}M${X(19)} ${Y(-4)}V${Y(4)}M${X(19)} ${Y(6)}V${Y(14)}"/>` +
        `<path class="lead" data-ref="ld" d="M${X(19)} ${Y(-10)}H${X(40)}V${Y(-40)}"/>` +
        `<path class="lead" data-ref="ls" d="M${X(19)} ${Y(10)}H${X(40)}V${Y(40)}M${X(19)} ${Y(0)}H${X(40)}V${Y(10)}"/>` +
        `<path class="arrowhead" d="M${X(20)} ${Y(0)}L${X(28)} ${Y(-4)}L${X(28)} ${Y(4)}Z"/>` +
        dots(`M${X(40)} ${Y(-40)}V${Y(-10)}H${X(19)}V${Y(10)}H${X(40)}V${Y(40)}`, 0) +
        `<text class="pin-lbl" x="${X(46)}" y="${Y(-26)}">D</text><text class="pin-lbl" x="${X(1)}" y="${Y(-9)}">G</text><text class="pin-lbl" x="${X(46)}" y="${Y(32)}">S</text>` +
        (p.label === false ? "" : `<text class="lbl" x="${X(52)}" y="${Y(4)}">${labelText(p, "MOSFET")}</text>`)
      );
    },
    update(p, r, ctx) {
      attr(r.ld, "stroke", ctx.color(ctx.v[p.nodes[0]]));
      attr(r.lg, "stroke", ctx.color(ctx.v[p.nodes[1]]));
      attr(r.gate, "stroke", ctx.color(ctx.v[p.nodes[1]]));
      attr(r.ls, "stroke", ctx.color(ctx.v[p.nodes[2]]));
      const on = clamp((ctx.v[p.nodes[1]] - ctx.v[p.nodes[2]] - p.vth) / 1.5, 0, 1);
      attr(r.channel, "stroke-opacity", f(0.35 + 0.65 * on));
    },
    hit: (p, G) => ({ x: (p.at[0] + 0.6) * G, y: p.at[1] * G, r: G * 0.6 }),
    info(p, q) {
      const vgs = q.pinV(p.id, 1) - q.pinV(p.id, 2);
      const state = vgs < p.vth ? "Off" : vgs > p.vth + 2 ? "Fully on" : "Partly on";
      return `<b>N-channel MOSFET</b>${state}<br>Gate–source ${si(vgs, "V")}<br>Drain current ${si(q.i(p.id), "A")}`;
    },
  },

  // Markers with no electrical behaviour.
  ground: {
    pins: (p) => [p.at],
    draw(p, G) {
      const x = p.at[0] * G;
      const y = p.at[1] * G;
      return `<path class="ground" d="M${x} ${y}v10M${x - 12} ${y + 10}h24M${x - 7} ${y + 15}h14M${x - 3} ${y + 20}h6"/>`;
    },
  },

  label: {
    pins: (p) => [p.at],
    draw(p, G) {
      const x = p.at[0] * G;
      const y = p.at[1] * G;
      const off = { above: [0, -12, "middle"], below: [0, 22, "middle"], left: [-12, 5, "end"], right: [12, 5, "start"] }[p.side || "above"];
      return `<circle class="node-dot" cx="${x}" cy="${y}" r="4.5"/><text class="node-lbl" x="${x + off[0]}" y="${y + off[1]}" text-anchor="${off[2]}">${p.text}</text>`;
    },
  },
};

Object.assign(COMPONENTS, {
  // A plain piece of wire drawn as a part, so it can be named, broken and replaced.
  link: {
    ...two,
    build(p, [a, b], sim) {
      p.els = [sim.add(new Resistor(a, b, p.broken ? OPEN : 0.002))];
    },
    through: (p, sim) => p.els[0].current(sim.v),
    draw(p, G) {
      const g = geom(p, G);
      return `<line class="lead" data-ref="lead0" x1="${f(g.ax)}" y1="${f(g.ay)}" x2="${f(g.cx)}" y2="${f(g.cy)}"/><line class="lead" data-ref="lead1" x1="${f(g.cx)}" y1="${f(g.cy)}" x2="${f(g.bx)}" y2="${f(g.by)}"/>` + straightDots(g) + labelSvg(p, g, 6, "");
    },
    update(p, r, ctx) {
      colorLeads(r, ctx, p);
    },
    info: (p, q) => `<b>${p.name || "Wire"}</b>${q.pinV(p.id, 0).toFixed(2)} V at one end, ${q.pinV(p.id, 1).toFixed(2)} V at the other`,
  },
  text: {
    pins: () => [],
    draw(p, G) {
      return `<text class="${p.cls || "annotation"}" x="${p.at[0] * G}" y="${p.at[1] * G}" text-anchor="${p.anchor || "middle"}">${p.text}</text>`;
    },
  },
});

// Fill in each part's defaults and stable ids.
export function preparePart(p, index) {
  const def = COMPONENTS[p.type];
  if (!def) throw new Error(`Unknown part type: ${p.type}`);
  for (const [k, v] of Object.entries(def.defaults || {})) if (p[k] === undefined) p[k] = v;
  p.id ||= `${p.type}${index}`;
  return p;
}
