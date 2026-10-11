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
  minutes: 30,
  goals: [
    "Switch a load with an NPN transistor and choose its base resistor",
    "Tell “partly on” from “fully on” (saturated)",
    "Drive a MOSFET, and explain why its gate needs a pull-down resistor",
    "Protect a transistor from the voltage spike a coil makes",
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
      type: "note",
      kind: "deeper",
      title: "Why does the base need a resistor at all?",
      html: `<p>From base to emitter, a transistor behaves like a diode: about 0.7 V, then a steep curve. Connect the base straight to a supply and it's the LED-without-a-resistor problem all over again. The base resistor sets the base current: (9 V − 0.7 V) ÷ R.</p>`,
    },
    { type: "h2", text: "MOSFETs: switched by voltage" },
    `<p>A <strong>MOSFET</strong> does the same job differently. Its control leg, the <strong>gate</strong>, is insulated from everything else: it's essentially one plate of a tiny capacitor. Charge the gate to a few volts above the <strong>source</strong> and the path from <strong>drain</strong> to source turns on, with very low resistance. Once the gate is charged, it takes no current at all to keep it on. MOSFETs switch motors, lights and power supplies everywhere.</p>`,
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
    { type: "h2", text: "Coils kick back" },
    `<p>Motors, relays and solenoids are all coils of wire, and coils have a quirk: their current doesn't like to change suddenly. Switch a coil off and it tries to keep the current going for a moment, by generating whatever voltage it takes. This figure runs in slow motion (500×) so you can see it, with a scope on the MOSFET's drain.</p>`,
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
