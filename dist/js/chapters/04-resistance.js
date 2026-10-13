import { graph } from "../plots.js";
import { si } from "../format.js";
import { ohmLab } from "../labs.js";

const OHMS = [100, 150, 200, 220, 330, 390, 470, 500, 560, 680, 820, 1000, 1200, 1500, 2000, 2200, 3300, 4700, 5000, 6800, 10000];

export default {
  id: "resistance",
  title: "Resistance and Ohm's law",
  lede: "Resistance is how hard a part fights the current. Put it together with voltage and you can predict the current in any simple circuit, with one tiny formula.",
  minutes: 20,
  goals: [
    "Find Ohm's law for yourself from measurements, and read a resistance off a graph",
    "Predict current with I = V ÷ R, and rearrange it when you need V or R",
    "Explain why a resistor gets hot, and work out how hot (P = V × I)",
    "Check a resistor against its power rating",
    "Recognise what an overloaded resistor looks like on a real board",
    "Work out a wire's resistance from its length, thickness and material",
    "Measure resistors with your meter, and zero out the leads",
  ],
  blocks: [
    `<p>In {{ch:inside}} you saw, from the inside, that the electrons' drift is proportional to the push: twice the field, twice the drift. If that's right, then from the outside, current should be proportional to voltage. Before anyone hands you a formula, measure it.</p>
     <p>Below is a <strong>mystery resistor</strong> with an ammeter in series (current through it) and a voltmeter across it (voltage across it). <strong>Set a battery voltage, record the reading, change the voltage, record again.</strong> Your readings appear in the table and on the graph.</p>`,
    { type: "custom", tasks: ["ohm-lab-five", "ohm-lab-led"], render: (el) => ohmLab(el) },
    `<p>For the resistor, every point lands on one straight line through zero. Double the voltage and the current doubles; that's what <em>proportional</em> means. The column V ÷ I comes out the same every time: that constant is the part's <strong>[[resistance]]</strong>.</p>
     <p>The LED is different. Nothing flows at all until about 1.7 V, then the current climbs steeply. Its V ÷ I changes all the time, so it doesn't <em>have</em> a single resistance. Parts like resistors and copper wire, whose line is straight, are called <em>ohmic</em>. Diodes, LEDs and lamp filaments that heat up are not.</p>`,
    {
      type: "problems",
      id: "ohm-lab-p",
      title: "What's in the box?",
      intro: "Use your readings from the lab above. Any one point will do, but the slope of the line uses them all.",
      items: [
        {
          id: "ohm-mystery",
          level: 1,
          q: "<p>What is the mystery resistor's resistance?</p>",
          unit: "Ω",
          answer: 330,
          tol: 0.03,
          hints: ["Resistance is V ÷ I for any one reading. Use base units: volts and amps.", "Or use the slope: the line rises by (slope) amps for every volt, so R = 1 ÷ slope."],
          solution: "<p>At 3 V the ammeter reads 9.09 mA: R = 3 ÷ 0.00909 = <b>330 Ω</b>. Every reading gives the same answer, which is the point. From the slope: 3.03 mA per volt, and 1 ÷ 0.00303 = 330 Ω.</p>",
        },
      ],
    },
    {
      type: "formula",
      id: "ohm",
      name: "Ohm's law",
      eq: "I = V ÷ R",
      alt: ["V = I × R", "R = V ÷ I"],
      vars: [
        ["I", "current through the part", "amperes, A"],
        ["V", "voltage across the part", "volts, V"],
        ["R", "its resistance", "ohms, Ω"],
      ],
      why: `<p>Drift is proportional to the field, as you saw inside the wire, so current is proportional to voltage. The constant that relates them is the resistance: how many volts it takes to push each amp through. That's also what an ohm <em>is</em>: one volt per amp.</p>`,
      use: `<p>Everywhere: choosing a resistor for an LED, working out what a heater draws, checking whether a reading makes sense. A handy shortcut once you're fluent: volts ÷ kilohms gives milliamps (6 V ÷ 2 kΩ = 3 mA).</p>`,
      example: `<p>9 V across a 470 Ω resistor:</p>
                <span class="calc">I = 9 ÷ 470 = 0.0191 A = 19.1 mA</span>
                <p>What resistor gives 20 mA from 5 V? <span class="calc">R = 5 ÷ 0.020 = 250 Ω</span></p>`,
    },
    `<p>A <strong>resistor</strong> is a part made to have a precise, known resistance. It's the most common component there is: it sets currents, makes reference voltages, and protects more delicate parts. Its value is in ohms (Ω): a 1 kΩ (one kilo-ohm) resistor is 1,000 Ω.</p>`,
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
    { type: "h2", text: "Resistance turns energy into heat" },
    `<p>Every bit of charge that tumbles down through a resistor gives up its energy as heat. How fast that happens is the power, in watts:</p>
     <p>Resistors are rated for how much heat they can safely get rid of. The small ones you'll use most are rated ¼ watt (0.25 W). Go past that and they get hot, discolour, and eventually burn open.</p>`,
    {
      type: "formula",
      id: "power",
      name: "Electrical power",
      eq: "P = V × I",
      alt: ["P = I² × R", "P = V² ÷ R"],
      vars: [
        ["P", "power: energy converted per second", "watts, W (1 W = 1 J/s)"],
        ["V", "voltage across the part", "volts, V"],
        ["I", "current through it", "amperes, A"],
        ["R", "its resistance", "ohms, Ω"],
      ],
      why: `<p>Each coulomb gives up V joules ({{ch:voltage}}), and I coulombs pass every second. So the energy per second is V × I. Substitute Ohm's law (V = I × R, or I = V ÷ R) and you get the other two forms.</p>`,
      use: `<p>Picking a resistor's [[power rating]], sizing a heater or a fuse, and working out battery life. Use I² × R when you know the current (a wire carrying a load), and V² ÷ R when you know the voltage (a heater on mains).</p>`,
      example: `<p>A 220 Ω resistor straight across a 9 V battery:</p>
                <span class="calc">P = V² ÷ R = 81 ÷ 220 = 0.37 W</span>
                <p>That's well over a ¼ W rating: use a ½ W part, or a bigger resistor.</p>`,
    },
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
    { type: "h2", text: "The resistance of a wire" },
    `<p>Copper isn't a perfect conductor, just a very good one. A wire's resistance depends on three things, all of which make sense from the inside: the <em>material</em> (how often electrons collide in it), the <em>length</em> (twice the length, twice the collisions to get through) and the <em>thickness</em> (twice the cross-section, twice as many lanes for the same current).</p>`,
    {
      type: "formula",
      id: "resistivity",
      name: "Resistance of a wire",
      eq: "R = ρ × L ÷ A",
      vars: [
        ["R", "resistance of the wire", "ohms, Ω"],
        ["ρ", "the material's resistivity (Greek rho)", "ohm-metres, Ω·m"],
        ["L", "length", "metres, m"],
        ["A", "cross-section area", "m² (1 mm² = 10⁻⁶ m²)"],
      ],
      why: `<p>Two equal wires end to end are like two resistors in series: double the resistance. Two side by side are like two lanes: half. Resistivity is the material's own contribution, measured for a 1 m cube. Copper: 1.7 × 10⁻⁸ Ω·m. Aluminium: 2.7 × 10⁻⁸. Nichrome (heating elements): 1.1 × 10⁻⁶, about 65 times copper. Resistivity rises as a metal heats up, because the ions shake more.</p>`,
      use: `<p>Why a kettle's cable is thick and a phone cable thin, why long extension reels get warm and lose voltage, and how heating elements and fuses are designed.</p>`,
      example: `<p>One conductor of a 25 m extension reel, 1.5 mm² copper:</p>
                <span class="calc">R = 1.7 × 10⁻⁸ × 25 ÷ 1.5 × 10⁻⁶ = 0.28 Ω</span>
                <p>Current goes out on one conductor and back on the other, so the loop is 0.57 Ω.</p>`,
    },
    {
      type: "note",
      kind: "safety",
      title: "Unwind extension reels before heavy loads",
      html: `<p>A 2 kW heater on a 25 m reel heats the cable by about 40 W (you'll work it out below). Stretched out, that's harmless. Wound tightly on the drum, the heat can't escape and the insulation can melt. That's why reels carry two ratings: a lower one when wound, a higher one when fully unwound.</p>`,
    },
    {
      type: "bench",
      id: "bench-resistors",
      title: "Measure resistors, and zero your leads",
      intro: "Resistance is the one measurement your meter makes by itself: it pushes a small known current through the part and measures the voltage that results. So the part must be unpowered and, ideally, out of the circuit.",
      setup: { dial: "Ω (SELECT until no •))) shows)", leads: "black in COM, red in V Ω", need: "three resistors from your kit, say 100 Ω, 1 kΩ and 10 kΩ" },
      steps: [
        "Read each resistor's colour bands first (the <a href=\"#tools\">Tools page</a> decodes them) and write the value down.",
        "Touch the probe tips together and note the reading: the leads themselves, about 0.1 Ω.",
        "Hold <b>HOLD</b> for a second with the tips still touching. <b>Δ</b> appears and the display reads 0.0: from now on the meter subtracts the leads for you. This matters for small resistances.",
        "Measure each resistor, holding the leads against the probes with your fingers on <em>one</em> side only. Note how close each is to its marked value.",
        "Now measure the 10 kΩ again, but pinch both ends between your fingers and the probes. The reading drops: your body is now a second path, in parallel ({{ch:dividers}} explains the maths).",
        "Hold HOLD again to leave relative mode.",
      ],
      record: [
        { label: "The 1 kΩ resistor", unit: "Ω", min: 950, max: 1050, ok: "Within ±5%: in spec for a gold-band resistor. Metal-film parts (blue body, 5 bands) are usually within 1%.", low: "Below 950 Ω: either it isn't 1 kΩ (check the bands), or something is in parallel, like your fingers.", high: "Above 1,050 Ω: check the bands, and that you're on Ω, not in relative mode from another measurement." },
      ],
      expect: `<p>Resistors are rarely spot on: they're made to a <em>tolerance</em>. A gold fourth band means ±5%, brown ±1%. Your meter adds its own small uncertainty, ±(0.3% + 3 digits) up to 6 kΩ and ±(0.5% + 3 digits) above, which you'll learn to read in {{ch:multimeter}}.</p>
               <p>If you have a long extension reel, try one more (it's unplugged, so it's safe): one probe on the live pin of the plug, the other into the matching hole of a socket on the reel. 25 m of 1.5 mm² cable should read about 0.3 Ω. Without relative mode, the 0.1 Ω of your leads would have been a third of the answer.</p>`,
    },
    {
      type: "problems",
      id: "ohm-p",
      title: "Ohm's law and heat, on paper",
      items: [
        { id: "ohm-p1", level: 1, q: "<p>12 V is connected across a 470 Ω resistor. What current flows?</p>", unit: "mA", answer: (12 / 470) * 1000, hints: ["I = V ÷ R, in volts and ohms gives amps."], solution: "<p>I = 12 ÷ 470 = 0.0255 A = <b>25.5 mA</b>.</p>" },
        { id: "ohm-p2", level: 1, q: "<p>What resistor lets 15 mA flow from 5 V?</p>", unit: "Ω", answer: 5 / 0.015, hints: ["R = V ÷ I, with I = 0.015 A."], solution: "<p>R = 5 ÷ 0.015 = <b>333 Ω</b>. The nearest standard value is 330 Ω.</p>" },
        {
          id: "ohm-p3",
          level: 2,
          q: "<p>A kettle is rated 2,000 W on 230 V mains. What current does it draw?</p>",
          unit: "A",
          answer: 2000 / 230,
          hints: ["P = V × I, so I = P ÷ V."],
          solution: "<p>I = 2,000 ÷ 230 = <b>8.7 A</b>. That's why a kettle needs a fuse or breaker rated at 10 A or more.</p>",
        },
        {
          id: "ohm-p4",
          level: 2,
          q: "<p>What is the resistance of that kettle's heating element when hot?</p>",
          unit: "Ω",
          answer: (230 * 230) / 2000,
          hints: ["Either R = V ÷ I, or P = V² ÷ R rearranged: R = V² ÷ P."],
          solution: "<p>R = V² ÷ P = 52,900 ÷ 2,000 = <b>26.5 Ω</b>. (Or 230 ÷ 8.7.) Measured cold, with the kettle unplugged, it reads a little lower, because the element's resistivity rises as it heats.</p>",
        },
        {
          id: "ohm-p5",
          level: 2,
          q: "<p>A 220 Ω resistor sits straight across a 9 V battery. How much power does it turn into heat? Is a ¼ W resistor enough?</p>",
          unit: "W",
          answer: 81 / 220,
          hints: ["P = V² ÷ R."],
          solution: "<p>P = 81 ÷ 220 = <b>0.37 W</b>. No: that's about 150% of a ¼ W rating. Use a ½ W resistor.</p>",
        },
        {
          id: "ohm-p6",
          level: 3,
          q: "<p>The 2,000 W kettle runs from a 25 m reel whose loop resistance is 0.57 Ω. How much power heats the cable? (Use the 8.7 A you found.)</p>",
          unit: "W",
          answer: (2000 / 230) ** 2 * 0.567,
          tol: 0.04,
          hints: ["The cable carries the kettle's current: use P = I² × R with the cable's resistance."],
          solution: "<p>P = I² × R = 8.7² × 0.57 = 75.6 × 0.57 = <b>43 W</b>. Spread along 50 m of conductor it's under a watt per metre; wound tightly on a drum, it adds up.</p>",
        },
        {
          id: "ohm-p7",
          level: 3,
          q: "<p>You want a 10 Ω heater made from nichrome wire 0.25 mm in diameter (resistivity 1.1 × 10⁻⁶ Ω·m). How long must the wire be?</p>",
          unit: "m",
          answer: (10 * Math.PI * 0.000125 ** 2) / 1.1e-6,
          tol: 0.03,
          hints: ["Area of a circle: A = π r², with r = 0.125 mm = 1.25 × 10⁻⁴ m.", "Rearrange R = ρL ÷ A for L: L = R × A ÷ ρ."],
          solution: "<p>A = π × (1.25 × 10⁻⁴)² = 4.91 × 10⁻⁸ m². L = R × A ÷ ρ = 10 × 4.91 × 10⁻⁸ ÷ 1.1 × 10⁻⁶ = <b>0.45 m</b>.</p>",
        },
      ],
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
