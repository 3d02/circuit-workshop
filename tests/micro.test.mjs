import { test } from "node:test";
import assert from "node:assert/strict";
import { makeWire, stepWire, crossingRates, V_RANDOM, driftSpeed, raceTimes, loopProfile } from "../dist/js/micro.js";

// Average drift (as a fraction of the random speed) and heating, over several seeds.
function measure(field, temp, seconds = 25) {
  let drift = 0;
  let heat = 0;
  let n = 0;
  let net = 0;
  for (const seed of [1, 2, 3, 4]) {
    const w = makeWire({ width: 740, height: 290, seed });
    for (let t = 0; t < seconds; t += 1 / 60) {
      stepWire(w, 1 / 60, { field, temp });
      if (t > 5) {
        drift += w.electrons.reduce((a, e) => a + e.vx, 0) / w.electrons.length / V_RANDOM;
        heat += w.heatRate;
        n++;
      }
    }
    net += crossingRates(w).net;
  }
  return { drift: drift / n, heat: heat / n, net: net / 4 };
}

test("with no field the electrons move but don't drift, and nothing heats up", () => {
  const m = measure(0, 1);
  assert.ok(Math.abs(m.drift) < 0.015, `drift ${m.drift}`);
  assert.ok(Math.abs(m.heat) < 1, `heat ${m.heat}`);
});

test("a field makes electrons drift against it, in proportion (Ohm's law emerges)", () => {
  const half = measure(0.5, 1);
  const full = measure(1, 1);
  assert.ok(half.drift < -0.04, "electrons drift left, against the field");
  assert.ok(half.net < 0 && full.net < half.net, "more net crossings with a stronger field");
  const ratio = full.drift / half.drift;
  assert.ok(ratio > 1.6 && ratio < 2.4, `doubling the field should roughly double the drift, got ×${ratio.toFixed(2)}`);
  const heatRatio = full.heat / half.heat;
  assert.ok(heatRatio > 3 && heatRatio < 5.5, `heating should go up about four times, got ×${heatRatio.toFixed(2)}`);
});

test("a hotter wire has more collisions, so less drift: resistance rises with temperature", () => {
  assert.ok(measure(0.7, 2).drift > measure(0.7, 1).drift * 0.75, "hot drift should be clearly smaller in magnitude");
});

test("real-world numbers used in the chapter", () => {
  assert.ok(Math.abs(driftSpeed(0.3, 0.5) * 1000 - 0.044) < 0.002, "0.3 A in 0.5 mm² copper drifts at about 0.044 mm/s");
  const { field, electron } = raceTimes();
  assert.ok(field > 1e-9 && field < 2e-9, "the field crosses 30 cm in about 1.5 ns");
  assert.ok(electron > 1.5 * 3600 && electron < 2.5 * 3600, "an electron takes about two hours");
});

test("the loop's field: weak in the wires, strong in the lamp, all across the gap when open", () => {
  const closed = loopProfile({ closed: true });
  const wire = closed.samples.find((s) => s.kind === "wire").field;
  const lamp = closed.samples.find((s) => s.kind === "lamp").field;
  assert.ok(lamp / wire > 100);
  const drop = closed.samples.reduce((a, s) => a + s.field * 6, 0);
  assert.ok(Math.abs(drop - 9) < 1e-9, "the drops round the loop add up to the battery voltage");
  const open = loopProfile({ closed: false });
  assert.equal(open.current, 0);
  assert.ok(open.samples.filter((s) => s.kind !== "gap").every((s) => s.field === 0), "no field inside any conductor when open");
});
