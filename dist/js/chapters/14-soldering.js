import { solderSim, inspectionTrainer } from "../solder.js";

export default {
  id: "soldering",
  title: "Soldering",
  lede: "Soldering joins parts with a metal that melts at a low temperature and bonds to copper. Done right it's strong, conductive and lasts decades. Done wrong it looks fine and fails later. The difference is mostly about heat and timing.",
  minutes: 30,
  goals: [
    "Set up a safe bench and the right tools",
    "Make a through-hole joint in the right order: heat, solder, solder away, iron away",
    "Recognise good and bad joints by eye",
    "Know how to undo a joint",
    "Work out how much heat a joint needs, and why big copper is slow",
    "Check joints with your meter",
  ],
  blocks: [
    { type: "h2", text: "What's actually happening" },
    `<p>Solder doesn't glue things together. When it's hot enough, it <em>wets</em> clean copper: it spreads across the surface and bonds with it, the way water spreads across clean glass but beads up on a greasy one. For that to happen, two things must be true:</p>
     <ul>
       <li><strong>Both surfaces must be hotter than the solder's melting point.</strong> Solder that touches cold metal just freezes onto it as a lump.</li>
       <li><strong>Both surfaces must be clean.</strong> Copper oxidises in air. <em>Flux</em> (inside the core of electronics solder) strips that oxide off as it heats, but it burns away after a few seconds.</li>
     </ul>
     <p>So the iron's job is to heat the <em>joint</em>, the pad and the lead together, and the solder goes onto the joint, not onto the iron. That's the single most important idea in soldering.</p>`,
    { type: "h2", text: "The physics: heat in, heat out" },
    `<p>Two kinds of solder are common. Traditional tin-lead solder (Sn63Pb37) melts at exactly 183 °C. Lead-free solder (usually SAC305: tin with 3% silver and 0.5% copper) melts at about 217–220 °C, flows a little less readily, and is what new products use. Either way, the iron's job is to deliver enough heat, fast enough, to get the pad and the lead above that temperature while the flux is still working.</p>`,
    {
      type: "formula",
      id: "heat",
      name: "Heat to warm something up",
      eq: "Q = m × c × ΔT",
      alt: ["time ≈ Q ÷ P"],
      vars: [
        ["Q", "heat energy needed", "joules, J"],
        ["m", "mass being heated", "kilograms, kg"],
        ["c", "specific heat capacity: copper 385, tin solder about 200, FR4 board about 1,100", "J/(kg·°C)"],
        ["ΔT", "temperature rise", "°C"],
        ["P", "the power actually flowing from the tip into the joint", "watts, W"],
      ],
      why: `<p>Every kilogram of a material takes a fixed amount of energy per degree to warm up: its specific heat capacity. Twice the mass, or twice the rise, takes twice the energy.</p>`,
      use: `<p>Why a pad on a big copper area (a ground plane) won't come up to temperature: the plane is a large mass, and copper also conducts the heat away fast. A bigger tip delivers more power through a larger contact area; leaning on a small one for longer mostly cooks the flux and the board.</p>`,
      example: `<p>A pad and lead, about 0.05 g of copper, from 20 °C to 240 °C:</p>
                <span class="calc">Q = 0.00005 × 385 × 220 = 4.2 J</span>
                <p>With about 10 W flowing from the tip into it, that's under half a second. A ground-plane pad might be 2 g: 170 J, or 17 seconds, while it also loses heat to the rest of the plane.</p>`,
    },
    { type: "h2", text: "Try it: the soldering simulator" },
    `<p>Below is a cross-section: a component's lead poking up through a hole in a circuit board, with a copper <em>pad</em> around it. The thermometers show how hot the pad and the lead are. Solder melts at 217 °C (the dashed line).</p>
     <p><strong>How to use it:</strong> click <b>Put the iron on the joint</b>, watch both temperatures climb past the line, then <b>hold</b> “feed solder” for a second or two. Release the solder, then lift the iron. Or use the keyboard: <kbd>I</kbd> for the iron, hold <kbd>S</kbd> for solder. Then try doing it badly on purpose: solder too early, too much, or leave the iron on too long.</p>`,
    { type: "custom", tasks: ["solder-good", "solder-plane"], render: (el) => solderSim(el) },
    `<p>A few things the simulator shows that are true at a real bench:</p>
     <ul>
       <li><strong>Big copper areas are slow to heat.</strong> A pad on a ground plane drains heat away. Use a hotter iron or a bigger tip, rather than leaning on it for longer.</li>
       <li><strong>A little molten solder helps heat flow.</strong> Once some solder melts into the joint, it conducts heat much better, which is why a freshly <em>tinned</em> (solder-coated) tip works so much better than a dry one.</li>
       <li><strong>Hotter isn't automatically better.</strong> Flux burns faster, and pads lift sooner. 330–370 °C suits most lead-free work.</li>
     </ul>`,
    { type: "h2", text: "The sequence, step by step" },
    `<ol class="steps">
       <li><b>Prepare.</b> Board held firmly in a clamp or holder. Iron in its stand, tip cleaned on brass wool, then tinned with a little fresh solder.</li>
       <li><b>Fit the part.</b> Push the leads through, check orientation (polarity marks!), and bend the leads slightly outward so the part stays put.</li>
       <li><b>Heat the joint.</b> Touch the tip so it contacts <em>both</em> the pad and the lead. Count “one, two”.</li>
       <li><b>Feed the solder</b> into the joint on the side opposite the iron: the joint melts it, not the iron. It should flow around the lead in a second or two.</li>
       <li><b>Solder away, then iron away.</b> In that order. Then keep everything still for a few seconds while it freezes.</li>
       <li><b>Trim</b> the excess lead with flush cutters, holding the end so it doesn't fly off.</li>
       <li><b>Inspect.</b> A smooth, concave cone, wetted onto both pad and lead, with no bridges to neighbours.</li>
     </ol>`,
    {
      type: "note",
      kind: "safety",
      title: "At the bench",
      html: `<ul>
        <li>The tip is around 350 °C. Always return the iron to its stand; never leave it lying on the bench. Never catch a falling iron.</li>
        <li>Flux fumes irritate the lungs. Work with ventilation or a fume extractor, and don't lean over the joint.</li>
        <li>Wear eye protection: clipped leads and spitting flux go everywhere.</li>
        <li>Wash your hands after soldering (especially with leaded solder) and keep food and drink off the bench.</li>
        <li>Only solder circuits that are disconnected from any power.</li>
      </ul>`,
    },
    { type: "h2", text: "Train your eye" },
    `<p>Most bad joints can be spotted by eye, with a magnifier. Here are the ones you'll meet. Diagnose each.</p>`,
    { type: "custom", tasks: ["solder-eye"], wide: false, render: (el) => inspectionTrainer(el) },
    { type: "h2", text: "Undoing a joint" },
    `<p>You'll need to remove solder to fix mistakes and to replace parts in repairs. Two tools do almost everything:</p>
     <ul>
       <li><strong>Solder wick</strong> (desoldering braid): copper braid soaked in flux. Lay it on the joint, press the iron on top, and the molten solder soaks into the braid. Snip off the used end.</li>
       <li><strong>Solder sucker</strong> (desoldering pump): cock it, melt the joint, then put the nozzle on and press the button to suck the solder away.</li>
     </ul>
     <p>Adding a little <em>fresh</em> solder to an old joint before removing it often helps: the new flux and solder help the old stuff melt and flow. Never pull a lead out of a hole while its solder is still solid; that's how pads get ripped off.</p>`,
    {
      type: "note",
      kind: "build",
      title: "Your first practice session",
      html: `<p>Get a cheap through-hole practice board and a strip of resistors. Solder ten resistors, inspect every joint with a magnifier, then desolder five of them and do them again. Twenty joints in, you'll be surprised how natural it feels. Move to small surface-mount parts (size 1206, then 0805) once through-hole is easy.</p>`,
    },
    {
      type: "bench",
      id: "bench-joints",
      title: "Check your practice joints with the meter",
      intro: "A joint can look acceptable and still not connect. After a practice session, buzz your work out before you trust it.",
      setup: { dial: "Ω, then SELECT for •)))", leads: "black in COM, red in V Ω", need: "your practice board with soldered resistors" },
      steps: [
        "On continuity, touch the probes to the same copper track either side of each joint you made: every one should beep.",
        "Check that neighbouring pads that shouldn't connect <em>don't</em> beep. A beep there means a solder bridge.",
        "On Ω, measure each soldered resistor through its two joints, probing the copper pads rather than the leads. It should read its marked value: a cracked joint reads high, or OL, or wanders when you press on the part.",
        "Flex the board gently while watching the reading: a cold joint often shows itself by flickering.",
      ],
      expect: `<p>A good joint is a few thousandths of an ohm: far below what your meter can resolve, so it simply disappears from the reading. A bad one shows up as OL, as extra resistance, or as a reading that changes when you flex the board. This is exactly how you'll check the flashlight before its first power-up.</p>`,
    },
    {
      type: "problems",
      id: "solder-p",
      title: "Heat, on paper",
      items: [
        { id: "solder-p1", level: 1, q: "<p>How much heat raises 0.1 g of copper (c = 385 J/(kg·°C)) from 20 °C to 250 °C?</p>", unit: "J", answer: 0.0001 * 385 * 230, hints: ["Q = m × c × ΔT, with m in kg: 0.0001."], solution: "<p>Q = 0.0001 × 385 × 230 = <b>8.9 J</b>.</p>" },
        {
          id: "solder-p2",
          level: 2,
          q: "<p>If 12 W flows from the iron into that joint, about how long does it take to heat, ignoring losses?</p>",
          unit: "s",
          answer: (0.0001 * 385 * 230) / 12,
          hints: ["time = energy ÷ power."],
          solution: "<p>t = 8.9 ÷ 12 = <b>0.74 s</b>. In practice longer, because heat leaks away into the board and the lead while it warms.</p>",
        },
        {
          id: "solder-p3",
          level: 3,
          q: "<p>A temperature-controlled iron's heater is rated 60 W at 24 V. What is its resistance?</p>",
          unit: "Ω",
          answer: (24 * 24) / 60,
          hints: ["P = V² ÷ R, rearranged."],
          solution: "<p>R = 24² ÷ 60 = <b>9.6 Ω</b>. The station switches it on and off rapidly to hold the set temperature: the duty cycle you'll meet with PWM.</p>",
        },
      ],
    },
    {
      type: "quiz",
      id: "solder-quiz",
      questions: [
        {
          q: "Where should the solder be fed?",
          choices: ["Onto the iron's tip, so it drips onto the joint", "Into the heated joint, on the side opposite the iron", "Onto the lead before heating"],
          answer: 1,
          explain: "The joint itself must melt the solder. Solder melted on the tip and dripped onto a cold joint makes a cold joint.",
        },
        {
          q: "When you finish a joint, what comes away first?",
          choices: ["The iron", "The solder", "It doesn't matter"],
          answer: 1,
          explain: "Solder away, then iron away. Lift the iron first and the solder wire can freeze into the joint.",
        },
        {
          q: "A joint is a round ball sitting on the pad, not stuck to the lead. What happened?",
          choices: ["Too much heat", "The joint wasn't hot enough, so the solder never wetted it", "The solder was the wrong colour"],
          answer: 1,
          explain: "That's a cold joint. Reheat with a little flux until it flows, and it'll usually pull into a proper fillet.",
        },
        {
          q: "A pad on a big copper area won't get hot enough. Best fix?",
          choices: ["Hold the iron on for 20 seconds", "Use a bigger tip or a hotter setting so heat gets in faster", "Use more solder"],
          answer: 1,
          explain: "Long dwell times burn the flux and lift pads. Get the heat in faster with a bigger tip (more contact) or a higher temperature.",
        },
      ],
    },
  ],
};
