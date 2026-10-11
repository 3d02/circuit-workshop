import { graph } from "../plots.js";
import { si } from "../format.js";

const OHMS = [100, 150, 200, 220, 330, 390, 470, 500, 560, 680, 820, 1000, 1200, 1500, 2000, 2200, 3300, 4700, 5000, 6800, 10000];

export default {
  id: "resistance",
  title: "Resistance and Ohm's law",
  lede: "Resistance is how hard a part fights the current. Put it together with voltage and you can predict the current in any simple circuit, with one tiny formula.",
  minutes: 20,
  goals: [
    "Predict current with I = V ÷ R, and rearrange it when you need V or R",
    "Explain why a resistor gets hot, and work out how hot (P = V × I)",
    "Check a resistor against its power rating",
    "Recognise what an overloaded resistor looks like on a real board",
  ],
  blocks: [
    `<p>Push harder and more current flows. Make the path harder and less flows. That's the whole of Ohm's law:</p>
     <p class="formula-block">I = V ÷ R<small>current (amps) = voltage (volts) ÷ resistance (ohms, Ω)</small></p>
     <p>A <strong>resistor</strong> is a part made to have a precise, known resistance. It's the most common component there is: it sets currents, makes reference voltages, and protects more delicate parts. Its value is in ohms (Ω): a 1 kΩ (one kilo-ohm) resistor is 1,000 Ω.</p>`,
    {
      type: "note",
      kind: "analogy",
      title: "A picture to hold on to: a crowded corridor",
      html: `<p>Imagine people being pushed along a corridor. The push is the voltage. A resistor is a narrow doorway: the narrower it is, the fewer people get through per second, however hard you push. Push twice as hard, twice as many get through. Make the doorway twice as hard to pass, half as many get through.</p>`,
    },
    `<p>Below, an adjustable power supply drives a single resistor. The ammeter shows the current. Under the circuit, a graph plots current against voltage for this resistor: every resistor is a straight line through zero. The steeper the line, the lower the resistance.</p>`,
    {
      type: "figure",
      id: "ohm",
      spec: {
        title: "An adjustable supply and a resistor",
        iScale: 0.02,
        parts: [
          { id: "B1", type: "battery", a: [1, 2], b: [1, 4], v: 6, r: 0.001, label: (p) => `${si(p.v, "V")} supply`, labelSide: "left" },
          { id: "A1", type: "ammeter", a: [3, 0], b: [5, 0] },
          { id: "R1", type: "resistor", a: [8, 1.5], b: [8, 3.5], r: 1000, pmax: 2 },
        ],
        wires: ["1,2 1,0 3,0", "5,0 8,0 8,1.5", "8,3.5 8,5 1,5 1,4"],
        vmax: 12,
        controls: [
          { label: "Supply voltage", part: "B1", prop: "v", min: 0, max: 12, step: 0.5, unit: "V" },
          { label: "Resistance", part: "R1", prop: "r", values: OHMS, unit: "Ω" },
        ],
        readouts: [
          { label: "Voltage", value: (q) => q.across("R1"), unit: "V" },
          { label: "Current", value: (q) => q.i("R1"), unit: "A" },
        ],
        setup: (fig) => (fig.hits = new Set()),
        goals: [
          { id: "ohm-10ma", text: "Make exactly 10 mA flow (±0.3 mA)", test: (q) => Math.abs(q.i("R1") - 0.01) < 0.0003 },
          {
            id: "ohm-10ma-again",
            text: "Find a <em>different</em> resistor and voltage that also give 10 mA",
            test: (q, fig) => {
              if (Math.abs(q.i("R1") - 0.01) < 0.0003) fig.hits.add(q.part("R1").r);
              return fig.hits.size >= 2;
            },
          },
        ],
        extras: [
          graph({
            title: "Current against voltage for this resistor",
            x: { min: 0, max: 12, unit: "V", label: "voltage →" },
            y: { min: 0, max: 0.06, unit: "A", label: "current", fmt: (v) => `${Math.round(v * 1000)} mA` },
            curves: (q) => {
              const r = q.part("R1").r;
              return [
                { points: [[0, 0], [12, 12 / r]], label: `${si(r, "Ω")}`, labelAt: [Math.min(11, 0.054 * r), Math.min(0.054, 11 / r)] },
              ];
            },
            point: (q) => [q.across("R1"), q.i("R1")],
            pointLabel: (q) => si(q.i("R1"), "A"),
          }),
        ],
      },
    },
    {
      type: "predict",
      id: "ohm-double",
      figure: "ohm",
      q: "6 V across 1 kΩ drives 6 mA. Double the resistance to 2 kΩ, with the same 6 V. What current flows?",
      choices: ["12 mA", "6 mA: the voltage didn't change", "3 mA"],
      answer: 2,
      why: ["More resistance means it's harder to push current through, so the current goes down, not up.", "Voltage is the same, but the path is now twice as hard."],
      explain: `<p>I = V ÷ R = 6 V ÷ 2,000 Ω = 0.003 A, or 3 mA. Twice the resistance, half the current. On the graph, the line gets shallower.</p>`,
      reveal: (fig) => {
        fig.set("B1", "v", 6);
        fig.set("R1", "r", 2000);
      },
      revealLabel: "Set 6 V and 2 kΩ",
    },
    {
      type: "note",
      kind: "deeper",
      title: "Three ways to write the same law",
      html: `<p>Ohm's law rearranges to find whichever quantity you're missing:</p>
             <ul><li><code>I = V ÷ R</code>: how much current will flow?</li><li><code>V = I × R</code>: how much voltage will this current drop across the resistor?</li><li><code>R = V ÷ I</code>: what resistor do I need for this current?</li></ul>
             <p>Watch the units: volts, amps and ohms together. If you use milliamps and kilo-ohms, those work together too (6 V ÷ 2 kΩ = 3 mA), which is handy for quick sums.</p>`,
    },
    { type: "h2", text: "Resistance turns energy into heat" },
    `<p>Every bit of charge that tumbles down through a resistor gives up its energy as heat. How fast that happens is the power, in watts:</p>
     <p class="formula-block">P = V × I<small>power (watts) = voltage across × current through</small></p>
     <p>Resistors are rated for how much heat they can safely get rid of. The small ones you'll use most are rated ¼ watt (0.25 W). Go past that and they get hot, discolour, and eventually burn open.</p>`,
    {
      type: "predict",
      id: "heat-x4",
      figure: "heat",
      q: "At 5 V, this 100 Ω resistor turns 0.25 W into heat: exactly its rating. What does it make at 10 V?",
      choices: ["0.5 W: twice as much", "1 W: four times as much", "Still 0.25 W"],
      answer: 1,
      why: ["Doubling the voltage doubles the current too, and power depends on both.", "", "Power depends on both the voltage and the current, and both just changed."],
      explain: `<p>Twice the voltage pushes twice the current, and power is voltage × current, so it goes up <strong>four times</strong>: P = V² ÷ R = 100 ÷ 100 = 1 W. That's why a supply that's “only a bit higher” than intended can cook a part that was fine before.</p>`,
      reveal: (fig) => fig.set("B1", "v", 10),
      revealLabel: "Turn it up to 10 V",
    },
    {
      type: "figure",
      id: "heat",
      spec: {
        title: "A ¼ W resistor under load",
        iScale: 0.06,
        parts: [
          { id: "B1", type: "battery", a: [1, 2], b: [1, 4], v: 3, r: 0.001, label: (p) => `${si(p.v, "V")} supply`, labelSide: "left" },
          { id: "R1", type: "resistor", a: [6, 1.5], b: [6, 3.5], r: 100, pmax: 0.25, label: "100 Ω, ¼ W" },
        ],
        wires: ["1,2 1,0 6,0 6,1.5", "6,3.5 6,5 1,5 1,4"],
        vmax: 12,
        controls: [{ label: "Supply voltage", part: "B1", prop: "v", min: 0, max: 12, step: 0.5, unit: "V" }],
        readouts: [
          { label: "Current", value: (q) => q.i("R1"), unit: "A" },
          { label: "Heat", value: (q) => q.power("R1"), unit: "W" },
          { label: "Of its rating", value: (q) => q.power("R1") / 0.25, format: (v) => `${Math.round(v * 100)}%` },
        ],
        status: (q) => (q.power("R1") <= 0.25 ? "Within its ¼ W rating. It may feel warm, which is normal." : ""),
        goals: [
          { id: "heat-max", text: "Find the highest supply voltage that keeps the resistor within its ¼ W rating", test: (q) => q.power("R1") <= 0.2501 && q.power("R1") > 0.23, hold: 0.8 },
          { id: "heat-burn", text: "Then push it too far, to see what failure looks like (it's free here)", test: (q) => !!q.part("R1").burnt },
        ],
      },
    },
    `<p>Notice the resistor starts to glow well before it fails. Real ones do something similar: they get too hot to touch, the paint browns, the board around them discolours. When a resistor finally burns, it usually goes <em>open circuit</em>: the loop breaks and everything stops.</p>`,
    {
      type: "note",
      kind: "repair",
      title: "A burnt resistor is a clue, not the whole answer",
      html: `<p>A brown, cracked or blistered resistor on a circuit board tells you it carried more current than it was designed for. Replace it, but also ask <em>why</em>. Often something further along has failed short, and the resistor was the victim. Replace only the resistor and the new one may burn too.</p>`,
    },
    {
      type: "note",
      kind: "build",
      title: "Reading a real resistor's value",
      html: `<p>Through-hole resistors are marked with coloured bands; tiny surface-mount ones with a printed code like <code>472</code> (47 × 10² = 4.7 kΩ). The <a href="#tools">Tools page</a> decodes both. And when in doubt, measure it with a multimeter ({{ch:multimeter}}).</p>`,
    },
    {
      type: "quiz",
      id: "ohm-quiz",
      questions: [
        {
          q: "9 V across a 3 kΩ resistor. What current flows?",
          choices: ["3 mA", "27 mA", "0.3 mA"],
          answer: 0,
          explain: "I = V ÷ R = 9 V ÷ 3 kΩ = 3 mA. (Volts divided by kilo-ohms gives milliamps.)",
        },
        {
          q: "You need 20 mA through a resistor with 5 V across it. What value?",
          choices: ["100 Ω", "250 Ω", "4 kΩ"],
          answer: 1,
          explain: "R = V ÷ I = 5 V ÷ 0.02 A = 250 Ω.",
        },
        {
          q: "A 1 kΩ resistor has 10 V across it. Is a ¼ W resistor enough?",
          choices: ["Yes: it only makes 0.01 W", "Yes: it makes 0.1 W, under the 0.25 W rating", "No: it makes 10 W"],
          answer: 1,
          explain: "I = 10 mA, so P = V × I = 10 V × 0.01 A = 0.1 W. Comfortably under 0.25 W.",
        },
        {
          q: "You double the voltage across a resistor. What happens to the heat it produces?",
          choices: ["It doubles", "It quadruples", "It stays the same"],
          answer: 1,
          explain: "Current doubles too, and P = V × I, so power goes up by 2 × 2 = 4.",
        },
      ],
    },
  ],
};
