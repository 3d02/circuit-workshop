import { graph, ledCurve } from "../plots.js";
import { series, si } from "../format.js";
import { LEDS } from "../sim.js";

const E12 = series(100, 4700);
const SMALL = series(47, 4700);
const LED_OPTIONS = [
  ["red", "Red (about 2.0 V)"],
  ["green", "Green (about 2.2 V)"],
  ["blue", "Blue (about 3.0 V)"],
];

const BAND = ["black", "brown", "red", "orange", "yellow", "green", "blue", "violet", "grey", "white"];
function bands(r) {
  const exp = Math.floor(Math.log10(r)) - 1;
  const digits = String(Math.round(r / 10 ** exp)).padStart(2, "0");
  return `${BAND[+digits[0]]}-${BAND[+digits[1]]}-${BAND[exp]}`;
}

export default {
  id: "leds",
  title: "Diodes and LEDs",
  lede: "A diode lets current through in one direction only. An LED is a diode that glows, and it's the first thing most people build. Here's how to light one without destroying it.",
  minutes: 25,
  goals: [
    "Get a diode's direction right, and know what happens when you don't",
    "Read an LED's curve and see why it always needs a resistor",
    "Calculate a safe resistor for an LED and pick a standard value",
    "Build the circuit for real on a breadboard",
  ],
  blocks: [
    `<p>A <strong>diode</strong> is a one-way valve for current. Its symbol is an arrow pointing the way current is allowed to flow, with a bar across the tip. The two ends have names: current goes in at the <strong>anode</strong> and out at the <strong>cathode</strong> (the bar). On a real diode, the cathode end is marked with a painted stripe.</p>`,
    {
      type: "predict",
      id: "diode-flip",
      figure: "diode",
      q: "The diode is letting current through. What happens if you turn it around?",
      choices: ["The current flows the other way round the loop", "The current stops, almost completely", "Nothing changes"],
      answer: 1,
      why: ["The battery still pushes the same way. The diode just refuses to let current through in its blocking direction.", "", "A diode is not symmetric: that's its whole point."],
      explain: `<p>Reversed, the diode blocks: only a tiny leakage current (billionths of an amp) gets through. With no current, there's no voltage drop across the resistor, so the full 9 V sits across the diode.</p>
                <p>Notice one more thing when it's conducting: the diode takes about <strong>0.7 V</strong> for itself. That's a silicon diode's “toll” for letting current through, and it barely changes with current.</p>`,
      reveal: (fig) => fig.flip("D1"),
      revealLabel: "Flip the diode",
    },
    {
      type: "figure",
      id: "diode",
      spec: {
        title: "A diode in a loop",
        iScale: 0.008,
        parts: [
          { id: "B1", type: "battery", a: [1, 2], b: [1, 4], v: 9, r: 0.5, labelSide: "left" },
          { id: "R1", type: "resistor", a: [3, 0], b: [5, 0], r: 1000, label: "1 kΩ" },
          { id: "D1", type: "diode", a: [8, 1.5], b: [8, 3.5], kind: "silicon" },
          { id: "A1", type: "ammeter", a: [6, 5], b: [4, 5], labelSide: "below" },
        ],
        wires: ["1,2 1,0 3,0", "5,0 8,0 8,1.5", "8,3.5 8,5 6,5", "4,5 1,5 1,4"],
        controls: [{ type: "button", label: "⇅ Flip the diode", run: (fig) => fig.flip("D1"), primary: true }],
        readouts: [
          { label: "Current", value: (q) => q.i("D1"), unit: "A" },
          { label: "Across the diode", value: (q) => q.across("D1"), unit: "V" },
        ],
        status: (q) =>
          q.i("D1") > 1e-4
            ? "Forward: the arrow points the way current flows. The diode takes about 0.7 V; the resistor takes the rest."
            : { text: "Reversed: the diode blocks. No current, so the whole 9 V sits across the diode.", level: "warn" },
      },
    },
    `<p>Diodes are used to protect circuits from batteries fitted backwards, to turn AC into DC in power supplies, and (as you'll see in {{ch:transistors}}) to protect transistors from voltage spikes.</p>`,
    { type: "h2", text: "LEDs: diodes that glow" },
    `<p>An <strong>LED</strong> (light-emitting diode) is a diode built so that some of that toll comes out as light. Its toll is bigger, and depends on the colour: around 2 V for red, 3 V for blue and white.</p>
     <p>Here's the important part. Below its toll voltage, an LED lets almost nothing through. Above it, the current climbs <em>steeply</em>: a fraction of a volt more and the current multiplies. You can see this in the orange curve under the circuit below.</p>`,
    {
      type: "figure",
      id: "iv",
      spec: {
        title: "An LED, a resistor, and its curve",
        iScale: 0.015,
        parts: [
          { id: "B1", type: "battery", a: [1, 2], b: [1, 4], v: 5, r: 0.01, label: (p) => `${si(p.v, "V")}`, labelSide: "left" },
          { id: "R1", type: "resistor", a: [3, 0], b: [5, 0], r: 330 },
          { id: "D1", type: "led", a: [8, 1.5], b: [8, 3.5], color: "red" },
        ],
        wires: ["1,2 1,0 3,0", "5,0 8,0 8,1.5", "8,3.5 8,5 1,5 1,4"],
        vmax: 9,
        controls: [
          { label: "Supply", part: "B1", prop: "v", min: 0, max: 9, step: 0.1, unit: "V" },
          { label: "Resistor", part: "R1", prop: "r", values: SMALL, unit: "Ω" },
          { type: "select", label: "LED colour", part: "D1", prop: "color", options: LED_OPTIONS },
        ],
        readouts: [
          { label: "LED current", value: (q) => q.i("D1"), unit: "A" },
          { label: "Across the LED", value: (q) => q.across("D1"), unit: "V" },
          { label: "Across the resistor", value: (q) => q.across("R1"), unit: "V" },
        ],
        goals: [
          { id: "led-sweet", text: "Run the LED at a healthy 10–15 mA", test: (q) => q.i("D1") >= 0.01 && q.i("D1") <= 0.015 },
          { id: "led-blue", text: "Switch to a blue LED and bring it back into 10–15 mA", test: (q) => q.part("D1").color === "blue" && q.i("D1") >= 0.01 && q.i("D1") <= 0.015 },
        ],
        extras: [
          graph({
            title: "Current against the LED's voltage",
            x: { min: 0, max: 9, unit: "V", label: "voltage across the LED →" },
            y: { min: 0, max: 0.04, unit: "A", label: "current", fmt: (v) => `${Math.round(v * 1000)} mA` },
            zones: [{ y0: 0.02, cls: "danger", label: "over 20 mA: too much for most LEDs" }],
            curves: (q) => {
              const vs = q.part("B1").v;
              const r = q.part("R1").r;
              return [
                { cls: "led", points: ledCurve(q.part("D1").color, 0.04), label: "LED", labelAt: [LEDS[q.part("D1").color].vf + 0.15, 0.033] },
                { cls: "load", points: [[0, vs / r], [vs, 0]], label: "what the resistor allows", labelAt: [Math.max(vs * 0.55, 3), Math.min(0.035, (vs - Math.max(vs * 0.55, 3)) / r + 0.002)] },
              ];
            },
            point: (q) => [q.across("D1"), q.i("D1")],
            pointLabel: (q) => si(q.i("D1"), "A"),
            note: "The dashed line shows every combination the resistor allows: at 0 V across the LED, the whole supply is across the resistor, so the current is supply ÷ R. The LED can only sit where both lines agree: the dot.",
          }),
        ],
      },
    },
    `<p>Play with it. Turn the supply up and watch where the dot goes: along the steep part of the curve, so the LED's voltage hardly changes while its current climbs. A bigger resistor makes the dashed line flatter, which pins the current lower. <strong>The resistor, not the LED, is what sets the current.</strong></p>`,
    {
      type: "predict",
      id: "led-nores",
      figure: "bypass",
      q: "What happens if you leave the resistor out and connect the LED straight to a 9 V battery?",
      choices: ["It's brighter, which is fine", "Nothing bad: an LED limits its own current", "A huge current flows and it burns out"],
      answer: 2,
      why: ["It is brighter, for a moment.", "That's exactly what an LED can't do. Look at how steep its curve is."],
      explain: `<p>Past its toll voltage the LED's curve is nearly vertical, so without a resistor nothing sets the current except the LED's own tiny internal resistance and the battery's. Hundreds of milliamps flow and the LED dies in a flash. That's why every LED circuit you'll ever see has a resistor (or a special constant-current driver) in series with it.</p>`,
      reveal: (fig) => fig.set("S1", "closed", true),
      revealLabel: "Bypass the resistor",
    },
    {
      type: "figure",
      id: "bypass",
      spec: {
        title: "What if there's no resistor?",
        iScale: 0.015,
        parts: [
          { id: "B1", type: "battery", a: [1, 2], b: [1, 4], v: 9, r: 1, labelSide: "left" },
          { id: "R1", type: "resistor", a: [4, 0], b: [6, 0], r: 680, label: "680 Ω", labelSide: "below" },
          { id: "S1", type: "switch", a: [4, -1.5], b: [6, -1.5], name: "Bypass wire", label: "bypass", labelSide: "above" },
          { id: "D1", type: "led", a: [9, 1.5], b: [9, 3.5], color: "red" },
        ],
        wires: ["1,2 1,0 4,0", "6,0 9,0 9,1.5", "3,0 3,-1.5 4,-1.5", "6,-1.5 7,-1.5 7,0", "9,3.5 9,5 1,5 1,4"],
        setup: (fig) => fig.on((t) => t === "burnt" && (fig.popped = true)),
        goals: [
          { id: "led-pop", text: "Burn out an LED (they're free here)", test: (q) => !!q.part("D1").burnt },
          { id: "led-revive", text: "Fix the circuit properly: remove the bypass, then replace the LED", test: (q, fig) => fig.popped && !q.part("D1").burnt && q.i("D1") > 0.005 },
        ],
      },
    },
    { type: "h2", text: "Choosing the resistor" },
    `<p>Here's the calculation you'll use every time you add an LED to a project. Going round the loop, the LED takes its toll voltage and the resistor must take the rest. You choose the current you want; Ohm's law gives the resistor:</p>
     <p class="formula-block">R = (V<sub>supply</sub> − V<sub>LED</sub>) ÷ I<small>for a red LED on 9 V at 10 mA: (9 − 2) ÷ 0.01 = 700 Ω</small></p>
     <p>You can't buy a 700 Ω resistor. Resistors come in <strong>standard values</strong>: 100, 120, 150, 180, 220, 270, 330, 390, 470, 560, 680, 820, then the same again ×10. Pick the nearest one: 680 Ω gives 10.3 mA, which is perfect. When in doubt, round <em>up</em>: a little less current is always safe.</p>
     <p>Most small indicator LEDs are happy at 5–15 mA and have a maximum around 20 mA. Modern LEDs are bright; 2–5 mA is often plenty for a status light.</p>`,
    {
      type: "figure",
      id: "pick",
      spec: {
        title: "Pick a resistor from the drawer",
        iScale: 0.015,
        parts: [
          { id: "B1", type: "battery", a: [1, 2], b: [1, 4], v: 9, r: 0.5, labelSide: "left" },
          { id: "R1", type: "resistor", a: [3, 0], b: [5, 0], r: 470 },
          { id: "D1", type: "led", a: [8, 1.5], b: [8, 3.5], color: "red" },
          { id: "A1", type: "ammeter", a: [6, 5], b: [4, 5], labelSide: "below" },
        ],
        wires: ["1,2 1,0 3,0", "5,0 8,0 8,1.5", "8,3.5 8,5 6,5", "4,5 1,5 1,4"],
        controls: [
          { type: "select", label: "Resistor", part: "R1", prop: "r", options: E12.map((r) => [r, `${si(r, "Ω")}  (${bands(r)})`]) },
          { type: "select", label: "LED colour", part: "D1", prop: "color", options: LED_OPTIONS },
        ],
        readouts: [
          { label: "LED current", value: (q) => q.i("D1"), unit: "A" },
          { label: "Resistor heat", value: (q) => q.power("R1"), unit: "W" },
        ],
        status: (q) => `Check: (9 V − ${q.across("D1").toFixed(1)} V) ÷ ${si(q.part("R1").r, "Ω")} ≈ ${si(q.i("D1"), "A")}`,
        goals: [
          { id: "pick-red", text: "Red LED on 9 V: choose a resistor for 8–12 mA", test: (q) => q.part("D1").color === "red" && q.i("D1") >= 0.008 && q.i("D1") <= 0.012 },
          { id: "pick-blue", text: "Now a blue LED: choose a resistor for 8–12 mA", test: (q) => q.part("D1").color === "blue" && q.i("D1") >= 0.008 && q.i("D1") <= 0.012 },
        ],
      },
    },
    {
      type: "note",
      kind: "deeper",
      title: "Why not just use a 2 V supply and skip the resistor?",
      html: `<p>Because the toll voltage isn't exact. It varies from LED to LED, and drops as the LED warms up. On that steep curve, a 0.1 V difference can double the current. The resistor makes the current depend mostly on itself, and resistors are precise and stable. (Specialised LED drivers do the same job more efficiently, for high-power lighting.)</p>`,
    },
    { type: "h2", text: "Build it for real" },
    {
      type: "custom",
      render(el) {
        el.innerHTML = `<div class="build-card">${breadboard()}<div class="build-steps">
          <h3>Your first real circuit</h3>
          <p class="build-parts"><b>You need:</b> a breadboard, a red LED, a 680 Ω resistor (blue–grey–brown), a 9 V battery with a snap clip (or a 3×AA holder: use 220 Ω instead), one short jumper wire.</p>
          <ol>
            <li><b>Find the LED's legs.</b> The longer leg is the anode (+). The rim of the LED has a flat edge on the cathode (−) side.</li>
            <li><b>Push the LED in</b> across two different columns, as shown: long leg in column 10, short leg in column 13.</li>
            <li><b>Add the resistor</b> from the + rail into column 10, the same column as the LED's long leg. The five holes in a column are connected underneath.</li>
            <li><b>Jumper</b> from column 13 to the − rail.</li>
            <li><b>Last of all, the battery:</b> red wire to the + rail, black to the − rail. It should light. If not, turn the LED round (nothing will be damaged with the resistor in place).</li>
          </ol>
          <p class="small-note">Always change wiring with the battery disconnected. Some breadboards split their power rails half-way along; if one end doesn't work, bridge the gap with a jumper.</p>
        </div></div>`;
      },
    },
    {
      type: "quiz",
      id: "led-quiz",
      questions: [
        {
          q: "On a diode, what does the painted stripe mark?",
          choices: ["The anode, where current goes in", "The cathode, where current comes out", "The positive supply"],
          answer: 1,
          explain: "The stripe matches the bar in the symbol: the cathode. Current flows from anode to cathode.",
        },
        {
          q: "A blue LED (3 V) on a 5 V supply, at 10 mA. Which resistor?",
          choices: ["200 Ω", "500 Ω", "300 Ω"],
          answer: 0,
          explain: "R = (5 − 3) ÷ 0.01 = 200 Ω. The nearest standard value, 220 Ω, would give about 9 mA.",
        },
        {
          q: "Why does an LED need a series resistor?",
          choices: ["To make it brighter", "Its current rises so steeply with voltage that something else has to set the current", "To protect the battery from the LED's light"],
          answer: 1,
          explain: "The LED's curve is nearly vertical above its toll voltage. The resistor sets the current, steadily.",
        },
        {
          q: "You swap a red LED for a blue one, keeping the same resistor and supply. The current…",
          choices: ["goes up", "stays the same", "goes down"],
          answer: 2,
          explain: "The blue LED takes a bigger toll (3 V instead of 2 V), leaving less voltage across the resistor, so less current flows.",
        },
      ],
    },
  ],
};

