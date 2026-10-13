// A small analog circuit simulator.
//
// Every element stamps conductances and current sources into the nodal
// equations G·v = i. Nonlinear parts (diodes, transistors) are linearised on
// each Newton–Raphson iteration; capacitors and inductors use backward-Euler
// companion models, so the same solver handles DC and changes over time.
// Node 0 is ground. Units are SI throughout.

export const VT = 0.025852; // thermal voltage near room temperature
const GMIN = 1e-12; // tiny leak from every node to ground keeps floating nodes solvable

export class Sim {
  constructor() {
    this.size = 1;
    this.elements = [];
    this.v = new Float64Array(1);
    this.t = 0;
    this.converged = true;
  }

  node() {
    return this.size++;
  }

  add(el) {
    this.elements.push(el);
    el.attach?.(this);
    return el;
  }

  // --- stamping helpers (used by elements) ---

  conduct(a, b, g) {
    const { A, n } = this;
    if (a) A[(a - 1) * n + a - 1] += g;
    if (b) A[(b - 1) * n + b - 1] += g;
    if (a && b) {
      A[(a - 1) * n + b - 1] -= g;
      A[(b - 1) * n + a - 1] -= g;
    }
  }

  // A current source pushing current I out of node a, through itself, into node b.
  inject(a, b, I) {
    if (a) this.b[a - 1] -= I;
    if (b) this.b[b - 1] += I;
  }

  // Linearised multi-terminal device.
  // pins[k]: node of terminal k. I0[k]: current flowing from that node into the device.
  // ctrl[m] = [p, q, V0]: controlling voltage v[p] − v[q], evaluated at V0.
  // dI[k][m]: ∂I_k/∂ctrl_m.
  device(pins, I0, ctrl, dI) {
    const { A, b, n } = this;
    for (let k = 0; k < pins.length; k++) {
      const r = pins[k];
      if (!r) continue;
      let rhs = I0[k];
      for (let m = 0; m < ctrl.length; m++) {
        const g = dI[k][m];
        if (!g) continue;
        const [p, q, V0] = ctrl[m];
        if (p) A[(r - 1) * n + p - 1] += g;
        if (q) A[(r - 1) * n + q - 1] -= g;
        rhs -= g * V0;
      }
      b[r - 1] -= rhs;
    }
  }

  // Advance the circuit by dt seconds.
  step(dt) {
    const n = this.size - 1;
    if (this.n !== n) {
      this.n = n;
      this.A = new Float64Array(n * n);
      this.b = new Float64Array(n);
      const v = new Float64Array(this.size);
      v.set(this.v.subarray(0, Math.min(this.v.length, this.size)));
      this.v = v;
    }
    this.dt = dt;
    this.tNext = this.t + dt;
    const v = Float64Array.from(this.v);
    let converged = false;
    for (let iter = 0; iter < 150; iter++) {
      this.A.fill(0);
      this.b.fill(0);
      this.limited = false;
      for (const el of this.elements) el.stamp(this, v, dt);
      for (let i = 0; i < n; i++) this.A[i * n + i] += GMIN;
      if (!solveLinear(this.A, this.b, n)) break;
      let worst = 0;
      for (let i = 1; i < this.size; i++) {
        const next = this.b[i - 1];
        const diff = Math.abs(next - v[i]) / (1e-6 + 1e-6 * Math.abs(next));
        if (diff > worst) worst = diff;
        v[i] = next;
      }
      if (!this.limited && worst < 1) {
        converged = true;
        break;
      }
    }
    if (!v.every(Number.isFinite)) {
      // Keep the last good state rather than poisoning everything with NaN.
      for (const el of this.elements) el.reset?.();
      this.converged = false;
      return false;
    }
    this.v = v;
    this.t = this.tNext;
    this.converged = converged;
    for (const el of this.elements) el.commit?.(this, v, dt);
    return converged;
  }
}

function solveLinear(A, b, n) {
  for (let k = 0; k < n; k++) {
    let p = k;
    let max = Math.abs(A[k * n + k]);
    for (let i = k + 1; i < n; i++) {
      const a = Math.abs(A[i * n + k]);
      if (a > max) {
        max = a;
        p = i;
      }
    }
    if (max < 1e-300) return false;
    if (p !== k) {
      for (let j = k; j < n; j++) {
        const t = A[k * n + j];
        A[k * n + j] = A[p * n + j];
        A[p * n + j] = t;
      }
      const t = b[k];
      b[k] = b[p];
      b[p] = t;
    }
    const pivot = A[k * n + k];
    for (let i = k + 1; i < n; i++) {
      const f = A[i * n + k] / pivot;
      if (!f) continue;
      for (let j = k; j < n; j++) A[i * n + j] -= f * A[k * n + j];
      b[i] -= f * b[k];
    }
  }
  for (let i = n - 1; i >= 0; i--) {
    let s = b[i];
    for (let j = i + 1; j < n; j++) s -= A[i * n + j] * b[j];
    b[i] = s / A[i * n + i];
  }
  return true;
}

