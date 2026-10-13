import { test } from "node:test";
import assert from "node:assert/strict";
import { CHAPTERS } from "../dist/js/chapters/index.js";
import { chapterTasks } from "../dist/js/lesson.js";
import { check, toDisplayUnit, sig } from "../dist/js/quantity.js";
import { TERMS, findTerm } from "../dist/js/data/glossary.js";
import { discharge, cellVoltage } from "../dist/js/labs.js";

const blocks = (type) => CHAPTERS.flatMap((c) => c.blocks.filter((b) => b.type === type).map((b) => [c, b]));
const text = (v) => JSON.stringify(v, (k, x) => (typeof x === "function" ? undefined : x));

test("typed answers: units, prefixes, commas and resistor codes", () => {
  const ok = (raw, answer, unit) => assert.ok(check(raw, { answer, unit }).ok, `${raw} should equal ${answer} ${unit}`);
  ok("19.1", 19.1, "mA");
  ok("19.1 mA", 19.1, "mA");
  ok("0.0191 A", 19.1, "mA");
  ok("0,0191 A", 19.1, "mA");
  ok("1.91e-2 A", 19.1, "mA");
  ok("19100 µA", 19.1, "mA");
  ok("19.1ma", 19.1, "mA");
  ok("4k7", 4700, "Ω");
  ok("4.7k", 4700, "Ω");
  ok("4.7 kohm", 4700, "Ω");
  ok("150 min", 2.5, "h");
  ok("6.25e12", 6.25e12, "electrons");
  ok("1,200", 1200, "mAh");
  ok("300 Wh", 0.3, "kWh");
  assert.equal(check("19.1 uA", { answer: 19.1, unit: "mA" }).why, "prefix");
  assert.equal(check("9 V", { answer: 19.1, unit: "mA" }).why, "unit");
  assert.equal(check("-19.1", { answer: 19.1, unit: "mA" }).why, "sign");
  assert.equal(check("38.2", { answer: 19.1, unit: "mA" }).why, "half");
  assert.equal(check("hello", { answer: 1, unit: "V" }).why, "number");
  assert.equal(toDisplayUnit("12 m", "m").value, 12);
  assert.equal(sig(1.602e-19), "1.6 × 10⁻¹⁹");
});

test("every problem has a finite answer, a solution, and accepts its own answer", () => {
  for (const [c, b] of blocks("problems")) {
    for (const p of b.items) {
      assert.ok(Number.isFinite(p.answer), `${c.id} › ${p.id}: answer`);
      assert.ok(p.solution && p.q, `${c.id} › ${p.id}: question and solution`);
      assert.ok(check(String(p.answer), p).ok, `${c.id} › ${p.id}: its own answer`);
      assert.ok(!check(String(p.answer * 1.5), p).ok, `${c.id} › ${p.id}: a wrong answer`);
    }
  }
});

test("every trackable task id is unique across the course", () => {
  const ids = CHAPTERS.flatMap(chapterTasks);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  assert.deepEqual(dupes, []);
});

test("formula cards are complete and their ids are unique", () => {
  const ids = blocks("formula").map(([, b]) => b.id);
  assert.deepEqual(
    ids.filter((id, i) => ids.indexOf(id) !== i),
    [],
  );
  for (const [c, b] of blocks("formula")) {
    assert.ok(b.name && b.eq && b.vars?.length, `${c.id} › ${b.id}`);
    for (const v of b.vars) assert.equal(v.length, 3, `${c.id} › ${b.id}: each symbol has meaning and unit`);
  }
});

test("bench exercises have steps, and their reading ranges make sense", () => {
  for (const [c, b] of blocks("bench")) {
    assert.ok(b.title && b.steps.length >= 2, `${c.id} › ${b.id}`);
    for (const r of b.record || []) assert.ok(r.min < r.max && r.ok && r.low && r.high, `${c.id} › ${b.id}: ${r.label}`);
  }
});

test("every [[term]] in the course is in the glossary", () => {
  for (const c of CHAPTERS) {
    for (const [, shown, id] of text(c.blocks).matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)) assert.ok(findTerm(id || shown), `${c.id}: unknown term "${id || shown}"`);
  }
});

test("glossary entries point at real chapters and have unique ids", () => {
  const chapters = new Set(CHAPTERS.map((c) => c.id));
  const ids = TERMS.map((t) => t.id);
  assert.deepEqual(
    ids.filter((id, i) => ids.indexOf(id) !== i),
    [],
  );
  for (const t of TERMS) {
    assert.ok(t.def.length > 20, t.id);
    if (t.ch) assert.ok(chapters.has(t.ch), `${t.id}: unknown chapter ${t.ch}`);
  }
});

test("battery model: alkaline loses capacity at high current, NiMH holds its voltage", () => {
  const low = discharge("alkaline", 0.05);
  const high = discharge("alkaline", 1);
  assert.ok(low.runtime * 0.05 > 2.2, "about 2.5 Ah at 50 mA");
  assert.ok(high.runtime * 1 < 1.2, "well under half at 1 A");
  const nimhMid = cellVoltage("nimh", 0.5, 0.35);
  assert.ok(nimhMid > 1.18 && nimhMid < 1.3, `NiMH mid-discharge ${nimhMid}`);
  const liion = discharge("liion", 0.5);
  assert.ok(liion.wh > 9 && liion.wh < 12, `an 18650 delivers about 10–11 Wh, got ${liion.wh}`);
});
