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
  title: "Using a multimeter",
  lede: "A multimeter is how you see inside a real circuit. Three measurements cover almost everything you'll do: voltage across, current through, and resistance of something unpowered.",
  minutes: 25,
  goals: [
    "Measure the voltage across a part, and read a negative reading",
    "Measure resistance and continuity safely, with the power off",
    "Measure current by making the meter part of the loop",
    "Avoid the classic way to blow a meter's fuse",
  ],
  blocks: [
    `<p>Every multimeter has the same essentials: a <strong>display</strong>, a <strong>dial</strong> to choose what to measure, and two <strong>probes</strong>. The black probe plugs into the socket marked <b>COM</b> (common) and is your reference: the meter shows the red probe's value <em>relative to</em> the black one. It's exactly the “height difference” from {{ch:voltage}}.</p>
     <p>The meter below works on the live circuit. <strong>Drag the probe tips onto the wires</strong> (the black one has already been clipped to point D, the bottom wire). Choose a mode with the buttons on the meter.</p>`,
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
       <li><strong>Voltage is measured across something</strong>: one probe each side. The meter doesn't disturb the circuit, because in voltage mode it lets almost no current through itself.</li>
       <li><strong>A minus sign isn't an error.</strong> It means the red probe is <em>lower</em> than the black one. Handy: it tells you which way round things are.</li>
       <li><strong>Resistance mode works by sending its own small current</strong> through the part and measuring the voltage it causes. If the circuit is powered, the circuit's own currents scramble that, and on a real meter you can damage it. Power off first, always.</li>
       <li><strong>Continuity</strong> is resistance mode with a beeper: it beeps for a near-zero resistance, so you can check wires and joints without looking at the display.</li>
     </ul>`,
    {
      type: "note",
      kind: "repair",
      title: "Measuring the resistor in place worked here. Why?",
      html: `<p>With the switch off, the resistor's only other path is through the LED and the open switch: effectively nothing. On a real board, other parts are often connected across the same two points and the reading comes out lower than the true value. Lift one leg if a reading looks wrong.</p>`,
    },
    { type: "h2", text: "Measuring current: the meter joins the loop" },
    `<p>To measure the current in a wire, that current has to flow <em>through</em> the meter. So you must break the circuit and let the meter close the gap, exactly like the ammeters in {{ch:loop}}. In current mode, the meter's insides are nearly a plain piece of wire.</p>`,
    {
      type: "predict",
      id: "meter-across",
      q: "In current mode the meter is almost a plain wire. What happens if you put its probes straight across the battery's terminals?",
      choices: ["It shows how much current the battery can supply", "It short-circuits the battery, and the meter's fuse blows", "It shows the battery voltage instead"],
      answer: 1,
      why: ["It would try to, by letting the battery push as much current as it possibly can through it. That's a short circuit.", "", "The meter can't tell what you meant. In current mode it's a near-zero resistance, wherever you put it."],
      explain: `<p>Across the battery, the meter is a short circuit. Meters protect themselves with a fuse inside, and that's the most common way people blow it: measuring current, then forgetting to switch back and touching the probes across a supply. On a real meter, also move the red lead back to the V socket when you're done measuring current.</p>`,
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
      type: "note",
      kind: "safety",
      title: "Real-meter safety",
      html: `<ul>
        <li>Pick the mode <em>before</em> touching the probes to anything.</li>
        <li>Resistance, continuity and diode modes only on unpowered circuits.</li>
        <li>After measuring current, move the red lead back to the V/Ω socket straight away.</li>
        <li>Stick to low-voltage battery circuits while learning. Mains voltages need training and a meter with a suitable safety (CAT) rating. A cheap meter is not safe on mains.</li>
      </ul>`,
    },
    {
      type: "note",
      kind: "build",
      title: "Your own meter",
      html: `<p>Got a Brymen BM235? The <a href="#bm235">BM235 field guide</a> covers every dial position and button on the real thing, how each one works inside, and useful checks around the house.</p>`,
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
      ],
    },
  ],
};
