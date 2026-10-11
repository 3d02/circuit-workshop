import { si, series, E12 } from "../format.js";

const COLORS = ["black", "brown", "red", "orange", "yellow", "green", "blue", "violet", "grey", "white"];
const HEX = ["#222822", "#7a4a2e", "#c43c2c", "#ed8a3c", "#e8cc3a", "#3f8a4f", "#2f6fbf", "#7d4fa3", "#8f938a", "#f5f5ea"];
const MULT = [
  [-2, "silver", "#b6bdb7"],
  [-1, "gold", "#c9a24a"],
  ...COLORS.slice(0, 7).map((c, i) => [i, c, HEX[i]]),
];
const TOL = [
  [5, "gold", "#c9a24a"],
  [10, "silver", "#b6bdb7"],
  [1, "brown", HEX[1]],
  [2, "red", HEX[2]],
];

const GLOSSARY = [
  ["Current (I)", "How much electric charge flows past a point each second, in amps (A). 1 mA is a thousandth of an amp."],
  ["Voltage (V)", "The push that drives current: a difference in electrical “height” between two points, in volts (V)."],
  ["Resistance (R)", "How hard it is for current to flow through something, in ohms (Ω). I = V ÷ R."],
  ["Power (P)", "How fast energy is converted, in watts (W). P = V × I. For a resistor it all becomes heat."],
  ["Ground", "The point in a circuit chosen as 0 V, that other voltages are measured from. Not necessarily connected to the earth."],
  ["Series / parallel", "Series: one after another, same current, voltages add. Parallel: side by side, same voltage, currents add."],
  ["Short circuit", "An unintended low-resistance path. Large currents flow and things get hot."],
  ["Open circuit", "A break in the path. No current can flow."],
  ["Forward voltage (Vf)", "The voltage a diode or LED takes for itself when conducting: about 0.7 V for silicon diodes, 2–3 V for LEDs."],
  ["Time constant (τ)", "R × C for a resistor charging a capacitor: after one τ it's 63% charged, after 5τ effectively full."],
  ["Saturation", "A transistor switched fully on: more base current won't increase the load current."],
  ["Flyback diode", "A diode across a coil that gives its current somewhere safe to go when switched off."],
  ["Datasheet", "The manufacturer's document for a part: pinout, ratings, typical circuits. The final authority."],
  ["Absolute maximum", "A limit that damages the part if exceeded. Not a target: design well inside it."],
];

