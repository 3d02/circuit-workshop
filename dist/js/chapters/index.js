import maths from "./00-maths.js";
import loop from "./01-loop.js";
import inside from "./02-inside-wire.js";
import voltage from "./03-voltage.js";
import resistance from "./04-resistance.js";
import dividers from "./05-dividers.js";
import energy from "./06-energy.js";
import multimeter from "./07-multimeter.js";
import meterInside from "./08-meter-inside.js";
import leds from "./09-leds.js";
import capacitors from "./10-capacitors.js";
import coils from "./11-coils.js";
import transistors from "./12-transistors.js";
import datasheets from "./13-datasheets.js";
import soldering from "./14-soldering.js";
import repair from "./15-repair.js";
import flashlight from "./16-flashlight.js";

export const PARTS_OF_COURSE = [
  { name: "Electricity you can see", blurb: "A maths toolkit, what's really going on inside a wire, and the rules and formulas everything else is built on.", ids: ["maths", "loop", "inside", "voltage", "resistance", "dividers", "energy"] },
  { name: "Your meter", blurb: "Measuring real circuits with confidence, and knowing what your meter is really telling you.", ids: ["multimeter", "meter-inside"] },
  { name: "Components", blurb: "The parts you'll use in every build: how they work inside, the formulas that describe them, and how to test them.", ids: ["leds", "capacitors", "coils", "transistors", "datasheets"] },
  { name: "At the bench", blurb: "Making joints that last, and finding faults like a technician.", ids: ["soldering", "repair"] },
  { name: "Final project", blurb: "A flashlight you specify, design with the formulas, simulate, breadboard, solder, test and publish as open hardware.", ids: ["flashlight"] },
];

const list = [maths, loop, inside, voltage, resistance, dividers, energy, multimeter, meterInside, leds, capacitors, coils, transistors, datasheets, soldering, repair, flashlight];

// Chapter 0 is the maths toolkit, so chapter numbers start from zero.
export const CHAPTERS = list.map((c, i) => ({
  ...c,
  num: i,
  part: PARTS_OF_COURSE.find((p) => p.ids.includes(c.id))?.name || "",
}));
