import { test } from "node:test";
import assert from "node:assert/strict";
import { CHAPTERS } from "../dist/js/chapters/index.js";
import { Netlist } from "../dist/js/netlist.js";
import { JOBS } from "../dist/js/repair.js";

function run(spec, seconds = 2) {
  const net = new Netlist(spec);
  net.build();
  const steps = Math.round(seconds * 60);
  for (let i = 0; i < steps; i++) {
    net.advance((1 / 60) * (spec.timeScale ?? 1), spec.maxDt ?? 1 / 240);
    net.wireCurrents();
  }
  return net;
}

const fakeFig = (net) => ({ net, goalState: new Map(), hits: new Set(), peak: 0, part: (id) => net.byId.get(id), query: () => net.query() });

for (const chapter of CHAPTERS) {
  for (const block of chapter.blocks.filter((b) => b.type === "figure")) {
    test(`${chapter.id} › ${block.id}: simulates cleanly`, () => {
      const net = run(block.spec);
      assert.ok(net.sim.v.every(Number.isFinite), "node voltages are finite");
      assert.ok(net.sim.converged, "Newton converged");
      for (const e of net.edges) assert.ok(Number.isFinite(e.i), `wire current finite on ${e.key}`);
      const q = net.query();
      const fig = fakeFig(net);
      for (const r of block.spec.readouts || []) r.value(q, fig);
      for (const g of block.spec.goals || []) g.test(q, fig);
      block.spec.status?.(q, fig);
    });
  }
}

test("every task id in the course is unique", () => {
  const ids = [];
  for (const c of CHAPTERS)
    for (const b of c.blocks) {
      if (b.type === "figure") ids.push(...(b.spec.goals || []).map((g) => g.id));
      if (b.type === "predict" || b.type === "quiz") ids.push(b.id);
      if (b.type === "custom" && b.tasks) ids.push(...b.tasks);
    }
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  assert.deepEqual(dupes, []);
});

test("predictions and quizzes have a valid answer", () => {
  for (const c of CHAPTERS)
    for (const b of c.blocks) {
      if (b.type === "predict") assert.ok(b.answer >= 0 && b.answer < b.choices.length, b.id);
      if (b.type === "quiz") for (const q of b.questions) assert.ok(q.answer >= 0 && q.answer < q.choices.length, `${b.id}: ${q.q}`);
    }
});

test("every chapter reference points at a real chapter", () => {
  const ids = new Set(CHAPTERS.map((c) => c.id));
  const text = JSON.stringify(CHAPTERS.map((c) => c.blocks), (k, v) => (typeof v === "function" ? undefined : v));
  for (const [, , id] of text.matchAll(/\{\{(ch|Ch):([\w-]+)\}\}/g)) assert.ok(ids.has(id), `unknown chapter reference: ${id}`);
});

test("every named point sits on the circuit", () => {
  const specs = [...CHAPTERS.flatMap((c) => c.blocks.filter((b) => b.type === "figure").map((b) => [b.id, b.spec])), ...JOBS.map((j) => [j.id, j.spec])];
  for (const [id, spec] of specs) {
    const net = new Netlist(spec);
    for (const [name, key] of net.names) assert.ok(net.points.has(key), `${id}: "${name}" at ${key} is not on any wire or pin`);
  }
});

for (const job of JOBS) {
  test(`repair job ${job.id}: broken before the fix, working after`, () => {
    const broken = run(job.spec, 1);
    assert.equal(job.works(broken.query()), false, "the fault should stop it working");
    const fixed = { ...job.spec, faults: { parts: Object.fromEntries(Object.entries(job.spec.faults.parts).filter(([id]) => id !== job.culprit)) } };
    const net = run(fixed, 1);
    assert.equal(job.works(net.query()), true, "replacing the culprit should fix it");
  });
}

test("the LED chapter's resistor challenge is solvable with a standard value", () => {
  const spec = CHAPTERS.find((c) => c.id === "leds").blocks.find((b) => b.id === "pick").spec;
  for (const [color, goal] of [
    ["red", "pick-red"],
    ["blue", "pick-blue"],
  ]) {
    const solvable = [100, 150, 220, 330, 470, 560, 680, 820, 1000, 1500, 2200].some((r) => {
      const s = { ...spec, parts: spec.parts.map((p) => (p.id === "R1" ? { ...p, r } : p.id === "D1" ? { ...p, color } : p)) };
      const net = run(s, 0.2);
      return s.goals.find((g) => g.id === goal).test(net.query());
    });
    assert.ok(solvable, color);
  }
});
