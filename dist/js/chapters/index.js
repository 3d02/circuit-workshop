import maths from "./00-maths.js";
import loop from "./01-loop.js";
import inside from "./02-inside-wire.js";
import voltage from "./03-voltage.js";
import resistance from "./04-resistance.js";
import dividers from "./05-dividers.js";
import energy from "./06-energy.js";
import leds from "./06-leds.js";
import multimeter from "./07-multimeter.js";
import meterInside from "./08-meter-inside.js";
import capacitors from "./08-capacitors.js";
import transistors from "./09-transistors.js";
import soldering from "./10-soldering.js";
import repair from "./11-repair.js";

export const PARTS_OF_COURSE = [
  { name: "Electricity you can see", blurb: "A maths toolkit, what's really going on inside a wire, and the rules and formulas everything else is built on.", ids: ["maths", "loop", "inside", "voltage", "resistance", "dividers", "energy"] },
  { name: "Your meter", blurb: "Measuring real circuits with confidence, and knowing what your meter is really telling you.", ids: ["multimeter", "meter-inside"] },
  { name: "Components", blurb: "The parts you'll use in every build: how they work inside, the formulas that describe them, and how to test them.", ids: ["leds", "capacitors", "transistors"] },
  { name: "At the bench", blurb: "Making joints that last, and finding faults like a technician.", ids: ["soldering", "repair"] },
];

const list = [maths, loop, inside, voltage, resistance, dividers, energy, multimeter, meterInside, leds, capacitors, transistors, soldering, repair];

// Chapter 0 is the maths toolkit, so chapter numbers start from zero.
export const CHAPTERS = list.map((c, i) => ({
  ...c,
  num: i,
  part: PARTS_OF_COURSE.find((p) => p.ids.includes(c.id))?.name || "",
}));
