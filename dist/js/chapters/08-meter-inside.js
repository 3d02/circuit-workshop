import { meterDiagram, accuracyLab, rmsLab, ghostLab } from "../meterlabs.js";

export default {
  id: "meter-inside",
  title: "How your meter works, and when it fibs",
  lede: "Every term in your meter's manual, from counts and accuracy to burden voltage, True RMS, LoZ and CAT IV, describes a piece of physics you already know. Learn what each one means and you'll know exactly how far to trust a reading, and how to measure mains safely.",
  minutes: 45,
  goals: [
    "Explain how one converter measures volts, amps, ohms and AC",
    "Read an accuracy spec like ±(0.3% + 2 digits) and work out the real uncertainty",
    "Predict when the meter's 10 MΩ input or its shunt changes the circuit you're measuring",
    "Explain RMS, True RMS and crest factor, and which waveforms fool cheaper meters",
    "Explain ghost voltages, and when to use AutoV (LoZ) instead of V",
    "Say what CAT ratings protect you from, and check a socket safely with prove–test–prove",
  ],
  blocks: [
    { type: "h2", text: "One voltmeter does everything" },
    `<p>Inside your BM235 there's really only one measuring instrument: an <strong>analogue-to-digital converter</strong> (ADC) that measures a small DC voltage, about five times a second, and turns it into a number. Every function on the dial is a way of turning something else into a small DC voltage for it.</p>`,
    { type: "custom", wide: false, render: (el) => meterDiagram(el) },
    `<p>Two consequences follow, and they're the theme of this chapter. First, the meter can only be as good as the step that turns your quantity into a voltage. Second, that step always involves the meter becoming part of your circuit: a 10 MΩ resistor across it, a shunt in series with it, or a current pushed into it. Usually that's negligible. Knowing when it isn't is what separates measuring from guessing.</p>`,
    { type: "h2", text: "Counts, ranges and resolution" },
    `<p>The converter counts up to about 6,000, so your BM235 is a <strong>[[6000-count|counts]]</strong> meter: it can show any number from 0 to 5,999 on a range, plus a decimal point. The range decides where the decimal point goes: 5.999 V on the 6 V range, 59.99 V on 60 V, 599.9 V on 600 V. Auto-ranging picks the lowest range that fits, to give you the most digits.</p>`,
    {
      type: "formula",
      id: "resolution",
      name: "Resolution",
      eq: "resolution = range ÷ counts",
      vars: [
        ["range", "the full scale of the range in use", "e.g. 6.000 V"],
        ["counts", "how many steps the display has", "6,000 on the BM235"],
        ["resolution", "the smallest change the display can show: one step of the last digit", "e.g. 0.001 V"],
      ],
      why: `<p>The converter splits each range into about 6,000 equal steps. One step of the last digit is the range divided by the count.</p>`,
      use: `<p>Knowing what you can and can't see. A 9 V battery reads to 0.01 V (on the 60 V range); an AA reads to 0.001 V (on the 6 V range). To see a millivolt change on a 9 V battery you'd need a better meter, or a cleverer method.</p>`,
      example: `<p>Mains on the 600.0 V range:</p>
                <span class="calc">600 V ÷ 6,000 = 0.1 V per step</span>
                <p>So 230.4 V is shown to a tenth of a volt. That's resolution, not accuracy: the next section shows how far that 230.4 might be from the truth.</p>`,
    },
    { type: "h2", text: "Accuracy: ±(% + digits)" },
    `<p>A meter's specification gives its accuracy as two parts added together: a <em>percentage of the reading</em>, for errors that grow with the size of what you measure (like a slightly-off reference), and a number of <em>[[digits]]</em>, for errors of a few steps in the last digit whatever you measure (like noise and offset).</p>`,
    {
      type: "formula",
      id: "accuracy",
      name: "Accuracy band",
      eq: "± (p% × reading + d × resolution)",
      vars: [
        ["p", "the percentage part of the spec", "e.g. 0.3% for DC volts on 6 V"],
        ["reading", "what the display shows", "in the range's unit"],
        ["d", "the digits part of the spec", "e.g. 2"],
        ["resolution", "one step of the last digit on that range", "e.g. 0.001 V"],
      ],
      why: `<p>The manufacturer guarantees the true value lies within this band of the reading, under its stated conditions: around room temperature and not too humid. Outside those conditions, or in a meter that hasn't been checked for years, the band can grow.</p>`,
      use: `<p>Deciding whether a difference is real. If two readings differ by less than their accuracy bands, the meter can't tell you which is bigger. It also explains why a low reading on a high range is poor: the digits term is a large share of a small reading.</p>`,
      example: `<p>A battery reads 12.63 V on the 60.00 V range, where the spec is ±(0.4% + 2 digits):</p>
                <span class="calc">0.004 × 12.63 + 2 × 0.01 = 0.051 + 0.02 = ±0.071 V</span>
                <p>The true voltage lies between 12.55 and 12.71 V.</p>`,
    },
    `<p>Try it with your meter's real specifications. Type a reading, change the function, and see the band the true value lies in.</p>`,
    { type: "custom", wide: false, render: (el) => accuracyLab(el) },
    { type: "h2", text: "Voltage: the 10 MΩ load" },
    `<p>You met this in {{ch:dividers}}: on V, your meter puts 10 MΩ across whatever it measures. Any real voltage source has some resistance of its own in series: a battery's internal resistance, a sensor's output resistance, the top resistor of a divider. The meter and that resistance form a divider, and the meter sees only its share.</p>`,
    {
      type: "formula",
      id: "loading",
      name: "Meter loading",
      eq: "V<sub>read</sub> = V × R<sub>in</sub> ÷ (R<sub>in</sub> + R<sub>source</sub>)",
      vars: [
        ["V<sub>read</sub>", "what the meter shows", "volts, V"],
        ["V", "the voltage with the meter not connected", "volts, V"],
        ["R<sub>in</sub>", "the meter's input impedance", "10 MΩ on V"],
        ["R<sub>source</sub>", "the resistance looking back into the circuit from the probes", "ohms, Ω"],
      ],
      why: `<p>It's the voltage divider formula, with the meter as the bottom resistor. Any two-terminal circuit, however complicated, behaves at its terminals like a single voltage in series with a single resistance (this is called Thévenin's theorem), so this one formula covers everything.</p>`,
      use: `<p>The error is about R<sub>source</sub> ÷ R<sub>in</sub>. Below 10 kΩ of source resistance it's under 0.1%: forget it. At 100 kΩ it's 1%; at 1 MΩ, 9%. Megohm circuits (sensors, timers, high-voltage dividers) need care, or a meter with a higher input impedance.</p>`,
      example: `<p>A sensor gives 2.000 V through 100 kΩ of output resistance:</p>
                <span class="calc">V<sub>read</sub> = 2.000 × 10 ÷ (10 + 0.1) = 1.980 V</span>
                <p>1% low: more than the meter's own 0.3% accuracy.</p>`,
    },
    { type: "h2", text: "Current: shunts and burden voltage" },
    `<p>In current mode the meter measures the voltage across its [[shunt]] and divides by the shunt's resistance: I = V ÷ R. That voltage is taken from your circuit. It's called the <strong>[[burden voltage]]</strong>, and it makes the current while you measure slightly smaller than the current when you don't.</p>`,
    {
      type: "formula",
      id: "burden",
      name: "Burden voltage",
      eq: "V<sub>burden</sub> = I × R<sub>shunt</sub>",
      alt: ["I<sub>measured</sub> = V ÷ (R + R<sub>shunt</sub>)"],
      vars: [
        ["V<sub>burden</sub>", "voltage the meter takes from the circuit", "volts, V"],
        ["I", "the current being measured", "amperes, A"],
        ["R<sub>shunt</sub>", "the shunt in use: 100 Ω on µA, 1.9 Ω on mA, 0.04 Ω on A", "ohms, Ω"],
        ["R", "the circuit's own resistance in the loop", "ohms, Ω"],
      ],
      why: `<p>The shunt is a resistor in series with your circuit, so it drops I × R like any other ({{ch:resistance}}), and the series rule ({{ch:dividers}}) gives the current with it in the loop.</p>`,
      use: `<p>Choosing the current position. The µA position resolves 0.1 µA but drops 0.1 mV per µA: 0.6 V at its 6 mA limit, a lot in a 3 V circuit. The mA jack drops 1.9 mV per mA. Use the position with the smallest shunt that still shows enough digits. And it's why a gadget can misbehave when you measure its current: the burden starves it.</p>`,
      example: `<p>A 3.0 V circuit that draws 10 mA (300 Ω), measured on the µA position's 100 Ω shunt:</p>
                <span class="calc">I = 3.0 ÷ (300 + 100) = 7.5 mA</span>
                <p>25% low, with a perfect meter. On the mA jack: 3.0 ÷ 301.9 = 9.94 mA.</p>`,
    },
    {
      type: "bench",
      id: "bench-burden",
      title: "See the burden voltage",
      intro: "The same small current, measured through two different shunts. The difference is the burden at work.",
      setup: { leads: "black in COM, red in mA µA", need: "breadboard, 9 V battery, a 4.7 kΩ resistor, a red LED" },
      steps: [
        "Build battery +, 4.7 kΩ, LED, back to battery −. It glows dimly at about 1.5 mA.",
        "Open the loop at the LED's short leg, as in {{ch:multimeter}}, and close it with the probes.",
        "Dial on <b>A mA</b>, ⎓ showing. Note the current (1.9 Ω shunt).",
        "Without moving the probes, turn the dial to <b>µA</b>, ⎓ showing. Note the current again (100 Ω shunt).",
        "Put the circuit back together, move the red lead back to V Ω, and turn the dial back to V.",
      ],
      record: [
        { label: "On A mA (1.9 Ω)", unit: "mA", min: 1.3, max: 1.7, ok: "About (9 − 1.8) ÷ 4,700. The burden here is under 3 mV.", low: "Low: check the battery and resistor.", high: "High: is the resistor 4.7 kΩ (yellow-violet-red)?" },
        { label: "On µA (100 Ω)", unit: "mA", min: 1.25, max: 1.68, ok: "A few percent lower than on A mA: the extra 98 Ω of shunt takes about 0.15 V from the circuit.", low: "Much lower? Check the probes stayed put.", high: "Higher than on A mA? Take both readings again: they should differ by about 2%." },
      ],
      expect: `<p>On µA the reading drops by roughly 2%: the 100 Ω shunt takes about 0.15 V that the LED and resistor no longer get. Neither reading is wrong. Each correctly measures the current that flows <em>with that meter position in the loop</em>. To find the undisturbed current, use the position with the smaller shunt, or calculate the correction with the formula above.</p>`,
    },
    { type: "h2", text: "Resistance, continuity, diodes and capacitance" },
    `<p>These modes all use the meter's own source, powered by its batteries, so they only work on unpowered parts:</p>
     <ul>
       <li><strong>Resistance:</strong> a known, steady current through the part, and R = V ÷ I. Higher ranges use smaller currents (down to 0.02 µA on 60 MΩ), which is why megohm readings settle slowly and pick up your fingers.</li>
       <li><strong>Continuity:</strong> resistance mode with a threshold. Below it (somewhere from 30 to 480 Ω, depending on the unit) the meter beeps and flashes.</li>
       <li><strong>Diode test:</strong> about 0.3 mA from a source of up to 3.2 V, displaying the voltage across the part: its forward voltage at that current.</li>
       <li><strong>Capacitance:</strong> the meter charges the capacitor with a known current and times how fast the voltage rises. You'll meet the formula, Q = C × V, in {{ch:capacitors}}.</li>
     </ul>
     <p>The 1.6 V that resistance mode applies can switch on silicon junctions. Measure a resistor that has a diode or transistor across it on a board, and the reading comes out low. Lift a leg, or measure with the probes both ways round: a difference gives the junction away.</p>`,
    { type: "h2", text: "AC: what “230 volts” means" },
    `<p>Mains voltage swings from +325 V to −325 V and back, 50 times a second. So why is it called 230 V? Because a 230 V DC supply would heat a kettle element by exactly as much. That heating-equivalent value is called the <strong>[[RMS]]</strong> (root-mean-square) value, and it's what every AC voltage and current is quoted as.</p>`,
    {
      type: "formula",
      id: "rms",
      name: "Peak and RMS",
      eq: "V<sub>peak</sub> = √2 × V<sub>RMS</sub>",
      alt: ["crest factor = V<sub>peak</sub> ÷ V<sub>RMS</sub>"],
      vars: [
        ["V<sub>peak</sub>", "the highest voltage reached in each cycle", "volts, V"],
        ["V<sub>RMS</sub>", "the DC voltage that would heat a resistor equally", "volts, V"],
        ["√2", "1.414, true only for a clean sine wave", "no unit"],
      ],
      why: `<p>Heating goes as V² ÷ R ({{ch:resistance}}), so for the same heat you need the same <em>average of V²</em>. Square the waveform, take the mean over a cycle, then the square root: root, mean, square, read backwards. For a sine wave the mean of sin² is ½, so V<sub>RMS</sub> = V<sub>peak</sub> ÷ √2.</p>`,
      use: `<p>Mains: 230 V RMS peaks at 325 V, which is what insulation and capacitors must survive. And meters: a “[[True RMS]]” meter like your BM235 calculates the RMS of whatever waveform it gets. A cheaper average-responding meter measures the waveform's average size and multiplies by 1.11, which is right only for a pure sine.</p>`,
      example: `<p>230 V mains:</p>
                <span class="calc">V<sub>peak</sub> = 1.414 × 230 = 325 V</span>`,
    },
    `<p>Here's what each kind of meter would show for different waveforms, all with the same 325 V peak. A dimmer or a cheap inverter fools an average-responding meter by 20–30%.</p>`,
    { type: "custom", render: (el) => rmsLab(el) },
    `<p>Your BM235's True RMS is specified at 50–60 Hz to ±(0.7% + 3 digits), and up to 440 Hz with a wider band. It isn't meant for high-frequency signals: a 1 V signal at 1.6 kHz already reads 5% low. For mains, motors, transformers and dimmers it's what you want. Press <b>Hz</b> while measuring AC to read the frequency too.</p>`,
    { type: "h2", text: "Ghost voltages and AutoV" },
    `<p>Two wires running side by side in a cable form a small capacitor: two conductors separated by insulation. An AC voltage on one makes a small current flow in the other, through that capacitance. This is <strong>[[capacitive coupling]]</strong>.</p>
     <p>Now picture a wire that's been disconnected at both ends but still runs alongside a live one. It's dead, but its 10 MΩ meter reading can show 100 V or more, because 10 MΩ draws so little current that even the tiny coupled current makes a big voltage across it. That's a <strong>[[ghost voltage]]</strong>.</p>`,
    {
      type: "formula",
      id: "reactance",
      name: "A capacitor's opposition to AC",
      eq: "X<sub>C</sub> = 1 ÷ (2π × f × C)",
      vars: [
        ["X<sub>C</sub>", "reactance: how hard it is for AC to pass through a capacitance", "ohms, Ω"],
        ["f", "frequency", "hertz, Hz"],
        ["C", "capacitance", "farads, F"],
      ],
      why: `<p>A capacitor passes current only while its voltage changes ({{ch:capacitors}}). The faster the voltage swings (higher f) and the more charge it holds per volt (higher C), the more current flows for the same voltage. Reactance plays the part of resistance for a capacitor on AC.</p>`,
      use: `<p>Ghost voltages: 10 m of cable with 500 pF of coupling has a reactance of about 6.4 MΩ at 50 Hz, comparable to the meter's 10 MΩ, so the meter sees a large share of the voltage. Load the wire with AutoV's 2 kΩ instead and the ghost collapses to a few volts, while a genuinely live wire hardly notices.</p>`,
      example: `<p>10 m of cable at 50 pF per metre, on 50 Hz mains:</p>
                <span class="calc">X<sub>C</sub> = 1 ÷ (2π × 50 × 500 × 10⁻¹²) = 6.4 MΩ</span>`,
    },
    { type: "custom", wide: false, render: (el) => ghostLab(el) },
    `<p>That's what the <strong>[[AutoV|loz]]</strong> position (marked LoZ) is for. It drops the meter's input to about 2 kΩ, so it can only show a voltage that can actually deliver current. (Below about 6 V it switches back to a high impedance, which is why a ghost settles at a few volts rather than zero.) Use it to check whether a wire in your house is really live. Never use it on electronics: at 230 V it draws about 0.1 A, enough to upset sensors and control wiring. And measured from live to earth, that current flows down the earth wire and can trip the RCD: use the V position for that.</p>`,
    { type: "h2", text: "Safety ratings: what CAT III and CAT IV mean" },
    `<p>The danger on mains isn't the 230 V itself, which a meter handles easily. It's the <strong>[[transient|transient]]</strong>: a brief spike of thousands of volts from a lightning strike nearby or a big motor switching off. If a spike makes a spark jump inside the meter while its probes are on the supply, the mains can keep feeding that arc. The meter can explode in your hand.</p>
     <p>How much energy a spike can deliver depends on how close you are to where the power comes in. Near the incoming supply, the wiring is thick and short, and its resistance is tiny; at the end of a long socket circuit, the cable's own resistance limits the current. So meters are rated by <strong>[[measurement category|cat]]</strong>:</p>
     <ul>
       <li><strong>CAT II</strong>: sockets and plugged-in appliances.</li>
       <li><strong>CAT III</strong>: the fuse board and fixed installation wiring.</li>
       <li><strong>CAT IV</strong>: the incoming supply and the electricity meter.</li>
     </ul>
     <p>The safety standard (IEC 61010) tests each rating with a spike of a set size from a set source resistance. A CAT II 600 V meter must survive 4,000 V from 12 Ω; a CAT III 600 V meter, 6,000 V from just 2 Ω. Your BM235 is rated CAT III 600 V and CAT IV 300 V, with ceramic <strong>[[HRC fuses|hrc-fuse]]</strong> that break a fault current without exploding. The rating covers the meter <em>and</em> its leads: use the rated leads, with the tip caps on in CAT III and IV locations.</p>`,
    {
      type: "note",
      kind: "safety",
      title: "Where you stop",
      html: `<p>Measuring at sockets, and on unplugged appliances, is within reach with care and this meter. Opening the fuse board (the <em>meterkast</em>), fixed wiring, or anything with its cover off is work for a qualified electrician, whatever the meter's rating. Never work alone on mains, never with wet hands, and never on something you haven't proven dead.</p>`,
    },
    { type: "h2", text: "Proving dead: prove–test–prove" },
    `<p>A meter that reads 0 V might mean “dead”, or it might mean a broken lead, a blown fuse, flat batteries or the wrong dial position. So before trusting a 0 V reading on mains, electricians use <strong>[[prove–test–prove]]</strong>:</p>
     <ol class="steps">
       <li><b>Prove</b> the meter works, on a source you know is live: a socket.</li>
       <li><b>Test</b> the circuit you want to work on.</li>
       <li><b>Prove</b> the meter again on the known live source, to show it didn't fail in between.</li>
     </ol>
     <p>Only a 0 V reading sandwiched between two good live readings means dead. AutoV is the right position for this: it ignores ghosts.</p>`,
    {
      type: "bench",
      id: "bench-socket",
      title: "Check a socket, safely",
      intro: "A Dutch socket has two round holes (live and neutral, which can be either way round, since the plug is reversible) and two springy earth clips at the sides. You'll measure all three pairs.",
      safety: "Probes with their caps on, fingers behind the finger guards, one hand where possible, and dry hands. If your sockets have child-safety shutters, the probes won't go in: don't force them, skip this exercise. Never push a probe in while the other hand touches anything metal.",
      setup: { dial: "AutoV, then V with ~ showing", leads: "black in COM, red in V Ω", need: "a socket, the meter and its CAT-rated leads" },
      steps: [
        "Dial on <b>AutoV</b>. Probes into the two round holes. You should read about 230 V AC: live to neutral. (This also proves your meter works.)",
        "Turn to <b>V</b>, press SELECT until <b>~</b> shows. Black probe on an earth clip, red into one hole, then the other. One reads about 230 V (that hole is live), the other just a few volts (neutral).",
        "Still on V ~, red on the live hole: press <b>Hz</b>. It reads about 50.0 Hz. Press Hz again to go back.",
        "Remove the probes, red first. Turn the dial off.",
      ],
      record: [
        { label: "Live to neutral (AutoV)", unit: "V", min: 207, max: 253, ok: "Within the European standard of 230 V ± 10%.", low: "Low. Was the dial on AutoV and are both probes fully in? If it's really low, tell your energy supplier.", high: "High for 230 V mains: recheck on V ~." },
        { label: "Neutral to earth (V)", unit: "V", min: 0, max: 10, ok: "A few volts is normal: the current on the neutral wire drops a little voltage along it.", low: "Zero is fine too.", high: "More than about 10 V between neutral and earth is unusual. Get an electrician to look at it." },
      ],
      expect: `<p>Live to neutral and live to earth both read about 230 V; neutral to earth reads close to zero, because neutral is connected to earth back at the supply. The few volts you see on neutral are its own I × R drop, from the current of everything else running on that circuit.</p>
               <p>The live to earth measurement is done on V, not AutoV, on purpose: AutoV's low impedance would push about 0.1 A down the earth wire, and the RCD, which trips at about 30 mA of leakage, could switch off the power.</p>`,
    },
    {
      type: "bench",
      id: "bench-appliance",
      title: "Check an appliance, unplugged",
      intro: "With the plug out of the socket, an appliance is just resistances and switches, and your meter can check it safely: the element, and the earth connection to its metal case.",
      setup: { dial: "Ω", leads: "black in COM, red in V Ω", need: "a kettle, fan heater or other heating appliance, unplugged" },
      steps: [
        "<b>Unplug it</b>. Put a kettle on its base and switch it on (the switch is mechanical and stays on without power).",
        "Measure between the plug's two round pins. That's the heating element. Zero the leads with relative mode first (hold HOLD).",
        "If it has a metal body: measure from the plug's earth contacts (the metal strips on the sides) to bare metal on the case. It should beep on continuity, well under 1 Ω.",
        "Work out the power the element would make on 230 V, with P = V² ÷ R, and compare it with the rating plate.",
      ],
      record: [{ label: "Element resistance", unit: "Ω", min: 15, max: 200, ok: "Now P = 230² ÷ R. A 2,000 W kettle is about 26 Ω.", low: "Below 15 Ω would be over 3.5 kW: is something else in parallel? Recheck with relative mode zeroed.", high: "High for a heater: check the appliance's switch is on, and its thermostat isn't open." }],
      expect: `<p>Your calculated power comes out slightly <em>above</em> the rating, because the element's resistance rises as it heats up ({{ch:resistance}}). A reading of OL means an open switch, a tripped thermal cut-out or a broken element. A tiny resistance from the earth pin to the case is what makes the appliance safe: if the live wire ever touched the case, the fault current would flow down that earth path and blow the fuse or trip the RCD.</p>`,
    },
    {
      type: "problems",
      id: "mi-p",
      title: "Your meter, on paper",
      items: [
        { id: "mi-p1", level: 1, q: "<p>What is the BM235's resolution on its 600.0 V range?</p>", unit: "V", answer: 0.1, hints: ["Range ÷ counts: 600 ÷ 6,000."], solution: "<p>600 ÷ 6,000 = <b>0.1 V</b>.</p>" },
        {
          id: "mi-p2",
          level: 2,
          q: "<p>On the 60.00 V range, DC accuracy is ±(0.4% + 2 digits). A car battery reads 12.63 V. What is the uncertainty, ± how many volts?</p>",
          unit: "V",
          answer: 0.004 * 12.63 + 0.02,
          tol: 0.03,
          hints: ["0.4% of 12.63, plus 2 steps of 0.01 V."],
          solution: "<p>0.004 × 12.63 = 0.051 V, plus 2 × 0.01 = 0.02 V: <b>±0.071 V</b>. The true value is between 12.55 and 12.71 V.</p>",
        },
        {
          id: "mi-p3",
          level: 2,
          q: "<p>AC accuracy at 50 Hz is ±(0.7% + 3 digits). A socket reads 230.4 V on the 600.0 V range. What is the uncertainty?</p>",
          unit: "V",
          answer: 0.007 * 230.4 + 0.3,
          tol: 0.03,
          hints: ["One digit on the 600.0 V range is 0.1 V."],
          solution: "<p>0.007 × 230.4 = 1.61 V, plus 3 × 0.1 = 0.3 V: <b>±1.9 V</b>.</p>",
        },
        {
          id: "mi-p4",
          level: 2,
          q: "<p>A sensor's output is 2.000 V through 100 kΩ of output resistance. What does your meter, with its 10 MΩ input, read?</p>",
          unit: "V",
          answer: (2 * 10e6) / (10e6 + 1e5),
          tol: 0.002,
          hints: ["It's a divider: 100 kΩ on top, 10 MΩ underneath."],
          solution: "<p>2.000 × 10,000,000 ÷ 10,100,000 = <b>1.980 V</b>, 1% low.</p>",
        },
        {
          id: "mi-p5",
          level: 2,
          q: "<p>You measure a 10 mA current on the µA position, whose shunt is 100 Ω. What is the burden voltage? (The µA position actually tops out at 6 mA: this is why.)</p>",
          unit: "V",
          answer: 1.0,
          hints: ["V = I × R, with I = 0.010 A."],
          solution: "<p>0.010 × 100 = <b>1.0 V</b>: a third of a 3 V circuit's supply. On the mA jack (1.9 Ω) it would be 19 mV.</p>",
        },
        {
          id: "mi-p6",
          level: 3,
          q: "<p>A 3.0 V circuit has 300 Ω of resistance in its loop. You measure its current on the µA position (100 Ω shunt). What does the meter show?</p>",
          unit: "mA",
          answer: (3 / 400) * 1000,
          hints: ["The shunt is in series: total resistance 300 + 100.", "I = V ÷ R<sub>total</sub>."],
          solution: "<p>I = 3.0 ÷ 400 = <b>7.5 mA</b>, instead of the 10 mA that flows without the meter.</p>",
        },
        { id: "mi-p7", level: 1, q: "<p>What is the peak voltage of 230 V RMS mains?</p>", unit: "V", answer: 230 * Math.SQRT2, hints: ["V<sub>peak</sub> = √2 × V<sub>RMS</sub>."], solution: "<p>1.414 × 230 = <b>325 V</b>.</p>" },
        {
          id: "mi-p8",
          level: 3,
          q: "<p>10 m of cable has 500 pF of capacitance between a disconnected wire and a live one. What is that capacitance's reactance at 50 Hz, in MΩ?</p>",
          unit: "MΩ",
          answer: 1 / (2 * Math.PI * 50 * 500e-12) / 1e6,
          tol: 0.03,
          hints: ["X<sub>C</sub> = 1 ÷ (2π × f × C), with C = 500 × 10⁻¹² F.", "2π × 50 × 5 × 10⁻¹⁰ = 1.57 × 10⁻⁷."],
          solution: "<p>X<sub>C</sub> = 1 ÷ (2π × 50 × 500 × 10⁻¹²) = 1 ÷ (1.57 × 10⁻⁷) = <b>6.4 MΩ</b>. Comparable with the meter's 10 MΩ, so a 10 MΩ reading shows a large ghost; against AutoV's 2 kΩ it's enormous, so the ghost collapses.</p>",
        },
        {
          id: "mi-p9",
          level: 3,
          q: "<p>The CAT III 600 V test applies a 6,000 V spike from a 2 Ω source. What peak current could that spike drive into a short circuit?</p>",
          unit: "A",
          answer: 3000,
          hints: ["Ohm's law: I = V ÷ R."],
          solution: "<p>6,000 ÷ 2 = <b>3,000 A</b>, for a few microseconds. A CAT II 600 V spike (4,000 V from 12 Ω) can drive 333 A. That difference is why a meter rated only for sockets doesn't belong in the fuse board.</p>",
        },
      ],
    },
    {
      type: "quiz",
      id: "mi-quiz",
      questions: [
        { q: "Your meter shows 4.983 V and its spec is ±(0.3% + 2 digits) on that range. Can you be sure the voltage is below 5.000 V?", choices: ["Yes: 4.983 is below 5", "No: the band is ±0.017 V, which reaches 5.000 V"], answer: 1, explain: "0.3% × 4.983 + 0.002 = 0.017 V, so the truth could be anywhere from 4.966 to 5.000 V." },
        { q: "Why does a circuit sometimes stop working properly while you measure its current?", choices: ["The meter's fuse adds noise", "The burden voltage across the meter's shunt takes voltage from the circuit", "Current meters reverse the polarity"], answer: 1, explain: "The shunt is in series: it drops I × R, and the circuit gets that much less." },
        { q: "A dimmer's output reads 115 V on a cheap meter and 162 V on your BM235. Which is right?", choices: ["The cheap meter", "Your BM235: True RMS gives the heating value of any waveform", "Neither: AC can't be measured"], answer: 1, explain: "An average-responding meter assumes a sine wave. The chopped dimmer waveform fools it by about 30%." },
        { q: "A wire you've disconnected reads 95 V on the V position, and 6 V on AutoV. What's going on?", choices: ["The wire is live", "A ghost voltage: capacitive coupling to a live wire nearby, which can't supply real current", "The meter is faulty"], answer: 1, explain: "AutoV's 2 kΩ load collapses a ghost but not a real supply. Still, treat the wire with respect until it's proven dead." },
        { q: "Why test a known live socket both before and after checking that a circuit is dead?", choices: ["To warm the meter up", "To prove the meter and leads were working, so a 0 V reading really means dead", "It's a legal formality"], answer: 1, explain: "A broken lead or blown fuse also reads 0 V. Prove–test–prove rules that out." },
      ],
    },
  ],
};
