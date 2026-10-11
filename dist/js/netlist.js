// Turns a drawn circuit (parts on a grid + wire polylines) into a simulation,
// and maps simulation results back onto the drawing: node voltages for every
// wire, and the current in every wire segment (so dots can flow along them).
// No DOM here, so it can run under Node for tests.

import { Sim, Resistor } from "./sim.js";
import { COMPONENTS, preparePart } from "./components.js";

export const pointKey = (x, y) => `${x},${y}`;
export const parsePath = (s) =>
  s
    .trim()
    .split(/\s+/)
    .map((t) => t.split(",").map(Number));
const edgeKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

export class Netlist {
  constructor(spec) {
    this.spec = spec;
    this.parts = spec.parts.map((p, i) => preparePart({ ...p }, i));
    this.byId = new Map(this.parts.map((p) => [p.id, p]));
    this.cuts = new Set(spec.cuts || []);
    this.faults = structuredClone(spec.faults || {});
    this.hiddenCuts = new Set((this.faults.cuts || []).map((c) => normalizeCut(c)));
    this.names = new Map(Object.entries(spec.names || {}).map(([n, [x, y]]) => [n, pointKey(x, y)]));
    for (const p of this.parts) if (p.type === "label") this.names.set(p.text, pointKey(...p.at));
    this.extra = null;
    this.layout();
  }

  // Points, wire segments (split wherever another point lies on them) and junctions.
  layout() {
    const points = (this.points = new Map());
    const point = ([x, y]) => {
      const k = pointKey(x, y);
      if (!points.has(k)) points.set(k, { x, y, key: k, edges: [], pins: [] });
      return points.get(k);
    };
    for (const p of this.parts) {
      const def = COMPONENTS[p.type];
      def.pins(p).forEach((pin, k) => point(pin).pins.push([p, k]));
    }
    const polylines = (this.spec.wires || []).map(parsePath);
    for (const line of polylines) line.forEach(point);
    const all = [...points.values()];
    const edges = new Map();
    for (const line of polylines) {
      for (let i = 0; i < line.length - 1; i++) {
        const [x1, y1] = line[i];
        const [x2, y2] = line[i + 1];
        const inside = all
          .filter((q) => onSegment(q, x1, y1, x2, y2))
          .sort((m, n) => Math.hypot(m.x - x1, m.y - y1) - Math.hypot(n.x - x1, n.y - y1));
        const chain = [point([x1, y1]), ...inside, point([x2, y2])];
        for (let j = 0; j < chain.length - 1; j++) {
          const a = chain[j];
          const b = chain[j + 1];
          const key = edgeKey(a.key, b.key);
          if (a === b || edges.has(key)) continue;
          const edge = { key, a: a.key, b: b.key, x1: a.x, y1: a.y, x2: b.x, y2: b.y, i: 0, off: 0 };
          edges.set(key, edge);
          a.edges.push(edge);
          b.edges.push(edge);
        }
      }
    }
    this.edges = [...edges.values()];
    this.junctions = [...points.values()].filter((p) => p.edges.length + p.pins.filter(([part]) => part.type !== "label" && part.type !== "ground").length >= 3);
  }

  isOpen(edge) {
    return this.cuts.has(edge.key) || this.hiddenCuts.has(edge.key);
  }

  // Build (or rebuild) the simulation from the current state of the parts.
  // Copy state held inside engine elements (capacitor charge, coil current) back onto the parts.
  syncAll() {
    if (this.sim) for (const p of this.parts) if (p.els) COMPONENTS[p.type].sync?.(p);
  }

  build({ sync = true } = {}) {
    const old = this.sim;
    if (sync) this.syncAll();

    const parent = new Map([...this.points.keys()].map((k) => [k, k]));
    const find = (k) => {
      while (parent.get(k) !== k) {
        parent.set(k, parent.get(parent.get(k)));
        k = parent.get(k);
      }
      return k;
    };
    for (const e of this.edges) if (!this.isOpen(e)) parent.set(find(e.a), find(e.b));

    const grounds = this.parts.filter((p) => p.type === "ground").map((p) => pointKey(...p.at));
    const battery = this.parts.find((p) => p.type === "battery" || p.type === "pulse");
    if (!grounds.length) grounds.push(battery ? pointKey(...battery.b) : this.points.keys().next().value);

    const sim = new Sim();
    const nodeOfRoot = new Map(grounds.map((k) => [find(k), 0]));
    for (const pt of this.points.values()) {
      const root = find(pt.key);
      if (!nodeOfRoot.has(root)) nodeOfRoot.set(root, sim.node());
      pt.node = nodeOfRoot.get(root);
      pt.root = root;
    }

    for (const p of this.parts) {
      const def = COMPONENTS[p.type];
      if (!def.build) continue;
      p.nodes = def.pins(p).map(([x, y]) => this.points.get(pointKey(x, y)).node);
      if (p.absent) {
        // Not fitted: build it on its own isolated nodes so it affects nothing.
        def.build(p, p.nodes.map(() => sim.node()), sim);
        continue;
      }
      const fault = this.faults.parts?.[p.id];
      p.__short = null;
      p.__swapped = false;
      if (fault?.short) {
        def.build(p, p.nodes, sim);
        p.__short = sim.add(new Resistor(p.nodes[0], p.nodes[1], 0.02));
      } else if (fault) {
        const target = Object.assign(Object.create(p), fault);
        const nodes = fault.swap ? [...p.nodes].reverse() : p.nodes;
        def.build(target, nodes, sim);
        p.els = target.els;
        p.__swapped = !!fault.swap;
      } else {
        def.build(p, p.nodes, sim);
      }
    }
    this.extra?.build?.(sim, this);

    // Carry over the Newton starting point when the topology is unchanged.
    if (old && old.size === sim.size) {
      sim.v = Float64Array.from(old.v);
      old.elements.forEach((el, i) => {
        const nu = sim.elements[i];
        if (nu && nu.constructor === el.constructor) for (const f of ["vd", "vbe", "vbc", "vgs"]) if (f in el) nu[f] = el[f];
      });
      sim.t = old.t;
    }
    this.sim = sim;

    // A spanning tree per net, so wire currents can be found from KCL.
    this.trees = [];
    const seen = new Set();
    for (const pt of this.points.values()) {
      if (seen.has(pt.key)) continue;
      const order = [];
      const via = new Map([[pt.key, null]]);
      seen.add(pt.key);
      const queue = [pt];
      while (queue.length) {
        const u = queue.shift();
        order.push(u);
        for (const e of u.edges) {
          if (this.isOpen(e)) continue;
          const w = this.points.get(e.a === u.key ? e.b : e.a);
          if (seen.has(w.key)) continue;
          seen.add(w.key);
          via.set(w.key, { edge: e, parent: u.key });
          queue.push(w);
        }
      }
      this.trees.push({ order, via });
    }
    return sim;
  }