// SPICE's junction-voltage limiter: stops Newton from leaping up an exponential.
function pnjlim(sim, vnew, vold, vt, vcrit) {
  if (vnew > vcrit && Math.abs(vnew - vold) > 2 * vt) {
    sim.limited = true;
    if (vold > 0) {
      const arg = 1 + (vnew - vold) / vt;
      return arg > 0 ? vold + vt * Math.log(arg) : vcrit;
    }
    return vt * Math.log(vnew / vt);
  }
  return vnew;
}

const expSafe = (x) => Math.exp(Math.min(x, 80));
const sigmoid = (x) => 1 / (1 + Math.exp(-x));
const softplus = (x) => (x > 30 ? x : Math.log1p(Math.exp(x)));

// --- elements ---

export class Resistor {
  constructor(a, b, r) {
    Object.assign(this, { a, b, r });
  }
  stamp(sim) {
    if (Number.isFinite(this.r)) sim.conduct(this.a, this.b, 1 / Math.max(this.r, 1e-6));
  }
  current(v) {
    return Number.isFinite(this.r) ? (v[this.a] - v[this.b]) / Math.max(this.r, 1e-6) : 0;
  }
}

// An EMF with internal resistance (Norton form, so no extra unknowns).
// `wave(t)` may replace the constant voltage, e.g. for a square-wave output.
export class Source {
  constructor(p, m, volts, r = 0.01, wave = null) {
    Object.assign(this, { p, m, volts, r: Math.max(r, 1e-4), wave });
  }
  emf(t) {
    return this.wave ? this.wave(t) : this.volts;
  }
  stamp(sim) {
    const g = 1 / this.r;
    sim.conduct(this.p, this.m, g);
    sim.inject(this.m, this.p, this.emf(sim.tNext) * g);
  }
  // Current delivered out of the + terminal.
  current(v, t) {
    return (this.emf(t) - (v[this.p] - v[this.m])) / this.r;
  }
}

export class Capacitor {
  constructor(a, b, c, v0 = 0) {
    Object.assign(this, { a, b, c, vc: v0, i: 0 });
  }
  stamp(sim, v, dt) {
    const g = this.c / dt;
    sim.conduct(this.a, this.b, g);
    sim.inject(this.b, this.a, g * this.vc);
  }
  commit(sim, v, dt) {
    const vNew = v[this.a] - v[this.b];
    this.i = (this.c * (vNew - this.vc)) / dt;
    this.vc = vNew;
  }
  current() {
    return this.i;
  }
}

export class Inductor {
  constructor(a, b, l, i0 = 0) {
    Object.assign(this, { a, b, l, il: i0 });
  }
  stamp(sim, v, dt) {
    sim.conduct(this.a, this.b, dt / this.l);
    sim.inject(this.a, this.b, this.il);
  }
  commit(sim, v, dt) {
    this.il += (dt / this.l) * (v[this.a] - v[this.b]);
  }
  current() {
    return this.il;
  }
}

// Shockley diode with optional series resistance and reverse breakdown.
export class Diode {
  constructor(a, k, { is = 1e-14, n = 1, rs = 0, bv = Infinity, rz = 1 } = {}) {
    Object.assign(this, { a, k, is, n, rs, bv, rz, open: false, vd: 0, i: 0 });
    this.nvt = n * VT;
    this.vcrit = this.nvt * Math.log(this.nvt / (Math.SQRT2 * is));
  }
  attach(sim) {
    this.j = this.rs > 0 ? sim.node() : this.a;
  }
  reset() {
    this.vd = 0;
  }
  model(vd) {
    const e = expSafe(vd / this.nvt);
    let i = this.is * (e - 1);
    let g = (this.is * e) / this.nvt + GMIN;
    if (Number.isFinite(this.bv)) {
      // Smooth avalanche/zener conduction once reverse voltage passes bv.
      const s = 0.05;
      const x = (-vd - this.bv) / s;
      i -= (s * softplus(x)) / this.rz;
      g += sigmoid(x) / this.rz;
    }
    return [i, g];
  }
  stamp(sim, v) {
    if (this.open) return;
    if (this.rs > 0) sim.conduct(this.a, this.j, 1 / this.rs);
    const vd = pnjlim(sim, v[this.j] - v[this.k], this.vd, this.nvt, this.vcrit);
    this.vd = vd;
    const [i, g] = this.model(vd);
    sim.device([this.j, this.k], [i, -i], [[this.j, this.k, vd]], [[g], [-g]]);
  }
  commit(sim, v) {
    this.i = this.open ? 0 : this.model(v[this.j] - v[this.k])[0];
  }
  current() {
    return this.i;
  }
}

