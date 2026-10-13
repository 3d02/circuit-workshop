// Datasheet excerpts are shown as tables in the style of a real datasheet. The values
// are typical of the named parts; each learner should read the datasheet of the exact
// part they buy, which the chapter says plainly.

const sheet = (title, sub, sections) => `
  <div class="ds">
    <div class="ds-head"><strong>${title}</strong><span>${sub}</span></div>
    ${sections
      .map(
        ([name, head, rows]) => `
      <div class="ds-sec">${name}</div>
      <div class="bm-table-wrap"><table class="ds-table">
        <thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>${rows.map((r) => `<tr${r.mark ? ' class="mark"' : ""}>${(r.cells || r).map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
      </table></div>`,
      )
      .join("")}
  </div>`;

const MOSFET = sheet("IRLZ44N-type logic-level N-channel MOSFET", "TO-220 package · typical values · read the datasheet for your exact part", [
  [
    "Absolute maximum ratings (T<sub>C</sub> = 25 °C unless noted)",
    ["Symbol", "Parameter", "Max", "Unit"],
    [
      ["V<sub>DS</sub>", "Drain–source voltage", "55", "V"],
      ["V<sub>GS</sub>", "Gate–source voltage", "±16", "V"],
      ["I<sub>D</sub>", "Continuous drain current, case at 25 °C", "47", "A"],
      ["P<sub>D</sub>", "Power dissipation, case held at 25 °C", "110", "W"],
      ["T<sub>J</sub>", "Junction temperature", "175", "°C"],
    ],
  ],
  [
    "Electrical characteristics (T<sub>J</sub> = 25 °C)",
    ["Symbol", "Parameter", "Min", "Typ", "Max", "Conditions"],
    [
      { cells: ["V<sub>GS(th)</sub>", "Gate threshold voltage", "1.0", "", "2.0 V", "V<sub>DS</sub> = V<sub>GS</sub>, I<sub>D</sub> = 250 µA"], mark: true },
      ["R<sub>DS(on)</sub>", "On-resistance", "", "", "0.022 Ω", "V<sub>GS</sub> = 10 V, I<sub>D</sub> = 25 A"],
      { cells: ["R<sub>DS(on)</sub>", "On-resistance", "", "", "0.025 Ω", "V<sub>GS</sub> = 5 V, I<sub>D</sub> = 25 A"], mark: true },
      ["R<sub>DS(on)</sub>", "On-resistance", "", "", "0.035 Ω", "V<sub>GS</sub> = 4 V, I<sub>D</sub> = 21 A"],
    ],
  ],
  [
    "Thermal resistance",
    ["Symbol", "Parameter", "Typ", "Max", "Unit"],
    [
      ["R<sub>θJC</sub>", "Junction to case", "", "1.4", "°C/W"],
      { cells: ["R<sub>θJA</sub>", "Junction to ambient air, no heatsink", "", "62", "°C/W"], mark: true },
    ],
  ],
]);

const BJT = sheet("BC547B small-signal NPN transistor", "TO-92 package · typical values", [
  [
    "Absolute maximum ratings",
    ["Symbol", "Parameter", "Max", "Unit"],
    [
      ["V<sub>CEO</sub>", "Collector–emitter voltage, base open", "45", "V"],
      { cells: ["I<sub>C</sub>", "Collector current", "100", "mA"], mark: true },
      ["P<sub>tot</sub>", "Total power dissipation, ambient 25 °C", "500", "mW"],
    ],
  ],
  [
    "Electrical characteristics (T<sub>A</sub> = 25 °C)",
    ["Symbol", "Parameter", "Min", "Typ", "Max", "Conditions"],
    [
      { cells: ["h<sub>FE</sub>", "DC current gain, group B", "200", "290", "450", "I<sub>C</sub> = 2 mA, V<sub>CE</sub> = 5 V"], mark: true },
      ["V<sub>CE(sat)</sub>", "Collector–emitter saturation voltage", "", "0.09", "0.25 V", "I<sub>C</sub> = 10 mA, I<sub>B</sub> = 0.5 mA"],
      { cells: ["V<sub>BE(on)</sub>", "Base–emitter on voltage", "0.58", "0.66", "0.70 V", "I<sub>C</sub> = 2 mA, V<sub>CE</sub> = 5 V"], mark: true },
    ],
  ],
]);

const LED = sheet("1 W white power LED on a 20 mm star board", "typical values for this class of part · they vary a lot between makers", [
  [
    "Absolute maximum ratings",
    ["Parameter", "Max", "Unit"],
    [
      { cells: ["DC forward current", "350", "mA"], mark: true },
      ["Peak pulsed current (1/10 duty, 0.1 ms)", "500", "mA"],
      ["Junction temperature", "120", "°C"],
      ["Reverse voltage", "not designed for reverse operation", ""],
    ],
  ],
  [
    "Characteristics at I<sub>F</sub> = 350 mA, T<sub>J</sub> = 25 °C",
    ["Parameter", "Min", "Typ", "Max", "Unit"],
    [
      { cells: ["Forward voltage V<sub>F</sub>", "2.9", "3.2", "3.5", "V"], mark: true },
      ["Luminous flux", "90", "110", "", "lm"],
      ["Viewing angle (half intensity)", "", "120", "", "°"],
      ["Thermal resistance, junction to star", "", "15", "", "°C/W"],
    ],
  ],
]);

export default {
  id: "datasheets",
  title: "Reading a datasheet",
  lede: "Every part comes with a datasheet: the manufacturer's promise of what it will and won't do. Reading one is a skill of its own, and it's what turns the formulas in this course into real parts you can trust.",
  minutes: 30,
  goals: [
    "Find your way round a datasheet: ratings, characteristics, graphs, thermal data, pinout",
    "Tell an absolute maximum from an operating value, and design inside it",
    "Use minimum and maximum values to design for the worst case",
    "Read the conditions under which a number was measured",
    "Work out a part's temperature from its power and thermal resistance",
  ],
  blocks: [
    `<p>Datasheets look intimidating: pages of tables and graphs, mostly about conditions you'll never meet. But they all follow the same plan, and for most jobs you need five or six numbers. This chapter walks through excerpts from the datasheets of the three parts in the flashlight project. The values are typical for those parts; when you buy yours, download the datasheet for the exact part number and maker, from the manufacturer's own website.</p>`,
    { type: "h2", text: "The plan every datasheet follows" },
    `<ol class="steps">
       <li><b>Features and summary</b> on the first page: what it is, the headline numbers, the package.</li>
       <li><b>Absolute maximum ratings</b>: the limits beyond which the part may be damaged, even briefly.</li>
       <li><b>Electrical characteristics</b>: what it actually does, as minimum, typical and maximum values, each measured under stated conditions.</li>
       <li><b>Typical performance graphs</b>: how those values change with current, voltage and temperature.</li>
       <li><b>Thermal data</b>: how hot it gets per watt.</li>
       <li><b>Package and pinout</b>: dimensions, and which leg is which.</li>
     </ol>`,
    { type: "h2", text: "Absolute maximum is not a target" },
    `<p>An absolute maximum is a cliff edge, not a speed limit. The part isn't promised to <em>work</em> there, only to survive briefly. Good designs stay well inside, typically using no more than half to three-quarters of a rating, a habit called <strong>derating</strong>. Heat, age and part-to-part spread all eat into the margin.</p>`,
    { type: "custom", wide: false, render: (el) => (el.innerHTML = MOSFET) },
    `<p>A few things to notice in the MOSFET's excerpt:</p>
     <ul>
       <li><strong>47 A sounds huge, but read the condition</strong>: with the case held at 25 °C. That needs a big heatsink. In free air, heat limits it to a watt or two, far below 47 A × anything.</li>
       <li><strong>R<sub>DS(on)</sub> depends on the gate voltage</strong>. At 10 V it's 0.022 Ω; at 4 V, 0.035 Ω. A part is “logic level” when it's specified at 4–5 V, so a microcontroller or a few battery cells can switch it fully on.</li>
       <li><strong>The threshold is a range</strong>: 1.0 to 2.0 V, measured at just 250 µA. At the threshold the MOSFET is barely on. Never design to it; design to the R<sub>DS(on)</sub> conditions.</li>
     </ul>`,
    { type: "h2", text: "Min, typ, max: design for the worst case" },
    `<p>“Typical” is what an average part does. Your part might be at either end of the range, and a circuit that only works with a typical part will fail on one in a few. So you design with the value that hurts most: the minimum gain when choosing a base resistor, the maximum forward voltage when checking a regulator's dropout, the minimum threshold when checking that a MOSFET will turn off.</p>`,
    { type: "custom", wide: false, render: (el) => (el.innerHTML = BJT) },
    `<p>The BC547B's gain runs from 200 to 450: more than a factor of two. A base resistor chosen with β = 290 would leave a β = 200 part under-driven. And its 100 mA rating means it's no good for the flashlight's 350 mA. It's perfect for the regulator's other job, though: the NPN that only ever carries a few microamps from the MOSFET's gate. Its V<sub>BE(on)</sub> of 0.58–0.70 V is the number that sets the flashlight's current.</p>`,
    { type: "custom", wide: false, render: (el) => (el.innerHTML = LED) },
    `<p>The LED's forward voltage spans 2.9 to 3.5 V. That's why its current needs regulating: across that spread, a fixed resistor from 4.8 V would give currents differing by a factor of two. And 350 mA is its <em>absolute</em> maximum, so the flashlight runs it at about 300 mA, a sensible margin that also keeps it cooler and lasts much longer.</p>`,
    { type: "h2", text: "Heat: thermal resistance" },
    `<p>Every watt a part dissipates has to flow out to the air, and the path has a <strong>[[thermal resistance]]</strong>: how many degrees warmer the inside of the part (its junction) gets for every watt flowing out. It works just like Ohm's law, with temperature as the voltage and power as the current.</p>`,
    {
      type: "formula",
      id: "thermal",
      name: "Junction temperature",
      eq: "T<sub>J</sub> = T<sub>A</sub> + P × R<sub>θ</sub>",
      vars: [
        ["T<sub>J</sub>", "temperature inside the part, at the junction", "°C"],
        ["T<sub>A</sub>", "ambient air temperature around it", "°C"],
        ["P", "power the part turns into heat", "watts, W"],
        ["R<sub>θ</sub>", "thermal resistance from the junction to the air (or through a heatsink)", "°C/W"],
      ],
      why: `<p>Heat flow is driven by a temperature difference, the way current is driven by a voltage. The steady temperature rise is the power times the thermal resistance: the thermal version of V = I × R. A heatsink lowers the resistance by giving the heat a bigger surface to leave from.</p>`,
      use: `<p>Checking whether a part needs a heatsink. Keep T<sub>J</sub> comfortably below the maximum (125–175 °C for silicon). Every 10 °C cooler roughly doubles an electronic part's life.</p>`,
      example: `<p>The flashlight's MOSFET dissipating 0.55 W in a 25 °C room, with no heatsink (62 °C/W):</p>
                <span class="calc">T<sub>J</sub> = 25 + 0.55 × 62 = 59 °C</span>
                <p>Warm to the touch, but far below 175 °C: no heatsink needed.</p>`,
    },
    {
      type: "bench",
      id: "bench-datasheet",
      title: "Find your own parts' datasheets",
      intro: "Do this with the parts in your own drawer. It's the habit that matters.",
      setup: { need: "your NPN transistors, a MOSFET, an LED or two, and a magnifier" },
      steps: [
        "Read the markings. Transistors and MOSFETs have their part number printed on the flat face (BC547B, 2N3904, IRLZ44N). LEDs usually have none: use the shop's listing.",
        "Search for the part number plus “datasheet”, and use the manufacturer's own site (onsemi, Nexperia, Infineon, Vishay…) rather than an aggregator, so you get the current version.",
        "For each transistor, write down: the pinout, the maximum collector or drain current, the maximum voltage, and the gain range or the R<sub>DS(on)</sub> and its gate voltage.",
        "Use diode-test mode to check the pinout you found: a good NPN shows about 0.6–0.7 V from base (red) to emitter and from base to collector, and OL the other way round.",
      ],
      expect: `<p>Three families of numbers matter most, every time: what it can survive (absolute maximum), what it actually does (characteristics, min to max), and how hot it gets (thermal). The diode-test check is a habit worth keeping: a wrong pinout is one of the most common reasons a first build doesn't work.</p>`,
    },
    {
      type: "problems",
      id: "ds-p",
      title: "Datasheets, on paper",
      items: [
        {
          id: "ds-p1",
          level: 1,
          q: "<p>Using the MOSFET excerpt: what is the most heat it can make, fully on at 4 V gate drive, carrying 2 A?</p>",
          unit: "W",
          answer: 4 * 0.035,
          hints: ["P = I² × R<sub>DS(on)</sub>, using the 4 V row: 0.035 Ω, the maximum."],
          solution: "<p>P = 2² × 0.035 = <b>0.14 W</b>, at most. Use the maximum, not the typical: that's the worst case.</p>",
        },
        {
          id: "ds-p2",
          level: 2,
          q: "<p>A BC547B must switch 50 mA with a 2× margin, from a 5 V pin. Using the <em>minimum</em> gain in the excerpt, what base current do you need?</p>",
          unit: "µA",
          answer: ((2 * 0.05) / 200) * 1e6,
          hints: ["I<sub>B</sub> = margin × I<sub>C</sub> ÷ β<sub>min</sub>.", "β<sub>min</sub> = 200."],
          solution: "<p>I<sub>B</sub> = 2 × 0.05 ÷ 200 = 0.0005 A = <b>500 µA</b>, then R<sub>B</sub> = (5 − 0.7) ÷ 0.0005 = 8.6 kΩ: use 8.2 kΩ.</p>",
        },
        {
          id: "ds-p3",
          level: 2,
          q: "<p>The MOSFET dissipates 0.8 W with no heatsink (62 °C/W) on a 30 °C day. What is its junction temperature?</p>",
          unit: "°C",
          answer: 30 + 0.8 * 62,
          hints: ["T<sub>J</sub> = T<sub>A</sub> + P × R<sub>θJA</sub>."],
          solution: "<p>T<sub>J</sub> = 30 + 0.8 × 62 = <b>80 °C</b>. Fine for a 175 °C part, though too hot to touch comfortably.</p>",
        },
        {
          id: "ds-p4",
          level: 3,
          q: "<p>With the MOSFET's 175 °C limit and a 50 °C safety margin, what is the most power it should dissipate without a heatsink in a 25 °C room?</p>",
          unit: "W",
          answer: (175 - 50 - 25) / 62,
          hints: ["Aim for T<sub>J</sub> = 175 − 50 = 125 °C.", "P = (T<sub>J</sub> − T<sub>A</sub>) ÷ R<sub>θJA</sub>."],
          solution: "<p>P = (125 − 25) ÷ 62 = <b>1.6 W</b>.</p>",
        },
        {
          id: "ds-p5",
          level: 3,
          q: "<p>The LED's forward voltage can be up to 3.5 V. The regulator needs about 0.6 V for its sense resistor and 0.2 V across the MOSFET. What is the lowest battery voltage that still regulates, in the worst case?</p>",
          unit: "V",
          answer: 3.5 + 0.6 + 0.2,
          hints: ["Add up the drops round the loop: Kirchhoff's voltage law."],
          solution: "<p>3.5 + 0.6 + 0.2 = <b>4.3 V</b>. Four NiMH cells sit at about 4.8–5.2 V for most of their discharge, so even a worst-case LED regulates for most of the battery's life. A typical 3.2 V LED regulates down to 4.0 V.</p>",
        },
      ],
    },
    {
      type: "quiz",
      id: "ds-quiz",
      questions: [
        { q: "A transistor's absolute maximum collector current is 100 mA. What should you design for?", choices: ["100 mA, to get the most from it", "Well below it: say 50–75 mA at most", "Anything: it's just a guideline"], answer: 1, explain: "Absolute maximums are survival limits, not operating points. Derate." },
        { q: "Which gain should you use to choose a base resistor?", choices: ["The minimum", "The typical", "The maximum"], answer: 0, explain: "The minimum gain needs the most base current. Design for it and every part works." },
        { q: "A MOSFET's R<sub>DS(on)</sub> is listed as 0.022 Ω at V<sub>GS</sub> = 10 V. You drive its gate from 3.3 V. What can you say?", choices: ["It'll be 0.022 Ω", "Nothing reliable: it isn't specified at 3.3 V, and may be far higher or barely on", "It'll be 0 Ω"], answer: 1, explain: "Specifications only hold under their stated conditions. Choose a part specified at your gate voltage." },
        { q: "Doubling the power in a part, with the same thermal resistance, doubles…", choices: ["its temperature in °C", "its temperature rise above the air", "nothing"], answer: 1, explain: "T<sub>J</sub> − T<sub>A</sub> = P × R<sub>θ</sub>: it's the rise that's proportional to the power." },
      ],
    },
  ],
};