// A top-down breadboard with the LED circuit from the steps above.
function breadboard() {
  const pitch = 18;
  const x0 = 46;
  const col = (c) => x0 + (c - 1) * pitch;
  const railY = [44, 62];
  const rowY = (r) => 104 + r * pitch; // rows a–e
  let holes = "";
  for (let c = 1; c <= 30; c++) {
    if (c % 6 !== 0) for (const y of railY) holes += `<rect x="${col(c) - 3}" y="${y - 3}" width="6" height="6" rx="1.5" class="hole"/>`;
    for (let r = 0; r < 5; r++) holes += `<rect x="${col(c) - 3}" y="${rowY(r) - 3}" width="6" height="6" rx="1.5" class="hole"/>`;
  }
  const letters = "abcde"
    .split("")
    .map((l, r) => `<text x="${x0 - 22}" y="${rowY(r) + 4}" class="bb-label">${l}</text>`)
    .join("");
  const nums = [1, 5, 10, 13, 15, 20, 25, 30].map((c) => `<text x="${col(c)}" y="${rowY(4) + 24}" text-anchor="middle" class="bb-label">${c}</text>`).join("");
  return `<svg class="breadboard" viewBox="0 0 640 260" role="img" aria-label="Breadboard layout: resistor from the plus rail to column 10, LED from column 10 to column 13, jumper from column 13 to the minus rail, battery on the rails.">
    <rect x="10" y="20" width="620" height="216" rx="12" class="bb-body"/>
    <line x1="30" x2="610" y1="${railY[0] - 12}" y2="${railY[0] - 12}" class="rail-plus"/><line x1="30" x2="610" y1="${railY[1] + 12}" y2="${railY[1] + 12}" class="rail-minus"/>
    <text x="22" y="${railY[0] + 4}" class="bb-rail plus">+</text><text x="22" y="${railY[1] + 5}" class="bb-rail minus">−</text>
    <rect x="${col(10) - 8}" y="${rowY(0) - 9}" width="16" height="${4 * pitch + 18}" rx="5" class="bb-strip"/>
    <rect x="${col(13) - 8}" y="${rowY(0) - 9}" width="16" height="${4 * pitch + 18}" rx="5" class="bb-strip"/>
    ${holes}${letters}${nums}
    <path d="M${col(5)} ${railY[0]}V${rowY(0) - 26}" class="bb-lead"/>
    <path d="M${col(5)} ${rowY(0) - 26}L${col(10)} ${rowY(0) - 26}V${rowY(1)}" class="bb-lead"/>
    <g transform="translate(${(col(5) + col(10)) / 2} ${rowY(0) - 26})"><rect x="-20" y="-7" width="40" height="14" rx="6" fill="#d9c08a"/><rect x="-13" y="-7" width="4" height="14" fill="#2f6fbf"/><rect x="-5" y="-7" width="4" height="14" fill="#8a8a8a"/><rect x="3" y="-7" width="4" height="14" fill="#7a4a2a"/><rect x="11" y="-7" width="3" height="14" fill="#c9a24a"/></g>
    <path d="M${col(10)} ${rowY(2)}V${rowY(2) - 6}Q${col(10)} ${rowY(2) - 18} ${col(11)} ${rowY(2) - 22}" class="bb-lead"/>
    <path d="M${col(13)} ${rowY(2)}V${rowY(2) - 4}Q${col(13)} ${rowY(2) - 16} ${col(12)} ${rowY(2) - 22}" class="bb-lead"/>
    <g transform="translate(${(col(11) + col(12)) / 2} ${rowY(2) - 30})"><circle r="15" fill="#ff5a3c" opacity=".25"/><path d="M-11 9V-2a11 11 0 0 1 22 0V9Z" fill="#e8513a"/><rect x="-13" y="8" width="26" height="4" rx="1" fill="#c2402c"/><path d="M8 8V-4" stroke="#b03a28" stroke-width="2"/></g>
    <path d="M${col(13)} ${rowY(0)}C${col(13)} ${rowY(0) - 40} ${col(16)} ${railY[1] + 4} ${col(16)} ${railY[1]}" class="bb-jumper"/>
    <path d="M${col(28)} ${railY[0]}C${col(28)} 2 ${col(31)} 2 640 8" class="bb-wire red"/>
    <path d="M${col(29)} ${railY[1]}C${col(29)} 10 ${col(32)} 14 640 22" class="bb-wire black"/>
    <text x="${col(25) - 10}" y="12" class="bb-note">to 9 V battery</text>
    <text x="${col(7) + 4}" y="${rowY(0) - 40}" class="bb-note" text-anchor="middle">680 Ω</text>
    <path d="M${col(13) + 8} ${rowY(2) - 30}L${col(18) - 4} ${rowY(2) - 4}" class="bb-pointer"/>
    <text x="${col(18)}" y="${rowY(2)}" class="bb-note">LED: long leg in column 10,</text>
    <text x="${col(18)}" y="${rowY(2) + 15}" class="bb-note">flat side (short leg) in 13</text>
    <text x="${col(10) + 2}" y="${rowY(4) + 44}" class="bb-note" text-anchor="middle">each column of 5 is connected</text>
  </svg>`;
}
