import { prefixLadder } from "../labs.js";

export default {
  id: "maths",
  title: "The maths toolkit",
  lede: "Almost every calculation in electronics uses the same five moves: prefixes, powers of ten, rearranging a formula, squares and roots, and a quick estimate to catch mistakes. Ten minutes here makes every later chapter easier.",
  minutes: 25,
  goals: [
    "Convert between mA and A, kΩ and Ω, µF and F without slipping a factor of 1,000",
    "Write very big and very small numbers as powers of ten, and use them on a calculator",
    "Rearrange any formula of the form A = B × C",
    "Estimate an answer in your head, so a wrong calculator answer looks wrong",
    "Use units to check that a formula makes sense",
  ],
  blocks: [
    `<p>If you've done physics at school, this is a recap; skim it and do the problems at the end. If it's been a while, take it slowly. Nothing here is harder than a shopping receipt, but a single slip in this chapter's skills is the most common way real circuits get damaged: a resistor ten times too small, or a current a thousand times too big.</p>`,
    { type: "h2", text: "Prefixes: the same number, written to fit" },
    `<p>Electronics deals in wildly different sizes. A phone charger delivers about 2 amps; an LED is happy with 0.010 amps; a meter's input draws 0.000 000 9 amps. Rather than juggling zeros, we use <strong>prefixes</strong> that stand for a power of a thousand:</p>
     <ul>
       <li><b>k</b> kilo = × 1,000 &nbsp;·&nbsp; <b>M</b> mega = × 1,000,000</li>
       <li><b>m</b> milli = ÷ 1,000 &nbsp;·&nbsp; <b>µ</b> micro = ÷ 1,000,000 &nbsp;·&nbsp; <b>n</b> nano = ÷ 10⁹ &nbsp;·&nbsp; <b>p</b> pico = ÷ 10¹²</li>
     </ul>
     <p>So 0.010 A is 10 mA, and 4,700 Ω is 4.7 kΩ. Case matters: <b>m</b> is a thousandth, <b>M</b> is a million. Type a value below and see it with every prefix; the highlighted one is how people would normally write it.</p>`,
    { type: "custom", wide: false, render: (el) => prefixLadder(el) },
    {
      type: "formula",
      id: "base-units",
      name: "The golden rule for prefixes",
      eq: "convert → calculate → convert back",
      vars: [
        ["mA", "÷ 1,000 to get A", "milliamps → amps"],
        ["kΩ", "× 1,000 to get Ω", "kilohms → ohms"],
        ["µF", "÷ 1,000,000 to get F", "microfarads → farads"],
      ],
      why: `<p>The formulas in this course are written for <em>base units</em>: volts, amps, ohms, farads, seconds. They're only guaranteed to work when every number goes in that way. Mixing mA with V and kΩ can happen to come out right (mA × kΩ = V), but that's a trick to learn later, not a habit to start with.</p>`,
      use: `<p>Every calculation. When an answer looks a thousand times too big or too small, the slip is almost always here.</p>`,
      example: `<p>A 9 V battery drives 470 Ω. What current flows?</p>
                <span class="calc">I = V ÷ R = 9 ÷ 470 = 0.0191 A</span>
                <p>Then convert back to something readable: 0.0191 A × 1,000 = <b>19.1 mA</b>.</p>`,
    },
    { type: "h2", text: "Powers of ten" },
    `<p>Some numbers in physics are too big or too small even for prefixes. One electron carries 0.000 000 000 000 000 000 16 coulombs. Writing that as <b>1.6 × 10⁻¹⁹</b> is far less error-prone: the small number −19 says how many places the decimal point moves (left, because it's negative).</p>
     <p>Calculators write it as <code>1.6E-19</code> (on a phone calculator, turn it sideways or look for <code>EE</code> or <code>×10ˣ</code>). Two rules do almost all the work:</p>
     <ul>
       <li><b>Multiplying, add the powers:</b> 10³ × 10⁻⁶ = 10⁻³.</li>
       <li><b>Dividing, subtract them:</b> 10⁶ ÷ 10² = 10⁴, and 1 ÷ 10⁻¹⁹ = 10¹⁹.</li>
     </ul>
     <p>Example: how many electrons pass each second when 1 A flows? One amp is one coulomb per second, so it's 1 ÷ (1.6 × 10⁻¹⁹) = 6.25 × 10¹⁸ electrons: six and a quarter billion billion.</p>`,
    { type: "h2", text: "Rearranging: one shape covers most formulas" },
    `<p>Most of the formulas you'll meet have the same shape: one quantity equals two others multiplied together. V = I × R, P = V × I, Q = I × t, Q = C × V, E = P × t. Learn to rearrange this one shape and you've learned them all.</p>`,
    {
      type: "formula",
      id: "product",
      name: "The product shape",
      eq: "A = B × C",
      alt: ["B = A ÷ C", "C = A ÷ B"],
      vars: [
        ["A", "the product: the one on its own", ""],
        ["B, C", "the two factors multiplied together", ""],
      ],
      why: `<p>An equation stays true if you do the same thing to both sides. Divide both sides of A = B × C by C and the C's cancel on the right: A ÷ C = B.</p>`,
      use: `<p>V = I × R gives I = V ÷ R and R = V ÷ I. P = V × I gives I = P ÷ V: a 2,000 W kettle on 230 V draws 2,000 ÷ 230 = 8.7 A.</p>`,
      example: `<p>A resistor has 5 V across it and 2 mA through it. What is its resistance?</p>
                <span class="calc">V = I × R  →  R = V ÷ I = 5 ÷ 0.002 = 2,500 Ω = 2.5 kΩ</span>`,
    },
    {
      type: "note",
      kind: "analogy",
      title: "The cover-up triangle, and why you'll outgrow it",
      html: `<p>Many people learn V = I × R as a triangle with V on top and I and R underneath: cover the one you want and the other two show you what to do. It works for this shape and nothing else. The rule <em>do the same to both sides</em> works for every formula you'll meet, including the ones with squares and fractions below.</p>`,
    },
    { type: "h2", text: "Squares and square roots" },
    `<p>A few formulas contain a square. The heat in a resistor is P = I² × R: double the current and the heat goes up four times. To undo a square, take the square root.</p>`,
    {
      type: "formula",
      id: "square",
      name: "Undoing a square",
      eq: "A = B² × C",
      alt: ["B = √(A ÷ C)"],
      vars: [
        ["B²", "B × B", ""],
        ["√", "square root: the number that, times itself, gives what's inside", ""],
      ],
      why: `<p>Divide both sides by C to get B² = A ÷ C, then take the square root of both sides.</p>`,
      use: `<p>Finding the most current a resistor can safely carry from its power rating: I = √(P ÷ R).</p>`,
      example: `<p>What's the most current a 470 Ω, ¼ W resistor can take?</p>
                <span class="calc">I = √(P ÷ R) = √(0.25 ÷ 470) = √0.000532 = 0.0231 A = 23 mA</span>`,
    },
    { type: "h2", text: "Reciprocals" },
    `<p>The <em>reciprocal</em> of a number is 1 divided by it: the reciprocal of 4 is 0.25. You'll need it for resistors side by side in {{ch:dividers}}, where the rule is 1/R = 1/R₁ + 1/R₂. Work it in three steps: take each reciprocal, add them, then take the reciprocal of the total. For two 100 Ω resistors: 1/100 + 1/100 = 0.02, and 1 ÷ 0.02 = 50 Ω.</p>`,
    { type: "h2", text: "Percentages" },
    `<p>Percentages appear on every part and every meter. A resistor marked 1 kΩ ±5% may be anywhere from 950 to 1,050 Ω. Your meter's accuracy is written like ±(0.3% + 2 digits): you'll take that apart in {{ch:multimeter}}. To find 5% of something, multiply by 0.05.</p>`,
    { type: "h2", text: "Estimate first" },
    `<p>Before you press a single calculator key, round every number to one digit and do it in your head. 9 V ÷ 470 Ω is about 10 ÷ 500 = 0.02 A, or 20 mA. If the calculator then says 19.1 mA, good. If it says 0.0191 mA or 19,100 mA, you know you've slipped a prefix, before you build anything.</p>
     <p>Engineers do this constantly. It isn't laziness: it's the fastest way to catch the mistakes that cost parts.</p>`,
    { type: "h2", text: "Let the units check your formula" },
    `<p>Units multiply and divide like numbers, so they can catch a wrong formula. Volts divided by ohms gives amps. Volts times amps gives watts. Amps times seconds gives coulombs. If you're after a current and your working ends in V × Ω, you've used the formula upside down.</p>
     <p>This also explains units that look odd at first. A battery's <b>mAh</b> is milliamps × hours: a current multiplied by a time, which is an amount of charge.</p>`,
    {
      type: "problems",
      id: "maths-p",
      title: "The toolkit, on paper",
      items: [
        { id: "maths-p1", level: 1, q: "<p>Write 0.047 A in milliamps.</p>", unit: "mA", answer: 47, hints: ["Milli means a thousandth, so there are 1,000 mA in 1 A.", "Multiply by 1,000."], solution: "<p>0.047 × 1,000 = <b>47 mA</b>.</p>" },
        { id: "maths-p2", level: 1, q: "<p>Write 3.3 kΩ in ohms.</p>", unit: "Ω", answer: 3300, hints: ["Kilo means × 1,000."], solution: "<p>3.3 × 1,000 = <b>3,300 Ω</b>.</p>" },
        { id: "maths-p3", level: 1, q: "<p>A capacitor is marked 100 nF. How many microfarads is that?</p>", unit: "µF", answer: 0.1, hints: ["A microfarad is 1,000 nanofarads.", "Divide by 1,000."], solution: "<p>100 nF ÷ 1,000 = <b>0.1 µF</b>. (It's also 100,000 pF.)</p>" },
        {
          id: "maths-p4",
          level: 2,
          q: "<p>A resistor has 12 V across it and 30 mA flowing through it. What is its resistance? Rearrange V = I × R first.</p>",
          unit: "Ω",
          answer: 400,
          hints: ["R = V ÷ I.", "Convert 30 mA to amps first: 0.030 A."],
          solution: `<p>R = V ÷ I = 12 ÷ 0.030 = <b>400 Ω</b>.</p><p>Estimate check: 12 ÷ 0.03 is 1,200 ÷ 3 = 400. ✓</p>`,
        },
        {
          id: "maths-p5",
          level: 2,
          q: "<p>One electron carries 1.6 × 10⁻¹⁹ C. How many electrons make up a charge of 1 µC (10⁻⁶ C)?</p>",
          unit: "electrons",
          answer: 1e-6 / 1.6e-19,
          hints: ["Divide the total charge by the charge on one electron.", "10⁻⁶ ÷ 10⁻¹⁹: subtract the powers."],
          solution: `<p>10⁻⁶ ÷ (1.6 × 10⁻¹⁹) = (1 ÷ 1.6) × 10⁻⁶⁺¹⁹ = 0.625 × 10¹³ = <b>6.25 × 10¹²</b> electrons. You can type it as <code>6.25e12</code>.</p>`,
        },
        {
          id: "maths-p6",
          level: 2,
          q: "<p>A 1 kΩ resistor is rated ¼ W. Using P = I² × R, what is the largest current it can carry?</p>",
          unit: "mA",
          answer: Math.sqrt(0.25 / 1000) * 1000,
          hints: ["Rearrange: I = √(P ÷ R).", "√(0.25 ÷ 1,000) = √0.00025."],
          solution: `<p>I = √(P ÷ R) = √(0.25 ÷ 1,000) = √0.00025 = 0.0158 A = <b>15.8 mA</b>.</p>`,
        },
        {
          id: "maths-p7",
          level: 2,
          q: "<p>Two resistors, 220 Ω and 330 Ω, are side by side. Using 1/R = 1/R₁ + 1/R₂, what is their combined resistance?</p>",
          unit: "Ω",
          answer: 1 / (1 / 220 + 1 / 330),
          hints: ["1/220 = 0.004545 and 1/330 = 0.003030.", "Add them, then take 1 ÷ the total."],
          solution: `<p>1/220 + 1/330 = 0.004545 + 0.003030 = 0.007576. Then 1 ÷ 0.007576 = <b>132 Ω</b>.</p><p>Check: two resistors in parallel always come out <em>smaller</em> than the smaller one. ✓</p>`,
        },
        {
          id: "maths-p8",
          level: 3,
          q: "<p>Estimate in your head first, then calculate: a phone battery stores 4,000 mAh. If the phone draws an average of 250 mA, how many hours does it last?</p>",
          unit: "h",
          answer: 16,
          hints: ["mAh ÷ mA leaves hours: the milliamps cancel.", "Estimate: 4,000 ÷ 250 is the same as 16,000 ÷ 1,000."],
          solution: `<p>4,000 mAh ÷ 250 mA = <b>16 hours</b>. The units check: mA × h ÷ mA = h. ✓</p>`,
        },
      ],
    },
    {
      type: "bench",
      id: "bench-meet",
      title: "Meet your meter: find the prefixes",
      intro: "Before measuring anything real, get to know where the prefixes appear on your BM235. Nothing is connected for this one, so it's completely safe.",
      setup: { leads: "black in COM, red in the V Ω jack (the right-hand one)", need: "just the meter and its leads" },
      steps: [
        "Turn the dial to <b>Ω</b>. With the probe tips apart, the display shows <b>OL</b>: “over limit”, too much resistance to measure, which is what air is.",
        "Touch the two probe tips together. It drops to a fraction of an ohm, something like 0.1 Ω: that's the resistance of the leads themselves.",
        "Look at the small symbols next to the number. Touch your fingertips to the two probes (one on each), firmly. Your skin reads somewhere in the hundreds of kΩ or even MΩ, and the meter switches range by itself: watch the <b>k</b> or <b>M</b> appear.",
        "Turn to <b>V</b> with nothing connected. Press <b>SELECT</b> until the display shows <b>⎓</b> (DC); the other choices are <b>~</b> (AC) and VFD. It reads close to zero volts. Then turn to <b>mV</b>: the same nothing, but now in millivolts, so you'll see the last digits wander a little.",
        "Turn the dial back to <b>OFF</b>.",
      ],
      record: [{ label: "Leads touching together", unit: "Ω", min: 0, max: 0.5, ok: "That's typical: a tenth of an ohm or so for leads and contacts.", low: "Below zero means the meter is in relative mode (Δ on the display). Hold HOLD for a second to leave it.", high: "That's high for the leads alone. Check they're pushed fully into the sockets, and that the tips are clean." }],
      expect: `<p>The prefixes appear right on the display: <b>m</b>V, <b>k</b>Ω, <b>M</b>Ω. The meter picks the range automatically (autoranging) and shows the prefix that keeps the number readable, exactly like the ladder above.</p><p>Your skin's resistance depends on how damp your fingers are and how hard you press. Dampen your fingertips and try again: it drops a lot. This is the reason wet hands and electricity don't mix.</p>`,
    },
    {
      type: "quiz",
      id: "maths-quiz",
      questions: [
        { q: "What is 2.2 kΩ in ohms?", choices: ["22 Ω", "220 Ω", "2,200 Ω"], answer: 2, explain: "Kilo means × 1,000: 2.2 × 1,000 = 2,200 Ω." },
        { q: "Your calculator says the LED current is 0.0187 mA, but you estimated about 20 mA. What's most likely?", choices: ["The estimate was rough; trust the calculator", "A prefix slip: probably kΩ typed as Ω somewhere, or the other way round", "The LED is broken"], answer: 1, explain: "Being out by exactly 1,000 is the signature of a prefix slip. The estimate did its job." },
        { q: "P = I² × R. If you double the current through a resistor, the heat…", choices: ["doubles", "goes up four times", "stays the same"], answer: 1, explain: "The current is squared: 2² = 4." },
        { q: "Which unit is a current multiplied by a time?", choices: ["mAh", "W", "Ω"], answer: 0, explain: "mA × h is an amount of charge. That's how battery capacity is quoted." },
      ],
    },
  ],
};
