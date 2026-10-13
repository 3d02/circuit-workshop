// Drawings and tables for the final project: the perfboard layout, the
// connection checklist and the parts list.

// ---------- perfboard layout ----------
// A 14 × 10 hole perfboard, seen from the component side. Copper connections made on
// the back (solder trails or bare wire) are drawn as translucent copper lines.

const P = 30; // px per 0.1 inch hole pitch
const OX = 190;
const OY = 46;
const X = (c) => OX + (c - 1) * P;
const Y = (r) => OY + (r - 1) * P;

const TRACES = [
  // nets, as polylines of [col, row]
  { net: "plus", pts: [[1, 1], [14, 1]] },
  { net: "zero", pts: [[1, 10], [14, 10]] },
  { net: "plus", pts: [[8, 1], [8, 2]] },
  { net: "gate", pts: [[8, 4], [8, 5]] },
  { net: "gate", pts: [[4, 7], [4, 5], [8, 5]] },
  { net: "drain", pts: [[9, 5], [9, 3]] },
  { net: "sense", pts: [[10, 5], [10, 6]] },
  { net: "sense", pts: [[5, 7], [5, 6], [10, 6]] },
  { net: "zero", pts: [[10, 9], [10, 10]] },
  { net: "zero", pts: [[6, 7], [6, 10]] },
  { net: "plus", pts: [[12, 1], [12, 2]] },
];

export function perfboard() {
  let holes = "";
  for (let c = 1; c <= 14; c++) for (let r = 1; r <= 10; r++) holes += `<circle cx="${X(c)}" cy="${Y(r)}" r="4.5" class="pb-hole"/>`;
  const traces = TRACES.map((t) => `<polyline class="pb-trace ${t.net}" points="${t.pts.map(([c, r]) => `${X(c)},${Y(r)}`).join(" ")}"/>`).join("");
  const pad = (c, r) => `<circle cx="${X(c)}" cy="${Y(r)}" r="6.5" class="pb-pad"/>`;
  const resistor = (c, r1, r2, bands, label, side = 1) => {
    const x = X(c);
    const y1 = Y(r1);
    const y2 = Y(r2);
    const mid = (y1 + y2) / 2;
    return `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" class="pb-lead"/>
      <rect x="${x - 9}" y="${mid - 22}" width="18" height="44" rx="7" class="pb-res"/>
      ${bands.map((b, i) => `<rect x="${x - 9}" y="${mid - 15 + i * 8}" width="18" height="4" fill="${b}"/>`).join("")}
      ${pad(c, r1)}${pad(c, r2)}
      <text x="${x + side * 16}" y="${mid + 4}" class="pb-label" text-anchor="${side > 0 ? "start" : "end"}">${label}</text>`;
  };
  // A transistor standing upright, seen from above: a thin body over its three pins
  // (a TO-220's metal tab is the lighter strip behind it), labelled to one side.
  const three = (c, r, pins, cls, label, tab, side) => {
    const y = Y(r);
    const x0 = X(c) - 16;
    const w = 2 * P + 32;
    const lx = side > 0 ? X(c + 2) + 26 : X(c) - 26;
    return `${tab ? `<rect x="${x0 - 2}" y="${y - 25}" width="${w + 4}" height="7" rx="2" class="pb-tab"/>` : ""}
      <rect x="${x0}" y="${y - 18}" width="${w}" height="14" rx="${tab ? 2 : 7}" class="${cls}"/>
      ${pins.map((p, i) => `${pad(c + i, r)}<text x="${X(c + i)}" y="${y + 22}" class="pb-pin" text-anchor="middle">${p}</text>`).join("")}
      <text x="${lx}" y="${y - 7}" class="pb-part" text-anchor="${side > 0 ? "start" : "end"}">${label}</text>`;
  };
  const wirePad = (c, r, text, side, cls) => `${pad(c, r)}<line x1="${X(c)}" y1="${Y(r)}" x2="${X(c) + side * 40}" y2="${Y(r) - 14}" class="pb-wire ${cls}"/><text x="${X(c) + side * 46}" y="${Y(r) - 14}" class="pb-label${side < 0 ? " out" : ""}" text-anchor="${side > 0 ? "start" : "end"}" dominant-baseline="middle">${text}</text>`;

  return `<svg class="perfboard" viewBox="0 0 700 370" role="img" aria-label="Perfboard layout for the flashlight driver: rails along the top and bottom, the MOSFET and NPN in the middle, the two resistors, and the wire connections described in the checklist below.">
    <rect x="${OX - 26}" y="${OY - 26}" width="${13 * P + 52}" height="${9 * P + 52}" rx="10" class="pb-board"/>
    ${holes}
    ${traces}
    ${resistor(8, 2, 4, ["#7a4a2e", "#222822", "#e8cc3a"], "R1 100 kΩ", -1)}
    ${resistor(10, 6, 9, ["#7a4a2e", "#8f938a", "#c9a24a"], "R2 1.8 Ω ½ W", 1)}
    ${three(8, 5, ["G", "D", "S"], "pb-to220", "Q1 MOSFET", true, 1)}
    ${three(4, 7, ["C", "B", "E"], "pb-to92", "Q2 NPN", false, -1)}
    ${wirePad(1, 1, "from switch (+)", -1, "red")}
    ${wirePad(1, 10, "battery −", -1, "black")}
    ${wirePad(12, 2, "LED +", 1, "red")}
    ${wirePad(9, 3, "LED −", 1, "black")}
    <text x="${X(14) + 40}" y="${Y(1) + 5}" class="pb-rail">+ rail</text>
    <text x="${X(14) + 40}" y="${Y(10) + 5}" class="pb-rail">0 V rail</text>
  </svg>`;
}

