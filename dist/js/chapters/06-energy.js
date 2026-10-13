import { dischargeLab } from "../labs.js";

export default {
  id: "energy",
  title: "Energy, power and batteries",
  lede: "Every circuit runs on energy from somewhere. Learn to count it in joules, watt-hours and milliamp-hours, and you can say how long a torch will last, why a battery that measures fine still fails, and where the wasted energy goes.",
  minutes: 30,
  goals: [
    "Convert between joules, watt-hours and kilowatt-hours",
    "Turn a battery's mAh rating into energy and running time",
    "Explain from a discharge curve why a battery's usable capacity depends on the load",
    "Measure a battery's internal resistance, and use it to predict sag and short-circuit current",
    "Work out efficiency, and say where the lost energy goes",
  ],
  blocks: [
    `<p>Power tells you how fast energy is being converted; energy tells you how much, in total. A 2,000 W kettle and a 2 W night light differ in power. Whether either of them empties a battery depends on power <em>and</em> time.</p>`,
    { type: "h2", text: "Energy is power multiplied by time" },
    {
      type: "formula",
      id: "energy-time",
      name: "Energy and power",
      eq: "E = P × t",
      alt: ["P = E ÷ t", "t = E ÷ P"],
      vars: [
        ["E", "energy", "joules, J; or watt-hours, Wh"],
        ["P", "power", "watts, W"],
        ["t", "time", "seconds, s; or hours, h"],
      ],
      why: `<p>A watt is one joule per second, so a power multiplied by a number of seconds gives joules. Multiply watts by <em>hours</em> instead and you get <strong>[[watt-hours]]</strong>: 1 Wh = 1 W × 3,600 s = 3,600 J. A kilowatt-hour (kWh) is 1,000 Wh, or 3.6 million joules, and it's what your electricity bill counts.</p>`,
      use: `<p>Electricity bills, battery sizes, and comparing very different things in one unit. A phone battery holds about 17 Wh; a car's 12 V battery about 700 Wh; a Dutch household uses roughly 7–8 kWh a day.</p>`,
      example: `<p>A 2,000 W kettle runs for 3 minutes:</p>
                <span class="calc">E = 2,000 W × 0.05 h = 100 Wh = 0.1 kWh</span>
                <p>At €0.30 per kWh that's 3 cents. The same 0.1 kWh would run a 2 W night light for 50 hours.</p>`,
    },
    { type: "h2", text: "What's in a battery" },
    `<p>A battery's label usually gives its <strong>capacity</strong> in <strong>[[mAh]]</strong>: milliamps × hours, which is an amount of <em>charge</em>, as you saw in {{ch:inside}}. To know how much <em>energy</em> that is, multiply by the voltage, exactly as E = Q × V from {{ch:voltage}}.</p>
     <div class="bm-table-wrap"><table class="bm-table">
       <thead><tr><th>Battery</th><th>Voltage</th><th>Capacity</th><th>Energy</th></tr></thead>
       <tbody>
         <tr><td>AA alkaline (at low current)</td><td>1.5 V, falling as it drains</td><td>about 2,500 mAh</td><td>about 3 Wh</td></tr>
         <tr><td>AA NiMH rechargeable</td><td>1.2 V, nearly flat</td><td>about 2,000 mAh</td><td>about 2.4 Wh</td></tr>
         <tr><td>18650 Li-ion cell</td><td>3.6–3.7 V</td><td>about 3,000 mAh</td><td>about 11 Wh</td></tr>
         <tr><td>Phone battery</td><td>3.85 V</td><td>about 4,500 mAh</td><td>about 17 Wh</td></tr>
         <tr><td>Car battery</td><td>12 V</td><td>about 60,000 mAh (60 Ah)</td><td>about 700 Wh</td></tr>
       </tbody>
     </table></div>`,
    {
      type: "formula",
      id: "battery-energy",
      name: "Battery energy",
      eq: "E = Q × V",
      alt: ["Wh = Ah × V"],
      vars: [
        ["E", "energy stored", "watt-hours, Wh"],
        ["Q", "capacity, as charge", "amp-hours, Ah (1,000 mAh = 1 Ah)"],
        ["V", "the battery's average voltage while it discharges", "volts, V"],
      ],
      why: `<p>Each coulomb a battery pushes round the circuit carries V joules ({{ch:voltage}}). Multiply the total charge by the voltage and you have the total energy. In amp-hours and volts, the answer comes out in watt-hours.</p>`,
      use: `<p>Comparing batteries of different voltages fairly. A 10,000 mAh power bank (rated at its 3.7 V cell) holds 37 Wh, but it delivers at 5 V over USB, so after conversion losses it supplies only about 6,000–6,500 mAh at 5 V.</p>`,
      example: `<p>An 18650 cell rated 3,000 mAh at 3.6 V:</p>
                <span class="calc">E = 3.0 Ah × 3.6 V = 10.8 Wh</span>
                <p>Four NiMH AAs (4 × 2.0 Ah × 1.2 V) hold about 9.6 Wh: a similar amount, in four times the volume.</p>`,
    },
    {
      type: "formula",
      id: "runtime",
      name: "Running time",
      eq: "t = Q ÷ I",
      vars: [
        ["t", "how long the battery lasts", "hours, h"],
        ["Q", "capacity", "milliamp-hours, mAh"],
        ["I", "the current drawn", "milliamps, mA"],
      ],
      why: `<p>It's Q = I × t from {{ch:inside}}, rearranged: if the battery can supply Q of charge and the circuit takes I every hour, it lasts Q ÷ I hours. The milliamps cancel and leave hours.</p>`,
      use: `<p>Any battery-powered build, including the flashlight in the final project. It's an <em>upper</em> limit: the next section shows why real batteries deliver less, especially at high currents.</p>`,
      example: `<p>A torch draws 350 mA from 2,000 mAh rechargeable cells:</p>
                <span class="calc">t = 2,000 ÷ 350 = 5.7 hours</span>`,
    },
    { type: "h2", text: "Discharge curves: the label isn't the whole story" },
    {
      type: "predict",
      id: "energy-alk",
      q: "An alkaline AA is rated about 2,500 mAh. Roughly how long does it last at 1 A, before its voltage falls below 0.9 V?",
      choices: ["2.5 hours: 2,500 mAh ÷ 1,000 mA", "Under an hour", "About 25 hours"],
      answer: 1,
      why: ["That's what the simple formula says, and at low currents it's close. At 1 A an alkaline cell can't keep up.", "", "That would be the runtime at 100 mA, not 1 A."],
      explain: `<p>At 1 A an alkaline cell delivers well under half its rated charge. Two things conspire. The chemistry can't react fast enough at high currents, so less of it gets used. And the cell's <em>internal resistance</em> (next section) rises as it drains, so the voltage under load falls below the cut-off early. Set the lab below to alkaline at 1 A, then at 50 mA, and compare.</p>`,
    },
    `<p>Below, the voltage of a battery as it discharges at a steady current. The curve stops where the voltage falls too low to use: the dashed line. The grey part is energy left inside that you can't get at.</p>`,
    { type: "custom", render: (el) => dischargeLab(el, { chem: "alkaline", current: 0.1 }) },
    `<p>Three shapes worth remembering:</p>
     <ul>
       <li><strong>Alkaline</strong> starts at about 1.55 V and slides steadily down. Great for low-current, long-life things (clocks, remotes); poor for high-current ones.</li>
       <li><strong>NiMH</strong> sits almost flat near 1.2 V, then drops off a cliff. Lower voltage than alkaline, but it holds it, and it copes well with high currents.</li>
       <li><strong>Li-ion</strong> runs from 4.2 V full to about 3.0 V empty, mostly around 3.6–3.7 V. The most energy for its size and weight; it needs a proper charger and protection.</li>
     </ul>
     <p>The flat NiMH curve matters for the flashlight you'll build: a circuit that needs a minimum voltage gets almost all the energy from NiMH, but leaves a lot behind in a sliding alkaline cell.</p>`,
    { type: "h2", text: "Why the voltage sags: internal resistance" },
    `<p>A real battery behaves like a perfect voltage source with a small resistor hidden inside it, in series. The perfect source is called the <strong>[[EMF]]</strong> (ε, the Greek letter epsilon): the voltage you measure with nothing connected. The hidden resistor is the <strong>[[internal resistance]]</strong>, r. Draw current, and some of the voltage is lost across r before it reaches the terminals.</p>`,
    {
      type: "formula",
      id: "terminal",
      name: "Terminal voltage under load",
      eq: "V = ε − I × r",
      alt: ["r = (ε − V) ÷ I"],
      vars: [
        ["V", "voltage at the battery's terminals", "volts, V"],
        ["ε", "EMF: the open-circuit voltage", "volts, V"],
        ["I", "current being drawn", "amperes, A"],
        ["r", "internal resistance", "ohms, Ω"],
      ],
      why: `<p>It's Kirchhoff's voltage law with one more part in the loop: the battery's own resistance, which drops I × r like any resistor. It comes from the chemistry: ions moving through the paste, and the contacts and materials inside.</p>`,
      use: `<p>A weak battery can measure 1.5 V on your meter (which draws almost nothing, so I × r is tiny) and still fail to run a motor. Testing a battery properly means testing it under load. The same law is why a car's headlights dim while the starter motor turns.</p>`,
      example: `<p>A fresh AA: ε = 1.58 V, r = 0.15 Ω. At 1 A:</p>
                <span class="calc">V = 1.58 − 1 × 0.15 = 1.43 V</span>
                <p>Near the end of its life r might be 0.6 Ω: V = 1.58 − 0.6 = 0.98 V, and the torch goes dim.</p>`,
    },
    {
      type: "formula",
      id: "short-current",
      name: "Short-circuit current",
      eq: "I<sub>short</sub> = ε ÷ r",
      vars: [
        ["I<sub>short</sub>", "the current if the terminals are joined by a wire", "amperes, A"],
        ["ε", "EMF", "volts, V"],
        ["r", "internal resistance", "ohms, Ω"],
      ],
      why: `<p>With a near-zero resistance outside, the internal resistance is the only thing left to limit the current: I = ε ÷ r, from Ohm's law.</p>`,
      use: `<p>Safety. It's why shorting an AA makes a wire hot, and why a Li-ion cell, with its tiny internal resistance, can deliver over a hundred amps into a short and catch fire.</p>`,
      example: `<p>A fresh AA: 1.58 ÷ 0.15 ≈ 10 A. An 18650 Li-ion cell: 4.2 ÷ 0.03 = 140 A.</p>`,
    },
    {
      type: "bench",
      id: "bench-internal",
      title: "Measure a battery's internal resistance",
      intro: "The method: measure the voltage with no load, then with a known resistor across the battery. The difference is what's lost inside.",
      setup: { dial: "V, with ⎓ showing", leads: "black in COM, red in V Ω", need: "an AA cell, a 10 Ω resistor rated ½ W or more, two crocodile leads or a battery holder" },
      safety: "The resistor makes about a quarter of a watt and gets warm. Connect it for ten seconds at a time, not longer.",
      steps: [
        "Measure the cell with nothing connected: probes straight onto its two ends. This is ε. Write down all three decimals.",
        "Measure the resistor on Ω (relative mode zeroed, as in {{ch:resistance}}) so you know its real value.",
        "Back on V. Connect the resistor across the cell. Keep the probes on the cell's own ends (not on the holder's wires, whose contacts add resistance) and read the voltage after a couple of seconds. This is V.",
        "Disconnect the resistor. Work out I = V ÷ R, then r = (ε − V) ÷ I.",
      ],
      record: [
        { label: "ε, nothing connected", unit: "V", min: 1.2, max: 1.65, ok: "Note it to the millivolt.", low: "This cell is mostly used up; its internal resistance will be high, which makes it a good one to measure.", high: "Above 1.65 V is unusual for an AA. Is it a lithium AA (1.8 V when new)?" },
        { label: "V, with 10 Ω across it", unit: "V", min: 1.0, max: 1.64, ok: "Now take it from ε. A fresh alkaline cell drops roughly 15–40 mV; a NiMH only a few millivolts.", low: "A big drop: this cell's internal resistance is high. It's near the end of its life.", high: "Is the resistor really connected? V should be a little lower than ε." },
      ],
      expect: `<p>For a fresh alkaline AA you should find r somewhere around 0.1–0.3 Ω; for a charged NiMH, 0.02–0.05 Ω; for a tired alkaline, 0.5 Ω or more. Your meter's 1 mV resolution limits how precisely you can measure a NiMH's tiny drop, which is a nice lesson in itself: resolution decides what you can see.</p>`,
    },
    { type: "h2", text: "Efficiency: where the energy goes" },
    `<p>Energy is never used up, only converted: some of it into what you wanted (light, motion, sound), the rest into heat. <strong>[[Efficiency]]</strong> is the fraction that ends up useful.</p>`,
    {
      type: "formula",
      id: "efficiency",
      name: "Efficiency",
      eq: "η = P<sub>out</sub> ÷ P<sub>in</sub>",
      alt: ["P<sub>lost</sub> = P<sub>in</sub> − P<sub>out</sub>"],
      vars: [
        ["η", "efficiency (Greek eta), between 0 and 1, or as a percentage", "no unit"],
        ["P<sub>out</sub>", "useful power out", "watts, W"],
        ["P<sub>in</sub>", "power going in", "watts, W"],
      ],
      why: `<p>Conservation of energy: what goes in comes out, as something useful or as heat. Efficiency just says how big the useful share is.</p>`,
      use: `<p>Choosing how to power things. A simple way to run a 3.1 V LED from a 4.8 V battery is to drop the extra 1.7 V across a resistor or a transistor: that part then wastes (4.8 − 3.1) × I as heat. The flashlight project uses exactly this, and you'll calculate how much heat the transistor has to get rid of.</p>`,
      example: `<p>An LED at 3.1 V and 350 mA, fed from a 4.8 V battery through a regulator that just drops the difference:</p>
                <span class="calc">P<sub>out</sub> = 3.1 × 0.35 = 1.09 W   P<sub>in</sub> = 4.8 × 0.35 = 1.68 W   η = 1.09 ÷ 1.68 = 65%</span>
                <p>The missing 0.6 W warms the regulator. And the LED itself turns only about a third of its 1.09 W into light; the rest warms it too.</p>`,
    },
    {
      type: "note",
      kind: "safety",
      title: "Lithium cells deserve respect",
      html: `<ul>
        <li>Never short-circuit one, puncture one, or charge one with a charger meant for other chemistries.</li>
        <li>Buy cells from known brands and sellers. Fakes overstate their capacity and may lack protection.</li>
        <li>A swollen or hot cell should go outside, away from anything flammable, and to a battery recycling point once cool.</li>
        <li>NiMH rechargeables are a forgiving choice while you learn: that's what the flashlight project uses.</li>
      </ul>`,
    },
    {
      type: "problems",
      id: "energy-p",
      title: "Energy and batteries, on paper",
      items: [
        { id: "energy-p1", level: 1, q: "<p>A 60 W lamp is on for 5 hours. How much energy does it use, in kWh?</p>", unit: "kWh", answer: 0.3, hints: ["E = P × t = 60 W × 5 h, in watt-hours.", "Divide by 1,000 for kWh."], solution: "<p>60 × 5 = 300 Wh = <b>0.3 kWh</b>.</p>" },
        { id: "energy-p2", level: 1, q: "<p>An 18650 Li-ion cell is rated 3,000 mAh at 3.6 V. How much energy does it hold?</p>", unit: "Wh", answer: 10.8, hints: ["E = Q × V, with Q in Ah: 3.0 Ah."], solution: "<p>3.0 Ah × 3.6 V = <b>10.8 Wh</b>.</p>" },
        { id: "energy-p3", level: 2, q: "<p>A torch draws 350 mA from 2,000 mAh NiMH cells. Ignoring the curve's effects, how long does it run?</p>", unit: "h", answer: 2000 / 350, hints: ["t = Q ÷ I, in mAh and mA."], solution: "<p>2,000 ÷ 350 = <b>5.7 hours</b>. The lab above, set to NiMH and 350 mA, gives about 5.5 h: close, because NiMH holds its voltage well.</p>" },
        {
          id: "energy-p4",
          level: 2,
          q: "<p>A TV box draws 1.5 W on standby, all day, every day. How much energy does that use in a year, in kWh?</p>",
          unit: "kWh",
          answer: (1.5 * 24 * 365) / 1000,
          hints: ["Hours in a year: 24 × 365 = 8,760.", "E = 1.5 W × 8,760 h, then ÷ 1,000."],
          solution: "<p>1.5 × 8,760 = 13,140 Wh = <b>13.1 kWh</b>, about €4 a year at €0.30 per kWh. Small on its own; a house full of standby adds up.</p>",
        },
        {
          id: "energy-p5",
          level: 2,
          q: "<p>An AA reads 1.585 V with nothing connected, and 1.552 V with a 10.0 Ω resistor across it. What is its internal resistance?</p>",
          unit: "Ω",
          answer: (1.585 - 1.552) / (1.552 / 10),
          tol: 0.03,
          hints: ["First the current: I = V ÷ R = 1.552 ÷ 10.0.", "Then r = (ε − V) ÷ I."],
          solution: "<p>I = 1.552 ÷ 10.0 = 0.1552 A. r = (1.585 − 1.552) ÷ 0.1552 = 0.033 ÷ 0.1552 = <b>0.21 Ω</b>.</p>",
        },
        {
          id: "energy-p6",
          level: 3,
          q: "<p>A Li-ion cell has an EMF of 4.2 V and an internal resistance of 0.03 Ω. What current would flow through a dead short?</p>",
          unit: "A",
          answer: 140,
          hints: ["I = ε ÷ r."],
          solution: "<p>4.2 ÷ 0.03 = <b>140 A</b>. At that current the cell itself makes I² × r = 590 W of heat inside. That's how lithium fires start.</p>",
        },
        {
          id: "energy-p7",
          level: 3,
          q: "<p>An LED that needs 3.1 V is run at a steady current from a 4.8 V battery, with a transistor dropping the difference. What is the efficiency, as a percentage?</p>",
          unit: "%",
          answer: (3.1 / 4.8) * 100,
          hints: ["The same current flows through the LED and from the battery, so it cancels: η = (3.1 × I) ÷ (4.8 × I)."],
          solution: "<p>η = 3.1 ÷ 4.8 = 0.646 = <b>65%</b>. A switching converter could do better than 90%, at the cost of a far more complex circuit.</p>",
        },
      ],
    },
    {
      type: "quiz",
      id: "energy-quiz",
      questions: [
        { q: "What does a battery's mAh rating measure?", choices: ["Its voltage", "The charge it can deliver", "Its power"], answer: 1, explain: "Milliamps × hours is an amount of charge. Multiply by the voltage for energy." },
        { q: "A battery reads 1.5 V on your meter but can't run a motor. What's the most likely reason?", choices: ["The meter is wrong", "Its internal resistance is high, so the voltage collapses under load", "Motors need AC"], answer: 1, explain: "The meter draws almost no current, so I × r is tiny. Under the motor's current, the high r drops most of the voltage." },
        { q: "Which chemistry holds its voltage nearly flat until it's almost empty?", choices: ["Alkaline", "NiMH", "Both"], answer: 1, explain: "NiMH sits near 1.2 V for most of its discharge; alkaline slides steadily down." },
        { q: "A circuit takes 10 W in and delivers 7 W of useful output. Where are the other 3 W?", choices: ["Used up", "Turned into heat", "Stored in the circuit"], answer: 1, explain: "Energy is converted, never destroyed. The losses end up as heat." },
      ],
    },
  ],
};
