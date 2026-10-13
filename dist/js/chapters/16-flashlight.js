import { dischargeLab } from "../labs.js";
import { perfboard, CHECKS, BOM, table } from "../project.js";

export default {
  id: "flashlight",
  title: "Final project: a flashlight you design and build",
  lede: "Everything in the course, in one object you'll actually use: a torch with a 1 W LED, held at a steady current from four rechargeable AAs. You'll write the specification, size every part with the formulas, simulate it, prove it on a breadboard with your meter, solder it, test it like a technician, and publish it as open hardware.",
  minutes: 240,
  goals: [
    "Turn a wish into a specification with numbers in it",
    "Choose the battery, LED, current and every component, using the course's formulas",
    "Simulate the design, then prove it on a breadboard with your meter",
    "Lay it out on perfboard, solder it, and check it before the first power-up",
    "Measure the finished torch, and find faults with a method",
    "Publish it as open hardware",
  ],
  blocks: [
    `<p>Allow three evenings: one to design and breadboard, one to solder, one to test and box it up. The parts cost about €15–20, plus a NiMH charger if you haven't got one. Work through it in order. Each step depends on the numbers from the one before, and the problems along the way <em>are</em> the design.</p>`,
    { type: "scene", scene: "torch3d", tasks: ["torch-explode"] },
    { type: "h2", text: "1 · The brief" },
    `<p>Every design starts with a wish and ends with numbers. The wish: <em>a torch bright enough to find your way across a dark garden, that lasts an evening, keeps the same brightness until it's nearly flat, and that you understand completely.</em> As a specification:</p>
     <div class="bm-table-wrap"><table class="bm-table">
       <thead><tr><th>Requirement</th><th>Target</th><th>Why</th></tr></thead>
       <tbody>
         <tr><td>Light</td><td>about 100 lumens</td><td>A bright bicycle lamp. A 1 W white LED gives this at about 300 mA.</td></tr>
         <tr><td>Running time</td><td>5 hours or more</td><td>An evening, with margin.</td></tr>
         <tr><td>Steady brightness</td><td>within 5% until nearly flat</td><td>A current regulator, not a resistor ({{ch:transistors}}).</td></tr>
         <tr><td>Battery</td><td>rechargeable, safe, easy to buy</td><td>AA NiMH: no special charger circuit or protection to build.</td></tr>
         <tr><td>Parts</td><td>about a dozen, from any electronics shop</td><td>No ready-made driver module: you build the driver.</td></tr>
         <tr><td>Heat</td><td>no part above about 60 °C</td><td>Long life, and comfortable in the hand ({{ch:datasheets}}).</td></tr>
       </tbody>
     </table></div>`,
    { type: "h2", text: "2 · Choose the battery" },
    `<p>The regulator needs about V<sub>f</sub> + V<sub>BE</sub> + a little: 3.1 + 0.56 + 0.1 ≈ <strong>3.8 V</strong> to keep regulating ({{ch:transistors}}). Below that it drops out and the light dims. So the battery must stay above 3.8 V for as much of its discharge as possible, without being so high that the MOSFET wastes lots of heat.</p>
     <ul>
       <li><strong>3 × NiMH</strong> = 3.6 V nominal: below the dropout from the start. No.</li>
       <li><strong>4 × NiMH</strong> = 4.8 V nominal, about 5.4 V fresh off the charger and 4.0 V nearly flat: above the dropout for almost all of its flat discharge. <strong>Yes.</strong></li>
       <li><strong>4 × alkaline</strong> = up to 6.4 V fresh, sliding steadily down: works, but wastes more heat when fresh and leaves charge behind ({{ch:energy}}).</li>
       <li><strong>One Li-ion cell</strong>, 4.2 to 3.0 V: too close to the dropout, and it needs a protection circuit and a proper charger.</li>
     </ul>
     <p>Check it below: four NiMH cells at 310 mA, with the regulator's 3.8 V as the cut-off. Then try alkaline.</p>`,
    { type: "custom", render: (el) => dischargeLab(el, { cells: 4, chem: "nimh", current: 0.31, needs: 3.8, needsLabel: "regulator needs 3.8 V" }) },
    { type: "h2", text: "3 · Size every part" },
    `<p>Now the design itself. Each problem below is one decision, using the formulas you've met. Work them in order: each uses the answer before. The worked solutions explain the choice that follows from the number.</p>`,
    {
      type: "problems",
      id: "fl-design",
      title: "The design, on paper",
      intro: "Use V<sub>f</sub> = 3.1 V for the LED at 300 mA, V<sub>BE</sub> = 0.56 V, and a 4 × NiMH pack at 4.8 V nominal, 5.4 V fresh.",
      items: [
        {
          id: "fl-p1",
          level: 1,
          q: "<p><b>The current.</b> The LED's absolute maximum is 350 mA. You'll run it at about 85% of that, for margin and long life. What current is that?</p>",
          unit: "mA",
          answer: 297.5,
          hints: ["0.85 × 350."],
          solution: "<p>0.85 × 350 = <b>about 300 mA</b>: our target. It costs only a little brightness and keeps the LED cooler.</p>",
        },
        {
          id: "fl-p2",
          level: 1,
          q: "<p><b>The sense resistor.</b> What resistor sets 300 mA? (I = V<sub>BE</sub> ÷ R.)</p>",
          unit: "Ω",
          answer: 0.56 / 0.3,
          hints: ["R = V<sub>BE</sub> ÷ I = 0.56 ÷ 0.3."],
          solution: "<p>R = 0.56 ÷ 0.3 = <b>1.87 Ω</b>. The nearest standard value is 1.8 Ω, giving 0.56 ÷ 1.8 = 311 mA. That's still under 90% of the LED's limit: choose <b>1.8 Ω</b>.</p>",
        },
        {
          id: "fl-p3",
          level: 2,
          q: "<p><b>Its power rating.</b> How much power does the 1.8 Ω sense resistor dissipate at 311 mA?</p>",
          unit: "W",
          answer: 0.311 * 0.311 * 1.8,
          hints: ["P = I² × R, or V × I with V = 0.56 V."],
          solution: "<p>P = 0.311² × 1.8 = <b>0.17 W</b>. That's 70% of a ¼ W rating: too close. Use a <b>½ W</b> resistor.</p>",
        },
        {
          id: "fl-p4",
          level: 2,
          q: "<p><b>The MOSFET's worst case.</b> With fresh cells at 5.4 V, how much heat does the MOSFET make?</p>",
          unit: "W",
          answer: (5.4 - 3.1 - 0.56) * 0.311,
          hints: ["V<sub>DS</sub> = 5.4 − 3.1 − 0.56.", "P = V<sub>DS</sub> × I."],
          solution: "<p>V<sub>DS</sub> = 1.74 V, so P = 1.74 × 0.311 = <b>0.54 W</b>. As the cells settle to 4.8 V it drops to about 0.35 W.</p>",
        },
        {
          id: "fl-p5",
          level: 2,
          q: "<p><b>Does it need a heatsink?</b> A TO-220 MOSFET in free air has R<sub>θJA</sub> = 62 °C/W. What is its junction temperature at 0.54 W in a 25 °C room?</p>",
          unit: "°C",
          answer: 25 + 0.54 * 62,
          tol: 0.03,
          hints: ["T<sub>J</sub> = T<sub>A</sub> + P × R<sub>θJA</sub>."],
          solution: "<p>T<sub>J</sub> = 25 + 0.54 × 62 = <b>58 °C</b>: inside our 60 °C target and miles from its 175 °C limit. <b>No heatsink needed</b> for the MOSFET.</p>",
        },
        {
          id: "fl-p6",
          level: 3,
          q: "<p><b>The LED's heat.</b> The LED takes 3.1 V × 0.311 A, and about 30% of that leaves as light. On a bare star board it has about 60 °C/W from junction to air; on a small heatsink, about 35 °C/W. What is its junction temperature on the heatsink, in a 25 °C room?</p>",
          unit: "°C",
          answer: 25 + 3.1 * 0.311 * 0.7 * 35,
          tol: 0.03,
          hints: ["Heat = 0.7 × 3.1 × 0.311 W.", "T<sub>J</sub> = 25 + heat × 35."],
          solution: "<p>Heat = 0.67 W. On the heatsink: 25 + 0.67 × 35 = <b>49 °C</b>. On the bare star it would be 25 + 0.67 × 60 = 65 °C: warm enough to shorten the LED's life. <b>Give the LED a heatsink</b> (a small aluminium plate or the torch's metal body).</p>",
        },
        {
          id: "fl-p7",
          level: 2,
          q: "<p><b>Running time.</b> Ideally, how long do 2,000 mAh cells last at 311 mA?</p>",
          unit: "h",
          answer: 2000 / 311,
          hints: ["t = Q ÷ I."],
          solution: "<p>t = 2,000 ÷ 311 = <b>6.4 hours</b>. The discharge lab above, which allows for the cut-off, gives about 6 h: comfortably over the 5 h target.</p>",
        },
        {
          id: "fl-p8",
          level: 2,
          q: "<p><b>Efficiency.</b> At 4.8 V, what fraction of the battery's power reaches the LED? Give it as a percentage.</p>",
          unit: "%",
          answer: (3.1 / 4.8) * 100,
          hints: ["Same current everywhere: η = V<sub>f</sub> ÷ V<sub>bat</sub>."],
          solution: "<p>η = 3.1 ÷ 4.8 = <b>65%</b>. The rest warms the MOSFET and the sense resistor. A switching driver could reach 90%, at the cost of a coil, a chip and a much harder build: a fair trade for a first design.</p>",
        },
        {
          id: "fl-p9",
          level: 3,
          q: "<p><b>A low mode (optional).</b> Add a 6.8 Ω resistor in series with the 1.8 Ω, and a switch that shorts it out for high power. With the switch open, what current flows?</p>",
          unit: "mA",
          answer: (0.56 / 8.6) * 1000,
          hints: ["The NPN now senses the voltage across both resistors: 1.8 + 6.8 = 8.6 Ω."],
          solution: "<p>I = 0.56 ÷ 8.6 = <b>65 mA</b>: about a fifth of the light (LEDs are a little more efficient at low current), for about 30 hours.</p>",
        },
      ],
    },
    {
      type: "note",
      kind: "deeper",
      title: "A design decision you might not have thought about: reverse polarity",
      html: `<p>What if the battery goes in backwards? Current would flow backwards through the sense resistor and the MOSFET's built-in body diode, and through the protection diode built into many power LEDs, limited by almost nothing. The usual fix is a diode in series with the battery, but even a Schottky diode drops about 0.3 V, which raises the dropout and shortens the running time. This design avoids the problem mechanically instead: a battery holder with a snap connector physically can't be connected backwards. A single cell put in the wrong way round in the holder only subtracts its voltage: the torch is dim, nothing is harmed. Every design is a series of trade-offs like this one.</p>`,
    },
    { type: "h2", text: "4 · Simulate it" },
    `<p>Here's the finished schematic, including the power switch and the optional low mode. Try fresh cells (5.4 V), nominal (4.8 V) and nearly flat (4.0 V), in both modes. Hover over any part for its numbers.</p>`,
    {
      type: "figure",
      id: "torch",
      spec: {
        title: "The flashlight, complete",
        iScale: 0.35,
        parts: [
          { id: "S1", type: "switch", a: [1, 1], b: [1, 3], closed: true, name: "Power switch", label: "power", labelSide: "left" },
          { id: "B1", type: "battery", a: [1, 4], b: [1, 6], v: 4.8, r: 0.12, label: (p) => `4 × NiMH ${p.v.toFixed(1)} V`, labelSide: "left" },
          { type: "ground", at: [1, 7] },
          { id: "D1", type: "led", a: [8, 1], b: [8, 3], color: "power", rated: 0.35, imax: 0.6, label: "D1 1 W LED", labelSide: "right" },
          { id: "Q1", type: "nmos", at: [7, 4], vth: 1.6, k: 8, label: "Q1" },
          { id: "R1", type: "resistor", a: [4, 1], b: [4, 3], r: 100000, label: "R1 100 kΩ", labelSide: "left" },
          { id: "Q2", type: "npn", at: [6.5, 7], mirror: true, label: "Q2" },
          { id: "R2", type: "resistor", a: [8, 7], b: [8, 9], r: 1.8, label: "R2 1.8 Ω", labelSide: "right" },
          { id: "R3", type: "resistor", a: [8, 9], b: [8, 11], r: 6.8, label: "R3 6.8 Ω", labelSide: "left" },
          { id: "S2", type: "switch", a: [10, 9], b: [10, 11], closed: true, name: "Mode switch: closed is high", label: "high", labelSide: "right" },
          { type: "ground", at: [8, 11.5] },
          { type: "ground", at: [5.5, 9] },
        ],
        wires: ["1,1 1,0 4,0 8,0 8,1", "1,3 1,4", "1,6 1,7", "4,0 4,1", "4,3 4,4 5.5,4 7,4", "5.5,6 5.5,4", "8,5 8,7", "6.5,7 8,7", "5.5,8 5.5,9", "8,9 10,9", "8,11 8,11.5", "10,11 10,11.5 8,11.5"],
        view: [-3, -1.2, 16.4, 13.6],
        controls: [
          { label: "Battery voltage", part: "B1", prop: "v", min: 3.4, max: 5.6, step: 0.1, unit: "V" },
          { type: "toggle", label: "Power on", part: "S1", prop: "closed" },
          { type: "toggle", label: "High mode", part: "S2", prop: "closed" },
        ],
        readouts: [
          { label: "LED current", value: (q) => q.i("D1"), unit: "A" },
          { label: "MOSFET heat", value: (q) => q.across("Q1") * q.i("D1"), unit: "W" },
          { label: "Sense voltage", value: (q) => q.across("R2") + q.across("R3"), unit: "V" },
          { label: "Efficiency", value: (q) => (q.i("D1") > 0.005 ? (q.across("D1") * q.i("D1")) / (q.part("B1").v * q.i("D1")) : 0), format: (v) => (v > 0 ? `${Math.round(v * 100)}%` : "–") },
        ],
        status: (q) => {
          if (!q.part("S1").closed) return "Off. The switch breaks the loop, so nothing at all is drawn from the battery.";
          const i = q.i("D1");
          if (q.across("R2") + q.across("R3") < 0.5) return { text: `Dropped out: the battery can't keep the LED's ${q.across("D1").toFixed(2)} V plus the sense voltage. Time to recharge.`, level: "warn" };
          return `Regulating at ${Math.round(i * 1000)} mA (${q.part("S2").closed ? "high" : "low"} mode). The MOSFET is dropping ${q.across("Q1").toFixed(2)} V.`;
        },
        goals: [
          { id: "torch-fresh", text: "Fresh cells (5.4 V or more), high mode: check the current and the MOSFET's heat", test: (q) => q.part("S1").closed && q.part("S2").closed && q.part("B1").v >= 5.4 && q.i("D1") > 0.28 },
          { id: "torch-low", text: "Switch to low mode: about 65 mA", test: (q) => q.part("S1").closed && !q.part("S2").closed && q.i("D1") > 0.05 && q.i("D1") < 0.08 },
          { id: "torch-flat", text: "Run the battery down to 3.6 V in high mode. What happens?", test: (q) => q.part("S1").closed && q.part("S2").closed && q.part("B1").v <= 3.6 },
        ],
      },
    },
    { type: "h2", text: "5 · Prove it on a breadboard" },
    `<p>Before soldering anything, build it on the breadboard and measure it. Mistakes are free here: a part in the wrong row costs nothing to move.</p>`,
    {
      type: "bench",
      id: "bench-torch-breadboard",
      title: "Breadboard the driver and measure it",
      intro: "Use your parts list, the schematic above, and the transistor pinouts from {{ch:datasheets}}. Put the LED's star on its heatsink first, with short wires soldered to its + and − pads.",
      setup: { dial: "V ⎓, then the A position for current", leads: "black in COM, red in V Ω (A jack for current)", need: "everything on the parts list except the perfboard, plus the 47 Ω resistor" },
      safety: "Don't look into a 1 W LED from close up: it's uncomfortably bright. Point it at the wall.",
      steps: [
        "Build the circuit without the batteries. Check each connection against the schematic.",
        "<b>First power-up, the careful way:</b> put the 47 Ω resistor in series with the battery's + lead. If there's a mistake, it limits the current to about 0.1 A. Connect the battery: the LED should glow dimly. If it doesn't, check the LED's polarity and the MOSFET's pins before anything else.",
        "Remove the 47 Ω and connect the battery directly. Full brightness.",
        "Measure across the sense resistor (R2): about 0.55–0.6 V. Divide by 1.8 Ω: that's your LED current, measured without breaking the loop.",
        "Measure across the LED, across the MOSFET (drain to source) and across the battery. Check that they add up.",
        "Now measure the current directly: dial on A mA, red lead in the <b>A</b> jack (300 mA is close to the mA jack's 400 mA fuse). Break the battery's − lead and close the gap with the probes. Then move the red lead back to V Ω.",
        "After five minutes, feel the MOSFET's tab and the LED's heatsink. If your BM235 has its thermocouple, measure both: dial on mV, SELECT for °C, bead taped to the tab.",
      ],
      record: [
        { label: "Across the sense resistor", unit: "V", min: 0.5, max: 0.66, ok: "The NPN is regulating. Divide by 1.8 Ω for the current.", low: "Below 0.5 V: not regulating. The battery is low, or the LED's voltage is high, or something's in the wrong row.", high: "Above about 0.66 V: the NPN isn't doing its job. Check its pins and that its base goes to the MOSFET's source." },
        { label: "Current, measured directly", unit: "mA", min: 270, max: 350, ok: "Compare with V<sub>sense</sub> ÷ 1.8 Ω. They should agree within a few percent; the A jack's 0.04 Ω shunt barely disturbs it.", low: "Low: check the battery voltage, and that the regulator isn't in dropout.", high: "Over 350 mA: switch off and check Q2 and R2 before the LED suffers." },
        { label: "MOSFET tab temperature", unit: "°C", min: 25, max: 60, ok: "In line with the 58 °C junction estimate: the tab is a little cooler than the junction inside.", low: "Cooler than the room? Check the thermocouple reading on its own first.", high: "Hotter than predicted: is the battery voltage higher than 5.4 V (alkalines?), or is the current high?" },
      ],
      expect: `<p>You should find about 0.56 V across R2, 310 mA, 3.0–3.3 V across the LED and the rest across the MOSFET. Kirchhoff's voltage law ties them together: battery = LED + MOSFET + sense. If you have a spare cell, try the battery at three cells plus a bit of wire in the fourth slot: about 3.9 V, near dropout. The current should start to fall.</p>`,
    },
    { type: "h2", text: "6 · Lay it out and solder it" },
    `<p>Transfer the circuit to perfboard. The layout below is seen from the component side, with the copper connections you make on the back drawn in copper colour: either solder trails between neighbouring pads, or short lengths of bare wire laid along the holes and soldered at each end. A + rail runs along the top edge and a 0 V rail along the bottom.</p>`,
    { type: "custom", wide: false, render: (el) => (el.innerHTML = `<figure class="pb-wrap">${perfboard()}<figcaption class="small-note">Q1's metal tab is connected to its drain, so keep it away from the rails. Q2 is a BC547 here (C-B-E with the flat face towards the bottom of the board); a 2N3904 is mirrored, so turn it round.</figcaption></figure>`) },
    `<ol class="steps">
       <li><b>Lowest parts first:</b> the two resistors, then the transistors. Bend the leads on the back to hold each part while you solder.</li>
       <li><b>Mind the heat on Q2.</b> A TO-92 transistor doesn't like more than a few seconds of iron: solder its legs one at a time, letting it cool between them.</li>
       <li><b>Make the connections on the back</b>, following the copper lines. Solder each end, and trim.</li>
       <li><b>Add the wires:</b> red to the + rail and the LED's + pad, black to the LED's − pad and the 0 V rail. The star's pads are big copper areas: use a hotter tip setting and a bit of patience ({{ch:soldering}}).</li>
       <li><b>Put heat-shrink</b> over the switch's tags and the LED's wire joints.</li>
     </ol>`,
    { type: "h2", text: "7 · Check it before the first power-up" },
    `<p>Professionals never power a new board blind. With the batteries out, buzz out every connection with continuity mode, then check for the shorts that must not be there. It takes five minutes and catches nearly every mistake.</p>`,
    { type: "custom", wide: false, render: (el) => (el.innerHTML = table(["Net", "Connects", "Check with continuity"], CHECKS)) },
    {
      type: "bench",
      id: "bench-torch-final",
      title: "First light, and the final measurements",
      intro: "Same method as the breadboard, on the finished board: the careful first power-up, then the readings that prove it's right.",
      setup: { dial: "Ω and •))) first, then V ⎓", leads: "black in COM, red in V Ω", need: "the soldered torch, the batteries, the 47 Ω resistor" },
      steps: [
        "Work through the checklist above with the batteries out.",
        "Power up through the 47 Ω resistor: a dim glow. Then directly: full brightness.",
        "Measure the sense voltage, the LED voltage and the MOSFET voltage, as on the breadboard.",
        "If you fitted the low mode, measure the sense voltage in both positions of the mode switch.",
        "Run it for half an hour and measure the sense voltage again. It may rise slightly: V<sub>BE</sub> falls about 2 mV per °C as Q2 warms, so the current drifts by a few percent.",
      ],
      record: [{ label: "Sense voltage, finished board", unit: "V", min: 0.5, max: 0.66, ok: "Regulating. Your torch is working as designed.", low: "Not regulating: see the fault table below.", high: "Too high: see the fault table below." }],
      expect: `<p>A working torch reads the same as the breadboard did. Note your numbers somewhere: they're your torch's “service data”, and the first thing you'll compare against if it ever misbehaves.</p>`,
    },
    { type: "h2", text: "8 · If it doesn't work" },
    `<p>Use the method from {{ch:repair}}: confirm the symptom, look, check the supply, then measure along the path. These are the faults first builds usually have:</p>
     <div class="bm-table-wrap"><table class="bm-table">
       <thead><tr><th>Symptom</th><th>Measure</th><th>Likely cause</th></tr></thead>
       <tbody>
         <tr><td>Dark. Battery fine.</td><td>Gate voltage (gate to 0 V)</td><td>Near 0 V: Q2's collector and emitter swapped, or Q2 shorted. Near the battery voltage: the LED is reversed or not connected, or Q1's pins are wrong.</td></tr>
         <tr><td>Dark. Nothing anywhere.</td><td>Voltage across the switch, when on</td><td>The full battery voltage across it: the switch or its wiring is open. Check continuity through it.</td></tr>
         <tr><td>Very bright, MOSFET hot, sense voltage over 0.7 V</td><td>Q2 base to emitter</td><td>Q2 isn't regulating: base not joined to the sense node, or the wrong pinout. Switch off at once: the LED is over its rating.</td></tr>
         <tr><td>Dim, sense voltage under 0.5 V</td><td>Battery voltage, under load</td><td>Dropout: the cells are flat, or one is in the wrong way round. Or R2 is the wrong value (check the bands).</td></tr>
         <tr><td>Flickers when tapped</td><td>Voltage-drop walk round the loop</td><td>A cracked or cold joint, or a loose battery contact: it shows a voltage across something that should have none.</td></tr>
       </tbody>
     </table></div>`,
    { type: "h2", text: "9 · Publish it as open hardware" },
    `<p>Open hardware is hardware whose design is published so that anyone can study it, build it, change it and share it. You've done the hard part: the design exists, it's documented, and you understand every decision in it. To make it open hardware, publish four things together, for example in a Git repository:</p>
     <ul>
       <li><strong>The schematic</strong>: a clear drawing, as above. Free tools like KiCad draw them properly, and can lay out a printed circuit board later.</li>
       <li><strong>The parts list</strong>, generic where possible, so people can buy the parts anywhere.</li>
       <li><strong>Build and test notes</strong>: the layout, the checklist, and the readings a working one should give.</li>
       <li><strong>A licence</strong>, so people know what they may do. The <em>CERN Open Hardware Licence</em> is the common choice: CERN-OHL-P (permissive: anyone may do anything, with credit), CERN-OHL-W (changes to your design must be shared) or CERN-OHL-S (anything built on it must be shared too).</li>
     </ul>
     <p>The Open Source Hardware Association (OSHWA) publishes a definition of open hardware and a free certification, if you'd like your torch to carry the logo.</p>`,
    { type: "custom", wide: false, render: (el) => (el.innerHTML = `<h3 class="bom-title">Parts list</h3>${table(["Ref", "Part", "Notes"], BOM)}`) },
    { type: "h2", text: "Where next" },
    `<ul>
       <li><strong>Efficiency:</strong> a switching (buck) driver turns the MOSFET's wasted heat into extra running time. It needs a coil ({{ch:coils}}) and a controller chip: a good second project.</li>
       <li><strong>Modes and a low-battery warning:</strong> a small microcontroller (an ATtiny85, say) can drive the MOSFET's gate with PWM for brightness levels, and watch the battery through a divider ({{ch:dividers}}).</li>
       <li><strong>A printed circuit board:</strong> draw the schematic in KiCad, lay out a board, and have a few made. That's the step from prototype to product.</li>
     </ul>`,
    {
      type: "quiz",
      id: "fl-quiz",
      questions: [
        { q: "Why does the torch use four NiMH cells rather than three?", choices: ["Four look better", "Three give 3.6 V, below the 3.8 V the regulator needs to work", "NiMH cells only come in fours"], answer: 1, explain: "The regulator needs V<sub>f</sub> + V<sub>BE</sub> + a little. Four cells stay above that for nearly all their discharge." },
        { q: "What sets the LED's current?", choices: ["The battery voltage", "V<sub>BE</sub> ÷ the sense resistor", "The MOSFET's R<sub>DS(on)</sub>"], answer: 1, explain: "The NPN holds the sense voltage at about one V<sub>BE</sub>, so I = V<sub>BE</sub> ÷ R2." },
        { q: "Why power up a new board through a 47 Ω resistor first?", choices: ["It makes the LED last longer", "If there's a short or a wrong part, it limits the current to a safe level while you find it", "It charges the batteries"], answer: 1, explain: "A mistake then costs a dim glow and a warm resistor, not a burnt LED or MOSFET." },
        { q: "Where does the battery's energy go that doesn't come out as light?", choices: ["Back into the battery", "Heat: in the MOSFET, the sense resistor and the LED itself", "Nowhere: it's all light"], answer: 1, explain: "About 65% reaches the LED, and only about a third of that becomes light. The rest is heat." },
      ],
    },
  ],
};
