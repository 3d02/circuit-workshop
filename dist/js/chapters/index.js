import loop from "./01-loop.js";
import inside from "./02-inside-wire.js";
import voltage from "./03-voltage.js";
import resistance from "./04-resistance.js";
import dividers from "./05-dividers.js";
import leds from "./06-leds.js";
import multimeter from "./07-multimeter.js";
import capacitors from "./08-capacitors.js";
import transistors from "./09-transistors.js";
import soldering from "./10-soldering.js";
import repair from "./11-repair.js";

export const PARTS_OF_COURSE = [
  { name: "Electricity you can see", blurb: "What's really going on inside a wire, and the three rules everything else is built on.", ids: ["loop", "inside", "voltage", "resistance", "dividers"] },
  { name: "Components and measurement", blurb: "The parts you'll use in every build, and how to see inside a real circuit.", ids: ["leds", "multimeter", "capacitors", "transistors"] },
  { name: "At the bench", blurb: "Making joints that last, and finding faults like a technician.", ids: ["soldering", "repair"] },
];

const list = [loop, inside, voltage, resistance, dividers, leds, multimeter, capacitors, transistors, soldering, repair];

export const CHAPTERS = list.map((c, i) => ({
  ...c,
  num: i + 1,
  part: PARTS_OF_COURSE.find((p) => p.ids.includes(c.id))?.name || "",
}));
