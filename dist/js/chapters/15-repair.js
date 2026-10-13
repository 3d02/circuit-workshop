import { repairBench, JOBS } from "../repair.js";

export default {
  id: "repair",
  title: "Fault finding",
  lede: "Repair isn't about knowing every circuit. It's a method: confirm the symptom, check the supply, follow the path with your meter, and only replace what the evidence points to.",
  minutes: 35,
  goals: [
    "Follow a repeatable fault-finding method instead of guessing",
    "Use voltage readings on a powered circuit to locate a break",
    "Use continuity and resistance on an unpowered circuit to confirm a fault",
    "Fix six real-world faults on the repair bench",
  ],
  blocks: [
    { type: "h2", text: "The method" },
    `<ol class="steps">
       <li><b>Confirm the symptom.</b> What exactly doesn't work? What still does? “Completely dead” and “works but dim” point to very different faults.</li>
       <li><b>Look and smell.</b> Burnt parts, bulging capacitors, cracked joints, loose connectors, corrosion. Many faults are visible.</li>
       <li><b>Check the supply first.</b> Is the battery or power supply actually delivering its voltage, while the circuit is switched on?</li>
       <li><b>Follow the path with the meter</b>, power on. Measure the voltage across each part along the loop. Wires, switches and fuses should read close to 0 V. A break shows up as the full supply voltage across it.</li>
       <li><b>Confirm with the power off.</b> Continuity across a suspected break, resistance of a suspected wrong part, diode test for diodes and LEDs.</li>
       <li><b>Change one thing at a time</b>, then test again. If you change three things and it works, you won't know which one fixed it.</li>
     </ol>`,
    {
      type: "note",
      kind: "repair",
      title: "Half-splitting",
      html: `<p>In a long chain (a cable, a string of parts), don't start at one end. Measure in the middle: is the signal or voltage right there? If yes, the fault is in the second half; if not, the first. Each measurement halves the search.</p>`,
    },
    {
      type: "bench",
      id: "bench-dropwalk",
      title: "The voltage-drop walk",
      intro: "Step 4 of the method, on a real circuit. It finds bad contacts that continuity mode misses, because it tests them while they carry current.",
      setup: { dial: "V, with ⎓ showing (or mV for small drops)", leads: "black in COM, red in V Ω", need: "the LED circuit from {{ch:multimeter}}, built on the breadboard, and one jumper wire you can loosen" },
      steps: [
        "Power the circuit. Measure across each part in turn: the battery, the battery clip's two contacts, each jumper wire (one probe on each end), the resistor, the LED.",
        "Write them down. Wires and contacts should read a few millivolts at most; the resistor and LED take almost all of the supply.",
        "Now half-pull one jumper wire out of its hole so it just touches. Measure across it again: a bad contact shows up as a voltage across something that should have none.",
        "Push it back in and confirm the drop disappears.",
      ],
      expect: `<p>This is Kirchhoff's voltage law turned into a fault-finding tool. Every millivolt of the supply is accounted for somewhere round the loop. A connection that's going bad takes its share as I × R, and heats up doing it, long before it fails completely. Electricians use exactly this on car wiring and on mains connections: the warm, high-resistance joint is what starts fires.</p>`,
    },
    { type: "h2", text: "The repair bench" },
    `<p>Each job below has exactly one fault. The circuit is drawn as it <em>should</em> be, like a schematic in a service manual; the board in front of you is what's actually built. Unlike the rest of this course, you can't see voltages here, just like a real board. Use the meter. When you're confident, use <b>Replace a part…</b> and click the culprit.</p>
     <p>You'll be scored on measurements and wrong replacements. Wrong parts cost money in real life too.</p>`,
    { type: "custom", tasks: JOBS.map((j) => j.id), render: (el) => repairBench(el) },
    { type: "h2", text: "Beyond the bench" },
    `<p>Real repairs add a few habits on top of the method:</p>
     <ul>
       <li><strong>Photograph before you remove anything</strong>, and note the orientation of every part you take out.</li>
       <li><strong>Find the datasheet or schematic</strong> if one exists. Many devices have service manuals or community teardowns online.</li>
       <li><strong>Treat static with respect</strong> when handling chips and MOSFETs: touch something grounded first, or use an anti-static wrist strap.</li>
       <li><strong>Mains-powered equipment is off-limits</strong> until you've had proper training. Power supplies can hold lethal charge after unplugging.</li>
       <li><strong>Lithium batteries</strong> that are swollen, punctured or hot are a fire risk. Don't charge them, don't puncture them, and recycle them properly.</li>
     </ul>`,
    {
      type: "quiz",
      id: "repair-quiz",
      questions: [
        {
          q: "A device is completely dead. What do you check first?",
          choices: ["The most complicated chip on the board", "The power supply or battery, while switched on", "Every resistor's value"],
          answer: 1,
          explain: "Supply first, always. It's the commonest fault and the quickest to rule out.",
        },
        {
          q: "With the power on, you measure 9 V across a fuse. What does that tell you?",
          choices: ["The fuse is fine", "The fuse is open (blown)", "The fuse is shorted"],
          answer: 1,
          explain: "A good fuse is nearly a wire, with almost 0 V across it. The full supply across it means it's open.",
        },
        {
          q: "A replacement fuse blows the moment you switch on. What next?",
          choices: ["Fit a bigger fuse", "Power off and look for a short circuit with continuity or resistance mode", "Keep trying new fuses"],
          answer: 1,
          explain: "Something is shorting the supply. Find it with the power off before fitting another fuse. Never fit a bigger one.",
        },
        {
          q: "Why change one thing at a time?",
          choices: ["Because it's slower and more careful", "So you know which change fixed (or broke) it", "Because parts are expensive"],
          answer: 1,
          explain: "Repair is an experiment. One variable at a time gives you a clear answer.",
        },
      ],
    },
  ],
};
