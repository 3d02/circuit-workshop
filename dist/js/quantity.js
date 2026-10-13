// Reading and checking typed answers to the pencil-and-paper problems.
// DOM-free, so it can be tested under Node.
//
// A problem states its answer in a display unit, e.g. { answer: 19.1, unit: "mA" }.
// The learner may type "19.1", "19.1 mA", "0.0191 A", "0,0191A" or "1.91e-2 A".
// A bare number is read in the display unit; a number with a unit is converted.

const PREFIX = { p: 1e-12, n: 1e-9, µ: 1e-6, m: 1e-3, "": 1, k: 1e3, M: 1e6, G: 1e9 };

// Units that take SI prefixes. Longest first, so "Wh" wins over "h" and "Ah" over "h".
const BASES = ["Wh", "Ah", "Hz", "V", "A", "Ω", "W", "J", "C", "F", "H", "s", "m"];
// Units used as they are.
const PLAIN = ["%", "°C", "h", "min", "×", "m/s", "mm/s", "mm²", "°C/W", "lm", "lm/W", "Ω·m", "years", "days", "electrons", "€"];

// "mA" → { prefix: "m", base: "A", scale: 1e-3 }
export function splitUnit(unit) {
  const u = normUnit(unit);
  if (PLAIN.includes(u)) return { prefix: "", base: u, scale: 1 };
  for (const loose of [false, true]) {
    for (const base of BASES) {
      // Second pass: forgive the case of the unit letter ("ma", "mv", "khz"), but not of the prefix.
      if (loose && base === "m") continue;
      const tail = u.slice(-base.length);
      if (loose ? tail.toLowerCase() !== base.toLowerCase() : tail !== base) continue;
      const prefix = u.slice(0, -base.length);
      if (prefix in PREFIX) return { prefix, base, scale: PREFIX[prefix] };
    }
  }
  return { prefix: "", base: u, scale: 1 };
}

function normUnit(text) {
  return String(text)
    .trim()
    .replace(/\s+/g, "")
    .replace(/^[uμ](?=[A-Za-zΩ])/, "µ")
    .replace(/^u$/, "µ")
    .replace(/ohms?$/i, "Ω")
    .replace(/^K(?=[A-Za-zΩ]|$)/, "k")
    .replace(/degC|ºC/i, "°C")
    .replace(/^(sec|secs|seconds?)$/i, "s")
    .replace(/^(hours?|hrs?)$/i, "h")
    .replace(/^(minutes?|mins)$/i, "min")
    .replace(/^x$/i, "×");
}

// Read a number in the learner's own notation. Returns null if it isn't one.
export function readNumber(raw) {
  let s = String(raw).trim().replace(/−/g, "-").replace(/^±\s*/, "").replace(/\s+/g, " ");
  // Decimal comma ("0,5") unless the comma is a thousands separator ("1,200").
  if (/,/.test(s) && !/\./.test(s) && !/^\d{1,3}(,\d{3})+(\D|$)/.test(s)) s = s.replace(",", ".");
  s = s.replace(/,/g, "");
  // Resistor shorthand: 4k7, 2M2, 4R7, 470R.
  const code = s.match(/^(\d+)([kKMR])(\d*)\s*(Ω|ohms?)?$/);
  if (code) {
    const mult = { k: 1e3, K: 1e3, M: 1e6, R: 1 }[code[2]];
    return { value: Number(`${code[1]}.${code[3] || 0}`) * mult, unit: "Ω", explicit: true };
  }
  const m = s.match(/^([+-]?(?:\d+\.?\d*|\.\d+))(?:\s*(?:e|E|x10\^|×10\^|\*10\^)\s*([+-]?\d+))?\s*(.*)$/);
  if (!m) return null;
  const value = Number(m[1]) * 10 ** Number(m[2] || 0);
  if (!Number.isFinite(value)) return null;
  return { value, unit: m[3].trim(), explicit: m[3].trim() !== "" };
}

