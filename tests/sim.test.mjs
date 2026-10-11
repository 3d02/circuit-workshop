import { test } from "node:test";
import assert from "node:assert/strict";
import { Sim, Resistor, Source, Capacitor, Inductor, Diode, NPN, NMOS, LEDS, DIODES } from "../dist/js/sim.js";

const near = (actual, expected, tol, msg = "") =>
  assert.ok(Math.abs(actual - expected) <= tol, `${msg} expected ${expected} ± ${tol}, got ${actual}`);

test("voltage divider and Ohm's law", () => {
  const s = new Sim();
  const top = s.node();
  const mid = s.node();
  s.add(new Source(top, 0, 10, 1e-4));
  const r1 = s.add(new Resistor(top, mid, 1000));
  s.add(new Resistor(mid, 0, 1000));
  s.step(1e-3);
  near(s.v[mid], 5, 1e-3, "midpoint");
  near(r1.current(s.v), 5e-3, 1e-6, "current");
});

test("battery internal resistance sags under load", () => {
  const s = new Sim();
  const p = s.node();
  const bat = s.add(new Source(p, 0, 9, 1));
  s.add(new Resistor(p, 0, 8));
  s.step(1e-3);
  near(s.v[p], 8, 1e-3, "terminal voltage");
  near(bat.current(s.v, s.t), 1, 1e-3, "battery current");
});

test("red LED with 330 Ω on 5 V runs near 9 mA at about 2 V", () => {
  const s = new Sim();
  const p = s.node();
  const a = s.node();
  s.add(new Source(p, 0, 5, 1e-3));
  s.add(new Resistor(p, a, 330));
  const led = s.add(new Diode(a, 0, LEDS.red));
  for (let i = 0; i < 3; i++) s.step(1e-3);
  assert.ok(s.converged);
  near(led.current(), 9.1e-3, 0.4e-3, "LED current");
  near(s.v[a], 2.0, 0.1, "LED voltage");
});

test("each LED colour has a sensible forward voltage at 10 mA", () => {
  for (const [name, params] of Object.entries(LEDS)) {
    const s = new Sim();
    const a = s.node();
    // 10 mA into the LED from a stiff current-ish source: 100 V through 10 kΩ
    const p = s.node();
    s.add(new Source(p, 0, 100, 1e-3));
    s.add(new Resistor(p, a, 9800));
    s.add(new Diode(a, 0, params));
    for (let i = 0; i < 5; i++) s.step(1e-3);
    near(s.v[a], params.vf, 0.15, name);
  }
});

test("a reversed diode blocks, a forward silicon diode drops ~0.7 V", () => {
  const s = new Sim();
  const p = s.node();
  const a = s.node();
  s.add(new Source(p, 0, 5, 1e-3));
  s.add(new Resistor(p, a, 1000));
  const d = s.add(new Diode(0, a, DIODES.silicon)); // anode at ground: reverse biased
  s.step(1e-3);
  near(d.current(), 0, 1e-8, "reverse current");
  near(s.v[a], 5, 1e-3);
  const s2 = new Sim();
  const p2 = s2.node();
  const a2 = s2.node();
  s2.add(new Source(p2, 0, 5, 1e-3));
  s2.add(new Resistor(p2, a2, 1000));
  s2.add(new Diode(a2, 0, DIODES.silicon));
  for (let i = 0; i < 3; i++) s2.step(1e-3);
  near(s2.v[a2], 0.67, 0.08, "forward drop");
});

test("RC charging reaches 63% after one time constant", () => {
  const s = new Sim();
  const p = s.node();
  const c = s.node();
  s.add(new Source(p, 0, 5, 1e-4));
  s.add(new Resistor(p, c, 10000));
  s.add(new Capacitor(c, 0, 100e-6));
  const dt = 1e-3;
  for (let i = 0; i < 1000; i++) s.step(dt);
  near(s.v[c], 5 * (1 - Math.exp(-1)), 0.02, "Vc at τ");
});

