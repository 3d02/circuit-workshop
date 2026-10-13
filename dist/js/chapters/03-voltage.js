import { landscape } from "../plots.js";
import { series } from "../format.js";

const OHMS = series(100, 10000);

export default {
  id: "voltage",
  title: "Voltage is a difference in height",
  lede: "Voltage is the push that drives current round a loop. But it never belongs to a single point. It's always a difference between two points, like height on a hill.",
  minutes: 15,
  goals: [
    "Explain voltage as a difference between two points",
    "Use ground as your 0 V reference",
    "Predict how a battery's voltage is shared between parts in a loop",
    "Use the rule that a working wire has no voltage across it",
  ],
  blocks: [
    `<p>If current is <em>how much</em> charge flows, voltage is <em>how hard</em> it's pushed. The most useful picture to hold in your head:</p>
     <p class="formula-block">voltage = height<small>A battery is a lift. Every part is a slope back down.</small></p>
     <p>Where does the height come from? From the electric field you met in {{ch:inside}}. The voltage between two points is the push the field gives each coulomb of charge, added up along the way from one point to the other: the energy per coulomb. “9 volts” means 9 joules of energy for every coulomb that goes round.</p>
     <p>A 9 V battery lifts charge up 9 volts. The charge then rolls back down through the parts of the circuit, giving up its energy as it goes: as light in a lamp, as heat in a resistor. By the time it's back at the battery, it's at the bottom again, ready for another lift.</p>`,
    {
      type: "formula",
      id: "volt",
      name: "Voltage: energy per charge",
      eq: "V = E ÷ Q",
      alt: ["E = Q × V"],
      vars: [
        ["V", "voltage between two points", "volts, V"],
        ["E", "energy gained or given up (not the field from {{ch:inside}})", "joules, J"],
        ["Q", "charge moved between the points", "coulombs, C"],
      ],
      why: `<p>This is what a volt <em>is</em>: one joule of energy for every coulomb that moves between the two points. The field from {{ch:inside}} does that work on the charge as it goes.</p>`,
      use: `<p>Working out the energy a battery delivers, and why the same charge through a higher voltage does more: a coulomb through a 230 V heater delivers 230 J, through a 1.5 V torch only 1.5 J. Physicists also measure tiny energies in <em>electron-volts</em>: the energy one electron gains crossing 1 V. You'll meet them in {{ch:leds}}.</p>`,
      example: `<p>2 C of charge flows through a lamp on a 9 V battery. How much energy does the lamp turn into light and heat?</p>
                <span class="calc">E = Q × V = 2 C × 9 V = 18 J</span>`,
    },
    { type: "h2", text: "Ground: where you measure from" },
    `<p>Height needs a reference. On a map it's sea level. In a circuit, we pick one point and call it <strong>0 V</strong>, or <strong>ground</strong>, drawn with this symbol: <span class="inline-ground" aria-hidden="true"></span>. Every other voltage is measured from there. It's usually the battery's <b>−</b> terminal.</p>
     <p>In these figures, grey-green wires are at ground level. Warmer colours are higher up.</p>`,
    {
      type: "note",
      kind: "myth",
      title: "Ground is not (necessarily) the earth",
      html: `<p>In a battery circuit, “ground” is simply the reference point you've chosen. It isn't connected to the soil outside. Mains wiring has a separate <em>protective earth</em> wire for safety, and that's a different thing.</p>`,
    },
    { type: "h2", text: "Walk around the loop" },
    `<p>Here's a 9 V battery driving two resistors, one after the other. Below the circuit, the loop has been “unrolled”: walk from the battery's − terminal, up through the battery, along the wire, down through R1, then down through R2, and back. The line shows how high you are at each step.</p>`,
    {
      type: "predict",
      id: "v-share",
      figure: "land",
      q: "Suppose R1 and R2 are equal. What voltage would point B, between them, be at?",
      choices: ["9 V: the full battery voltage", "4.5 V: half way", "0 V"],
      answer: 1,
      why: ["Point B still has R2 between it and ground, and R2 takes its share of the drop.", "", "B is above R2, so it's higher than ground by however much R2 drops."],
      explain: `<p>Two equal slopes share the descent equally: the charge drops 4.5 V through R1 and another 4.5 V through R2. Point B sits half way up.</p>
                <p>When resistors aren't equal, the bigger resistance takes the bigger share of the voltage. Move the sliders and watch the slopes change.</p>`,
      reveal: (fig) => {
        fig.set("R1", "r", 1000);
        fig.set("R2", "r", 1000);
        fig.set("B1", "v", 9);
      },
      revealLabel: "Make them equal",
    },
    {
      type: "figure",
      id: "land",
      spec: {
        title: "A 9 V battery and two resistors",
        iScale: 0.004,
        parts: [
          { id: "B1", type: "battery", a: [1, 2], b: [1, 4], v: 9, r: 0.05, labelSide: "left" },
          { id: "R1", type: "resistor", a: [4, 0], b: [6, 0], r: 1000, label: (p) => `R1 · ${fmtOhms(p.r)}` },
          { id: "R2", type: "resistor", a: [9, 1], b: [9, 3], r: 2200, label: (p) => `R2 · ${fmtOhms(p.r)}` },
          { type: "label", at: [2.5, 0], text: "A" },
          { type: "label", at: [7.5, 0], text: "B" },
          { type: "label", at: [5, 5], text: "C", side: "below" },
          { type: "ground", at: [1, 5] },
        ],
        wires: ["1,2 1,0 4,0", "6,0 9,0 9,1", "9,3 9,5 1,5 1,4"],
        controls: [
          { label: "Battery", part: "B1", prop: "v", min: 1.5, max: 12, step: 0.5, unit: "V" },
          { label: "R1", part: "R1", prop: "r", values: OHMS, unit: "Ω" },
          { label: "R2", part: "R2", prop: "r", values: OHMS, unit: "Ω" },
        ],
        readouts: [
          { label: "Height of A", value: (q) => q.v("A"), unit: "V" },
          { label: "Height of B", value: (q) => q.v("B"), unit: "V" },
          { label: "Height of C", value: (q) => q.v("C"), unit: "V" },
          { label: "Current", value: (q) => q.i("R1"), unit: "A" },
        ],
        goals: [
          { id: "v-half", text: "Put point B exactly half way up (half the battery voltage)", test: (q) => Math.abs(q.v("B") - q.part("B1").v / 2) < 0.01 * q.part("B1").v },
          { id: "v-3v", text: "Make point B sit at 3.0 V (±0.1 V)", test: (q) => Math.abs(q.v("B") - 3) < 0.1 },
        ],
        extras: [landscape({ path: [["B1", 1, 0], ["R1", 0, 1], ["R2", 0, 1]], names: { B1: "battery", R1: "R1", R2: "R2" } })],
      },
    },
    `<p>Three things to notice in the landscape:</p>
     <ul>
       <li><strong>Wires are flat.</strong> Walking along a wire, your height doesn't change. A wire has (almost) no voltage across it.</li>
       <li><strong>Bigger resistance, bigger drop.</strong> The same current flows through both resistors, so the one that's harder to push through takes more of the voltage.</li>
       <li><strong>You always come back to where you started.</strong> However the voltage is shared, the drops add up to exactly what the battery lifted. Engineers call this <em>Kirchhoff's voltage law</em>, and you'll use it constantly. If a 9 V battery feeds an LED that takes 2 V, the resistor in series with it must take the other 7 V.</li>
     </ul>`,
    {
      type: "formula",
      id: "kvl",
      name: "Kirchhoff's voltage law",
      eq: "V<sub>source</sub> = V₁ + V₂ + V₃ + …",
      vars: [
        ["V<sub>source</sub>", "the lift: the battery's voltage", "volts, V"],
        ["V₁, V₂…", "the drop across each part, all the way round one loop", "volts, V"],
      ],
      why: `<p>Voltage is like height: walk all the way round a loop and you end up where you started, so every metre climbed is a metre descended. In energy terms, each coulomb gives up in the parts exactly the energy the battery gave it.</p>`,
      use: `<p>Every series circuit, and every fault-finding session: if the drops you measure don't add up to the supply, something you haven't measured (a bad joint, a corroded contact) is taking the rest.</p>`,
      example: `<p>A 9 V battery drives a red LED (2.0 V) and a resistor in series. What's across the resistor?</p>
                <span class="calc">9 = 2.0 + V<sub>R</sub>  →  V<sub>R</sub> = 7.0 V</span>`,
    },
    {
      type: "note",
      kind: "deeper",
      title: "Why is the battery's lift slightly less than 9 V?",
      html: `<p>Real batteries have a little resistance inside them, so a bit of the lift is lost inside the battery itself whenever current flows. The more current you draw, the more the voltage at the terminals sags. That's why a weak battery can measure 9 V on a meter (which draws almost no current) and still fail to run a motor.</p>`,
    },
    { type: "h2", text: "A wire with voltage across it is a broken wire" },
    `<p>Below, a 9 V battery runs a lamp. Two <em>voltmeters</em> (V) are connected. A voltmeter measures the height difference between its two leads, and draws almost no current. V2 is across the lamp. V1 has both of its leads on the same piece of wire.</p>`,
    {
      type: "predict",
      id: "v-wire",
      figure: "gap",
      q: "What does V1 read, with both leads on the same wire?",
      choices: ["0 V", "Half the battery voltage", "The full 9 V"],
      answer: 0,
      why: ["", "There's nothing between V1's leads that could drop any voltage.", "That's what V2 reads, across the lamp. V1's leads have only a wire between them."],
      explain: `<p>A wire is flat ground in the landscape: no change in height along it, so no voltage across it. All 9 V is dropped across the lamp, which is exactly what V2 shows.</p>`,
      reveal: (fig) => {
        fig.highlight("V1");
        setTimeout(() => fig.highlight("V1", false), 3000);
      },
      revealLabel: "Point out V1",
    },
    {
      type: "figure",
      id: "gap",
      spec: {
        title: "Two voltmeters",
        iScale: 0.3,
        cuttable: true,
        parts: [
          { id: "B1", type: "battery", a: [1, 2], b: [1, 4], v: 9, r: 0.05, labelSide: "left" },
          { id: "V1", type: "voltmeter", a: [3, -2], b: [7, -2], labelSide: "above" },
          { id: "L1", type: "lamp", a: [10, 1.5], b: [10, 3.5], r: 30, rated: 2.7 },
          { id: "V2", type: "voltmeter", a: [12, 1.5], b: [12, 3.5], labelSide: "right" },
          { type: "text", at: [5, -0.45], text: "the wire V1 is measuring", cls: "annotation small" },
        ],
        wires: ["1,2 1,0 3,0 7,0 10,0 10,1.5", "3,0 3,-2", "7,0 7,-2", "10,0 12,0 12,1.5", "10,3.5 10,5 1,5 1,4", "12,3.5 12,5 10,5"],
        status: (q) =>
          q.across("V1") > 1
            ? { text: "Broken wire: the whole 9 V now appears across the gap, and the lamp, with no current, has 0 V across it.", level: "warn" }
            : "V1 reads 0 V: there's no voltage along an intact wire. V2 shows all 9 V dropped across the lamp.",
        goals: [{ id: "v-gap", text: "Cut the wire between V1's two leads. What does V1 read now?", test: (q) => q.across("V1") > 8.5, hold: 0.6 }],
      },
    },
    `<p>When the wire breaks, the charge piles up on one side of the gap and drains away on the other, so the full battery voltage appears <em>across the gap</em>. Meanwhile the lamp, with no current through it, has no voltage across it at all.</p>`,
    {
      type: "note",
      kind: "repair",
      title: "The most useful fault-finding rule there is",
      html: `<p>In a circuit that should be working, measure across each wire, connector, switch and fuse in turn. They should all read (nearly) 0 V. <strong>The one with the full supply voltage across it is your break.</strong> You'll do exactly this in the fault-finding chapter.</p>`,
    },
    {
      type: "bench",
      id: "bench-pack",
      title: "Batteries in series add up",
      intro: "A battery holder joins cells in series, one on top of the other. Kirchhoff's voltage law says the pack's voltage is the sum of the cells'. Check it, and meet the minus sign on purpose.",
      setup: { dial: "V, with ⎓ (DC) showing", leads: "black in COM, red in V Ω", need: "a 3 × AA holder with three cells in it" },
      steps: [
        "Black probe on the − end of one cell, red on its + end. Note the reading. The probes touch the holder's metal contacts or the cell ends; press firmly.",
        "Do the same for the other two cells.",
        "Now measure the whole pack: black on the holder's − lead (or its − terminal), red on its + lead.",
        "Swap the probes round on any measurement. The same number comes back with a minus sign: the red probe is now <em>lower</em> than the black one.",
      ],
      record: [
        { label: "Cell 1", unit: "V", min: 1.2, max: 1.65, ok: "A fresh alkaline cell reads about 1.5–1.6 V; rechargeable NiMH about 1.3–1.4 V when charged.", low: "Below 1.2 V an alkaline cell is mostly used up (a NiMH one is nearly flat).", high: "Above 1.65 V is unusual for a single AA. Is the dial on V ⎓, and is it really one cell?" },
        { label: "Whole pack", unit: "V", min: 3.6, max: 4.9, ok: "Now add your three cell readings on paper. They should come within a few millivolts of this.", low: "Low for three cells: one may be flat or reversed. A reversed cell subtracts instead of adding.", high: "That's more than three AAs can give. Check the holder." },
      ],
      expect: `<p>The three cells add up to the pack, give or take a few millivolts from rounding and contact pressure. That's Kirchhoff's voltage law in its simplest form: going up through three lifts in a row.</p>
               <p>With no current flowing, these are each cell's <em>open-circuit</em> voltages. Under load they'd sag a little, because of the cells' internal resistance. You'll measure that in {{ch:energy}}.</p>`,
    },
    {
      type: "problems",
      id: "v-p",
      title: "Voltage, on paper",
      items: [
        { id: "v-p1", level: 1, q: "<p>5 C of charge flows through a 12 V car lamp. How much energy does the lamp receive?</p>", unit: "J", answer: 60, hints: ["E = Q × V."], solution: "<p>E = Q × V = 5 × 12 = <b>60 J</b>.</p>" },
        { id: "v-p2", level: 1, q: "<p>A 9 V battery drives a green LED, which takes 2.1 V, through a resistor. What voltage is across the resistor?</p>", unit: "V", answer: 6.9, hints: ["The drops round the loop add up to the battery's 9 V."], solution: "<p>9 = 2.1 + V<sub>R</sub>, so V<sub>R</sub> = <b>6.9 V</b>.</p>" },
        { id: "v-p3", level: 2, q: "<p>Three resistors in series run from a 12 V supply. Two of them have 3.3 V and 4.7 V across them. What's across the third?</p>", unit: "V", answer: 4.0, hints: ["12 = 3.3 + 4.7 + V₃."], solution: "<p>V₃ = 12 − 3.3 − 4.7 = <b>4.0 V</b>.</p>" },
        {
          id: "v-p4",
          level: 2,
          q: "<p>How much energy does a single electron gain when it's lifted through a 9 V battery? (Its charge is 1.6 × 10⁻¹⁹ C.)</p>",
          unit: "J",
          answer: 9 * 1.602e-19,
          hints: ["E = Q × V, with Q the charge of one electron."],
          solution: "<p>E = 1.6 × 10⁻¹⁹ × 9 = <b>1.44 × 10⁻¹⁸ J</b>. Physicists call this 9 electron-volts (9 eV): far handier for single particles.</p>",
        },
        {
          id: "v-p5",
          level: 3,
          q: "<p>In the landscape figure, a 9 V battery drives R1 = 1 kΩ and R2 = 2.2 kΩ in series. What voltage is point B at, between them, measured from ground? (Find the current first: the same current flows through both.)</p>",
          unit: "V",
          answer: (9 * 2200) / 3200,
          hints: ["Total resistance 3.2 kΩ, so I = 9 ÷ 3,200.", "B is above R2 by R2's drop: V = I × R2."],
          solution: "<p>I = 9 ÷ 3,200 = 2.81 mA. R2's drop = 0.00281 × 2,200 = <b>6.19 V</b>, so B sits 6.19 V above ground. Set the sliders above to 1 kΩ and 2.2 kΩ to check.</p>",
        },
      ],
    },
    {
      type: "quiz",
      id: "v-quiz",
      questions: [
        {
          q: "Your meter's black probe is on ground and its red probe is on some point. It reads 5 V. What does that mean?",
          choices: ["That point is 5 V higher than ground", "5 V is flowing through that point", "That point is storing 5 V of charge"],
          answer: 0,
          explain: "Voltage is always a difference between two points: here, between the red probe's point and ground.",
        },
        {
          q: "A 9 V battery powers a lamp and a resistor in a single loop. The lamp has 6 V across it. How much does the resistor have across it?",
          choices: ["9 V", "6 V", "3 V"],
          answer: 2,
          explain: "Going round the loop, the drops add up to the 9 V lift: 9 − 6 = 3 V.",
        },
        {
          q: "A circuit doesn't work. You measure 9 V across a switch that is supposed to be closed. What does that tell you?",
          choices: ["The switch is broken: its contacts aren't touching", "The switch is working perfectly", "The battery is flat"],
          answer: 0,
          explain: "A closed switch should behave like a wire, with almost 0 V across it. Full supply voltage across it means the path is broken right there.",
        },
        {
          q: "What is “ground” in a battery circuit?",
          choices: ["The point we choose to call 0 V and measure from", "A wire connected to the earth outside", "The place where current gets used up"],
          answer: 0,
          explain: "It's a reference, like sea level. Usually it's the battery's negative terminal.",
        },
      ],
    },
  ],
};

function fmtOhms(r) {
  return r >= 1000 ? `${+(r / 1000).toPrecision(3)} kΩ` : `${r} Ω`;
}
