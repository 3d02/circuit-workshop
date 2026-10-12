import { test } from "node:test";
import assert from "node:assert/strict";
import { POSITIONS, FEATURES, ITEMS, JACKS, USES, ACCURACY, accuracy, parseReading, ghost, lozResistance, lozDcResistance, dischargeTime, burden } from "../dist/js/data/bm235.js";

test("readings parse with and without SI prefixes", () => {
  assert.equal(parseReading("12.6"), 12.6);
  assert.equal(parseReading("4.7k"), 4700);
  assert.equal(parseReading("2M"), 2e6);
  assert.equal(parseReading("38", 1e-3), 0.038);
  assert.ok(Math.abs(parseReading("100n", 1e-6) - 1e-7) < 1e-20);
  assert.ok(Math.abs(parseReading("100µ") - 1e-4) < 1e-18);
  assert.equal(parseReading("−5"), -5);
  assert.equal(parseReading("abc"), null);
});

test("accuracy: 12 V DC sits on the 60 V range at ±(0.4% + 2 d)", () => {
  const a = accuracy("dcv", 12);
  assert.equal(a.range.label, "60.00 V");
  assert.ok(Math.abs(a.err - 0.068) < 1e-9);
  assert.equal(a.lo, 11.93);
  assert.equal(a.hi, 12.07);
});

test("accuracy: auto-ranging moves up at 6000 counts", () => {
  assert.equal(accuracy("dcv", 5.999).range.label, "6.000 V");
  assert.equal(accuracy("dcv", 6.0).range.label, "60.00 V");
  assert.equal(accuracy("dcv", -12).range.label, "60.00 V");
  assert.ok(accuracy("dcv", 700).ol);
});

test("accuracy: a forced range that's too small reads OL, a bigger one loses resolution", () => {
  assert.ok(accuracy("dcv", 12, 0).ol);
  const coarse = accuracy("dcv", 1.5, 2);
  const fine = accuracy("dcv", 1.5);
  assert.ok(coarse.err > fine.err * 10);
});

test("accuracy: mains, high resistance, current and temperature use their own specs", () => {
  const mains = accuracy("acv", 230);
  assert.equal(mains.range.label, "600.0 V");
  assert.equal(mains.lo, 228);
  assert.equal(mains.hi, 232);
  assert.equal(accuracy("ohm", 45e6).pct, 5);
  assert.equal(accuracy("ohm", 25e6).pct, 0.9);
  assert.match(accuracy("dca", 0.038).range.where, /mA µA/);
  assert.match(accuracy("dca", 15).warn, /30 seconds/);
  assert.equal(accuracy("temp", 4).range.dec, 1);
  assert.equal(accuracy("temp", 180).range.dec, 0);
  assert.ok(accuracy("temp", -50).ol);
});

test("every function's example reading is measurable", () => {
  for (const fn of ACCURACY) {
    const a = accuracy(fn.id, parseReading(fn.example, fn.input[1]));
    assert.ok(a && !a.ol, fn.id);
  }
});

test("ghost voltage: convincing on 10 MΩ, a few volts in AutoV, more with a longer run", () => {
  const short = ghost(2);
  const long = ghost(30);
  assert.ok(long.highZ > short.highZ);
  assert.ok(long.highZ > 100 && long.highZ <= long.open);
  for (const g of [short, long]) assert.ok(g.lowZ > 1 && g.lowZ < 10, `LoZ reading ${g.lowZ}`);
  assert.ok(lozResistance(3) > 1e6 && lozResistance(60) < 3e3);
});

test("burden voltage: Dave's 3.3 V, 500 mA example on the mA jack", () => {
  const b = burden(3.3, 0.5, "ma");
  assert.ok(Math.abs(b.reading - 3.3 / 8.5) < 1e-9);
  assert.ok(b.drop > 0.7 && b.drop < 0.8);
  assert.equal(b.over, false);
  assert.ok(burden(3.3, 0.5, "a").error < 0.01);
  assert.equal(burden(5, 0.05, "ua").over, true);
});

test("the panel data is complete and every house job points at a real mode", () => {
  const ids = new Set(ITEMS.map((x) => x.id));
  assert.equal(ids.size, ITEMS.length, "ids are unique");
  for (const p of POSITIONS) {
    assert.ok(p.dial?.length && Number.isFinite(p.angle) && p.lcd, p.id);
    for (const j of p.leads?.red || []) assert.ok(JACKS[j], `${p.id}: unknown jack ${j}`);
  }
  for (const f of FEATURES) assert.ok(f.key && f.what, f.id);
  for (const g of USES) for (const u of g.items) for (const m of u.modes) assert.ok(ids.has(m), `${u.title}: unknown mode ${m}`);
});

test("AutoV discharge: matches the manual's impedances, quick for small caps, slow for big ones", () => {
  assert.equal(lozDcResistance(5), 10e6);
  assert.ok(Math.abs(lozDcResistance(50) - 2.6e3) < 1);
  assert.ok(Math.abs(lozDcResistance(300) - 100e3) < 1);
  // Above 50 V the meter settles near a watt: V² ÷ R.
  for (const v of [100, 300, 600]) assert.ok(v ** 2 / lozDcResistance(v) > 0.5 && v ** 2 / lozDcResistance(v) < 2, `${v} V`);
  const motor = dischargeTime(4e-6, 325);
  const bulk = dischargeTime(470e-6, 325);
  assert.ok(motor < 1, `4 µF: ${motor} s`);
  assert.ok(bulk > 15 && bulk < 60, `470 µF: ${bulk} s`);
  assert.ok(Math.abs(dischargeTime(940e-6, 325) - 2 * bulk) < 1e-6, "time scales with capacitance");
  assert.equal(dischargeTime(470e-6, 5), 0);
});
