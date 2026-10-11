import { scope } from "../plots.js";
import { si } from "../format.js";

export default {
  id: "capacitors",
  title: "Capacitors: storing charge, making time",
  lede: "A capacitor is a tiny rechargeable reservoir of charge. Its voltage can't jump instantly, and that one property gives you timers, smooth power supplies and LEDs that fade out gently.",
  minutes: 20,
  goals: [
    "Watch a capacitor charge, and explain why the curve bends",
    "Predict how long charging takes, using τ = R × C",
    "Use a capacitor to keep something running for a moment",
    "Handle charged capacitors safely",
  ],
  blocks: [
    `<p>A capacitor is two metal plates separated by a thin insulator. Current can't flow <em>through</em> it, but charge can pile up on one plate while the same amount leaves the other. The more charge piled up, the higher the voltage between the plates.</p>
     <p>Its size is its <strong>capacitance</strong>, in farads (F). One farad is huge; real parts are measured in microfarads (µF, millionths) or smaller.</p>`,
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
    `<p>The speed depends on just two things: how big the tank is (C), and how narrow the pipe is (R). Multiply them and you get the <strong>time constant</strong>, written τ (the Greek letter tau):</p>
     <p class="formula-block">τ = R × C<small>10 kΩ × 100 µF = 10,000 × 0.0001 = 1 second</small></p>`,
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
