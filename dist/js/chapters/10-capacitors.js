import { scope } from "../plots.js";
import { si } from "../format.js";

export default {
  id: "capacitors",
  title: "Capacitors: storing charge, making time",
  lede: "A capacitor is a tiny rechargeable reservoir of charge. Its voltage can't jump instantly, and that one property gives you timers, smooth power supplies and LEDs that fade out gently.",
  minutes: 40,
  goals: [
    "Explain what a capacitor stores, using Q = C × V",
    "Say what sets a capacitor's capacitance: area, gap and the insulator",
    "Watch a capacitor charge, and explain why the curve bends",
    "Predict how long charging takes, using τ = R × C",
    "Use a capacitor to keep something running for a moment",
    "Work out the energy a capacitor stores, and how long it can hold something up",
    "Measure capacitance with your meter, and time a real RC charge",
    "Handle charged capacitors safely",
  ],
  blocks: [
    `<p>A capacitor is two metal plates separated by a thin insulator. Current can't flow <em>through</em> it, but charge can pile up on one plate while the same amount leaves the other. The more charge piled up, the higher the voltage between the plates.</p>
     <p>Its size is its <strong>[[capacitance]]</strong>, in farads (F). One farad is huge; real parts are measured in microfarads (µF, millionths) or smaller.</p>`,
    {
      type: "formula",
      id: "charge-cap",
      name: "Charge on a capacitor",
      eq: "Q = C × V",
      alt: ["C = Q ÷ V", "V = Q ÷ C"],
      vars: [
        ["Q", "charge on each plate (+Q on one, −Q on the other)", "coulombs, C"],
        ["C", "capacitance", "farads, F"],
        ["V", "voltage between the plates", "volts, V"],
      ],
      why: `<p>This is what capacitance <em>means</em>: the charge stored per volt. The more charge you push onto the plates, the stronger the field between them, and the higher the voltage. One farad holds one coulomb for every volt.</p>`,
      use: `<p>Everything a capacitor does follows from it. It's also how your meter measures capacitance ({{ch:meter-inside}}): push in a known charge, watch the voltage rise, and C = Q ÷ V.</p>`,
      example: `<p>A 100 µF capacitor charged to 9 V:</p>
                <span class="calc">Q = 0.0001 × 9 = 0.0009 C = 0.9 mC</span>
                <p>That's about 5.6 × 10¹⁵ electrons moved from one plate to the other.</p>`,
    },
    `<p>Here's that happening in 3D, with real numbers for two 10 cm plates a couple of millimetres apart. <strong>Charge it</strong>, and watch where the electrons go and when the current in the wires stops.</p>`,
    { type: "scene", scene: "cap3d", tasks: ["cap3d-charge", "cap3d-gap", "cap3d-slab"] },
    {
      type: "formula",
      id: "plate-cap",
      name: "Capacitance of two plates",
      eq: "C = ε₀ × εᵣ × A ÷ d",
      vars: [
        ["C", "capacitance", "farads, F"],
        ["ε₀", "the permittivity of empty space", "8.85 × 10⁻¹² F/m"],
        ["εᵣ", "relative permittivity of the insulator: 1 for air, 2–10 for plastics and ceramics, thousands for some ceramics", "no unit"],
        ["A", "the area of the plates facing each other", "m²"],
        ["d", "the gap between them", "metres, m"],
      ],
      why: `<p>Bigger plates hold more charge at the same voltage, because the charge spreads out. A smaller gap means the same voltage makes a stronger field (E = V ÷ d, {{ch:inside}}), which holds more charge on the plates. And an insulator whose molecules line up with the field cancels part of it, so the plates can hold more charge for the same voltage.</p>`,
      use: `<p>Why real capacitors are built the way they are: an electrolytic is a long strip of foil rolled up with an insulating layer a few millionths of a millimetre thick, which is how 1000 µF fits in your fingertip. It's also why two wires running side by side have capacitance, and why ghost voltages exist.</p>`,
      example: `<p>Two 10 cm × 10 cm plates, 2 mm apart, in air:</p>
                <span class="calc">C = 8.85 × 10⁻¹² × 1 × 0.01 ÷ 0.002 = 4.4 × 10⁻¹¹ F = 44 pF</span>
                <p>Tiny: about two million of them would make 100 µF.</p>`,
    },
    {
      type: "note",
      kind: "analogy",
      title: "A picture to hold on to: filling a tank through a narrow pipe",
      html: `<p>Picture filling a water tank from below, through a narrow pipe, from a reservoir. At first the tank is empty and water rushes in. As the level rises, the water in the tank pushes back, so the flow slows down. It gets close to the reservoir's level but takes longer and longer to cover the last bit. The pipe is the resistor, the tank is the capacitor, and the water level is the voltage.</p>`,
    },
    `<p>Below, a switch connects a resistor and a capacitor either to the battery (to <strong>charge</strong>) or to ground (to <strong>discharge</strong>). <strong>Click the switch</strong> to flip it. The scope underneath draws the capacitor's voltage in real time.</p>`,
    {
      type: "figure",
      id: "rc",
      spec: {
        title: "Charge and discharge",
        iScale: 0.0012,
        maxDt: 0.002,
        parts: [
          { id: "B1", type: "battery", a: [1, 2], b: [1, 4], v: 9, r: 0.01, labelSide: "left" },
          { id: "S1", type: "spdt", c: [5, 2], a: [4, 1], b: [4, 3], to: "b", name: "Charge / discharge switch", names: { a: "charge", b: "discharge" } },
          { id: "R1", type: "resistor", a: [6, 2], b: [8, 2], r: 10000, label: (p) => si(p.r, "Ω") },
          { id: "C1", type: "cap", a: [10, 2.5], b: [10, 4.5], c: 100e-6, label: (p) => si(p.c, "F") },
          { type: "text", at: [3.6, 0.85], text: "charge", cls: "annotation small", anchor: "end" },
          { type: "text", at: [3.6, 3.45], text: "discharge", cls: "annotation small", anchor: "end" },
          { type: "ground", at: [1, 5.5] },
        ],
        wires: ["1,2 1,0 4,0 4,1", "4,3 4,5.5", "5,2 6,2", "8,2 10,2 10,2.5", "10,4.5 10,5.5 4,5.5 1,5.5 1,4"],
        controls: [
          { label: "Resistor", part: "R1", prop: "r", values: [1000, 2200, 4700, 10000, 22000, 47000], unit: "Ω" },
          { type: "select", label: "Capacitor", part: "C1", prop: "c", options: [[47e-6, "47 µF"], [100e-6, "100 µF"], [220e-6, "220 µF"], [470e-6, "470 µF"]] },
          { type: "button", label: "Empty the capacitor", run: (fig) => fig.set("C1", "vc", 0) },
        ],
        readouts: [
          { label: "Capacitor voltage", value: (q) => q.across("C1"), unit: "V" },
          { label: "Current", value: (q) => q.i("C1"), unit: "A", abs: true },
          { label: "τ = R × C", value: (q) => q.part("R1").r * q.part("C1").c, unit: "s" },
          { label: "Charged to", value: (q) => q.across("C1") / 9, format: (v) => `${Math.round(v * 100)}%` },
        ],
        status: (q) => {
          const p = q.part("S1");
          const vc = q.across("C1");
          if (p.to === "a") return vc > 8.9 ? "Practically full: the voltage has nearly reached the battery's, so almost no current flows." : "Charging: the emptier the capacitor, the more voltage across the resistor, and the faster it fills.";
          return vc > 0.1 ? "Discharging through the resistor: the capacitor itself is now the source, pushing current the other way." : "Empty. Flip the switch to charge it.";
        },
        goals: [
          { id: "rc-charge", text: "Charge the capacitor above 8.5 V", test: (q) => q.across("C1") > 8.5 },
          { id: "rc-discharge", text: "Then discharge it below 0.5 V", test: (q, fig) => fig.goalState.get("rc-charge") === "done" && q.across("C1") < 0.5 },
        ],
        extras: [
          scope({
            title: "Scope: voltage since you last flipped the switch",
            window: 8,
            trigger: true,
            markers: [1, 2, 3, 4, 5].map((n) => ({ label: `${n}τ`, at: (q) => n * q.part("R1").r * q.part("C1").c })),
            y: { min: 0, max: 10, unit: "V" },
            traces: [
              { label: "capacitor voltage", value: (q) => q.across("C1") },
              { label: "voltage across the resistor (shows the current)", value: (q) => Math.abs(q.across("R1")), color: "#ffb35c" },
            ],
          }),
        ],
      },
    },
    `<p>Watch the orange trace as you flip the switch. The current is biggest the instant you switch, while the capacitor is empty and the whole 9 V sits across the resistor. As the capacitor's voltage rises, less is left across the resistor, so less current flows, so filling slows down. That's why the curve bends.</p>`,
    { type: "h2", text: "How long does it take?" },
    `<p>The speed depends on just two things: how big the tank is (C), and how narrow the pipe is (R). Multiply them and you get the <strong>[[time constant]]</strong>, written τ (the Greek letter tau).</p>`,
    {
      type: "formula",
      id: "tau",
      name: "Time constant",
      eq: "τ = R × C",
      vars: [
        ["τ", "the time constant", "seconds, s"],
        ["R", "the resistance it charges through", "ohms, Ω"],
        ["C", "the capacitance", "farads, F"],
      ],
      why: `<p>At the start the current is V ÷ R; at that rate the capacitor would fill its C × V of charge in (C × V) ÷ (V ÷ R) = R × C seconds. It doesn't, because the current slows as it fills, but τ sets the timescale of everything. (Ohms times farads really is seconds: Ω × F = (V/A) × (C/V) = C/A = s.)</p>`,
      use: `<p>Timers, delays, debouncing a button, smoothing, and how fast any signal can change through a resistor into a capacitance.</p>`,
      example: `<p>10 kΩ and 100 µF:</p>
                <span class="calc">τ = 10,000 × 0.0001 = 1 second</span>`,
    },
    {
      type: "predict",
      id: "rc-63",
      figure: "rc",
      q: "With 10 kΩ and 100 µF, τ is 1 second. Starting empty, how full is the capacitor after 1 second of charging?",
      choices: ["Completely full", "About 63% full", "About 10% full"],
      answer: 1,
      why: ["It never quite gets completely full: each moment it fills a fraction of what's left.", "", "It fills fastest at the start, so it gets well past 10% in the first second."],
      explain: `<p>After one τ it's about <strong>63%</strong> of the way there. After 2τ, 86%; after 3τ, 95%; after 5τ, over 99%, which engineers call “full”. Discharging follows the same shape in reverse: after one τ, 37% is left. Watch the “Charged to” readout as it charges.</p>`,
      reveal: (fig) => {
        fig.set("R1", "r", 10000);
        fig.set("C1", "c", 100e-6);
        fig.set("C1", "vc", 0);
        fig.set("S1", "to", "a");
        fig.emit("clear-scope");
      },
      revealLabel: "Empty it and start charging",
    },
    {
      type: "formula",
      id: "rc-curve",
      name: "Charging and discharging",
      eq: "V = V<sub>s</sub> × (1 − e<sup>−t/τ</sup>)",
      alt: ["discharging: V = V<sub>0</sub> × e<sup>−t/τ</sup>"],
      vars: [
        ["V", "the capacitor's voltage at time t", "volts, V"],
        ["V<sub>s</sub>", "the supply it charges toward", "volts, V"],
        ["V<sub>0</sub>", "the voltage it starts discharging from", "volts, V"],
        ["e", "Euler's number, 2.718…; e<sup>−1</sup> = 0.37", ""],
        ["t", "time since the switch flipped", "seconds, s"],
      ],
      why: `<p>In each moment, the capacitor fills a fixed fraction of what's left to fill, because the current is proportional to the voltage still across the resistor. Anything that shrinks by the same fraction in each equal step of time follows an exponential. After one τ, e<sup>−1</sup> = 37% of the gap remains, so it's 63% charged; after 5τ, e<sup>−5</sup> is under 1%.</p>`,
      use: `<p>Working out exactly when a timer trips: when V crosses a threshold. Rearranged: t = −τ × ln(1 − V ÷ V<sub>s</sub>). Your calculator's <code>ln</code> key undoes e<sup>x</sup>.</p>`,
      example: `<p>How long until 10 kΩ and 100 µF charge to 6 V from 9 V?</p>
                <span class="calc">t = −1 × ln(1 − 6/9) = −ln(0.333) = 1.10 s</span>`,
    },
    {
      type: "note",
      kind: "deeper",
      title: "Where the exponential comes from (with calculus)",
      html: `<p>The capacitor's current is I = C × dV/dt (its charge changes as Q = C × V changes). The same current flows through the resistor: I = (V<sub>s</sub> − V) ÷ R. Setting them equal gives RC × dV/dt = V<sub>s</sub> − V. A rate of change proportional to the distance from the target is solved by an exponential: V = V<sub>s</sub>(1 − e<sup>−t/RC</sup>). Differentiate it and check: dV/dt = (V<sub>s</sub>/RC) e<sup>−t/RC</sup> = (V<sub>s</sub> − V)/RC. ✓</p>`,
    },
    {
      type: "predict",
      id: "rc-double",
      figure: "rc",
      q: "Swap the 100 µF capacitor for 220 µF, same resistor. How long does charging take now?",
      choices: ["Less time", "About the same", "About 2.2 times as long"],
      answer: 2,
      why: ["A bigger tank through the same pipe takes longer to fill, not less.", "τ = R × C, and C just got bigger."],
      explain: `<p>τ = 10 kΩ × 220 µF = 2.2 s. Everything happens 2.2 times more slowly. Need a 10-second delay? Pick R and C so that R × C is about right, and you've built a timer.</p>`,
      reveal: (fig) => {
        fig.set("C1", "c", 220e-6);
        fig.set("C1", "vc", 0);
        fig.set("S1", "to", "a");
        fig.emit("clear-scope");
      },
      revealLabel: "Try 220 µF",
    },
    {
      type: "formula",
      id: "cap-current",
      name: "A capacitor's current",
      eq: "I = C × ΔV ÷ Δt",
      vars: [
        ["I", "current into the capacitor", "amperes, A"],
        ["C", "capacitance", "farads, F"],
        ["ΔV ÷ Δt", "how fast its voltage is changing (Δ means “change in”)", "volts per second, V/s"],
      ],
      why: `<p>Rearrange Q = C × V for a change: ΔQ = C × ΔV. Current is charge per second, so I = ΔQ ÷ Δt = C × ΔV ÷ Δt. No change in voltage, no current, which is why a capacitor blocks steady DC.</p>`,
      use: `<p>It explains why capacitors pass AC and block DC, and the reactance from {{ch:meter-inside}}. Read backwards, it gives how fast a known current changes a capacitor's voltage: how a meter measures capacitance, and how long a capacitor can hold up a supply.</p>`,
      example: `<p>Charging 100 µF at a steady 1 mA:</p>
                <span class="calc">ΔV ÷ Δt = I ÷ C = 0.001 ÷ 0.0001 = 10 V per second</span>`,
    },
    { type: "h2", text: "Keeping the lights on" },
    `<p>A charged capacitor can act as a small, short-lived battery. Here a big capacitor sits across an LED. While the switch is closed, the battery runs the LED and keeps the capacitor topped up.</p>`,
    {
      type: "predict",
      id: "fade",
      figure: "fade",
      q: "What does the LED do when you open the switch?",
      choices: ["Goes out instantly", "Fades out over a second or so", "Stays lit forever"],
      answer: 1,
      why: ["The capacitor is still charged, and it's connected across the LED.", "", "The capacitor holds only a little energy, and the LED drains it."],
      explain: `<p>The capacitor takes over as the source, pushing its stored charge through the LED. As it empties, its voltage falls; once it drops below the LED's toll of about 2 V, the light goes out. This is exactly how power supplies smooth out bumps, and why some gadgets' lights linger for a moment after you unplug them.</p>`,
      reveal: (fig) => fig.set("S1", "closed", false),
      revealLabel: "Open the switch",
    },
    {
      type: "figure",
      id: "fade",
      spec: {
        title: "A capacitor holding up an LED",
        iScale: 0.012,
        maxDt: 0.002,
        parts: [
          { id: "B1", type: "battery", a: [1, 2], b: [1, 4], v: 9, r: 0.5, labelSide: "left" },
          { id: "S1", type: "switch", a: [3, 0], b: [5, 0], closed: true, label: "switch", labelSide: "above" },
          { id: "R1", type: "resistor", a: [6, 0], b: [8, 0], r: 47, label: "47 Ω" },
          { id: "C1", type: "cap", a: [9, 1.5], b: [9, 3.5], c: 1000e-6, vc: 8.7, label: (p) => si(p.c, "F"), labelSide: "left" },
          { id: "R2", type: "resistor", a: [12, 0], b: [12, 2], r: 470, label: "470 Ω" },
          { id: "D1", type: "led", a: [12, 2.5], b: [12, 4.5], color: "red" },
        ],
        wires: ["1,2 1,0 3,0", "5,0 6,0", "8,0 9,0 12,0", "9,0 9,1.5", "12,2 12,2.5", "12,4.5 12,5.5 9,5.5 1,5.5 1,4", "9,3.5 9,5.5"],
        controls: [
          { type: "toggle", label: "Switch closed", part: "S1", prop: "closed" },
          { type: "select", label: "Capacitor", part: "C1", prop: "c", options: [[1e-9, "none (1 nF)"], [100e-6, "100 µF"], [470e-6, "470 µF"], [1000e-6, "1000 µF"], [2200e-6, "2200 µF"]] },
        ],
        readouts: [
          { label: "Capacitor voltage", value: (q) => q.across("C1"), unit: "V" },
          { label: "LED current", value: (q) => q.i("D1"), unit: "A" },
        ],
        goals: [{ id: "fade-big", text: "Make the LED take more than two seconds to fade out (pick a bigger capacitor)", test: (q, fig) => !q.part("S1").closed && q.part("C1").c >= 2e-3 && q.i("D1") > 0.001 && (fig.offFor = (fig.offFor || 0) + 0.12) > 2, hold: 0 }],
        onSlow: (fig, q) => {
          if (q.part("S1").closed) fig.offFor = 0;
        },
      },
    },
    {
      type: "formula",
      id: "cap-energy",
      name: "Energy in a capacitor",
      eq: "E = ½ × C × V²",
      vars: [
        ["E", "energy stored", "joules, J"],
        ["C", "capacitance", "farads, F"],
        ["V", "voltage", "volts, V"],
      ],
      why: `<p>Charging takes work: each new bit of charge has to be pushed against the voltage already there, which grows from 0 to V as it fills. On average that's ½V per coulomb, and there are Q = C × V coulombs: E = ½ × V × C × V. (With calculus: E = ∫V dQ = ∫(Q/C) dQ = Q²/2C.)</p>`,
      use: `<p>Safety, and sizing. It grows with V²: a 330 µF capacitor at 9 V holds 13 mJ, harmless; the same capacitor charged to 330 V in a camera flash holds 18 J, enough to hurt badly.</p>`,
      example: `<p>1000 µF at 9 V:</p>
                <span class="calc">E = 0.5 × 0.001 × 81 = 0.04 J</span>
                <p>Compare an AA cell's 10,000 J: capacitors deliver energy fast, batteries store a lot of it.</p>`,
    },
    {
      type: "formula",
      id: "holdup",
      name: "Hold-up time",
      eq: "Δt = C × ΔV ÷ I",
      vars: [
        ["Δt", "how long the capacitor can supply the load", "seconds, s"],
        ["C", "capacitance", "farads, F"],
        ["ΔV", "how far its voltage may fall before the load stops working", "volts, V"],
        ["I", "the current the load draws", "amperes, A"],
      ],
      why: `<p>It's the capacitor's current law rearranged: a load drawing I lowers the voltage at ΔV ÷ Δt = I ÷ C.</p>`,
      use: `<p>Riding out a brief power dip, smoothing a rectified supply between peaks, and how long a light lingers after you unplug it.</p>`,
      example: `<p>2200 µF feeding a circuit that draws 10 mA, which still works down to 2 V below where it started:</p>
                <span class="calc">Δt = 0.0022 × 2 ÷ 0.01 = 0.44 s</span>`,
    },
    {
      type: "bench",
      id: "bench-caps",
      title: "Measure capacitors, then time a real charge",
      intro: "Two meter skills in one: the capacitance function, and watching a slowly changing voltage.",
      setup: { dial: "Cap ▶| for capacitance, then V ⎓", leads: "black in COM, red in V Ω", need: "a 100 µF and a 1000 µF electrolytic capacitor, a 100 kΩ resistor, the 9 V battery, a breadboard and a stopwatch (your phone)" },
      safety: "Electrolytics are polarised: the stripe marks the − leg. Put them in the right way round, and keep to their voltage rating.",
      steps: [
        "Dial on <b>Cap ▶|</b>, SELECT until a farad unit shows. Short the capacitor's legs together for a moment with a piece of wire, to empty it, then measure it: red on +, black on the striped leg. The 1000 µF takes several seconds.",
        "On the breadboard: battery + to the 100 kΩ, the 100 kΩ to the 100 µF's + leg, its − leg to battery −. Leave the battery unconnected for now. τ = 100 kΩ × 100 µF = 10 s.",
        "Dial on <b>V</b>, ⎓. Probes across the capacitor. Connect the battery and start the stopwatch. Note the voltage at 10, 20 and 30 seconds.",
        "Disconnect the battery and empty the capacitor through the 100 kΩ resistor (or a 1 kΩ for speed), checking on V that it reaches zero.",
      ],
      record: [
        { label: "The 100 µF capacitor", unit: "µF", min: 80, max: 120, ok: "Electrolytics are usually only made to ±20%, so anything from 80 to 120 µF is in spec.", low: "Below 80 µF: it may be old or dried out. That's a common fault in old power supplies.", high: "Above 120 µF: unusual but possible; check the marking." },
        { label: "Voltage after 10 s (one τ)", unit: "V", min: 4.8, max: 6.6, ok: "About 63% of your battery voltage: one time constant.", low: "Low: is the capacitor bigger than 100 µF, or the resistor bigger than 100 kΩ?", high: "High: the capacitor may be smaller than marked (±20%)." },
      ],
      expect: `<p>At 10, 20 and 30 s you should see about 63%, 86% and 95% of the battery voltage. Two real-world effects nudge it: the capacitor's ±20% tolerance shifts τ, and the meter's 10 MΩ input sits across the capacitor, though at 1% of 100 kΩ that's small. Compare your three readings with V = V<sub>s</sub>(1 − e<sup>−t/τ</sup>) on paper.</p>`,
    },
    {
      type: "problems",
      id: "cap-p",
      title: "Capacitors, on paper",
      items: [
        { id: "cap-p1", level: 1, q: "<p>A 470 µF capacitor is charged to 12 V. How much charge does it hold?</p>", unit: "mC", answer: 470e-6 * 12 * 1000, hints: ["Q = C × V, with C = 470 × 10⁻⁶ F."], solution: "<p>Q = 0.00047 × 12 = 0.00564 C = <b>5.64 mC</b>.</p>" },
        { id: "cap-p2", level: 1, q: "<p>What is the time constant of 22 kΩ and 47 µF?</p>", unit: "s", answer: 22000 * 47e-6, hints: ["τ = R × C in ohms and farads."], solution: "<p>τ = 22,000 × 0.000047 = <b>1.03 s</b>.</p>" },
        {
          id: "cap-p3",
          level: 2,
          q: "<p>A capacitor charges from empty toward 9 V with τ = 2 s. What is its voltage after 3 s?</p>",
          unit: "V",
          answer: 9 * (1 - Math.exp(-1.5)),
          hints: ["V = V<sub>s</sub>(1 − e<sup>−t/τ</sup>), with t/τ = 1.5.", "e<sup>−1.5</sup> = 0.223."],
          solution: "<p>V = 9 × (1 − e<sup>−1.5</sup>) = 9 × (1 − 0.223) = <b>6.99 V</b>.</p>",
        },
        {
          id: "cap-p4",
          level: 2,
          q: "<p>How much energy does a 1000 µF capacitor store at 25 V?</p>",
          unit: "J",
          answer: 0.5 * 1e-3 * 625,
          hints: ["E = ½ × C × V²."],
          solution: "<p>E = 0.5 × 0.001 × 625 = <b>0.31 J</b>.</p>",
        },
        {
          id: "cap-p5",
          level: 3,
          q: "<p>You want an LED to stay lit for 2 s after the power goes. It draws 5 mA, and works down to 1.5 V below the starting voltage. What capacitance do you need?</p>",
          unit: "µF",
          answer: ((0.005 * 2) / 1.5) * 1e6,
          tol: 0.03,
          hints: ["Rearrange Δt = C × ΔV ÷ I for C.", "C = I × Δt ÷ ΔV = 0.005 × 2 ÷ 1.5."],
          solution: "<p>C = 0.005 × 2 ÷ 1.5 = 0.00667 F = <b>6,670 µF</b>. In practice you'd fit 6,800 µF, or more for margin.</p>",
        },
        {
          id: "cap-p6",
          level: 3,
          q: "<p>Your meter measures capacitance by pushing in a steady 10 µA and timing the voltage. The voltage rises by 1.0 V in 0.47 s. What is the capacitance?</p>",
          unit: "µF",
          answer: ((10e-6 * 0.47) / 1.0) * 1e6,
          hints: ["C = I × Δt ÷ ΔV."],
          solution: "<p>C = 0.00001 × 0.47 ÷ 1.0 = 4.7 × 10⁻⁶ F = <b>4.7 µF</b>.</p>",
        },
        {
          id: "cap-p7",
          level: 2,
          q: "<p>Two plates of 20 cm × 20 cm, 1 mm apart, in air (εᵣ = 1). What is their capacitance?</p>",
          unit: "pF",
          answer: ((8.854e-12 * 0.04) / 0.001) * 1e12,
          hints: ["A = 0.2 × 0.2 = 0.04 m², d = 0.001 m.", "C = ε₀ × A ÷ d."],
          solution: "<p>C = 8.85 × 10⁻¹² × 0.04 ÷ 0.001 = 3.5 × 10⁻¹⁰ F = <b>354 pF</b>.</p>",
        },
      ],
    },
    {
      type: "note",
      kind: "safety",
      title: "Capacitors can bite after the power is off",
      html: `<p>Large capacitors in mains power supplies, camera flashes, microwave ovens and old TVs can hold a dangerous (even lethal) charge for minutes after unplugging. Don't open mains equipment. In your own low-voltage projects, discharge big capacitors through a resistor (never a screwdriver) and check with a meter before touching. Electrolytic capacitors are also polarised: fitted backwards, they can overheat and burst.</p>`,
    },
    {
      type: "quiz",
      id: "cap-quiz",
      questions: [
        {
          q: "When does the most current flow into a capacitor being charged through a resistor?",
          choices: ["At the very start, when it's empty", "When it's half full", "At the end, when it's nearly full"],
          answer: 0,
          explain: "Empty capacitor, full voltage across the resistor, biggest current. It tails off from there.",
        },
        {
          q: "What's the time constant of 47 kΩ and 100 µF?",
          choices: ["0.47 s", "4.7 s", "47 s"],
          answer: 1,
          explain: "τ = R × C = 47,000 × 0.0001 = 4.7 seconds.",
        },
        {
          q: "Roughly how many time constants until a capacitor counts as fully charged?",
          choices: ["1", "5", "100"],
          answer: 1,
          explain: "After 5τ it's over 99% of the way there.",
        },
        {
          q: "Why might a gadget's light stay on for a moment after you unplug it?",
          choices: ["The wires are still holding current", "Capacitors inside are discharging through it", "The LED stores light"],
          answer: 1,
          explain: "The supply's smoothing capacitors act like a tiny battery for a moment.",
        },
      ],
    },
  ],
};