test("RL current rises toward V/R", () => {
  const s = new Sim();
  const p = s.node();
  const m = s.node();
  s.add(new Source(p, 0, 5, 1e-4));
  s.add(new Resistor(p, m, 100));
  const l = s.add(new Inductor(m, 0, 0.1));
  const tau = 0.1 / 100;
  const dt = tau / 1000;
  for (let i = 0; i < 1000; i++) s.step(dt);
  near(l.current(), 0.05 * (1 - Math.exp(-1)), 0.0005, "I at τ");
});

test("NPN switch saturates with enough base drive and is off without it", () => {
  const build = (rb) => {
    const s = new Sim();
    const vcc = s.node();
    const c = s.node();
    const b = s.node();
    s.add(new Source(vcc, 0, 5, 1e-3));
    s.add(new Resistor(vcc, c, 220));
    s.add(new Resistor(vcc, b, rb));
    const q = s.add(new NPN(c, b, 0, { bf: 100 }));
    for (let i = 0; i < 5; i++) s.step(1e-3);
    return { s, q, c };
  };
  const on = build(4700);
  assert.ok(on.s.converged);
  assert.ok(on.s.v[on.c] < 0.3, `Vce should be saturated, got ${on.s.v[on.c]}`);
  near(on.q.ic, (5 - on.s.v[on.c]) / 220, 1e-4, "collector current");
  const active = build(470000);
  near(active.q.ic / active.q.ib, 100, 3, "gain in the active region");
  const off = build(Infinity);
  near(off.q.ic, 0, 1e-9, "off");
});

test("MOSFET: full gate drive switches on, 0 V gate is off", () => {
  const run = (vg) => {
    const s = new Sim();
    const vdd = s.node();
    const d = s.node();
    const g = s.node();
    s.add(new Source(vdd, 0, 9, 1e-3));
    s.add(new Source(g, 0, vg, 1e-3));
    s.add(new Resistor(vdd, d, 10));
    const m = s.add(new NMOS(d, g, 0));
    for (let i = 0; i < 20; i++) s.step(1e-3);
    return { s, m, d };
  };
  const on = run(5);
  assert.ok(on.s.converged);
  near(on.m.id, 0.9, 0.03, "load current");
  const off = run(0);
  near(off.m.id, 0, 1e-9, "off current");
});

test("a floating MOSFET gate keeps its charge; a pull-down drains it", () => {
  const run = (pulldown) => {
    const s = new Sim();
    const vdd = s.node();
    const d = s.node();
    const g = s.node();
    s.add(new Source(vdd, 0, 9, 1e-3));
    s.add(new Resistor(vdd, d, 10));
    s.add(new NMOS(d, g, 0));
    const cg = s.add(new Capacitor(g, 0, 2e-9, 5)); // charged gate, driver disconnected
    if (pulldown) s.add(new Resistor(g, 0, 100e3));
    for (let i = 0; i < 100; i++) s.step(1e-3);
    return cg.vc;
  };
  assert.ok(run(false) > 4.9, "floating gate should hold");
  assert.ok(run(true) < 0.01, "pull-down should discharge");
});

test("switching off a coil: avalanche clamps the spike, a flyback diode tames it", () => {
  const run = (withDiode) => {
    const s = new Sim();
    const vdd = s.node();
    const mid = s.node();
    const d = s.node();
    s.add(new Source(vdd, 0, 9, 1e-3));
    s.add(new Resistor(vdd, mid, 70));
    s.add(new Inductor(mid, d, 0.05, 9 / 70)); // coil already carrying current
    s.add(new Diode(0, d, { ...DIODES.silicon, bv: 60 })); // MOSFET body diode, avalanches at 60 V
    if (withDiode) s.add(new Diode(d, vdd, DIODES.silicon));
    let peak = 0;
    for (let i = 0; i < 400; i++) {
      s.step(1e-6);
      peak = Math.max(peak, s.v[d]);
    }
    return peak;
  };
  near(run(false), 60, 2, "avalanche clamp");
  near(run(true), 9.8, 0.4, "flyback clamp");
});
