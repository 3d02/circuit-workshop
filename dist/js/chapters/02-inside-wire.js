import { wireZoom, fieldRace, fieldMap, driftCalc } from "../micro.js";

export default {
  id: "inside",
  title: "Inside the wire: charges and fields",
  lede: "Zoom in on a copper wire and electricity stops being mysterious. There are only two characters: charges that are free to move, and the electric field that pushes them. Get these two straight and everything else in this course follows.",
  minutes: 30,
  goals: [
    "Say what carries charge in a wire, in a battery and in a semiconductor",
    "Explain what a current really is: a net flow of charge",
    "Describe what the electric field does, and how quickly it gets everywhere",
    "Explain why electrons drift so slowly, yet a lamp lights instantly",
    "Say where a circuit's energy actually travels, and where it's used",
  ],
  blocks: [
    { type: "h2", text: "Charge: the stuff that flows" },
    `<p>Everything is made of atoms, and atoms are made of charged particles: positive <strong>protons</strong> in the nucleus, negative <strong>electrons</strong> around it. Normally they balance exactly, so ordinary objects are electrically neutral.</p>
     <p>Charge is measured in <strong>coulombs</strong> (C). A single electron carries a minuscule 0.000 000 000 000 000 000 16 C, so one coulomb is the charge of about 6 billion billion electrons.</p>
     <p>In most materials, every electron is tied to its own atom. Metals are different. In copper, each atom lets go of one electron, which is then free to wander anywhere in the metal. What's left behind is a positive copper <em>ion</em>, held in place in a regular crystal. So a wire is a rigid lattice of positive ions soaked in a sea of free electrons: about 85 billion billion of them in every cubic millimetre. Overall it's still neutral; the electrons simply aren't attached to anything.</p>`,
    {
      type: "note",
      kind: "analogy",
      title: "What carries the charge depends on the material",
      html: `<ul>
        <li><strong>Metals</strong> (wires, resistor films, lamp filaments): free electrons.</li>
        <li><strong>Inside a battery</strong>, and in salt water or your own body: <em>ions</em>, whole atoms with an electron too many or too few, moving through a liquid or paste.</li>
        <li><strong>Semiconductors</strong> (diodes, LEDs, transistors): electrons, and <em>holes</em> (places where an electron is missing), which behave like positive charges. You'll meet them in {{ch:leds}}.</li>
        <li><strong>Insulators</strong> (plastic, glass, air): almost no free carriers at all. That's exactly why they're used to cover wires.</li>
      </ul>`,
    },
    { type: "h2", text: "Zoom in: a wire on its own" },
    `<p>Below is a slice of copper wire, magnified about a hundred million times. The copper-coloured circles are the ions, fixed in place; they jiggle because the metal is warm. The small blue dots are the free electrons. The dashed line counts electrons crossing it in each direction.</p>`,
    {
      type: "predict",
      id: "inside-random",
      q: "No battery is connected. What are the free electrons doing?",
      choices: ["Sitting still, waiting to be pushed", "Racing around in random directions", "Flowing slowly in one direction"],
      answer: 1,
      why: ["They're never still. Even in a cold wire, free electrons move at enormous speeds.", "", "With nothing to push them, no direction is special, so there's no reason to flow one way."],
      explain: `<p>Free electrons in copper move at around <strong>1,600 kilometres per second</strong>, constantly bouncing off the vibrating ions and changing direction. (The animation slows them down enormously.) But they head in every direction equally, so about as many cross the counting line one way as the other.</p>
                <p>That's the key to what a current is. <strong>A current isn't electrons moving: it's a net flow of charge</strong>, more crossing one way than the other. One ampere means one coulomb of net charge passing each second, which is about 6 billion billion electrons.</p>`,
    },
    { type: "custom", tasks: ["wire-net", "wire-follow", "wire-hot"], render: (el) => wireZoom(el) },
    `<p>Now connect the battery. Here's what changes:</p>
     <ul>
       <li><strong>The battery sets up an electric field</strong> inside the wire (the yellow arrows). A field is a push that exists at every point in a region: at each point, it says which way, and how hard, a charge there would be pushed. Here it points from the end connected to <b>+</b> toward the end connected to <b>−</b>.</li>
       <li><strong>The field pushes every free electron at once</strong>, wherever it is. Electrons are negative, so they're pushed <em>against</em> the field's direction: to the left here.</li>
       <li><strong>Collisions keep interrupting.</strong> An electron gains a little speed toward the left, hits an ion, bounces off in a random direction, and starts gaining again. Each collision hands the energy it picked up to the ion, which shakes harder. That shaking is <strong>heat</strong> (the glowing ions). This is where a resistor's heat comes from, and it's what resistance <em>is</em>: how much the collisions get in the way.</li>
       <li><strong>The result is a slow drift</strong> of the whole swarm, on top of the fast random motion. Follow one electron and you'll see it often heading the “wrong” way. Only on average does it drift.</li>
     </ul>
     <p>Notice the directions. The electrons drift left, yet we say the current flows right, the way the field points. That's the conventional current from {{ch:loop}}: negative charge moving left is the same flow of charge as positive charge moving right.</p>`,
    {
      type: "formula",
      id: "current",
      name: "Current: charge per second",
      eq: "I = Q ÷ t",
      alt: ["Q = I × t", "t = Q ÷ I"],
      vars: [
        ["I", "current", "amperes, A"],
        ["Q", "net charge that passes", "coulombs, C"],
        ["t", "time taken", "seconds, s"],
      ],
      why: `<p>This is the definition of current: count the net charge crossing a line, and divide by how long you counted. One ampere is one coulomb per second, exactly what the counting line in the figure above measures.</p>`,
      use: `<p>Battery capacity. A battery's mAh is Q = I × t written in milliamps and hours: a 2,000 mAh cell can deliver 2,000 mA for an hour, which is 2 A × 3,600 s = 7,200 C. You'll use this in {{ch:energy}}.</p>`,
      example: `<p>A torch draws 0.5 A for one minute. How much charge passes?</p>
                <span class="calc">Q = I × t = 0.5 A × 60 s = 30 C</span>
                <p>That's 30 ÷ (1.6 × 10⁻¹⁹) ≈ 1.9 × 10²⁰ electrons, every one of which comes back to the battery.</p>`,
    },
    {
      type: "formula",
      id: "electrons",
      name: "Counting electrons",
      eq: "N = Q ÷ e",
      vars: [
        ["N", "number of electrons", "a plain count"],
        ["Q", "charge", "coulombs, C"],
        ["e", "charge of one electron", "1.6 × 10⁻¹⁹ C"],
      ],
      why: `<p>Charge comes in lumps: every electron carries the same tiny amount, e. So the total charge is the number of electrons times e.</p>`,
      use: `<p>Getting a feel for scale. One amp is 6.25 × 10¹⁸ electrons a second, which is why nobody counts them one by one.</p>`,
    },
    {
      type: "predict",
      id: "inside-double",
      q: "You double the battery voltage, which doubles the field. What happens to the electrons' drift?",
      choices: ["It doubles", "It stays the same", "Their random speed doubles instead"],
      answer: 0,
      why: ["", "A stronger push between collisions builds up more drift each time.", "The random speed belongs to the metal itself. The field only adds a small drift on top."],
      explain: `<p>Twice the push between collisions means twice the drift, so twice the current. That's Ohm's law, seen from the inside: current is proportional to voltage because drift is proportional to the field. Try it above: compare the net count at 50% and at 100%.</p>
                <p>The heating goes up four times. Each electron is pushed twice as hard <em>and</em> moves twice as far along the push, so the field does four times the work. That's the P = V²/R you'll meet in {{ch:resistance}}.</p>`,
    },
    {
      type: "note",
      kind: "deeper",
      title: "Is this really how electrons collide?",
      html: `<p>Not exactly. Quantum mechanics lets electrons glide straight through a perfect crystal; what actually scatters them is the ions' heat vibrations and imperfections in the crystal. This bouncing-ball picture (the Drude model, from 1900) still gets the important things right, including why a metal's resistance rises as it heats up: hotter means more vibration, more scattering, less drift.</p>
             <p>One thing the animation exaggerates wildly: here the drift is a decent fraction of the random speed so you can see it. In real copper it's about a hundred-billionth.</p>`,
    },
    { type: "h2", text: "Fast field, slow electrons" },
    `<p>So how slow is the drift, really? For 0.3 A flowing in ordinary hook-up wire, about <strong>0.04 mm per second</strong>. A garden snail is a few hundred times faster. And yet when you flip a switch, the lamp lights at once. How?</p>`,
    {
      type: "predict",
      id: "inside-instant",
      q: "A lamp is at the end of 30 cm of wire. You close the switch. Roughly how long until it lights?",
      choices: ["About two hours: as long as electrons take to get there", "A couple of billionths of a second", "About a second"],
      answer: 1,
      why: ["That would be true if the lamp had to wait for electrons from the battery. It doesn't.", "", "Much, much quicker than that."],
      explain: `<p>The lamp doesn't need electrons from the battery: its filament is already full of free electrons. What it needs is the <strong>field</strong>, to push them. And the field spreads along the wires at roughly two-thirds of the speed of light, covering 30 cm in about 1.5 billionths of a second. Close the switch below, then speed up time to follow one electron.</p>`,
    },
    { type: "custom", tasks: ["race-field", "race-electron"], render: (el) => fieldRace(el) },
    `<p>The field is what gets everywhere fast. The electrons were there all along; the field sets them all moving together. When people say “electricity travels at nearly the speed of light”, this is what they mean: the field, not the electrons.</p>`,
    {
      type: "note",
      kind: "analogy",
      title: "A picture to hold on to: a hose that's already full",
      html: `<p>Open the tap on a hose that's already full of water, and water comes out of the far end straight away, even though the water you just let in is still back at the tap. A wire is always “full” of free electrons, so the moment the field arrives, the ones in the lamp start moving.</p>
             <p>The picture only goes so far. In a hose, the push travels from molecule to molecule as pressure. In a wire, electrons don't push each other along: each one is pushed directly by the field.</p>`,
    },
    { type: "custom", wide: false, render: (el) => driftCalc(el) },
    {
      type: "formula",
      id: "drift",
      name: "Drift speed",
      eq: "v = I ÷ (n × A × e)",
      vars: [
        ["v", "average drift speed of the electrons", "metres per second, m/s"],
        ["I", "current", "amperes, A"],
        ["n", "free electrons per cubic metre", "copper: 8.5 × 10²⁸"],
        ["A", "the wire's cross-section area", "square metres, m² (1 mm² = 10⁻⁶ m²)"],
        ["e", "charge of one electron", "1.6 × 10⁻¹⁹ C"],
      ],
      why: `<p>In one second, every free electron within a distance v upstream of the counting line crosses it. Those electrons fill a cylinder of length v and area A, so there are n × A × v of them, carrying n × A × v × e coulombs. That charge per second is the current: I = n A v e. Rearrange for v.</p>`,
      use: `<p>It explains why the drift is so slow (n is enormous) and why it's slower still in thick wires carrying the same current. The field, not the electrons, is what makes a lamp light instantly.</p>`,
      example: `<p>0.3 A in a 0.5 mm² wire:</p>
                <span class="calc">v = 0.3 ÷ (8.5 × 10²⁸ × 0.5 × 10⁻⁶ × 1.6 × 10⁻¹⁹) = 0.3 ÷ 6,800 = 4.4 × 10⁻⁵ m/s</span>
                <p>That's 0.044 mm per second, the figure quoted above.</p>`,
    },
    { type: "h2", text: "Where the field comes from" },
    `<p>A battery is a <strong>charge pump</strong>. Inside it, a chemical reaction moves charge (as ions, through the battery's paste) from one terminal to the other, even though the field inside the battery pushes the other way. That's what the battery's chemical energy is spent on, like a lift raising a load. The result: a little extra negative charge on the <b>−</b> terminal, and a shortage on the <b>+</b> terminal.</p>
     <p>That separated charge doesn't stay at the terminals. Within nanoseconds of connecting a circuit, a tiny amount spreads out as a thin layer on the <em>surface</em> of the wires: positive along the side connected to <b>+</b>, negative along the side connected to <b>−</b>, changing gradually in between. It's far too little to notice, but it's this <strong>[[surface charge]]</strong> that shapes the field so that inside the wire it points along the wire, round every bend.</p>`,
    `<p>Here's that charge in 3D. The amount is exaggerated enormously so you can see it, but its pattern is right. <strong>Drag to turn the circuit round</strong>, and look at where the signs sit.</p>`,
    { type: "scene", scene: "wire3d", tasks: ["w3d-turn", "w3d-open", "w3d-volts"] },
    `<p>Notice three things. The charge sits on the <em>outside</em> of the wire, never inside the metal. It changes <em>along the length</em> of the circuit: + all along the wire from the + terminal, − along the return wire, and the change is steepest across the filament. And it's astonishingly little: a few million extra charges on a centimetre of wire that holds hundreds of billions of billions of free electrons. That's about one extra charge for every hundred trillion free electrons, yet it's enough to steer the field round every corner.</p>`,
    {
      type: "note",
      kind: "myth",
      title: "Isn't the middle of the wire charged one way and the outside the other?",
      html: `<p>It's a popular picture: a current-carrying wire polarised across its thickness, positive in the centre and negative outside. It isn't what happens. With a steady current, the inside of a metal stays neutral. Any extra charge spreads to the surface, and it varies <em>along the wire's length</em>, as in the 3D view.</p>
             <p>There is one real effect across the thickness, and it goes the other way. The current makes a magnetic field round the wire, and that field nudges the moving electrons slightly toward the centre: the <em>pinch effect</em>. The centre ends up very slightly negative. In a household wire the sideways field this creates is about a billion times weaker than the field along the wire. It matters in lightning and in plasma, not in anything you'll build.</p>`,
    },
    { type: "custom", tasks: ["fm-open", "fm-energy"], render: (el) => fieldMap(el) },
    `<p>Three things to notice:</p>
     <ul>
       <li><strong>The field is weak in the copper and strong in the filament.</strong> Copper lets electrons drift easily, so it needs only a tiny push. The thin filament resists, so the surface charge changes steeply across it and the field there is strong. The field arranges itself, automatically, so that the same current gets through every part of the loop.</li>
       <li><strong>Open the switch and the field inside every conductor vanishes.</strong> Charge piles up on the two faces of the gap, just enough to cancel the field inside the wires, so nothing drifts. The whole 9 V now sits across the gap: exactly what the voltmeter showed across a broken wire in {{ch:voltage}}.</li>
       <li><strong>Field and voltage are two views of the same thing.</strong> The voltage between two points is the push the field gives each coulomb of charge, added up along the way: the energy per coulomb. A strong field over a short length (the filament) is a big voltage drop; a weak field along a wire is a tiny one.</li>
     </ul>`,
    {
      type: "formula",
      id: "field-uniform",
      name: "Field along a uniform wire",
      eq: "E = V ÷ L",
      alt: ["V = E × L"],
      vars: [
        ["E", "electric field strength (later chapters use E for energy too; the units tell them apart)", "volts per metre, V/m"],
        ["V", "voltage across that length", "volts, V"],
        ["L", "the length", "metres, m"],
      ],
      why: `<p>Voltage is the field's push per coulomb added up along the way. Where the field is the same all along a piece of material, adding it up is just multiplying: V = E × L.</p>`,
      use: `<p>Comparing parts of a circuit. A big voltage across a short filament means a strong field there; a tiny voltage along a long copper wire means a very weak one. It's also why sparks need a strong field: air breaks down at about 3 million V/m, so mains can only jump a fraction of a millimetre.</p>`,
      example: `<p>A 9 V lamp has a filament about 2 cm long. Nearly all the 9 V is across it:</p>
                <span class="calc">E = V ÷ L = 9 ÷ 0.02 = 450 V/m</span>
                <p>The copper wire carrying the same current has only a few hundredths of a volt per metre along it.</p>`,
    },
    { type: "h2", text: "Who carries the energy?" },
    `<p>Not the electrons. They're far too slow, and every electron that leaves the battery eventually comes back to it. The <strong>field delivers the energy</strong>: in the filament, the strong field pushes the electrons hard, they collide with the ions, and the ions' extra shaking is heat. In a lamp filament it gets hot enough to glow.</p>
     <p>And between the battery and the lamp, the energy travels through the space <em>around</em> the wires, carried by the electric field together with the magnetic field the current creates. Tick “Energy flow” in the figure above to see its path. The wires guide the energy; they don't carry it inside themselves. That's how energy can reach the lamp at nearly the speed of light while the electrons crawl.</p>`,
    {
      type: "note",
      kind: "deeper",
      title: "Really, through the space around the wires?",
      html: `<p>Yes. Physicists describe the flow of energy with the <em>Poynting vector</em>, which combines the electric and magnetic fields at each point. In a battery-and-lamp loop it points out of the battery, through the air or insulation between the wires, and into the filament. It's one of the more surprising results in physics, and it's how every power line and every torch really works. Inside an ideal wire there's no energy flowing along it at all.</p>`,
    },
    {
      type: "note",
      kind: "myth",
      title: "Myth: electricity is electrons moving at the speed of light",
      html: `<p>The electrons move at a snail's pace. What travels at close to the speed of light is the field, and the energy it carries.</p>`,
    },
    {
      type: "note",
      kind: "myth",
      title: "Myth: a battery is a store of electrons",
      html: `<p>A battery has no spare electrons to send out. It's a pump: it uses chemical energy to keep charge separated across its terminals, and that keeps the field going. A flat battery contains exactly as many electrons as a fresh one. What it has run out of is chemical energy.</p>`,
    },
    {
      type: "problems",
      id: "inside-p",
      title: "Charges and fields, on paper",
      items: [
        { id: "inside-p1", level: 1, q: "<p>A current of 2 A flows for 5 seconds. How much charge passes?</p>", unit: "C", answer: 10, hints: ["Q = I × t."], solution: "<p>Q = I × t = 2 A × 5 s = <b>10 C</b>.</p>" },
        {
          id: "inside-p2",
          level: 1,
          q: "<p>An LED runs at 1 mA. How many electrons pass through it each second?</p>",
          unit: "electrons",
          answer: 1e-3 / 1.602e-19,
          hints: ["In one second, Q = I × t = 0.001 C.", "N = Q ÷ e = 0.001 ÷ (1.6 × 10⁻¹⁹)."],
          solution: "<p>Q = 0.001 A × 1 s = 0.001 C. N = 0.001 ÷ (1.6 × 10⁻¹⁹) = <b>6.25 × 10¹⁵</b> electrons per second. Type it as <code>6.25e15</code>.</p>",
        },
        {
          id: "inside-p3",
          level: 2,
          q: "<p>A phone battery is rated 4,000 mAh. How much charge is that in coulombs?</p>",
          unit: "C",
          answer: 14400,
          hints: ["mAh is milliamps × hours. Convert both to base units.", "4,000 mA = 4 A, and 1 h = 3,600 s."],
          solution: "<p>Q = I × t = 4 A × 3,600 s = <b>14,400 C</b>.</p>",
        },
        {
          id: "inside-p4",
          level: 2,
          q: "<p>A 12 V heater in a camper van draws 10 A through copper wire with a 1.5 mm² cross-section. What is the electrons' drift speed? Copper has 8.5 × 10²⁸ free electrons per m³.</p>",
          unit: "mm/s",
          answer: (10 / (8.5e28 * 1.5e-6 * 1.602e-19)) * 1000,
          tol: 0.03,
          hints: ["v = I ÷ (n × A × e). Convert the area: 1.5 mm² = 1.5 × 10⁻⁶ m².", "n × A × e = 8.5 × 10²⁸ × 1.5 × 10⁻⁶ × 1.6 × 10⁻¹⁹ ≈ 20,400."],
          solution: "<p>n × A × e = 8.5 × 10²⁸ × 1.5 × 10⁻⁶ × 1.6 × 10⁻¹⁹ = 20,400 C/m.</p><p>v = 10 ÷ 20,400 = 4.9 × 10⁻⁴ m/s = <b>0.49 mm/s</b>.</p>",
        },
        {
          id: "inside-p5",
          level: 3,
          q: "<p>At that drift speed, how many minutes would one electron take to travel the 2 m from the van's battery to the heater?</p>",
          unit: "min",
          answer: 2 / (10 / (8.5e28 * 1.5e-6 * 1.602e-19)) / 60,
          tol: 0.04,
          hints: ["time = distance ÷ speed. Use the speed in m/s: 4.9 × 10⁻⁴.", "2 ÷ 0.00049 gives seconds; divide by 60."],
          solution: "<p>t = 2 m ÷ 0.00049 m/s = 4,080 s, about <b>68 minutes</b>. The heater still warms up the moment you switch on, because the field arrives in nanoseconds and pushes the electrons already inside it.</p><p>(On mains AC the electrons don't travel at all: they jiggle back and forth by a few thousandths of a millimetre, 50 times a second.)</p>",
        },
        {
          id: "inside-p6",
          level: 2,
          q: "<p>A torch bulb's filament is 1.5 cm long and has 4.5 V across it. What is the field strength inside it?</p>",
          unit: "V/m",
          answer: 4.5 / 0.015,
          hints: ["E = V ÷ L, with L in metres: 0.015 m."],
          solution: "<p>E = 4.5 ÷ 0.015 = <b>300 V/m</b>.</p>",
        },
      ],
    },
    { type: "h2", text: "The whole story, in five steps" },
    `<ol class="steps">
       <li><b>Charge is carried by particles that can move:</b> free electrons in metals, ions in batteries and liquids.</li>
       <li><b>A battery pumps charge</b> using chemical energy, leaving extra on one terminal and a shortage on the other.</li>
       <li><b>That separated charge sets up an electric field</b> around the whole loop, shaped by a thin layer of charge on the wires' surfaces, within nanoseconds.</li>
       <li><b>The field pushes every free electron at once.</b> They zigzag at high speed but drift slowly; their net flow is the current, the same all the way round.</li>
       <li><b>Where the path resists</b> (a filament, a resistor), the field is strongest and does the most work there: energy becomes heat and light. The energy itself travels through the fields around the wires.</li>
     </ol>
     <p>Every later chapter builds on this. Voltage is the field's push added up between two points; resistance is how much the collisions get in the way; Ohm's law is drift being proportional to the push.</p>`,
    {
      type: "quiz",
      id: "inside-quiz",
      questions: [
        {
          q: "What carries the charge in a copper wire?",
          choices: ["Free electrons", "Copper ions", "The electric field"],
          answer: 0,
          explain: "Free electrons move; the ions stay put in the crystal. The field pushes the electrons, but the field itself isn't charge.",
        },
        {
          q: "Free electrons in copper move at about 1,600 km/s, even with no battery. Why isn't that a current?",
          choices: ["They move in random directions, so there's no net flow", "They're too small to count", "Only protons can make a current"],
          answer: 0,
          explain: "Current is the net flow of charge. Random motion sends as much charge one way as the other.",
        },
        {
          q: "Why does a lamp light the instant you close the switch?",
          choices: ["Electrons from the battery reach it at nearly light speed", "The field reaches it in nanoseconds and pushes the electrons already in the filament", "The lamp stores some light in advance"],
          answer: 1,
          explain: "The electrons are already everywhere. Only the field has to arrive, and it's fast.",
        },
        {
          q: "In a battery-and-lamp loop, where is the electric field strongest?",
          choices: ["In the copper wires", "In the lamp's filament", "It's the same everywhere"],
          answer: 1,
          explain: "The filament resists most, so the field there is strongest, and that's where the energy is delivered.",
        },
        {
          q: "Where does a resistor's heat come from?",
          choices: ["Electrons rubbing against the plastic coating", "Electrons handing the energy they gained from the field to the ions when they collide", "The resistor using up some of the electrons"],
          answer: 1,
          explain: "Between collisions the field speeds electrons up; each collision passes that energy to the vibrating ions, which is heat. No electrons are used up.",
        },
      ],
    },
  ],
};
