import { series, si } from "../format.js";

const LOADS = series(100, 1e6);

export default {
  id: "dividers",
  title: "Series, parallel and voltage dividers",
  lede: "Real circuits branch. Two simple rules tell you how current and voltage split up, and they explain everything from fairy lights to how a sensor talks to a microcontroller.",
  minutes: 20,
  goals: [
    "Predict how bright lamps are in series and in parallel",
    "Use a voltage divider to make a smaller voltage",
    "Use a potentiometer as an adjustable divider",
    "Explain why connecting a load changes a divider's output",
    "Use Kirchhoff's current law at a junction",
    "Spot when your own meter is changing the voltage it measures",
  ],
  blocks: [
    `<p>There are only two ways to connect two parts:</p>
     <ul>
       <li><strong>In series</strong>: one after the other, so there's only one path. The <em>same current</em> flows through both, and they <em>share the voltage</em>.</li>
       <li><strong>In parallel</strong>: side by side, each across the same two points. Each gets the <em>full voltage</em>, and their currents <em>add up</em>.</li>
     </ul>
     <p>Below are three circuits, each with the same 6 V battery and identical lamps. Before you look closely, make two predictions.</p>`,
    {
      type: "predict",
      id: "series-bright",
      figure: "lamps",
      q: "Compared with one lamp on its own, how bright is each lamp when two are connected in series?",
      choices: ["Just as bright", "Dimmer", "Brighter"],
      answer: 1,
      why: ["Each lamp now only gets part of the battery's voltage.", "", "The battery hasn't changed, and the current now has to get through two lamps instead of one."],
      explain: `<p>In series, the two lamps share the 6 V: 3 V each. With half the voltage, each lamp also carries half the current, so it gets only <strong>a quarter</strong> of the power (½ × ½). They glow, but dimly. That's also why one blown bulb in an old string of fairy lights killed the whole string: in series, there's only one path.</p>`,
      reveal: (fig) => {
        fig.highlight("L2");
        fig.highlight("L3");
        setTimeout(() => ["L2", "L3"].forEach((id) => fig.highlight(id, false)), 3000);
      },
      revealLabel: "Look at the series lamps",
    },
    {
      type: "predict",
      id: "parallel-bright",
      figure: "lamps",
      q: "And when two lamps are connected in parallel?",
      choices: ["Each is just as bright as one lamp alone", "Each is dimmer", "Each is brighter"],
      answer: 0,
      why: ["", "Each lamp is connected straight across the battery, so it gets the full 6 V.", "Each lamp gets the full 6 V, the same as a single lamp. It can't get more."],
      explain: `<p>Each lamp in parallel is connected directly across the battery, so each gets the full 6 V and shines at full brightness. The cost: the battery now has to supply <strong>twice the current</strong>, so it runs down twice as fast. Homes are wired in parallel so every light and socket gets full voltage, independently.</p>`,
      reveal: (fig) => {
        fig.highlight("L4");
        fig.highlight("L5");
        setTimeout(() => ["L4", "L5"].forEach((id) => fig.highlight(id, false)), 3000);
      },
      revealLabel: "Look at the parallel lamps",
    },
    {
      type: "figure",
      id: "lamps",
      spec: {
        title: "One lamp · two in series · two in parallel",
        iScale: 0.5,
        parts: [
          { type: "text", at: [1.5, -1.1], text: "One lamp", cls: "annotation head" },
          { id: "B1", type: "battery", a: [0, 2], b: [0, 4], v: 6, r: 0.05, label: "6 V", labelSide: "left" },
          { id: "L1", type: "lamp", a: [3, 2], b: [3, 4], r: 12, rated: 3, label: false },
          { type: "ground", at: [0, 6] },

          { type: "text", at: [8, -1.1], text: "Series", cls: "annotation head" },
          { id: "B2", type: "battery", a: [6.5, 2], b: [6.5, 4], v: 6, r: 0.05, label: "6 V", labelSide: "left" },
          { id: "L2", type: "lamp", a: [9.5, 0.5], b: [9.5, 2.5], r: 12, rated: 3, label: false },
          { id: "L3", type: "lamp", a: [9.5, 3.5], b: [9.5, 5.5], r: 12, rated: 3, label: false },
          { type: "ground", at: [6.5, 6] },

          { type: "text", at: [14.5, -1.1], text: "Parallel", cls: "annotation head" },
          { id: "B3", type: "battery", a: [13, 2], b: [13, 4], v: 6, r: 0.05, label: "6 V", labelSide: "left" },
          { id: "L4", type: "lamp", a: [15.5, 2], b: [15.5, 4], r: 12, rated: 3, label: false },
          { id: "L5", type: "lamp", a: [17.5, 2], b: [17.5, 4], r: 12, rated: 3, label: false },
          { type: "ground", at: [13, 6] },
        ],
        wires: [
          "0,2 0,0 3,0 3,2",
          "3,4 3,6 0,6 0,4",
          "6.5,2 6.5,0 9.5,0 9.5,0.5",
          "9.5,2.5 9.5,3.5",
          "9.5,5.5 9.5,6 6.5,6 6.5,4",
          "13,2 13,0 15.5,0 17.5,0 17.5,2",
          "15.5,0 15.5,2",
          "17.5,4 17.5,6 15.5,6 13,6 13,4",
          "15.5,4 15.5,6",
        ],
        view: [-2, -2, 19.6, 7.4],
        readouts: [
          { label: "Battery current, one lamp", value: (q) => q.i("B1"), unit: "A" },
          { label: "Battery current, series", value: (q) => q.i("B2"), unit: "A" },
          { label: "Battery current, parallel", value: (q) => q.i("B3"), unit: "A" },
        ],
      },
    },
    `<p>Hover over each lamp to compare voltages and currents. The rules, written down, start with the simplest.</p>`,
    {
      type: "formula",
      id: "series",
      name: "Resistors in series",
      eq: "R<sub>total</sub> = R₁ + R₂ + R₃ + …",
      vars: [
        ["R<sub>total</sub>", "the single resistance that would behave the same", "ohms, Ω"],
        ["R₁, R₂…", "each resistance in the chain", "ohms, Ω"],
      ],
      why: `<p>The same current I flows through each part. Each drops I × R, and by Kirchhoff's voltage law the drops add up: V = I×R₁ + I×R₂ = I × (R₁ + R₂). So the chain behaves like one resistor of R₁ + R₂.</p>`,
      use: `<p>An LED and its resistor, a string of fairy lights, a long cable plus the appliance at its end. Any series chain carries one current, set by the total.</p>`,
      example: `<p>Two 12 Ω lamps in series on 6 V:</p>
                <span class="calc">R = 12 + 12 = 24 Ω  →  I = 6 ÷ 24 = 0.25 A</span>
                <p>Each lamp drops 0.25 × 12 = 3 V and makes 0.75 W: a quarter of the 3 W it makes alone.</p>`,
    },
    {
      type: "formula",
      id: "kcl",
      name: "Kirchhoff's current law",
      eq: "I<sub>in</sub> = I<sub>out</sub>",
      alt: ["at a junction: I = I₁ + I₂ + …"],
      vars: [
        ["I<sub>in</sub>", "total current flowing into a junction", "amperes, A"],
        ["I<sub>out</sub>", "total current flowing out of it", "amperes, A"],
      ],
      why: `<p>Charge can't pile up at a junction or vanish from it (you saw in {{ch:inside}} that even a tiny pile-up creates a field that stops it). So whatever flows in must flow out. It's the same reason the current was equal all round the loop in {{ch:loop}}.</p>`,
      use: `<p>House wiring: the current through your main fuse is the sum of every appliance's current. In fault finding, a branch that takes more than its share is suspect.</p>`,
      example: `<p>The parallel lamps: each takes 0.5 A, so the battery supplies</p>
                <span class="calc">I = 0.5 + 0.5 = 1.0 A</span>`,
    },
    {
      type: "formula",
      id: "parallel",
      name: "Resistors in parallel",
      eq: "1/R<sub>total</sub> = 1/R₁ + 1/R₂ + …",
      alt: ["for two: R<sub>total</sub> = R₁ × R₂ ÷ (R₁ + R₂)"],
      vars: [
        ["R<sub>total</sub>", "the single resistance that would behave the same", "ohms, Ω"],
        ["R₁, R₂…", "each branch's resistance", "ohms, Ω"],
      ],
      why: `<p>Every branch has the same voltage V across it. Each draws V ÷ R, and by the current law the branch currents add: I = V/R₁ + V/R₂ = V × (1/R₁ + 1/R₂). Compare with I = V ÷ R<sub>total</sub>.</p>`,
      use: `<p>Your fingers across a resistor you're measuring, a meter in parallel with what it measures, and why in-circuit readings come out low. The result is always smaller than the smallest branch: more paths, easier flow.</p>`,
      example: `<p>A 10 kΩ resistor, measured while your fingers (about 100 kΩ) pinch both ends:</p>
                <span class="calc">R = 10,000 × 100,000 ÷ 110,000 = 9,090 Ω</span>`,
    },
    { type: "h2", text: "Voltage dividers: making a smaller voltage" },
    `<p>Two resistors in series share the voltage in proportion to their resistance. Tap the point between them and you have a new, smaller voltage. This is a <strong>voltage divider</strong>, and it's everywhere: reading sensors, setting reference levels, scaling a big voltage down so a microcontroller can measure it.</p>`,
    {
      type: "formula",
      id: "divider",
      name: "Voltage divider",
      eq: "V<sub>out</sub> = V<sub>in</sub> × R<sub>bottom</sub> ÷ (R<sub>top</sub> + R<sub>bottom</sub>)",
      vars: [
        ["V<sub>out</sub>", "voltage at the tap, measured from ground", "volts, V"],
        ["V<sub>in</sub>", "voltage across the whole divider", "volts, V"],
        ["R<sub>top</sub>", "resistor between V<sub>in</sub> and the tap", "ohms, Ω"],
        ["R<sub>bottom</sub>", "resistor between the tap and ground", "ohms, Ω"],
      ],
      why: `<p>It's just a series circuit. The current is I = V<sub>in</sub> ÷ (R<sub>top</sub> + R<sub>bottom</sub>), and the output is the drop across the bottom resistor: I × R<sub>bottom</sub>. Put the two together. It only holds while nothing draws current from the tap.</p>`,
      use: `<p>Sensors (a light- or temperature-dependent resistor as one half), volume knobs, a microcontroller watching a battery's voltage, and inside your meter: its 10 MΩ input is a chain of resistors that divides big voltages down.</p>`,
      example: `<p>Scale 12 V down with 10 kΩ on top and 4.7 kΩ underneath:</p>
                <span class="calc">V<sub>out</sub> = 12 × 4.7 ÷ (10 + 4.7) = 12 × 0.320 = 3.84 V</span>`,
    },
    `
     <p>A <strong>potentiometer</strong> (a “pot”, like a volume knob) is a divider you can adjust: a resistive track with a sliding contact, the <em>wiper</em>. Slide it up and the bottom part of the track gets bigger, so the output rises.</p>`,
    {
      type: "figure",
      id: "pot",
      spec: {
        title: "A potentiometer as a voltage divider",
        iScale: 0.0005,
        parts: [
          { id: "B1", type: "battery", a: [1, 2], b: [1, 4], v: 5, r: 0.01, labelSide: "left" },
          { id: "P1", type: "pot", a: [5, 2], b: [5, 4], w: [6, 3], r: 10000, pos: 0.5, label: "10 kΩ pot", labelSide: "left" },
          { id: "V1", type: "voltmeter", a: [9, 3], b: [9, 5], labelSide: "right" },
          { type: "label", at: [7.5, 3], text: "OUT" },
          { type: "ground", at: [1, 6] },
        ],
        wires: ["1,2 1,0 5,0 5,2", "5,4 5,6", "1,4 1,6 5,6 9,6 9,5", "6,3 9,3"],
        controls: [
          {
            label: "Knob position",
            min: 0,
            max: 1,
            step: 0.01,
            get: (fig) => 1 - fig.part("P1").pos,
            set: (fig, v) => fig.set("P1", "pos", +(1 - v).toFixed(2)),
            format: (v) => `${Math.round(v * 100)}%`,
          },
        ],
        readouts: [
          { label: "Output", value: (q) => q.v("OUT"), unit: "V" },
          { label: "Top part", value: (q) => q.part("P1").r * q.part("P1").pos, unit: "Ω" },
          { label: "Bottom part", value: (q) => q.part("P1").r * (1 - q.part("P1").pos), unit: "Ω" },
        ],
        goals: [{ id: "pot-3v3", text: "Set the output to 3.3 V (±0.05 V), a common logic voltage", test: (q) => Math.abs(q.v("OUT") - 3.3) < 0.05 }],
      },
    },
    { type: "h2", text: "The catch: loading" },
    `<p>A divider works out its output assuming nothing else draws current from the middle. Connect something that does (a <em>load</em>) and the load ends up in parallel with the bottom resistor. That changes the sums.</p>`,
    {
      type: "predict",
      id: "div-load",
      figure: "load",
      q: "Two 10 kΩ resistors divide 9 V down to 4.5 V. You connect a 1 kΩ load to the output. What happens to the output voltage?",
      choices: ["It stays at 4.5 V", "It drops a little", "It collapses to under 1 V"],
      answer: 2,
      why: ["The load draws current from the middle of the divider, and that changes how the voltage is shared.", "A small load would only nudge it, but 1 kΩ is a heavy load next to 10 kΩ resistors."],
      explain: `<p>The 1 kΩ load sits in parallel with the bottom 10 kΩ resistor. Together they behave like about 909 Ω. Now the divider is 10 kΩ on top and 909 Ω underneath, so the output falls to roughly 9 × 909 ÷ 10,909 ≈ <strong>0.75 V</strong>.</p>
                <p>The rule of thumb: a divider only holds its voltage if the load draws much less current than flows through the divider itself. Dividers are great for <em>signals</em> going into something that draws almost nothing, like a microcontroller input. They're useless for <em>powering</em> things. For that you need a voltage regulator.</p>`,
      reveal: (fig) => fig.set("S1", "closed", true),
      revealLabel: "Connect the load",
    },
    {
      type: "figure",
      id: "load",
      spec: {
        title: "A divider, with a load",
        iScale: 0.004,
        parts: [
          { id: "B1", type: "battery", a: [1, 2], b: [1, 4], v: 9, r: 0.01, labelSide: "left" },
          { id: "R1", type: "resistor", a: [5, 0], b: [5, 2], r: 10000, label: "10 kΩ", labelSide: "left" },
          { id: "R2", type: "resistor", a: [5, 3], b: [5, 5], r: 10000, label: "10 kΩ", labelSide: "left" },
          { id: "V1", type: "voltmeter", a: [7, 3.5], b: [7, 5.5], labelSide: "right" },
          { id: "S1", type: "switch", a: [9, 2.5], b: [11, 2.5], name: "Load switch", label: "connect", labelSide: "above" },
          { id: "RL", type: "resistor", a: [12, 3], b: [12, 5], r: 1000, label: (p) => `load ${si(p.r, "Ω")}`, labelSide: "right" },
          { type: "label", at: [6, 2.5], text: "OUT" },
          { type: "ground", at: [1, 6] },
        ],
        wires: ["1,2 1,0 5,0", "5,2 5,3", "5,2.5 9,2.5", "7,2.5 7,3.5", "11,2.5 12,2.5 12,3", "1,4 1,6 5,6 7,6 12,6 12,5", "5,5 5,6", "7,5.5 7,6"],
        controls: [
          { type: "toggle", label: "Connect the load", part: "S1", prop: "closed" },
          { label: "Load resistance", part: "RL", prop: "r", values: LOADS, unit: "Ω" },
        ],
        readouts: [
          { label: "Output", value: (q) => q.v("OUT"), unit: "V" },
          { label: "Load current", value: (q) => q.i("RL"), unit: "A" },
          { label: "Divider current", value: (q) => q.i("R2"), unit: "A" },
        ],
        goals: [{ id: "div-light", text: "Find the smallest load resistance that pulls the output down by less than 10%", test: (q) => q.part("S1").closed && q.v("OUT") >= 4.05 && q.part("RL").r <= 50000 }],
      },
    },
    {
      type: "note",
      kind: "repair",
      title: "Why in-circuit resistance readings lie",
      html: `<p>Measure a resistor while it's still soldered into a board and the meter sees it <em>in parallel</em> with everything else connected across the same two points. The reading comes out lower than the resistor's real value. If a reading looks suspicious, lift one leg of the part and measure again.</p>`,
    },
    { type: "h2", text: "Your meter is a load too" },
    `<p>A voltmeter has to draw <em>some</em> current to measure anything. Your BM235 on V puts [[10 MΩ|input impedance]] across whatever it touches: that's its <strong>input impedance</strong>. Next to a 10 kΩ divider, 10 MΩ is a thousand times bigger and changes nothing you could see. But measure the middle of a divider built from 1 MΩ resistors and the meter becomes a real load, in parallel with the bottom resistor, exactly like the 1 kΩ load above.</p>
     <p>The display will then read about 5% low, even though the meter's own accuracy is better than 0.5%. The meter isn't wrong. It measured, precisely, a circuit that it had changed. This is called <em>loading</em>, and spotting it is a real meter skill: if a high-resistance circuit reads lower than you expected, suspect the meter.</p>`,
    {
      type: "bench",
      id: "bench-divider",
      title: "Build a divider, and catch your meter loading it",
      intro: "Your first breadboard circuit. A breadboard's holes are joined in strips underneath, so parts pushed into the same strip are connected without soldering.",
      setup: { dial: "V, with ⎓ showing", leads: "black in COM, red in V Ω", need: "breadboard, 9 V battery and clip, two 10 kΩ and two 1 MΩ resistors" },
      steps: [
        "Measure the battery first: black on −, red on +. Write it down; it won't be exactly 9 V.",
        "Push the two 10 kΩ resistors into the breadboard in series: one end of each in a shared strip, which is the output. Connect the free ends to the battery's + and −.",
        "Black probe on the battery's −, red on the output strip. Note the reading.",
        "Replace the two 10 kΩ resistors with the two 1 MΩ ones and measure the output again.",
        "Disconnect the battery when you're done: the divider drains it slowly all the time.",
      ],
      record: [
        { label: "Output with 10 kΩ", unit: "V", min: 4.2, max: 4.9, ok: "Half the battery voltage, give or take the resistors' 5% tolerance.", low: "Lower than half: check the battery reading and that both resistors are 10 kΩ.", high: "Higher than half: check the battery, and that the resistors are the right way round in the strips." },
        { label: "Output with 1 MΩ", unit: "V", min: 3.9, max: 4.55, ok: "Lower than half, about 5% low. That's the meter's 10 MΩ input pulling it down.", low: "Very low: check the resistor values (1 MΩ is brown-black-green).", high: "Exactly half? Check the resistors really are 1 MΩ." },
      ],
      expect: `<p>With 10 kΩ resistors you should see half the battery voltage. With 1 MΩ resistors it reads about 5% lower. Work it out: 1 MΩ in parallel with 10 MΩ is 0.909 MΩ, so the divider gives 9 × 0.909 ÷ 1.909 = 4.29 V instead of 4.5 V (problem 7 below).</p>
               <p>So when you measure voltages in high-resistance circuits (sensors, timing circuits, anything with megohms), remember that the meter is part of the circuit.</p>`,
    },
    {
      type: "problems",
      id: "div-p",
      title: "Series, parallel and dividers, on paper",
      items: [
        { id: "div-p1", level: 1, q: "<p>220 Ω, 330 Ω and 470 Ω in series. What's the total resistance?</p>", unit: "Ω", answer: 1020, hints: ["In series, add them."], solution: "<p>220 + 330 + 470 = <b>1,020 Ω</b>.</p>" },
        { id: "div-p2", level: 1, q: "<p>Two 1 kΩ resistors in parallel. What's the total?</p>", unit: "Ω", answer: 500, hints: ["Two equal resistors in parallel give half of one."], solution: "<p>1,000 × 1,000 ÷ 2,000 = <b>500 Ω</b>.</p>" },
        { id: "div-p3", level: 2, q: "<p>A 10 kΩ resistor in parallel with 100 kΩ. What's the total?</p>", unit: "kΩ", answer: (10 * 100) / 110, hints: ["Product over sum: R₁ × R₂ ÷ (R₁ + R₂). You can work in kΩ throughout."], solution: "<p>10 × 100 ÷ 110 = <b>9.09 kΩ</b>: a bit less than the smaller one, as always.</p>" },
        {
          id: "div-p4",
          level: 2,
          q: "<p>A battery feeds three branches in parallel. It supplies 200 mA in total; two branches take 120 mA and 45 mA. How much does the third take?</p>",
          unit: "mA",
          answer: 35,
          hints: ["Kirchhoff's current law: the branch currents add up to the total."],
          solution: "<p>200 = 120 + 45 + I₃, so I₃ = <b>35 mA</b>.</p>",
        },
        {
          id: "div-p5",
          level: 2,
          q: "<p>A divider has 10 kΩ on top and 4.7 kΩ underneath, across 12 V. What's the output?</p>",
          unit: "V",
          answer: (12 * 4.7) / 14.7,
          hints: ["V<sub>out</sub> = V<sub>in</sub> × R<sub>bottom</sub> ÷ (R<sub>top</sub> + R<sub>bottom</sub>)."],
          solution: "<p>12 × 4.7 ÷ 14.7 = <b>3.84 V</b>.</p>",
        },
        {
          id: "div-p6",
          level: 3,
          q: "<p>A microcontroller can measure up to 3.3 V. You want to watch a battery that can reach 6.0 V, using a divider with 10 kΩ on the bottom. What top resistor makes 6.0 V come out as exactly 3.3 V?</p>",
          unit: "kΩ",
          answer: (10 * (6 - 3.3)) / 3.3,
          hints: ["The top resistor must drop 6.0 − 3.3 = 2.7 V while the bottom drops 3.3 V.", "Same current through both, so their resistances are in the same ratio as their voltages: R<sub>top</sub> = 10 kΩ × 2.7 ÷ 3.3."],
          solution: "<p>R<sub>top</sub> = 10 × 2.7 ÷ 3.3 = <b>8.18 kΩ</b>. The nearest standard value at or above it is 8.2 kΩ, which keeps the output just under 3.3 V. You'll meet this circuit again in the flashlight.</p>",
        },
        {
          id: "div-p7",
          level: 3,
          q: "<p>A divider of two 1 MΩ resistors sits across 9.0 V. Your meter, with its 10 MΩ input, measures the output. What does it read?</p>",
          unit: "V",
          answer: (9 * (1 / (1 / 1 + 1 / 10))) / (1 + 1 / (1 / 1 + 1 / 10)),
          hints: ["The meter is in parallel with the bottom resistor: 1 MΩ ∥ 10 MΩ.", "1 × 10 ÷ 11 = 0.909 MΩ. Now use the divider formula with that as R<sub>bottom</sub>."],
          solution: "<p>R<sub>bottom</sub> = 1 ∥ 10 = 0.909 MΩ. V<sub>out</sub> = 9 × 0.909 ÷ (1 + 0.909) = <b>4.29 V</b>: 4.8% below the 4.5 V you'd expect.</p>",
        },
      ],
    },
    {
      type: "quiz",
      id: "div-quiz",
      questions: [
        {
          q: "Two 100 Ω resistors in series. What's the total resistance?",
          choices: ["50 Ω", "100 Ω", "200 Ω"],
          answer: 2,
          explain: "In series, resistances add: 100 + 100 = 200 Ω.",
        },
        {
          q: "Two 100 Ω resistors in parallel. What's the total resistance?",
          choices: ["50 Ω", "100 Ω", "200 Ω"],
          answer: 0,
          explain: "Two equal resistors in parallel make half the resistance: there are now two paths.",
        },
        {
          q: "A divider uses 10 kΩ on top and 5 kΩ underneath, on 9 V. What's the output?",
          choices: ["3 V", "4.5 V", "6 V"],
          answer: 0,
          explain: "9 × 5 ÷ (10 + 5) = 3 V. The bottom resistor is a third of the total, so it gets a third of the voltage.",
        },
        {
          q: "Can you power a 3 V motor from a 9 V battery with a voltage divider?",
          choices: ["Yes, if the resistors are right", "No: the motor's current would drag the divider's output down"],
          answer: 1,
          explain: "A motor is a heavy load. It would sit in parallel with the bottom resistor and collapse the output. Use a regulator for power.",
        },
      ],
    },
  ],
};