  // Current in every wire segment, positive in the direction a → b.
  wireCurrents() {
    const inj = new Map();
    const add = (k, i) => inj.set(k, (inj.get(k) || 0) + i);
    for (const p of this.parts) {
      const def = COMPONENTS[p.type];
      if (!def.terminals || !p.els) continue;
      const currents = def.terminals(p, this.sim);
      const pins = def.pins(p);
      // A fault-swapped part is wired backwards relative to its drawing.
      currents.forEach((i, k) => add(pointKey(...pins[p.__swapped ? pins.length - 1 - k : k]), -i));
      if (p.__short) {
        const i = p.__short.current(this.sim.v);
        add(pointKey(...pins[0]), -i);
        add(pointKey(...pins[1]), i);
      }
    }
    for (const [k, i] of this.extra?.injections?.(this) || []) add(k, i);
    for (const e of this.edges) e.i = 0;
    for (const { order, via } of this.trees) {
      for (let j = order.length - 1; j > 0; j--) {
        const u = order[j];
        const { edge, parent } = via.get(u.key);
        const flow = inj.get(u.key) || 0; // net current leaving u toward its parent
        edge.i = edge.a === u.key ? flow : -flow;
        add(parent, flow);
      }
    }
  }

  // Run the circuit forward and let parts react (heat up, burn out...).
  advance(dt, maxDt, onStep) {
    const sim = this.sim;
    const steps = Math.min(400, Math.max(1, Math.ceil(dt / maxDt - 1e-9)));
    const h = dt / steps;
    for (let s = 0; s < steps; s++) {
      sim.step(h);
      onStep?.();
    }
    const alerts = [];
    let rebuild = false;
    for (const p of this.parts) {
      const def = COMPONENTS[p.type];
      if (!def.tick || !p.els) continue;
      const result = def.tick(p, sim, dt, this.power(p));
      if (result) {
        alerts.push({ ...result, part: p });
        if (result.burnt) rebuild = true;
      }
    }
    if (rebuild) this.build();
    return alerts;
  }

  power(p) {
    const def = COMPONENTS[p.type];
    if (!def.across || !def.through || !p.els) return 0;
    if (def.delivered) return def.across(p, this.sim.v) * def.delivered(p, this.sim);
    return def.across(p, this.sim.v) * def.through(p, this.sim);
  }

  nodeAt(nameOrPoint) {
    const k = Array.isArray(nameOrPoint) ? pointKey(...nameOrPoint) : this.names.get(nameOrPoint);
    const pt = this.points.get(k);
    if (!pt) throw new Error(`No point named ${nameOrPoint}`);
    return pt.node;
  }

  // The read-only view of the circuit that lessons, readouts and goals use.
  query() {
    const net = this;
    const part = (id) => {
      const p = net.byId.get(id);
      if (!p) throw new Error(`No part ${id}`);
      return p;
    };
    return {
      get t() {
        return net.sim.t;
      },
      v: (name) => net.sim.v[net.nodeAt(name)],
      vBetween: (a, b) => net.sim.v[net.nodeAt(a)] - net.sim.v[net.nodeAt(b)],
      across: (id) => COMPONENTS[part(id).type].across(part(id), net.sim.v),
      i: (id) => {
        const p = part(id);
        const def = COMPONENTS[p.type];
        return def.delivered ? def.delivered(p, net.sim) : def.through(p, net.sim);
      },
      power: (id) => net.power(part(id)),
      pinV: (id, k) => net.sim.v[part(id).nodes[k]],
      part,
      meter: net.extra?.reading,
    };
  }
}

function onSegment(q, x1, y1, x2, y2) {
  if ((q.x === x1 && q.y === y1) || (q.x === x2 && q.y === y2)) return false;
  if (x1 === x2) return q.x === x1 && q.y > Math.min(y1, y2) && q.y < Math.max(y1, y2);
  if (y1 === y2) return q.y === y1 && q.x > Math.min(x1, x2) && q.x < Math.max(x1, x2);
  return false;
}

// Accepts "x,y x,y" (a wire segment) and returns its edge key.
export function normalizeCut(c) {
  const [[x1, y1], [x2, y2]] = parsePath(c);
  return edgeKey(pointKey(x1, y1), pointKey(x2, y2));
}
