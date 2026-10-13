import { scope } from "../plots.js";
import { series, si } from "../format.js";

// Remembers the highest drain voltage since the gate was last switched.
function peakHold(fig) {
  const el = document.createElement("div");
  el.className = "peak-hold";
  el.innerHTML = `<span>Highest drain voltage since you last flipped the switch</span><strong>0.0 V</strong>`;
  fig.peak = 0;
  fig.on((t, d) => {
    if (t === "change" && d?.id === "S1") {
      fig.peak = 0;
      fig.switchedOffWithDiode = fig.part("S1").to === "b" && !fig.part("D1").absent;
    }
    if (t === "reset") fig.peak = 0;
  });
  return {
    el,
    where: "side",
    sample(q) {
      fig.peak = Math.max(fig.peak, q.pinV("Q1", 0));
    },
    frame(q, dt, slow) {
      if (!slow) return;
      el.querySelector("strong").textContent = `${fig.peak.toFixed(1)} V`;
      el.classList.toggle("danger", fig.peak > 20);
    },
  };
}

export default {
  id: "transistors",
  title: "Transistors: a small signal controls a big one",
  lede: "A transistor is a switch with no moving parts, flipped by a tiny current or voltage. It's how a microcontroller pin that can only supply a few milliamps can run a motor that needs an amp.",
  minutes: 45,
  goals: [
    "Switch a load with an NPN transistor and choose its base resistor",
    "Work out how much heat a transistor makes, on, off and in between",
    "Tell “partly on” from “fully on” (saturated)",
    "Drive a MOSFET, and explain why its gate needs a pull-down resistor",
    "Protect a transistor from the voltage spike a coil makes",
    "Explain how two transistors hold an LED's current steady: the heart of the flashlight",
    "Measure a real transistor's gain with your meter",
  ],
  blocks: [
    `<p>A <strong>bipolar transistor</strong> (BJT) has three legs: the <strong>collector</strong>, the <strong>base</strong> and the <strong>emitter</strong>. A small current into the base lets a much bigger current flow from collector to emitter. In a typical small transistor the big current can be around a hundred times the small one; that ratio is its <em>gain</em>, written β.</p>
     <p>Below, an NPN transistor switches an LED. The control switch feeds a little current into the base through a resistor. Watch the dots: the base current crawls, the collector current races.</p>`,
    {
      type: "figure",
      id: "bjt",
      spec: {
        title: "A transistor switching an LED",
        iScale: 0.012,
        parts: [
          { id: "B1", type: "battery", a: [1, 3], b: [1, 5], v: 9, r: 0.5, labelSide: "left" },
          { id: "S1", type: "switch", a: [3, 1], b: [3, 3], name: "Control switch", label: "control", labelSide: "left" },
          { id: "RB", type: "resistor", a: [4, 5], b: [6, 5], r: 4700, label: (p) => `base ${si(p.r, "Ω")}`, labelSide: "below" },
          { id: "R2", type: "resistor", a: [8, 0], b: [8, 2], r: 470, label: "470 Ω" },
          { id: "D1", type: "led", a: [8, 2], b: [8, 4], color: "red", label: false },
          { id: "Q1", type: "npn", at: [7, 5], bf: 100 },
        ],
        wires: ["1,3 1,0 3,0 8,0", "3,0 3,1", "3,3 3,5 4,5", "6,5 7,5", "8,6 8,7 1,7 1,5"],
        controls: [
          { type: "toggle", label: "Control switch on", part: "S1", prop: "closed" },
          { label: "Base resistor", part: "RB", prop: "r", values: series(1000, 1e6), unit: "Ω" },
        ],
        readouts: [
          { label: "Base current", value: (q) => q.part("Q1").els[0].ib, unit: "A" },
          { label: "Collector current", value: (q) => q.part("Q1").els[0].ic, unit: "A" },
          { label: "Gain (Ic / Ib)", value: (q) => q.part("Q1").els[0].ic / q.part("Q1").els[0].ib, format: (v) => (Number.isFinite(v) && v > 0 ? `${v.toFixed(0)}×` : "–") },
          { label: "Collector–emitter", value: (q) => q.across("Q1"), unit: "V" },
        ],
        status: (q) => {
          const { ib } = q.part("Q1").els[0];
          const vce = q.across("Q1");
          if (ib < 1e-7) return "Off: no base current, so no collector current. The LED is dark.";
          if (vce < 0.3) return { text: "Saturated (fully on): the transistor is as on as it can get. The LED and its resistor now limit the current.", level: "good" };
          return { text: "Active (partly on): the collector current is about β × the base current, but that's not enough to turn it fully on.", level: "warn" };
        },
        goals: [
          { id: "bjt-on", text: "Turn the LED on with the control switch", test: (q) => q.i("D1") > 0.005 },
          { id: "bjt-sat", text: "Find the biggest base resistor that still turns the transistor fully on (saturated)", test: (q) => q.part("S1").closed && q.across("Q1") < 0.3 && q.part("RB").r >= 47000 },
          { id: "bjt-dim", text: "Pick a base resistor that only turns it partly on (a dimmer LED)", test: (q) => q.part("S1").closed && q.across("Q1") > 1 && q.i("D1") > 0.001 },
        ],
      },
    },
    {
      type: "predict",
      id: "bjt-gain",
      figure: "bjt",
      q: "The LED and its resistor allow about 14 mA. The transistor's gain is about 100. What's the smallest base current that can turn it fully on?",
      choices: ["14 mA", "1.4 mA", "0.14 mA"],
      answer: 2,
      why: ["That's the collector current. The base only needs a fraction of it.", "That would work, with plenty to spare, but it's ten times more than the minimum."],
      explain: `<p>14 mA ÷ 100 = 0.14 mA. Any less and the transistor can't deliver the full 14 mA: it's only partly on, and the LED is dimmer. In practice designers give the base 2–5 times the minimum, because gain varies a lot between transistors and with temperature. Too much is harmless; too little is a dim, hot transistor.</p>`,
    },
    {
      type: "formula",
      id: "beta",
      name: "Transistor gain",
      eq: "I<sub>C</sub> = β × I<sub>B</sub>",
      vars: [
        ["I<sub>C</sub>", "collector current", "amperes, A"],
        ["β", "the current gain, also written h<sub>FE</sub>: typically 100–400, and it varies a lot", "no unit"],
        ["I<sub>B</sub>", "base current", "amperes, A"],
      ],
      why: `<p>Electrons injected into the very thin base region mostly sweep straight across into the collector; only a small fraction drop into holes in the base. That ratio is fixed by how the transistor is made, so the collector current is a multiple of the base current, as long as the circuit lets it flow.</p>`,
      use: `<p>Only in the <em>active</em> region, when the transistor is partly on. Once the load limits the current (saturation), I<sub>C</sub> is set by the load, not by β × I<sub>B</sub>. As a switch, you deliberately give it more base current than β says it needs.</p>`,
      example: `<p>A BC547 with β = 200 and 50 µA into its base, in the active region:</p>
                <span class="calc">I<sub>C</sub> = 200 × 0.00005 = 10 mA</span>`,
    },
    {
      type: "formula",
      id: "base-resistor",
      name: "Choosing the base resistor",
      eq: "R<sub>B</sub> = (V<sub>drive</sub> − 0.7) ÷ I<sub>B</sub>",
      alt: ["with I<sub>B</sub> = 2 to 5 × I<sub>C</sub> ÷ β<sub>min</sub>"],
      vars: [
        ["R<sub>B</sub>", "the base resistor", "ohms, Ω"],
        ["V<sub>drive</sub>", "the voltage driving it: a switch, or a microcontroller pin", "volts, V"],
        ["0.7", "the base–emitter junction's forward voltage", "volts, V"],
        ["I<sub>B</sub>", "the base current you choose", "amperes, A"],
        ["β<sub>min</sub>", "the smallest gain in the datasheet", "no unit"],
      ],
      why: `<p>The base–emitter junction is a diode, so it takes about 0.7 V and the resistor takes the rest: Ohm's law does the rest. The 2–5× margin covers the spread in β between parts and with temperature.</p>`,
      use: `<p>Every time a microcontroller pin or a small signal switches something bigger: a relay, a motor, a strip of LEDs.</p>`,
      example: `<p>Switching 100 mA from a 5 V pin, with β<sub>min</sub> = 100 and a 3× margin:</p>
                <span class="calc">I<sub>B</sub> = 3 × 0.1 ÷ 100 = 3 mA   R<sub>B</sub> = (5 − 0.7) ÷ 0.003 = 1.4 kΩ</span>
                <p>Pick 1.2 kΩ (a little more current is safe).</p>`,
    },
    {
      type: "formula",
      id: "transistor-heat",
      name: "Heat in a transistor",
      eq: "P = V<sub>CE</sub> × I<sub>C</sub>",
      alt: ["MOSFET: P = V<sub>DS</sub> × I<sub>D</sub>", "fully on: P = I<sub>D</sub>² × R<sub>DS(on)</sub>"],
      vars: [
        ["P", "power turned into heat in the transistor", "watts, W"],
        ["V<sub>CE</sub>", "voltage from collector to emitter (V<sub>DS</sub>, drain to source, for a MOSFET)", "volts, V"],
        ["I<sub>C</sub>", "current through it", "amperes, A"],
      ],
      why: `<p>It's P = V × I from {{ch:resistance}}, for the transistor. Off, there's voltage but no current: no heat. Fully on, there's current but almost no voltage: little heat. Partly on, there's both, and that's when transistors cook.</p>`,
      use: `<p>Why switches should be fully on or fully off, and how hot the flashlight's regulator transistor gets, which by design is partly on all the time.</p>`,
      example: `<p>A saturated BC547 carrying 14 mA with 0.1 V across it: 0.0014 W. The same transistor partly on, with 4 V across it: 0.056 W, forty times more.</p>`,
    },
    {
      type: "note",
      kind: "deeper",
      title: "Why does the base need a resistor at all?",
      html: `<p>From base to emitter, a transistor behaves like a diode: about 0.7 V, then a steep curve. Connect the base straight to a supply and it's the LED-without-a-resistor problem all over again. The base resistor sets the base current: (9 V − 0.7 V) ÷ R.</p>`,
    },
    { type: "h2", text: "MOSFETs: switched by voltage" },
    `<p>A <strong>MOSFET</strong> does the same job differently. Its control leg, the <strong>gate</strong>, is insulated from everything else: it's essentially one plate of a tiny capacitor. Charge the gate to a few volts above the <strong>source</strong> and the path from <strong>drain</strong> to source turns on, with very low resistance. Once the gate is charged, it takes no current at all to keep it on. MOSFETs switch motors, lights and power supplies everywhere.</p>`,
    `<p>Here's how. Raise the gate voltage below and watch the silicon under it.</p>`,
    { type: "scene", scene: "mosfet3d", tasks: ["mos3d-channel", "mos3d-th"] },
    `<p>The gate and the silicon under it are the two plates of a capacitor, with the oxide as the insulator ({{ch:capacitors}}). Positive charge on the gate pulls negative charge to the other side of the oxide: first it pushes the holes away, then, above the <strong>[[threshold voltage]]</strong>, it gathers enough free electrons to make a thin n-type <em>channel</em> joining the source and drain. More gate voltage, more electrons, lower resistance. Fully on, a good MOSFET's resistance, its <strong>[[R_DS(on)]]</strong>, can be a few hundredths of an ohm.</p>`,
    {
      type: "predict",
      id: "mos-float",
      figure: "mosfet",
      q: "The motor is running. Now you unplug the gate wire. What does the motor do?",
      choices: ["Stops straight away", "Keeps running", "Speeds up"],
      answer: 1,
      why: ["That's what most people expect, and it's why this catches out so many projects.", "", "Nothing's adding energy. The gate just holds its charge."],
      explain: `<p>The gate is a capacitor, and with nothing connected to it there's no path for its charge to leave. So it stays charged, and the MOSFET stays on. In real life the charge leaks and drifts unpredictably, so a disconnected (<em>floating</em>) gate can turn on, off or half-on at random, especially if you touch it.</p>
                <p>The fix is a <strong>pull-down resistor</strong> from gate to source: a gentle path that drains the gate whenever nothing is actively driving it. Fit one below and try again.</p>`,
      reveal: (fig) => fig.set("S2", "closed", false),
      revealLabel: "Unplug the gate wire",
    },
    {
      type: "figure",
      id: "mosfet",
      spec: {
        title: "A MOSFET driving a motor",
        iScale: 0.9,
        parts: [
          { id: "B1", type: "battery", a: [1, 3], b: [1, 5], v: 9, r: 0.2, labelSide: "left" },
          { id: "M1", type: "motor", a: [10, 1], b: [10, 3], r: 10, l: 0.001, labelSide: "left" },
          { id: "D1", type: "diode", a: [12, 3], b: [12, 1], kind: "silicon", label: "diode", labelSide: "right" },
          { id: "Q1", type: "nmos", at: [9, 5], label: false },
          { id: "S1", type: "spdt", c: [5, 5], a: [4, 4], b: [4, 6], to: "a", name: "Driver switch", names: { a: "HIGH", b: "LOW" } },
          { id: "S2", type: "switch", a: [6, 5], b: [8, 5], closed: true, name: "Gate wire", label: "gate wire", labelSide: "above" },
          { id: "R3", type: "resistor", a: [8.5, 5], b: [8.5, 7], r: 100000, absent: true, label: "100 kΩ pull-down", labelSide: "left" },
          { type: "text", at: [3.6, 3.75], text: "HIGH", cls: "annotation small", anchor: "end" },
          { type: "text", at: [3.6, 6.55], text: "LOW", cls: "annotation small", anchor: "end" },
        ],
        wires: ["1,3 1,0 4,0 10,0 12,0 12,1", "10,0 10,1", "10,3 10,4", "10,3 12,3", "4,0 4,4", "4,6 4,7", "5,5 6,5", "8,5 9,5", "10,6 10,7 8.5,7 4,7 1,7 1,5"],
        controls: [
          { type: "toggle", label: "Gate wire connected", part: "S2", prop: "closed" },
          { type: "toggle", label: "Fit the 100 kΩ pull-down resistor", part: "R3", prop: "absent", on: false, off: true },
        ],
        readouts: [
          { label: "Gate voltage", value: (q) => q.pinV("Q1", 1), unit: "V" },
          { label: "Motor current", value: (q) => q.i("M1"), unit: "A" },
        ],
        status: (q) => {
          const floating = !q.part("S2").closed;
          const vg = q.pinV("Q1", 1);
          if (floating && q.part("R3").absent) return { text: `Floating gate: nothing is connected to it, but it still holds ${vg.toFixed(1)} V of charge, so the MOSFET is ${vg > 3 ? "still on" : "off"}.`, level: "warn" };
          if (floating) return "Gate wire unplugged, but the pull-down drains the gate to 0 V: the motor is safely off.";
          return vg > 3 ? "Driver HIGH: the gate is charged and the MOSFET is fully on." : "Driver LOW: the gate is at 0 V and the MOSFET is off.";
        },
        goals: [
          { id: "mos-pulldown", text: "Make the motor stop by itself when the gate wire is unplugged", test: (q) => !q.part("S2").closed && !q.part("R3").absent && q.i("M1") < 0.01 },
          { id: "mos-again", text: "Then plug the gate wire back in and run the motor again", test: (q, fig) => fig.goalState.get("mos-pulldown") === "done" && q.i("M1") > 0.5 },
        ],
      },
    },
    `<p>Two more things to notice. The pull-down is 100 kΩ, so it barely loads the driver: it only matters when nothing else is connected. And a MOSFET's gate needs a high enough voltage to turn <em>fully</em> on. If you drive one from a 3.3 V or 5 V microcontroller pin, choose a <strong>logic-level</strong> MOSFET whose datasheet promises low resistance at that voltage.</p>`,
    { type: "h2", text: "A current regulator: the heart of the flashlight" },
    `<p>An LED wants a steady current, but a battery's voltage falls as it runs down ({{ch:energy}}). A series resistor gives a current that falls with it. Two transistors can do much better: they hold the current steady from a fresh battery almost to a flat one.</p>
     <p>Below, a MOSFET passes the LED's current through a small <strong>sense resistor</strong>. A 100 kΩ resistor pulls the MOSFET's gate up, turning it on. As the current rises, so does the voltage across the sense resistor, and that voltage is also across the NPN transistor's base and emitter. At about 0.6 V the NPN starts to conduct, and pulls the gate down: the MOSFET turns down until the sense voltage sits right at 0.6 V. The current is held at <strong>0.6 V ÷ R<sub>sense</sub></strong>, whatever the battery does.</p>
     <p><strong>Turn the battery voltage up and down</strong>, and watch the LED current.</p>`,
    {
      type: "figure",
      id: "regulator",
      spec: {
        title: "A two-transistor current regulator",
        iScale: 0.35,
        parts: [
          { id: "B1", type: "battery", a: [1, 3], b: [1, 5], v: 4.8, r: 0.12, label: (p) => `${p.v.toFixed(1)} V`, labelSide: "left" },
          { type: "ground", at: [1, 6] },
          { id: "D1", type: "led", a: [8, 1], b: [8, 3], color: "power", rated: 0.35, imax: 0.6, labelSide: "right" },
          { id: "Q1", type: "nmos", at: [7, 4], vth: 1.6, k: 8, label: "MOSFET" },
          { id: "RG", type: "resistor", a: [4, 1], b: [4, 3], r: 100000, label: "100 kΩ", labelSide: "left" },
          { id: "Q2", type: "npn", at: [6.5, 7], mirror: true, label: "NPN" },
          { id: "RS", type: "resistor", a: [8, 7], b: [8, 9], r: 1.8, label: (p) => `sense ${p.r} Ω`, labelSide: "right" },
          { type: "ground", at: [8, 9] },
          { type: "ground", at: [5.5, 9] },
        ],
        wires: ["1,3 1,0 4,0 8,0 8,1", "1,5 1,6", "4,0 4,1", "4,3 4,4 5.5,4 7,4", "5.5,6 5.5,4", "8,5 8,7", "6.5,7 8,7", "5.5,8 5.5,9"],
        view: [-1.6, -1.2, 13.6, 11.4],
        controls: [
          { label: "Battery voltage", part: "B1", prop: "v", min: 3, max: 6.5, step: 0.1, unit: "V" },
          { type: "select", label: "Sense resistor", part: "RS", prop: "r", options: [[1.2, "1.2 Ω"], [1.5, "1.5 Ω"], [1.8, "1.8 Ω"], [2.2, "2.2 Ω"], [2.7, "2.7 Ω"]] },
        ],
        readouts: [
          { label: "LED current", value: (q) => q.i("D1"), unit: "A" },
          { label: "Across the sense resistor", value: (q) => q.across("RS"), unit: "V" },
          { label: "Across the MOSFET", value: (q) => q.across("Q1"), unit: "V" },
          { label: "MOSFET heat", value: (q) => q.across("Q1") * q.i("D1"), unit: "W" },
        ],
        status: (q) => {
          const i = q.i("D1");
          const vs = q.across("RS");
          if (vs < 0.5) return { text: `Dropout: the battery is too low to regulate. Everything is fully on and the LED gets what's left: ${si(i, "A")}.`, level: "warn" };
          return `Regulating: the NPN holds the sense voltage at ${vs.toFixed(2)} V, so the LED gets ${vs.toFixed(2)} ÷ ${q.part("RS").r} Ω ≈ ${si(i, "A")}. The MOSFET drops the spare ${q.across("Q1").toFixed(2)} V as heat.`;
        },
        goals: [
          { id: "reg-steady", text: "Sweep the battery from 4 V to 6 V: does the LED current change by more than 5%?", test: (q) => q.part("B1").v >= 6 && q.i("D1") > 0.28 && q.i("D1") < 0.34 },
          { id: "reg-dropout", text: "Find the dropout: the battery voltage where regulation gives up", test: (q) => q.part("B1").v <= 3.7 && q.across("RS") < 0.5 },
          { id: "reg-350", text: "Choose a sense resistor for 350–400 mA", test: (q) => q.i("D1") >= 0.35 && q.i("D1") <= 0.4 && q.across("RS") > 0.5 },
        ],
      },
    },
    {
      type: "formula",
      id: "regulator",
      name: "The regulated current",
      eq: "I ≈ V<sub>BE</sub> ÷ R<sub>sense</sub>",
      alt: ["dropout: V<sub>bat</sub> ≈ V<sub>f</sub> + V<sub>BE</sub> + a little", "MOSFET heat: P = (V<sub>bat</sub> − V<sub>f</sub> − V<sub>BE</sub>) × I"],
      vars: [
        ["I", "the LED current", "amperes, A"],
        ["V<sub>BE</sub>", "the NPN's base–emitter voltage when it starts to conduct: about 0.55–0.65 V", "volts, V"],
        ["R<sub>sense</sub>", "the sense resistor", "ohms, Ω"],
        ["V<sub>f</sub>", "the LED's forward voltage", "volts, V"],
      ],
      why: `<p>This is <em>negative feedback</em>: any rise in current raises the sense voltage, which turns the NPN on harder, which turns the MOSFET down, which lowers the current. The loop settles where the sense voltage equals V<sub>BE</sub>. Because V<sub>BE</sub> rises only slowly with current (the diode equation from {{ch:leds}}), the current hardly changes.</p>`,
      use: `<p>The flashlight in the final project. It's a linear regulator: simple and quiet, but it turns the spare voltage into heat, so efficiency is V<sub>f</sub> ÷ V<sub>bat</sub> ({{ch:energy}}). V<sub>BE</sub> also falls by about 2 mV per °C, so the current drifts up a few percent as things warm.</p>`,
      example: `<p>With R<sub>sense</sub> = 1.8 Ω and V<sub>BE</sub> = 0.56 V:</p>
                <span class="calc">I = 0.56 ÷ 1.8 = 0.31 A   heat at 4.8 V: (4.8 − 3.1 − 0.56) × 0.31 = 0.35 W</span>`,
    },
    { type: "h2", text: "Coils kick back" },
    `<p>Motors, relays and solenoids are all coils of wire ({{ch:coils}}), and coils have a quirk: their current doesn't like to change suddenly. Switch a coil off and it tries to keep the current going for a moment, by generating whatever voltage it takes. This figure runs in slow motion (500×) so you can see it, with a scope on the MOSFET's drain.</p>`,
    {
      type: "predict",
      id: "flyback-spike",
      figure: "flyback",
      q: "A 9 V relay coil is carrying 130 mA. You switch the MOSFET off. What's the highest voltage that appears at the drain?",
      choices: ["0 V", "9 V", "Far more than 9 V"],
      answer: 2,
      why: ["The drain is connected to the coil, which suddenly has nowhere to send its current.", "That's what you'd see after things settle, but not in the first instant."],
      explain: `<p>The coil's current has nowhere to go, so its voltage shoots up until <em>something</em> breaks down and conducts. Here it's the MOSFET itself, at about 60 V: on a 9 V circuit! Do that thousands of times and the MOSFET dies.</p>
                <p>The fix is the <strong>flyback diode</strong>: a diode across the coil, pointing “backwards” so it does nothing in normal operation. When the switch opens, it gives the coil's current a gentle loop to circulate in until it dies away. Fit it and switch off again.</p>`,
      reveal: (fig) => fig.set("S1", "to", "b"),
      revealLabel: "Switch off",
    },
    {
      type: "figure",
      id: "flyback",
      spec: {
        title: "Switching a relay coil off",
        iScale: 0.15,
        timeScale: 0.002,
        maxDt: 2e-6,
        parts: [
          { id: "B1", type: "battery", a: [1, 3], b: [1, 5], v: 9, r: 0.1, labelSide: "left" },
          { id: "R1", type: "resistor", a: [8, 0], b: [8, 2], r: 70, pmax: 5, label: "coil resistance 70 Ω", labelSide: "left" },
          { id: "L1", type: "inductor", a: [8, 2], b: [8, 4], l: 0.05, il: 9 / 70, label: "relay coil", labelSide: "left" },
          { id: "D1", type: "diode", a: [10, 4], b: [10, 0], absent: true, label: "flyback diode", labelSide: "right" },
          { id: "Q1", type: "nmos", at: [7, 6], vg: 9, label: false },
          { id: "S1", type: "spdt", c: [5, 6], a: [4, 5], b: [4, 7], to: "a", name: "Driver switch", names: { a: "ON", b: "OFF" } },
          { type: "text", at: [3.6, 4.75], text: "ON", cls: "annotation small", anchor: "end" },
          { type: "text", at: [3.6, 7.55], text: "OFF", cls: "annotation small", anchor: "end" },
        ],
        wires: ["1,3 1,0 4,0 8,0 10,0", "8,4 8,5", "8,4 10,4", "4,0 4,5", "4,7 4,8", "5,6 7,6", "8,7 8,8 4,8 1,8 1,5"],
        controls: [{ type: "toggle", label: "Fit the flyback diode", part: "D1", prop: "absent", on: false, off: true }],
        readouts: [{ label: "Coil current", value: (q) => q.i("L1"), unit: "A" }],
        status: (q, fig) => {
          if (fig.peak > 50) return { text: `Spike! The drain jumped to ${fig.peak.toFixed(0)} V on a 9 V circuit before the MOSFET broke down and let the current through.`, level: "bad" };
          if (fig.peak > 9.3 && fig.peak < 12) return { text: `The diode caught it: the drain only reached ${fig.peak.toFixed(1)} V (9 V + the diode's 0.7 V).`, level: "good" };
          return q.part("S1").to === "a" ? "Switched on: the coil is energised. Click the switch to turn it off." : "Off. Flip the switch to energise the coil again.";
        },
        goals: [{ id: "flyback-tame", text: "Fit the flyback diode, then switch the coil off without a big spike", test: (q, fig) => fig.switchedOffWithDiode && q.part("S1").to === "b" && fig.peak > 9 && fig.peak < 12, hold: 0.3 }],
        extras: [
          peakHold,
          scope({
            title: "Scope: drain voltage (slow motion)",
            window: 0.012,
            xstep: 0.002,
            trigger: true,
            y: { min: 0, max: 70, unit: "V" },
            xfmt: (t) => `${Math.round(t * 1000)} ms`,
            traces: [{ label: "drain voltage", value: (q) => q.pinV("Q1", 0) }],
          }),
        ],
      },
    },
    {
      type: "note",
      kind: "repair",
      title: "Dead transistor next to a relay or motor?",
      html: `<p>Check for a flyback diode across the coil. If it's missing, open (test it in diode mode), or fitted the wrong way round (which shorts the supply whenever the transistor turns on), you've likely found the cause, not just the casualty.</p>`,
    },
    {
      type: "bench",
      id: "bench-beta",
      title: "Measure a transistor's gain",
      intro: "Your BM235 has no transistor-testing mode, but it doesn't need one: two voltages and Ohm's law give you β.",
      setup: { dial: "V, with ⎓ showing", leads: "black in COM, red in V Ω", need: "a BC547 or 2N3904 NPN transistor, a 1 MΩ and a 1 kΩ resistor, the 9 V battery, a breadboard" },
      steps: [
        "Find the pins from the datasheet ({{ch:datasheets}}): a BC547, flat face towards you and legs down, is collector, base, emitter from left to right. A 2N3904 is the other way round: emitter, base, collector.",
        "Wire it: battery + through the 1 kΩ to the collector; battery + through the 1 MΩ to the base; emitter to battery −.",
        "Measure across the 1 MΩ base resistor, and across the 1 kΩ collector resistor.",
        "Work it out: I<sub>B</sub> = V ÷ 1,000,000 and I<sub>C</sub> = V ÷ 1,000, then β = I<sub>C</sub> ÷ I<sub>B</sub>.",
        "Measure base to emitter (red on the base): that's the junction's V<sub>BE</sub>.",
      ],
      record: [
        { label: "Across the 1 kΩ", unit: "V", min: 0.4, max: 8.5, ok: "Divide by 1,000 for the collector current in amps.", low: "Very low: check the transistor's pins, and that the emitter goes to battery −.", high: "Nearly the full battery: the transistor is saturated, so β can't be measured this way. Use a bigger base resistor (2.2 MΩ)." },
        { label: "Base–emitter voltage", unit: "V", min: 0.5, max: 0.75, ok: "A silicon junction, conducting a few microamps: just as the diode equation says.", low: "Low: check you're measuring base to emitter, not to collector.", high: "High: check the pins." },
      ],
      expect: `<p>With about 8.3 V across the 1 MΩ, the base current is 8.3 µA. A BC547B's β of 200–450 gives a collector current of 1.7–3.7 mA, so 1.7–3.7 V across the 1 kΩ. Try a second transistor of the same type: you'll likely get a noticeably different β. That spread is exactly why designs never rely on β being a particular value.</p>`,
    },
    {
      type: "problems",
      id: "trans-p",
      title: "Transistors, on paper",
      items: [
        { id: "trans-p1", level: 1, q: "<p>A transistor with β = 150 has 40 µA flowing into its base, in the active region. What is its collector current?</p>", unit: "mA", answer: 150 * 40e-6 * 1000, hints: ["I<sub>C</sub> = β × I<sub>B</sub>."], solution: "<p>I<sub>C</sub> = 150 × 0.00004 = 0.006 A = <b>6 mA</b>.</p>" },
        {
          id: "trans-p2",
          level: 2,
          q: "<p>A 3.3 V microcontroller pin must switch a 200 mA relay through an NPN with β<sub>min</sub> = 100. Using a 3× margin, what base resistor do you need?</p>",
          unit: "Ω",
          answer: (3.3 - 0.7) / ((3 * 0.2) / 100),
          tol: 0.03,
          hints: ["I<sub>B</sub> = 3 × 0.2 ÷ 100 = 6 mA.", "R<sub>B</sub> = (3.3 − 0.7) ÷ 0.006."],
          solution: "<p>I<sub>B</sub> = 6 mA, so R<sub>B</sub> = 2.6 ÷ 0.006 = <b>433 Ω</b>. Use 390 Ω. Check the pin can supply 6 mA: most can.</p>",
        },
        {
          id: "trans-p3",
          level: 2,
          q: "<p>A transistor is partly on, with 4.5 V from collector to emitter and 80 mA flowing. How much heat does it make?</p>",
          unit: "W",
          answer: 4.5 * 0.08,
          hints: ["P = V<sub>CE</sub> × I<sub>C</sub>."],
          solution: "<p>P = 4.5 × 0.08 = <b>0.36 W</b>: too much for a small TO-92 transistor like the BC547, which manages about 0.5 W at most in still air, and gets very hot doing it.</p>",
        },
        {
          id: "trans-p4",
          level: 2,
          q: "<p>A MOSFET with R<sub>DS(on)</sub> = 0.035 Ω, fully on, carries 3 A. How much heat does it make?</p>",
          unit: "W",
          answer: 9 * 0.035,
          hints: ["P = I² × R<sub>DS(on)</sub>."],
          solution: "<p>P = 9 × 0.035 = <b>0.32 W</b>. Switching 3 A with a third of a watt of loss: why MOSFETs rule power switching.</p>",
        },
        {
          id: "trans-p5",
          level: 2,
          q: "<p>In the current regulator, V<sub>BE</sub> is 0.58 V. What sense resistor gives 350 mA?</p>",
          unit: "Ω",
          answer: 0.58 / 0.35,
          hints: ["R = V<sub>BE</sub> ÷ I."],
          solution: "<p>R = 0.58 ÷ 0.35 = <b>1.66 Ω</b>. The nearest standard values are 1.5 Ω (about 390 mA) and 1.8 Ω (about 320 mA).</p>",
        },
        {
          id: "trans-p6",
          level: 3,
          q: "<p>The regulator runs a 3.1 V LED at 0.32 A from four fresh NiMH cells at 5.4 V, with 0.57 V across the sense resistor. How much heat does the MOSFET make?</p>",
          unit: "W",
          answer: (5.4 - 3.1 - 0.57) * 0.32,
          hints: ["Kirchhoff: the MOSFET takes whatever the LED and sense resistor don't.", "V<sub>DS</sub> = 5.4 − 3.1 − 0.57."],
          solution: "<p>V<sub>DS</sub> = 1.73 V, so P = 1.73 × 0.32 = <b>0.55 W</b>. The flashlight chapter works out whether that needs a heatsink.</p>",
        },
      ],
    },
    {
      type: "quiz",
      id: "trans-quiz",
      questions: [
        {
          q: "A transistor with β = 100 needs to switch 50 mA. What's the minimum base current?",
          choices: ["50 mA", "5 mA", "0.5 mA"],
          answer: 2,
          explain: "50 mA ÷ 100 = 0.5 mA. You'd design for 1–2 mA to be sure it's fully on.",
        },
        {
          q: "A transistor switch gets hot and the LED it drives is dim. The likely cause?",
          choices: ["Too much base current", "Too little base current, so it's only partly on", "The LED is too efficient"],
          answer: 1,
          explain: "Partly on means a sizeable voltage across the transistor while current flows through it, and voltage × current = heat.",
        },
        {
          q: "What does a gate pull-down resistor do?",
          choices: ["Makes the MOSFET switch faster", "Holds the gate at 0 V when nothing is driving it", "Limits the motor current"],
          answer: 1,
          explain: "It drains the gate's charge so the MOSFET is reliably off when the driver is disconnected or not yet started.",
        },
        {
          q: "Why fit a diode across a relay coil?",
          choices: ["To give the coil's current somewhere to go when it's switched off", "To make the relay click louder", "To stop current flowing through the coil"],
          answer: 0,
          explain: "Without it, the coil generates a large voltage spike that can destroy the transistor switching it.",
        },
      ],
    },
  ],
};
