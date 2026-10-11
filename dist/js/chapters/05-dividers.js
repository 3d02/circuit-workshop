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
    `<p>Hover over each lamp to compare voltages and currents. The rules, written down:</p>
     <ul>
       <li><strong>Series resistances add:</strong> R<sub>total</sub> = R<sub>1</sub> + R<sub>2</sub>. Two 12 Ω lamps in series behave like one 24 Ω lamp.</li>
       <li><strong>Parallel resistances combine to less than the smallest one:</strong> two equal resistors in parallel make half the resistance. More paths, easier flow.</li>
     </ul>`,
    {
      type: "note",
      kind: "deeper",
      title: "The general parallel formula",
      html: `<p>For any two resistors in parallel: R<sub>total</sub> = (R<sub>1</sub> × R<sub>2</sub>) ÷ (R<sub>1</sub> + R<sub>2</sub>). For more than two, add up the <em>conductances</em> (1/R) and flip the result: 1/R<sub>total</sub> = 1/R<sub>1</sub> + 1/R<sub>2</sub> + 1/R<sub>3</sub> …</p>`,
    },
    { type: "h2", text: "Voltage dividers: making a smaller voltage" },
    `<p>Two resistors in series share the voltage in proportion to their resistance. Tap the point between them and you have a new, smaller voltage. This is a <strong>voltage divider</strong>, and it's everywhere: reading sensors, setting reference levels, scaling a big voltage down so a microcontroller can measure it.</p>
     <p class="formula-block">V<sub>out</sub> = V<sub>in</sub> × R<sub>bottom</sub> ÷ (R<sub>top</sub> + R<sub>bottom</sub>)</p>
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
