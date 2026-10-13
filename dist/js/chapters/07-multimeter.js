const LOOP = {
  parts: [
    { id: "B1", type: "battery", a: [1, 2], b: [1, 4], v: 9, r: 0.5, labelSide: "left" },
    { id: "S1", type: "switch", a: [3, 0], b: [5, 0], closed: true, name: "Power switch", label: "power", labelSide: "above" },
    { id: "R1", type: "resistor", a: [7, 0], b: [9, 0], r: 680, label: "680 Ω" },
    { id: "D1", type: "led", a: [11, 1.5], b: [11, 3.5], color: "red" },
    { type: "label", at: [2, 0], text: "A" },
    { type: "label", at: [6, 0], text: "B" },
    { type: "label", at: [10, 0], text: "C" },
    { type: "label", at: [6, 5], text: "D", side: "below" },
  ],
  wires: ["1,2 1,0 3,0", "5,0 7,0", "9,0 11,0 11,1.5", "11,3.5 11,5 1,5 1,4"],
};

const near = (a, b, tol) => Math.abs(a - b) <= tol;

export default {
  id: "multimeter",
  title: "Your multimeter: the basics",
  lede: "A multimeter answers three questions about a circuit: how big is the push between two points, how much charge is flowing, and how easily does a part let current through. Each question needs the probes in a different place. Getting that right is most of the skill.",
  minutes: 35,
  goals: [
    "Set your BM235 up for voltage, current, resistance, continuity and diode test",
    "Measure the voltage across a part, and explain a minus sign",
    "Measure current by making the meter part of the loop, then put the lead back",
    "Measure resistance only on unpowered parts",
    "Read every symbol on the display",
    "Avoid the classic way to blow a meter's fuse",
  ],
  blocks: [
    { type: "h2", text: "Three questions, three ways to connect" },
    `<p>Everything you've learned so far tells you where the probes go:</p>
     <ul>
       <li><strong>Voltage is a difference between two points</strong> ({{ch:voltage}}), so you measure it <em>across</em> something: one probe each side, in parallel with it. The meter barely disturbs the circuit, because on V it lets almost no current through itself.</li>
       <li><strong>Current is a flow through a path</strong> ({{ch:loop}}), so the meter has to become <em>part of</em> the path: you open the loop and let the meter close it, in series.</li>
       <li><strong>Resistance is how a part responds to a push</strong> ({{ch:resistance}}), so the meter supplies its own small push and measures the response. Any other source in the circuit would spoil that, so the part must be unpowered.</li>
     </ul>`,
    { type: "h2", text: "The four sockets on your BM235" },
    `<p>Along the bottom of the meter are four sockets, called jacks. What's behind each one explains the rules:</p>
     <ul>
       <li><strong>COM</strong>: the black lead, always. It's the reference: every reading is the red probe's value <em>relative to</em> the black one.</li>
       <li><strong>V Ω</strong>: the red lead, for everything except current. Behind it sits a 10 MΩ chain of resistors, so the meter draws less than a microamp from what it measures. That's its [[input impedance]].</li>
       <li><strong>mA µA</strong>: the red lead, for currents up to 400 mA. Behind it the current flows through a small, precise resistor called a [[shunt]] (1.9 Ω, or 100 Ω on the µA position) and a 400 mA fuse.</li>
       <li><strong>A</strong>: the red lead, for currents up to 10 A. Behind it is a 0.04 Ω shunt and an 11 A fuse.</li>
     </ul>
     <p>Notice what the two current jacks have in common: almost no resistance. That's what makes them good at measuring current, and it's also what makes them dangerous in the wrong place.</p>`,
    { type: "h2", text: "Voltage: across" },
    `<p>The simulated meter below works on the live circuit. <strong>Drag the probe tips onto the wires</strong> (the black one has already been clipped to point D, the bottom wire). Choose a mode with the buttons on the meter.</p>`,
    {
      type: "figure",
      id: "basics",
      spec: {
        title: "An LED circuit on the bench",
        iScale: 0.015,
        ...LOOP,
        meter: { start: { black: "D" } },
        controls: [{ type: "toggle", label: "Power switch on", part: "S1", prop: "closed" }],
        goals: [
          { id: "m-batt", text: "Measure the battery's voltage (V mode)", test: (q) => q.meter?.mode === "V" && q.meter.attached && q.meter.value > 8.5 },
          { id: "m-led", text: "Measure the voltage across just the LED", test: (q) => q.meter?.mode === "V" && q.meter.attached && near(Math.abs(q.meter.value), q.across("D1"), 0.05) && q.across("D1") > 1.6 },
          { id: "m-neg", text: "Swap the probes round on any measurement. What does the minus sign mean?", test: (q) => q.meter?.mode === "V" && q.meter.attached && q.meter.value < -1 },
          { id: "m-ohms", text: "Measure the resistor's resistance (Ω mode). Switch the power off first!", test: (q) => q.meter?.mode === "R" && !q.meter.live && near(q.meter.value, 680, 15) },
          { id: "m-beep", text: "Use continuity mode (🔊) to check that a wire is unbroken", test: (q) => q.meter?.mode === "C" && q.meter.beep },
        ],
      },
    },
    `<p>A few things you just discovered:</p>
     <ul>
       <li><strong>Voltage is measured across something</strong>: one probe each side. Point A to D gives the battery; B to C gives the resistor; C to D gives the LED. They add up, as Kirchhoff's voltage law says they must.</li>
       <li><strong>A minus sign isn't an error.</strong> The display always shows red minus black. A minus means the red probe is <em>lower</em> than the black one. Handy: it tells you which way round things are.</li>
       <li><strong>Resistance mode works by sending its own small current</strong> through the part, about 0.16 mA on the BM235's lowest range, and measuring the voltage it causes: R = V ÷ I. If the circuit is powered, its own currents scramble that.</li>
       <li><strong>Continuity</strong> is resistance mode with a beeper: it beeps for a low resistance, so you can check wires and joints without looking at the display.</li>
     </ul>`,
    {
      type: "note",
      kind: "repair",
      title: "Measuring the resistor in place worked here. Why?",
      html: `<p>With the switch off, the resistor's only other path is through the LED and the open switch: effectively nothing. On a real board, other parts are often connected across the same two points, in parallel, and the reading comes out lower than the true value ({{ch:dividers}}). Lift one leg if a reading looks wrong.</p>`,
    },
    { type: "h2", text: "Reading the display" },
    `<p>The number is only half the reading. The small symbols around it say what the number means:</p>
     <div class="bm-table-wrap"><table class="bm-table">
       <thead><tr><th>You see</th><th>It means</th></tr></thead>
       <tbody>
         <tr><td><b>⎓</b> or <b>~</b></td><td>DC or AC. Check it every time: the meter remembers whichever you chose last in each dial position.</td></tr>
         <tr><td><b>m</b>, <b>k</b>, <b>M</b>, <b>µ</b>, <b>n</b></td><td>The prefix ({{ch:maths}}). 4.700 kΩ is 4,700 Ω.</td></tr>
         <tr><td><b>AUTO</b></td><td>Auto-ranging: the meter picks the range that shows the most digits.</td></tr>
         <tr><td><b>−</b> before the number</td><td>The red probe is lower than the black one.</td></tr>
         <tr><td><b>OL</b></td><td>“Over limit”: too big for the range. In Ω or continuity mode with nothing connected, it means no path at all.</td></tr>
         <tr><td><b>H</b></td><td>HOLD: the display is frozen. Press HOLD again to release it.</td></tr>
         <tr><td><b>Δ</b></td><td>[[Relative mode]]: readings are differences from a stored value. Hold HOLD for a second to switch it on or off.</td></tr>
         <tr><td><b>InEr</b> and a beep</td><td>A lead is in a current jack while the dial is on something else. Move it back to V Ω now.</td></tr>
         <tr><td>Battery symbol</td><td>The meter's own batteries are low. Readings may be wrong: replace them first.</td></tr>
       </tbody>
     </table></div>`,
    { type: "h2", text: "Measuring current: the meter joins the loop" },
    `<p>To measure the current in a wire, that current has to flow <em>through</em> the meter. So you must break the circuit and let the meter close the gap, exactly like the ammeters in {{ch:loop}}. In current mode, the meter's insides are nearly a plain piece of wire: just the shunt and the fuse.</p>`,
    {
      type: "predict",
      id: "meter-across",
      q: "In current mode the meter is almost a plain wire. What happens if you put its probes straight across the battery's terminals?",
      choices: ["It shows how much current the battery can supply", "It short-circuits the battery, and the meter's fuse blows", "It shows the battery voltage instead"],
      answer: 1,
      why: ["It would try to, by letting the battery push as much current as it possibly can through it. That's a short circuit.", "", "The meter can't tell what you meant. In current mode it's a near-zero resistance, wherever you put it."],
      explain: `<p>Across the battery, the meter is a [[short circuit]], and the current is limited only by the battery's internal resistance ({{ch:energy}}). Meters protect themselves with a fuse inside, and this is the most common way people blow one: measuring current, then forgetting to move the red lead back, and touching the probes across a supply. Your BM235 helps: if a lead is in a current jack while the dial is elsewhere, it beeps and shows <b>InEr</b>.</p>`,
    },
    {
      type: "figure",
      id: "amps",
      spec: {
        title: "Click a wire to cut it, then bridge the gap with the probes",
        iScale: 0.015,
        cuttable: true,
        ...LOOP,
        meter: { mode: "A" },
        setup: (fig) => fig.on((t) => t === "fuse" && (fig.fuseBlew = true)),
        goals: [
          { id: "m-amps", text: "Measure the LED's current: cut a wire, then put one probe on each side of the cut", test: (q, fig) => q.meter?.mode === "A" && fig.net.cuts.size > 0 && q.meter.value > 0.005 && q.i("D1") > 0.005 },
          { id: "m-fuse", text: "Optional, and only here: put the meter in current mode across the battery", test: (q, fig) => !!fig.fuseBlew },
        ],
      },
    },
    {
      type: "bench",
      id: "bench-led-meter",
      title: "Measure an LED circuit: three voltages and a current",
      intro: "Build the same circuit as the simulation, then measure it for real. This one exercise uses everything in the chapter.",
      setup: { need: "breadboard, 9 V battery and clip, a 680 Ω resistor (blue-grey-brown), a red LED" },
      steps: [
        "Build it: battery +, then the 680 Ω resistor, then the LED's long leg (the anode); the LED's short leg back to battery −. The LED lights.",
        "<b>Voltages.</b> Dial on V, ⎓ showing, red lead in V Ω. Measure across the battery, across the resistor, and across the LED. Add the resistor and LED readings on paper.",
        "<b>Predict the current.</b> I = V ÷ R, using your resistor reading and 680 Ω.",
        "<b>Current.</b> Turn the dial to A mA, check ⎓, and move the red lead to the <b>mA µA</b> jack. Pull the LED's short leg out of its strip and put it in an empty one. Now the loop is open: put the red probe on the LED's leg and the black probe back on the strip it came from. The meter closes the loop and the LED lights again.",
        "Note the current, then put the LED back, <b>move the red lead back to V Ω</b>, and turn the dial back to V.",
      ],
      record: [
        { label: "Across the resistor", unit: "V", min: 6.5, max: 7.6, ok: "About 9 V minus the LED's 1.8–2 V. Now the battery minus this should equal the LED's voltage.", low: "Low: is the battery tired? Measure it.", high: "High: check the LED is lit and the right way round." },
        { label: "Current through the loop", unit: "mA", min: 9, max: 11.5, ok: "Compare it with your V ÷ R prediction: they should agree within a few percent.", low: "Lower than expected: is the resistor really 680 Ω? Is the battery fresh?", high: "Higher than expected: check the resistor's colour bands." },
      ],
      expect: `<p>The resistor and the LED share the battery's voltage: about 7 V and 2 V. The current comes out at roughly 7 V ÷ 680 Ω ≈ 10 mA, both measured and calculated. If they agree, you've just confirmed Kirchhoff's voltage law and Ohm's law on a real circuit.</p>
               <p>The meter's shunt adds 1.9 Ω to the loop while it measures, taking about 19 mV. Against 680 Ω that's invisible. {{Ch:meter-inside}} shows when it isn't.</p>`,
    },
    {
      type: "bench",
      id: "bench-diode-test",
      title: "Test LEDs and diodes",
      intro: "Diode-test mode pushes about 0.3 mA through a part and shows the voltage across it: a diode's forward voltage. It also tells you which leg is which.",
      setup: { dial: "Cap ▶|, then SELECT until diod shows", leads: "black in COM, red in V Ω", need: "red, green and blue or white LEDs; a 1N4148 or 1N4001 diode if you have one" },
      steps: [
        "Red probe on the red LED's long leg, black on the short leg. It glows faintly and the display shows about 1.7–2.0 V.",
        "Swap the probes: <b>OL</b>. A diode only conducts one way.",
        "Try the green LED, then the blue or white one. The blue or white may read OL even the right way round: they need about 2.7–3 V, close to the meter's 3.2 V limit.",
        "If you have a silicon diode, the end with the stripe is the cathode: put black there. It reads about 0.5–0.7 V.",
      ],
      expect: `<p>Each colour needs a different voltage, because each LED's material releases a different amount of energy per electron as light: more for blue than for red. {{Ch:leds}} explains why. A silicon diode needs only about 0.6 V and gives off no light at all.</p>`,
    },
    {
      type: "note",
      kind: "safety",
      title: "Meter safety, from day one",
      html: `<ul>
        <li>Choose the function <em>before</em> the probes touch anything.</li>
        <li>Resistance, continuity, diode and capacitance only on unpowered circuits, with big capacitors discharged.</li>
        <li>After measuring current, move the red lead back to V Ω straight away. Listen for the InEr beep.</li>
        <li>Mains is a different world: {{ch:meter-inside}} explains your meter's safety ratings and how to measure sockets and appliances safely. Until then, stay with batteries.</li>
      </ul>`,
    },
    {
      type: "problems",
      id: "meter-p",
      title: "Reading the meter, on paper",
      items: [
        {
          id: "meter-p1",
          level: 1,
          q: "<p>Red probe on point A, black on point B. The display shows −4.512 V. What is the voltage of B measured from A (that is, with black on A and red on B)?</p>",
          unit: "V",
          answer: 4.512,
          hints: ["The display shows red minus black. Swapping the probes swaps the sign."],
          solution: "<p>Swapping the probes flips the sign: <b>+4.512 V</b>. B is 4.512 V higher than A.</p>",
        },
        {
          id: "meter-p2",
          level: 1,
          q: "<p>You measure 7.02 V across a 680 Ω resistor. What current flows through it?</p>",
          unit: "mA",
          answer: (7.02 / 680) * 1000,
          hints: ["I = V ÷ R."],
          solution: "<p>I = 7.02 ÷ 680 = 0.0103 A = <b>10.3 mA</b>. That's how you can find a current without breaking the circuit: measure the voltage across a resistor you know.</p>",
        },
        {
          id: "meter-p3",
          level: 2,
          q: "<p>The display shows 2.471 kΩ. How many ohms is that?</p>",
          unit: "Ω",
          answer: 2471,
          hints: ["k means × 1,000."],
          solution: "<p>2.471 × 1,000 = <b>2,471 Ω</b>.</p>",
        },
        {
          id: "meter-p4",
          level: 2,
          q: "<p>Across a 9.0 V battery you measure 7.05 V across the resistor and 1.93 V across the LED. How much voltage is unaccounted for?</p>",
          unit: "V",
          answer: 0.02,
          abs: 0.005,
          hints: ["Kirchhoff: the drops should add up to the supply.", "9.0 − 7.05 − 1.93."],
          solution: "<p>9.0 − 7.05 − 1.93 = <b>0.02 V</b>: tiny, taken by the wires, breadboard contacts and rounding. If you found a volt missing, there'd be a bad contact somewhere, and measuring across each connection would find it.</p>",
        },
      ],
    },
    {
      type: "quiz",
      id: "meter-quiz",
      questions: [
        {
          q: "To measure the voltage across a resistor, where do the probes go?",
          choices: ["One on each side of the resistor", "Both on the same side", "You cut the wire and bridge the gap"],
          answer: 0,
          explain: "Voltage is a difference between two points, so the probes go on either side of what you're measuring.",
        },
        {
          q: "Your meter reads −4.5 V. What does that mean?",
          choices: ["The meter is broken", "The red probe is 4.5 V lower than the black probe", "The current is flowing backwards"],
          answer: 1,
          explain: "The display is always red minus black. Swap the probes and it reads +4.5 V.",
        },
        {
          q: "Before measuring resistance on a board, you should…",
          choices: ["Turn the power on so the part is working", "Turn the power off (and discharge any large capacitors)", "Switch to current mode first"],
          answer: 1,
          explain: "Resistance mode supplies its own small test current. Any other source in the circuit ruins the measurement and can damage the meter.",
        },
        {
          q: "To measure current, the meter must be…",
          choices: ["Across the part (in parallel)", "In the loop (in series), so the current flows through it", "Connected to ground"],
          answer: 1,
          explain: "Current has to pass through the meter to be counted, so you break the circuit and let the meter complete it.",
        },
        {
          q: "Your BM235 beeps and shows InEr when you turn the dial. Why?",
          choices: ["Its batteries are flat", "The red lead is in a current jack while the dial is on another function", "The fuse has blown"],
          answer: 1,
          explain: "It's warning you before you short something out. Move the red lead back to V Ω.",
        },
      ],
    },
  ],
};