export function tools(main) {
  main.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">Reference</div>
      <h1>Bench tools</h1>
      <p class="lede">Calculators and decoders for the questions that come up at every build. Markings are clues; the datasheet is the authority.</p>
    </div>
    <div class="tool-grid">
      <section class="tool-card wide-card">
        <div class="eyebrow">Colour code</div>
        <h3>Read a resistor's bands</h3>
        <p class="small-note">Click a band to change it, or choose from the menus.</p>
        <div class="bands-resistor" aria-hidden="true"><span class="lead-wire"></span><div class="bands-body">${[0, 1, 2, 3].map((i) => `<button type="button" class="band band-${i}" data-band="${i}" tabindex="-1"></button>`).join("")}</div><span class="lead-wire"></span></div>
        <div class="band-selects">
          ${["First digit", "Second digit", "Multiplier", "Tolerance"]
            .map(
              (n, i) => `<label>${n}<select data-sel="${i}">${
                i < 2
                  ? COLORS.map((c, j) => (i === 0 && j === 0 ? "" : `<option value="${j}">${c} · ${j}</option>`)).join("")
                  : i === 2
                    ? MULT.map(([v, c]) => `<option value="${v}">${c} · ×${si(10 ** v, "")}</option>`).join("")
                    : TOL.map(([v, c]) => `<option value="${v}">${c} · ±${v}%</option>`).join("")
              }</select></label>`,
            )
            .join("")}
        </div>
        <div class="tool-answer band-answer"></div>
        <p class="small-note band-range"></p>
        <div class="reverse"><label>Or type a value to see its bands: <input class="value-in" placeholder="e.g. 4.7k" spellcheck="false" autocomplete="off"></label></div>
      </section>

      <section class="tool-card">
        <div class="eyebrow">Surface-mount codes</div>
        <h3>Decode an SMD resistor</h3>
        <label class="small-note">Try 103, 4701, 4R7 or 000<input class="code-in" value="472" maxlength="8" spellcheck="false" autocomplete="off"></label>
        <div class="tool-answer smd-answer"></div>
        <p class="small-note smd-why"></p>
      </section>

      <section class="tool-card">
        <div class="eyebrow">LEDs</div>
        <h3>LED resistor calculator</h3>
        <div class="calc-rows">
          <label>Supply voltage <span class="unit-input"><input type="number" class="led-vs" value="9" step="0.1" min="0"><em>V</em></span></label>
          <label>LED <select class="led-vf"><option value="2.0">Red / yellow · 2.0 V</option><option value="2.2">Green (older) · 2.2 V</option><option value="3.0">Blue / white / modern green · 3.0 V</option></select></label>
          <label>Current <span class="unit-input"><input type="number" class="led-i" value="10" step="1" min="1"><em>mA</em></span></label>
        </div>
        <div class="tool-answer led-answer"></div>
        <p class="small-note led-why"></p>
      </section>

      <section class="tool-card">
        <div class="eyebrow">Ohm's law</div>
        <h3>Fill in any two</h3>
        <div class="calc-rows ohm-rows">
          <label>Voltage <span class="unit-input"><input type="number" data-q="v" step="any" placeholder="?"><em>V</em></span></label>
          <label>Current <span class="unit-input"><input type="number" data-q="i" step="any" placeholder="?"><em>mA</em></span></label>
          <label>Resistance <span class="unit-input"><input type="number" data-q="r" step="any" placeholder="?"><em>Ω</em></span></label>
        </div>
        <div class="tool-answer ohm-answer small-answer"></div>
        <button type="button" class="linkish ohm-clear">Clear</button>
      </section>

      <section class="tool-card">
        <div class="eyebrow">Prefixes</div>
        <h3>Tiny and huge units</h3>
        <table class="prefix-table">
          <tr><th>M</th><td>mega</td><td>× 1,000,000</td><td>1 MΩ</td></tr>
          <tr><th>k</th><td>kilo</td><td>× 1,000</td><td>4.7 kΩ</td></tr>
          <tr><th>m</th><td>milli</td><td>÷ 1,000</td><td>20 mA</td></tr>
          <tr><th>µ</th><td>micro</td><td>÷ 1,000,000</td><td>100 µF</td></tr>
          <tr><th>n</th><td>nano</td><td>÷ 10⁹</td><td>100 nF</td></tr>
          <tr><th>p</th><td>pico</td><td>÷ 10¹²</td><td>22 pF</td></tr>
        </table>
        <p class="small-note">Case matters: m is milli, M is mega. 1 µF = 1,000 nF = 1,000,000 pF.</p>
      </section>
    </div>
    <section class="glossary">
      <h2>Words you'll keep meeting</h2>
      <dl>${GLOSSARY.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join("")}</dl>
    </section>`;

  const $ = (s) => main.querySelector(s);
  const sel = [0, 1, 2, 3].map((i) => main.querySelector(`[data-sel="${i}"]`));
  const set = (vals) => vals.forEach((v, i) => (sel[i].value = String(v)));
  set([4, 7, 2, 5]);

  const drawBands = () => {
    const d1 = +sel[0].value;
    const d2 = +sel[1].value;
    const m = +sel[2].value;
    const t = +sel[3].value;
    const r = (d1 * 10 + d2) * 10 ** m;
    const colors = [HEX[d1], HEX[d2], MULT.find(([v]) => v === m)[2], TOL.find(([v]) => v === t)[2]];
    main.querySelectorAll(".band").forEach((b, i) => (b.style.background = colors[i]));
    $(".band-answer").textContent = `${si(r, "Ω")} ±${t}%`;
    $(".band-range").textContent = `Anything from ${si(r * (1 - t / 100), "Ω")} to ${si(r * (1 + t / 100), "Ω")} is within tolerance.`;
  };
  sel.forEach((s) => (s.onchange = drawBands));
  main.querySelectorAll("[data-band]").forEach((b) => {
    b.onclick = () => {
      const s = sel[+b.dataset.band];
      s.selectedIndex = (s.selectedIndex + 1) % s.options.length;
      drawBands();
    };
  });
  $(".value-in").oninput = (e) => {
    const r = parseValue(e.target.value);
    if (!r || r < 1 || r > 99e9) return;
    const exp = Math.floor(Math.log10(r)) - 1;
    const digits = Math.round(r / 10 ** exp);
    if (digits >= 100) return;
    if (exp < -2 || exp > 6) return;
    set([Math.floor(digits / 10) || 1, digits % 10, exp, sel[3].value]);
    drawBands();
  };
  drawBands();

  const smd = () => {
    const code = $(".code-in").value.trim().toUpperCase();
    let n;
    let why;
    if (/^\d{3,4}$/.test(code)) {
      n = +code.slice(0, -1) * 10 ** +code.at(-1);
      why = `The first ${code.length - 1} digits (${code.slice(0, -1)}) are the value; the last digit (${code.at(-1)}) says how many zeros to add.`;
    } else if (/^(\d+R\d*|R\d+)$/.test(code)) {
      n = +code.replace("R", ".");
      why = "R marks where the decimal point goes, in ohms.";
    } else why = "Enter a 3- or 4-digit code, or one with R as the decimal point. Tiny EIA-96 codes (like 01C) need a lookup table.";
    $(".smd-answer").textContent = n === undefined ? "?" : si(n, "Ω");
    $(".smd-why").textContent = why;
  };
  $(".code-in").oninput = smd;
  smd();

  const led = () => {
    const vs = +$(".led-vs").value;
    const vf = +$(".led-vf").value;
    const i = +$(".led-i").value / 1000;
    if (!(vs > vf) || !(i > 0)) {
      $(".led-answer").textContent = "–";
      $(".led-why").textContent = "The supply must be higher than the LED's forward voltage.";
      return;
    }
    const exact = (vs - vf) / i;
    const options = series(10, 1e6, E12);
    const pick = options.find((r) => r >= exact * 0.97) || options.at(-1);
    const actual = (vs - vf) / pick;
    const p = (vs - vf) * actual;
    $(".led-answer").textContent = `${si(pick, "Ω")}`;
    $(".led-why").textContent = `Exactly ${si(exact, "Ω")} → nearest standard value at or above it: ${si(pick, "Ω")}, giving about ${si(actual, "A")}. The resistor dissipates ${si(p, "W")}${p > 0.125 ? ", so use at least a ½ W part" : ": a ¼ W resistor is fine"}.`;
  };
  main.querySelectorAll(".led-vs, .led-vf, .led-i").forEach((x) => (x.oninput = led));
  led();

  const ohm = () => {
    const get = (k) => {
      const v = main.querySelector(`[data-q="${k}"]`).value;
      return v === "" ? null : +v;
    };
    const v = get("v");
    const i = get("i") === null ? null : get("i") / 1000;
    const r = get("r");
    const known = [v, i, r].filter((x) => x !== null).length;
    let text = "Enter two of the three.";
    if (known >= 2) {
      if (v !== null && i !== null && r === null) text = `R = V ÷ I = ${si(v / i, "Ω")} · P = ${si(v * i, "W")}`;
      else if (v !== null && r !== null && i === null) text = `I = V ÷ R = ${si(v / r, "A")} · P = ${si((v * v) / r, "W")}`;
      else if (i !== null && r !== null && v === null) text = `V = I × R = ${si(i * r, "V")} · P = ${si(i * i * r, "W")}`;
      else text = `Clear one box to calculate it. (Check: V ÷ R = ${si(v / r, "A")})`;
    }
    $(".ohm-answer").textContent = text;
  };
  main.querySelectorAll(".ohm-rows input").forEach((x) => (x.oninput = ohm));
  $(".ohm-clear").onclick = () => {
    main.querySelectorAll(".ohm-rows input").forEach((x) => (x.value = ""));
    ohm();
  };
  ohm();
}

function parseValue(text) {
  const m = String(text)
    .trim()
    .replace(/\s|Ω|ohms?/gi, "")
    .match(/^(\d*\.?\d+)([kKmMR]?)(\d*)$/);
  if (!m) return null;
  const scale = { k: 1e3, K: 1e3, m: 1e6, M: 1e6, R: 1, "": 1 }[m[2]];
  // "4k7" style: the letter is the decimal point.
  const n = m[3] ? +`${m[1]}.${m[3]}` : +m[1];
  return n * scale;
}