// NPN bipolar transistor, Ebers–Moll transport model.
export class NPN {
  constructor(c, b, e, { is = 1e-14, bf = 100, br = 1 } = {}) {
    Object.assign(this, { c, b, e, is, bf, br, vbe: 0, vbc: 0, ic: 0, ib: 0 });
    this.vcrit = VT * Math.log(VT / (Math.SQRT2 * is));
  }
  reset() {
    this.vbe = this.vbc = 0;
  }
  model(vbe, vbc) {
    const { is, bf, br } = this;
    const ef = expSafe(vbe / VT);
    const er = expSafe(vbc / VT);
    const iF = is * (ef - 1);
    const iR = is * (er - 1);
    const gF = (is * ef) / VT;
    const gR = (is * er) / VT;
    return {
      ic: iF - iR * (1 + 1 / br),
      ib: iF / bf + iR / br,
      dic: [gF, -gR * (1 + 1 / br)],
      dib: [gF / bf + GMIN, gR / br + GMIN],
    };
  }
  stamp(sim, v) {
    const { c, b, e } = this;
    const vbe = pnjlim(sim, v[b] - v[e], this.vbe, VT, this.vcrit);
    const vbc = pnjlim(sim, v[b] - v[c], this.vbc, VT, this.vcrit);
    this.vbe = vbe;
    this.vbc = vbc;
    const m = this.model(vbe, vbc);
    sim.device(
      [c, b, e],
      [m.ic, m.ib, -(m.ic + m.ib)],
      [
        [b, e, vbe],
        [b, c, vbc],
      ],
      [m.dic, m.dib, [-(m.dic[0] + m.dib[0]), -(m.dic[1] + m.dib[1])]],
    );
  }
  commit(sim, v) {
    const m = this.model(v[this.b] - v[this.e], v[this.b] - v[this.c]);
    this.ic = m.ic;
    this.ib = m.ib;
  }
}

// N-channel enhancement MOSFET (square-law model). Gate capacitance and the
// body diode are separate elements added by the caller.
export class NMOS {
  constructor(d, g, s, { vth = 2, k = 4, lambda = 0.01 } = {}) {
    Object.assign(this, { d, g, s, vth, k, lambda, vgs: 0, id: 0 });
  }
  reset() {
    this.vgs = 0;
  }
  model(vgs, vds) {
    const { vth, k, lambda } = this;
    const vov = vgs - vth;
    if (vov <= 0) return [0, 0, 0];
    const cl = 1 + lambda * vds;
    if (vds < vov) {
      const base = vov * vds - (vds * vds) / 2;
      return [k * base * cl, k * vds * cl, k * (vov - vds) * cl + k * base * lambda];
    }
    return [(k / 2) * vov * vov * cl, k * vov * cl, (k / 2) * vov * vov * lambda];
  }
  stamp(sim, v) {
    // The channel is symmetric: whichever end is lower acts as the source.
    const swap = v[this.d] < v[this.s];
    const D = swap ? this.s : this.d;
    const S = swap ? this.d : this.s;
    let vgs = v[this.g] - v[S];
    if (Math.abs(vgs - this.vgs) > 0.5) {
      vgs = this.vgs + Math.sign(vgs - this.vgs) * 0.5;
      sim.limited = true;
    }
    this.vgs = vgs;
    const vds = v[D] - v[S];
    const [i, gm, gds] = this.model(vgs, vds);
    sim.device(
      [D, this.g, S],
      [i, 0, -i],
      [
        [this.g, S, vgs],
        [D, S, vds],
      ],
      [[gm, gds], [0, 0], [-gm, -gds]],
    );
    sim.conduct(D, S, GMIN);
  }
  commit(sim, v) {
    const swap = v[this.d] < v[this.s];
    const S = swap ? this.d : this.s;
    const D = swap ? this.s : this.d;
    const i = this.model(v[this.g] - v[S], v[D] - v[S])[0];
    this.id = swap ? -i : i;
  }
}

// Device presets used across the course.
export const DIODES = {
  silicon: { is: 4e-9, n: 1.8, rs: 0.05 },
  schottky: { is: 2e-6, n: 1.05, rs: 0.05 },
};

export const LEDS = {
  red: { is: 1e-18, n: 2, rs: 8, vf: 1.95, hue: "#ff5a3c", name: "Red" },
  yellow: { is: 2.5e-19, n: 2, rs: 8, vf: 2.05, hue: "#ffd23c", name: "Yellow" },
  green: { is: 3e-20, n: 2, rs: 9, vf: 2.25, hue: "#5cff7a", name: "Green" },
  blue: { is: 1e-26, n: 2, rs: 10, vf: 3.05, hue: "#4b8bff", name: "Blue" },
  white: { is: 1e-26, n: 2, rs: 10, vf: 3.05, hue: "#f4f6ff", name: "White" },
  // A 1 W white LED on a star board: about 2.85 V at 10 mA (vf), 3.1 V at 350 mA.
  power: { is: 2.2e-26, n: 2, rs: 0.3, vf: 2.85, hue: "#f4f6ff", name: "1 W white" },
};