export const CHECKS = [
  ["+ (after the switch)", "switch output, R1, LED +", "Beeps from the switch's output tag to the LED + wire"],
  ["Gate", "R1, Q1 gate, Q2 collector", "Beeps between all three"],
  ["Drain", "Q1 drain (also its metal tab), LED −", "Beeps"],
  ["Sense", "Q1 source, R2, Q2 base", "Beeps"],
  ["0 V", "R2, Q2 emitter, battery −", "Beeps"],
  ["Must <em>not</em> beep", "+ to 0 V; gate to 0 V; drain to 0 V", "No beep. Gate to + reads about 100 kΩ on Ω"],
];

export const BOM = [
  ["D1", "1 W white LED on a 20 mm star board", "about 3.2 V at 350 mA; any maker"],
  ["—", "Small aluminium heatsink or plate for the star", "with thermal adhesive or two screws and paste"],
  ["Q1", "Logic-level N-channel MOSFET, TO-220", "IRLZ44N, IRLB8721 or similar: V<sub>GS(th)</sub> ≤ 2 V"],
  ["Q2", "Small-signal NPN transistor, TO-92", "BC547, BC548 or 2N3904 (mind the pinout)"],
  ["R1", "100 kΩ, ¼ W", "brown-black-yellow"],
  ["R2", "1.8 Ω, ½ W", "brown-grey-gold; sets the current"],
  ["SW1", "Switch rated 1 A DC or more", "latching push-button or slide switch"],
  ["BT1", "4 × AA holder with leads or a snap", "a snap connector can't be fitted backwards"],
  ["—", "4 × AA NiMH cells, about 2,000 mAh, and a NiMH charger", "“low self-discharge” cells hold their charge for months"],
  ["—", "Perfboard about 5 × 7 cm, hook-up wire, heat-shrink tubing", "solid-core 0.5 mm² wire is easy to work with"],
  ["—", "For testing: a 47 Ω resistor", "limits the current at first power-up"],
  ["Optional", "6.8 Ω resistor and a second switch", "the low-power mode"],
  ["Optional", "A body: a project box or a length of 40 mm pipe, and a 20 mm reflector or lens", "to make it a proper torch"],
];

export function table(head, rows, cls = "") {
  return `<div class="bm-table-wrap"><table class="bm-table ${cls}"><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
