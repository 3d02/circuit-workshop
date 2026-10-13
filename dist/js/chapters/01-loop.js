export default {
  id: "loop",
  title: "Electricity needs a loop",
  lede: "A torch, a phone charger and a car all work the same way at heart: a source drives charge round a closed path, and something along the way turns energy into light, heat or motion. Break the loop anywhere and everything stops.",
  minutes: 15,
  goals: [
    "Explain why a circuit needs a complete loop",
    "Read this course's live circuits: colour shows voltage, moving dots show current",
    "Say why a lamp doesn't “use up” current",
    "Recognise a short circuit, and know why fuses exist",
  ],
  blocks: [
    `<p>Here's the simplest useful circuit there is: a battery, a switch and a lamp, joined by wires into a ring. It isn't a picture. It's a live simulation, so the battery, wires and lamp behave the way real ones do.</p>
     <p><strong>Click the switch to close it.</strong></p>`,
    {
      type: "figure",
      id: "first",
      spec: {
        title: "Your first circuit",
        iScale: 0.3,
        parts: [
          { id: "B1", type: "battery", a: [1, 2], b: [1, 4], v: 3, r: 0.3, label: "3 V battery", labelSide: "left" },
          { id: "S1", type: "switch", a: [3, 0], b: [5, 0], name: "Switch", labelSide: "above" },
          { id: "L1", type: "lamp", a: [8, 1], b: [8, 3], r: 10, rated: 0.85 },
        ],
        wires: ["1,2 1,0 3,0", "5,0 8,0 8,1", "8,3 8,5 1,5 1,4"],
        status: (q) =>
          q.part("S1").closed
            ? "Closed loop: current flows all the way round, and the lamp lights."
            : "The switch is open. There's a gap in the loop, so nothing can flow.",
        goals: [{ id: "loop-close", text: "Close the switch to light the lamp", test: (q) => q.power("L1") > 0.5, success: "Light! Now try opening it again." }],
      },
    },
    { type: "h2", text: "How to read every circuit in this course" },
    `<p>Two things are drawn on top of every wire:</p>
     <ul class="legend-list">
       <li><span class="swatch dots"></span><div><strong>Moving dots show current</strong>: how much electric charge is flowing. More current means faster dots. They move out of the battery's <b>+</b> end, round the loop, and back into its <b>−</b> end.</div></li>
       <li><span class="swatch volts"></span><div><strong>Colour shows voltage.</strong> Grey-green wires are at 0 V. The warmer the colour, the higher the voltage. {{Ch:voltage}} explains what that means; for now, notice that the wire leaving the battery's <b>+</b> end is “warm” and the one returning to <b>−</b> is not.</div></li>
     </ul>
     <p>Hover over (or tap) any part or wire to read its exact numbers. Try it on the lamp while it's lit.</p>`,
    {
      type: "note",
      kind: "analogy",
      title: "What's actually moving, and what does the pushing?",
      html: `<p>Wires are already full of free electrons; the battery doesn't supply them. What it does is set up an <strong>electric field</strong> along the whole loop, and the field pushes every free electron at once. The field spreads in billionths of a second. The electrons themselves only drift, slower than a snail. And the energy reaches the lamp through the field, not by riding on the electrons.</p>
             <p>That's the short version. In {{ch:inside}} you'll zoom inside the wire and watch all of this happen.</p>`,
    },
    {
      type: "note",
      kind: "deeper",
      title: "Why do the dots go from + to −, when electrons go the other way?",
      html: `<p>Current was defined as flowing from + to − long before anyone knew about electrons. Electrons turned out to drift the other way, but the convention stuck: every schematic, datasheet and calculation uses it. This is called <em>conventional current</em>. For everything you'll build, the direction you picture makes no difference to the answer.</p>
             <p>Also, the dots are a picture of <em>how much</em> current flows, not how fast electrons travel. Drawn at their real speed, they would look frozen.</p>`,
    },
    { type: "h2", text: "Is current used up by the lamp?" },
    `<p>Here's the same circuit with two <em>ammeters</em> (current meters) added, one in the wire going into the lamp and one in the wire coming out. Before you close the switch, make a prediction.</p>`,
    {
      type: "predict",
      id: "loop-same-current",
      figure: "meters",
      q: "Which ammeter will show more current: the one before the lamp, or the one after it?",
      choices: ["Before the lamp: the lamp uses some up", "After the lamp", "They'll be exactly the same"],
      answer: 2,
      why: [
        "That's the single most common misconception in electronics, so you're in good company.",
        "There's no source of extra charge after the lamp, so it can't be bigger.",
      ],
      explain: `<p>In a single loop there is nowhere else for charge to go, so <strong>the current is the same everywhere</strong>: before the lamp, after it, and even inside the battery. Count the dots: they move at the same speed all the way round.</p>
                <p>What the lamp takes is <strong>energy</strong>, not current. The battery's electric field does work on the electrons inside the lamp, and the lamp turns that work into light and heat. The electrons themselves just keep drifting round, as many coming out as going in.</p>`,
      reveal: (fig) => fig.set("S1", "closed", true),
      revealLabel: "Close the switch",
    },
    {
      type: "figure",
      id: "meters",
      spec: {
        title: "Current in, current out",
        iScale: 0.3,
        parts: [
          { id: "B1", type: "battery", a: [1, 2], b: [1, 4], v: 3, r: 0.3, labelSide: "left" },
          { id: "S1", type: "switch", a: [3, 0], b: [5, 0] },
          { id: "A1", type: "ammeter", a: [6, 0], b: [8, 0] },
          { id: "L1", type: "lamp", a: [10, 1], b: [10, 3], r: 10, rated: 0.85 },
          { id: "A2", type: "ammeter", a: [8, 5], b: [6, 5], labelSide: "below" },
          { type: "text", at: [7, -1.05], text: "into the lamp", cls: "annotation small" },
          { type: "text", at: [7, 6.3], text: "out of the lamp", cls: "annotation small" },
        ],
        wires: ["1,2 1,0 3,0", "5,0 6,0", "8,0 10,0 10,1", "10,3 10,5 8,5", "6,5 1,5 1,4"],
        view: [-1.6, -1.8, 12.4, 7.3],
      },
    },
    {
      type: "note",
      kind: "myth",
      title: "Myth: batteries store electricity, and devices use it up",
      html: `<p>A battery stores <em>chemical energy</em>. It uses that energy to push charge around the circuit. The charge was already in the wires and comes back, every bit of it. A “flat” battery hasn't run out of electrons; it has run out of the chemical energy it uses to push them.</p>`,
    },
    { type: "h2", text: "Break the loop" },
    `<p>This circuit lets you cut wires. <strong>Click any wire to cut it</strong>, and click it again to join it back up.</p>`,
    {
      type: "figure",
      id: "cut",
      spec: {
        title: "Cut a wire, anywhere",
        iScale: 0.3,
        cuttable: true,
        parts: [
          { id: "B1", type: "battery", a: [1, 2], b: [1, 4], v: 3, r: 0.3, labelSide: "left" },
          { id: "L1", type: "lamp", a: [8, 1], b: [8, 3], r: 10, rated: 0.85 },
        ],
        wires: ["1,2 1,0 4,0 8,0 8,1", "8,3 8,5 4,5 1,5 1,4"],
        status: (q) => (q.power("L1") > 0.1 ? "The loop is complete: current flows everywhere." : "The loop is broken. No current flows anywhere: not before the cut, not after it."),
        goals: [
          { id: "loop-cut", text: "Cut a wire and watch the whole circuit stop", test: (q, fig) => fig.net.cuts.size > 0 && q.power("L1") < 0.01, hold: 0.3 },
          { id: "loop-mend", text: "Mend it again", test: (q, fig) => fig.goalState.get("loop-cut") === "done" && q.power("L1") > 0.5 },
        ],
      },
    },
    `<p>Notice that the <em>whole</em> circuit stops at once, not just the part “after” the cut. The reason: within billionths of a second of the cut, charge piles up on both sides of the gap, and that changes the electric field everywhere until it no longer pushes electrons along the wire anywhere. ({{Ch:voltage}} shows the voltage that appears across the gap.)</p>
     <p>A switch is nothing more than a deliberate, convenient gap: two metal contacts that touch (closed, on) or separate (open, off).</p>`,
    {
      type: "note",
      kind: "repair",
      title: "Dead completely? Look for the gap",
      html: `<p>A huge share of real faults are breaks in the loop: a snapped wire inside a cable, a cracked solder joint, a corroded battery contact, a switch with worn contacts, a blown fuse. When something is <em>completely</em> dead, the first question is: <strong>where is the loop broken?</strong> Your meter has a mode made for exactly this question, and you can use it straight away.</p>`,
    },
    {
      type: "bench",
      id: "bench-continuity",
      title: "Is the loop closed? Ask the beeper",
      intro: "Continuity mode checks whether there's an unbroken path between the two probes. It only works on things that are <em>unpowered</em>: take batteries out and unplug anything first.",
      setup: { dial: "Ω, then SELECT until •))) shows", leads: "black in COM, red in V Ω", need: "a few unpowered things: a fuse, a switch, a length of wire, an empty battery holder" },
      steps: [
        "Touch the probe tips together. The meter beeps and the backlight flashes: a closed loop through the meter and its leads.",
        "Hold one probe on each end of a piece of wire. Beep: unbroken.",
        "Test a fuse out of its holder (a plug fuse, a car blade fuse or a glass fuse): one probe on each end cap. A good fuse beeps; a blown one shows <b>OL</b>.",
        "Test a switch: a probe on each terminal, then flip it. It should beep in one position and not in the other.",
        "Try an empty battery holder: one probe on the + terminal and one on the − terminal. Silence, because there's a gap where the batteries go. Now bridge a cell's position with a bit of wire and the path closes.",
      ],
      expect: `<p>A beep means the resistance between the probes is below a threshold: on the BM235, somewhere between 30 and 480 Ω depending on the unit. So a beep says “there's a path”, not “a perfect wire”. When the exact value matters, read the number on the display.</p>
               <p><b>OL</b> means “over limit”: no path the meter can find. That's an open circuit, a gap in the loop.</p>`,
    },
    { type: "h2", text: "Short circuits" },
    `<p>Current doesn't just take one path. It takes <em>every</em> path available to it, and most of it takes the easiest one. This circuit has a switch wired straight across the lamp: a shortcut. There's also a <em>fuse</em> in the top wire: a thin strip of metal designed to melt if the current gets too high.</p>`,
    {
      type: "predict",
      id: "loop-short",
      figure: "short",
      q: "The lamp is lit. What happens when you close the shortcut switch?",
      choices: ["The lamp gets brighter", "Nothing changes: the lamp is still connected", "The lamp goes out and a huge current flows"],
      answer: 2,
      why: [
        "The shortcut doesn't add any energy. It gives the current an easier path that skips the lamp.",
        "The lamp is still connected, but the shortcut offers a far easier path, so almost no current bothers going through the lamp.",
      ],
      explain: `<p>The shortcut has almost no resistance, so nearly all the current takes it. The lamp is bypassed and goes dark, while the current through the battery jumps from about 0.3 A to over 8 A. That's a <strong>short circuit</strong>: wires and the battery heat up fast, and in a bigger circuit that means melted insulation or a fire.</p>
                <p>The fuse is a deliberately weak link. It melts first and breaks the loop before anything else gets hurt.</p>`,
      reveal: (fig) => fig.set("S2", "closed", true),
      revealLabel: "Close the shortcut",
    },
    {
      type: "figure",
      id: "short",
      spec: {
        title: "A shortcut across the lamp",
        iScale: 0.3,
        parts: [
          { id: "B1", type: "battery", a: [1, 2], b: [1, 4], v: 3, r: 0.3, imax: 2, labelSide: "left" },
          { id: "F1", type: "fuse", a: [3, 0], b: [5, 0], rating: 1 },
          { id: "S2", type: "switch", a: [7, 1.5], b: [7, 3.5], name: "Shortcut switch", label: "shortcut", labelSide: "left" },
          { id: "L1", type: "lamp", a: [10, 1.5], b: [10, 3.5], r: 10, rated: 0.85 },
        ],
        wires: ["1,2 1,0 3,0", "5,0 7,0 10,0 10,1.5", "7,0 7,1.5", "7,3.5 7,5", "10,3.5 10,5 7,5 1,5 1,4"],
        setup: (fig) => fig.on((type) => type === "burnt" && (fig.fuseBlew = true)),
        goals: [
          { id: "loop-fuse", text: "Blow the fuse with the shortcut", test: (q, fig) => !!fig.fuseBlew },
          { id: "loop-fix", text: "Make the lamp work again (hint: fix the cause first, then replace the fuse)", test: (q, fig) => fig.fuseBlew && q.power("L1") > 0.5 },
        ],
      },
    },
    {
      type: "note",
      kind: "repair",
      title: "A blown fuse is a symptom, not the problem",
      html: `<p>If you replace the fuse while the short is still there, it blows again instantly. Try it above. In real repairs, find out <em>why</em> a fuse blew before replacing it, and always use the same rating. Fitting a bigger fuse just moves the failure somewhere more expensive.</p>`,
    },
    {
      type: "note",
      kind: "safety",
      html: `<p>Never short a battery on purpose. Even an AA cell can make a wire hot enough to burn you, and lithium phone and laptop batteries can catch fire. Mains electricity can kill: everything in this course stays at low voltage, and your own experiments should too.</p>`,
    },
    {
      type: "quiz",
      id: "loop-quiz",
      questions: [
        {
          q: "A lamp won't light. You know the battery and the lamp are both fine. What's the most likely problem?",
          choices: ["The loop is broken somewhere", "The wires are too long", "The lamp is using up the current"],
          answer: 0,
          explain: "With a good source and a good load, a dead circuit almost always means a gap: a loose wire, a bad joint, an open switch.",
        },
        {
          q: "0.3 A flows through a lamp. How much current flows in the wire returning to the battery?",
          choices: ["Less than 0.3 A", "Exactly 0.3 A", "More than 0.3 A"],
          answer: 1,
          explain: "In a single loop the current is the same everywhere. The lamp takes energy, not current.",
        },
        {
          q: "Why does a short circuit get hot?",
          choices: ["It has a very high resistance", "It has almost no resistance, so a huge current flows", "It stores up charge"],
          answer: 1,
          explain: "With almost nothing to limit it, the current becomes very large, and large currents heat wires and batteries quickly.",
        },
        {
          q: "What does a fuse do?",
          choices: ["Makes the circuit more efficient", "Breaks the loop if the current gets dangerously high", "Stores spare energy for later"],
          answer: 1,
          explain: "It's a deliberate weak link that melts open before anything more valuable (or flammable) overheats.",
        },
      ],
    },
  ],
};