// Convert what was typed into the problem's display unit.
// → { value } on success, { error: "number" | "unit", expected } otherwise.
export function toDisplayUnit(raw, displayUnit) {
  const read = readNumber(raw);
  if (!read) return { error: "number" };
  const want = splitUnit(displayUnit);
  if (!read.explicit) return { value: read.value };
  const typed = normUnit(read.unit);
  if (typed === normUnit(displayUnit)) return { value: read.value };
  // A lone prefix ("4.7k") borrows the expected base unit.
  if (typed in PREFIX && want.base !== "%" && BASES.includes(want.base)) return { value: (read.value * PREFIX[typed]) / want.scale };
  const got = splitUnit(typed);
  if (got.base !== want.base && got.base.toLowerCase() === want.base.toLowerCase()) got.base = want.base;
  if (got.base !== want.base) {
    // Allow "mAh" ↔ "Ah", "min" ↔ "h", "s" ↔ "min" between related time units.
    const time = { s: 1, min: 60, h: 3600 };
    if (got.base in time && want.base in time) return { value: (read.value * got.scale * time[got.base]) / (want.scale * time[want.base]) };
    return { error: "unit", expected: want.base };
  }
  return { value: (read.value * got.scale) / want.scale };
}

// Check an answer. tol is relative (default 2%, which absorbs sensible rounding);
// abs is an absolute tolerance in display units for answers near zero.
export function check(raw, { answer, unit = "", tol = 0.02, abs = 0 }) {
  const r = toDisplayUnit(raw, unit);
  if (r.error === "number") return { ok: false, why: "number" };
  if (r.error === "unit") return { ok: false, why: "unit", expected: r.expected };
  const v = r.value;
  const err = Math.abs(v - answer);
  if (err <= Math.max(abs, tol * Math.abs(answer)) * (1 + 1e-9)) return { ok: true, value: v };
  // Diagnose common slips.
  if (answer !== 0 && v !== 0) {
    if (Math.abs(v + answer) <= tol * Math.abs(answer)) return { ok: false, why: "sign", value: v };
    const ratio = Math.abs(v / answer);
    const decades = Math.log10(ratio);
    const k = Math.round(decades);
    if (k !== 0 && Math.abs(decades - k) < Math.log10(1 + tol * 2)) return { ok: false, why: k % 3 === 0 ? "prefix" : "decimal", factor: 10 ** k, value: v };
    if (Math.abs(ratio - 2) < 0.04 || Math.abs(ratio - 0.5) < 0.02) return { ok: false, why: "half", value: v };
    if (ratio > 0.8 && ratio < 1.25) return { ok: false, why: "close", value: v };
  }
  return { ok: false, why: "wrong", value: v };
}

// A short, specific nudge for each kind of slip.
export function feedback(result, unit) {
  switch (result.why) {
    case "number":
      return "Type a number, for example 12.5, optionally with a unit such as 12.5 mA.";
    case "unit":
      return `That unit doesn't fit. The answer is measured in ${result.expected}${unit && unit !== result.expected ? ` (give it in ${unit})` : ""}.`;
    case "sign":
      return "Right size, wrong sign. Check which way round you subtracted.";
    case "prefix":
      return `You're out by a factor of ${fmtFactor(result.factor)}. That's almost always a prefix slip: check your milli-, micro- and kilo-.`;
    case "decimal":
      return `You're out by a factor of ${fmtFactor(result.factor)}. Check where the decimal point went.`;
    case "half":
      return "You're out by a factor of two. Check whether something should be halved, doubled or squared.";
    case "close":
      return "Close, but not within rounding. Check each step, and keep a few more digits until the end.";
    default:
      return "Not yet. Try a hint, or check each step against the formula.";
  }
}

function fmtFactor(f) {
  const n = f >= 1 ? f : 1 / f;
  return n >= 1e4 ? `10^${Math.round(Math.log10(n))}` : n.toLocaleString("en-GB");
}

// Format a number for display in worked solutions and feedback: 3 significant figures.
// Very large or small numbers come out in powers of ten: 1.6 × 10⁻¹⁹.
const SUP = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
export function sig(v, digits = 3) {
  if (!Number.isFinite(v)) return "–";
  if (v === 0) return "0";
  const e = Math.floor(Math.log10(Math.abs(v)));
  if (e < -4 || e >= 9) {
    const m = Number((v / 10 ** e).toPrecision(digits));
    return `${m} × 10${String(e).replace(/./g, (c) => SUP[c])}`;
  }
  const p = Math.max(0, digits - 1 - e);
  return Number(v.toFixed(Math.min(p, 6))).toLocaleString("en-GB", { maximumFractionDigits: 6 });
}
