// Number formatting with SI prefixes, and standard component value series.

const PREFIXES = [
  [1e9, "G"],
  [1e6, "M"],
  [1e3, "k"],
  [1, ""],
  [1e-3, "m"],
  [1e-6, "µ"],
  [1e-9, "n"],
  [1e-12, "p"],
];

// si(0.0123, "A") → "12.3 mA"
export function si(value, unit = "", digits = 3) {
  if (value === Infinity) return `∞ ${unit}`.trim();
  if (!Number.isFinite(value)) return `– ${unit}`.trim();
  const abs = Math.abs(value);
  if (abs < 1e-12) return `0 ${unit}`.trim();
  let [scale, prefix] = PREFIXES.find(([s]) => abs >= s * 0.9995) || PREFIXES.at(-1);
  // Ohms and farads are commonly written without the "m" prefix for small fractions.
  if (unit === "Ω" && scale < 1) [scale, prefix] = [1, ""];
  const scaled = value / scale;
  const places = Math.max(0, digits - 1 - Math.floor(Math.log10(Math.abs(scaled) || 1)));
  const text = scaled.toFixed(Math.min(places, 3)).replace(/\.0+$|(\.\d*?)0+$/, "$1");
  return `${text} ${prefix}${unit}`.trim();
}

// Fixed-precision voltage display for meters: "4.52 V"
export const volts = (v, places = 2) => `${v.toFixed(places)} V`;

export const E12 = [1, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2];
export const E6 = [1, 1.5, 2.2, 3.3, 4.7, 6.8];

// Every value of a series between min and max (inclusive), e.g. 100 Ω … 1 MΩ.
export function series(min, max, base = E12) {
  const out = [];
  for (let decade = 10 ** Math.floor(Math.log10(min)); decade <= max; decade *= 10) {
    for (const m of base) {
      const v = +(m * decade).toPrecision(3);
      if (v >= min * 0.999 && v <= max * 1.001) out.push(v);
    }
  }
  return out;
}

export function nearest(value, list) {
  return list.reduce((best, v) => (Math.abs(Math.log(v / value)) < Math.abs(Math.log(best / value)) ? v : best));
}

export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

export const esc = (v) =>
  String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Distance from a point to a segment, and how far along it (0..1) the nearest point is.
export function segDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy || 1;
  const t = clamp(((px - x1) * dx + (py - y1) * dy) / len2, 0, 1);
  return { dist: Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy)), t };
}
