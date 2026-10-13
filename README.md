# Circuit Workshop

A hands-on electronics course built on a live circuit simulator, taught from the physics up. Learners see voltage (wire colour) and current (moving dots, speed proportional to current), predict what will happen before it happens, break things for free, work the formulas on paper, and then take it to a real bench: measuring with their own multimeter, soldering, repairing, and finally designing and building a flashlight.

Run `npm start`, then open http://127.0.0.1:4173. Run the checks with `npm test`. No build step and no dependencies: everything in `dist/` is served as-is. three.js (MIT licence) is vendored in `dist/js/vendor/` for the 3D scenes, so they work offline too (fonts fall back to system fonts offline).

The site is also published as a Claude artifact. `npm run artifact` writes `artifact/index.html`: the same page as `dist/index.html` without the document wrapper, which the artifact host supplies. Publish it with `dist/style.css` and `dist/js/**` at the same relative paths. Routes are plain words (`#loop`, `#flashlight`, `#formulas`, `#parts`, `#part-led`, `#tools`, `#bm235`, `#bm235-guide`) because an artifact link only passes a bare `#word` to the page; old `#/learn/...` links redirect. The page follows the viewer's light or dark theme.

## The course

| Part | Chapters |
| --- | --- |
| Electricity you can see | 0 The maths toolkit · 1 The loop · 2 Inside the wire: charges and fields · 3 Voltage as height · 4 Resistance and Ohm's law · 5 Series, parallel and dividers · 6 Energy, power and batteries |
| Your meter | 7 Your multimeter: the basics · 8 How your meter works, and when it fibs |
| Components | 9 Diodes and LEDs · 10 Capacitors · 11 Magnetism and coils · 12 Transistors · 13 Reading a datasheet |
| At the bench | 14 Soldering (simulator and joint inspection) · 15 Fault finding (six repair jobs) |
| Final project | 16 A flashlight you design and build |

Each chapter mixes short prose with live figures, 3D scenes and these kinds of activity, all tracked in the browser's local storage:

- **Predictions**: commit to an answer, then the figure demonstrates what really happens, with an explanation tailored to wrong answers.
- **Challenges**: goals the simulation checks for itself ("make exactly 10 mA flow", "measure the resistor with the power off").
- **Formula cards**: each formula with every symbol and unit, where it comes from, where you meet it, and a worked example. Calculus appears only in fold-out "Going deeper" notes.
- **Get a pencil**: problems worked on paper, with typed answers checked for units, prefixes and common slips (a factor of 1,000, a wrong sign, a factor of two), stepped hints and a worked solution.
- **At the meter**: exercises on the learner's own Brymen BM235, with expected readings and what they mean, from first continuity checks to proving a socket dead.
- **Quizzes**: a short check at the end of each chapter.

Technical terms written `[[like this]]` in chapter text become tap-to-explain buttons, defined in `data/glossary.js`; on the BM235 pages, the same terms are found and linked automatically. The **Formulas** page collects every formula card from the chapters.

There are also reference pages: **Parts** (17 component families), **Tools** (colour code, SMD codes, LED resistor and Ohm's-law calculators, glossary), and a field guide to the **Brymen BM235** multimeter: every dial position and button on an interactive front panel, how it works inside (with accuracy, ghost-voltage and burden-voltage calculators), the must-knows, and checks around the house. A companion **complete guide** takes every one of its functions and features in turn: how to select it, specifications, how it works inside, and expected uses, unexpected uses and traps, plus anatomy, versions, firmware, the teardown, batteries, fuses and troubleshooting. Figures come from Brymen's manual and the EEVblog edition, with independent measurements from HKJ's review credited where used.

## How it works

```
dist/js/
  sim.js         Circuit simulator: nodal analysis, Newton–Raphson for diodes/BJTs/MOSFETs,
                 backward-Euler companion models for capacitors and inductors. DOM-free.
  components.js  Every part type: pins, engine elements, SVG symbol, live visuals, damage
                 (LEDs burn out, resistors overheat, fuses blow).
  netlist.js     Turns a drawing (parts on a grid + wire polylines) into a simulation, and
                 maps results back: node voltages and per-wire currents (via KCL on a spanning
                 tree) so dots flow correctly through junctions. DOM-free.
  figure.js      A live figure: rendering, animation, hover info, clickable switches, cuttable
                 wires, controls, readouts, goals.
  meter.js       Multimeter with draggable probes (V, A, Ω, continuity, diode), fuse, and
                 live-circuit detection. Works on any figure.
  plots.js       Oscilloscope (triggered, sampled every sim step), voltage landscape, x–y graphs.
  micro.js       Inside the wire: free electrons and ions in copper (drift, collisions, heat),
                 the field-versus-electron race on a zoomable clock, and surface charge,
                 field strength and energy flow around a loop. Models are pure and tested.
  lesson.js      Renders a chapter from data: prose, figures, predictions, notes, quizzes.
  blocks.js      Formula cards, pencil problems, meter exercises, and 3D scenes (loaded on demand).
  quantity.js    Reads typed answers ("19 mA", "0,019 A", "4k7") and diagnoses slips. DOM-free.
  terms.js       Tap-to-explain glossary terms and their popover.
  labs.js        Ohm's-law discovery lab, battery discharge curves (alkaline, NiMH, Li-ion),
                 and the prefix ladder. The battery model is DOM-free and tested.
  meterlabs.js   What's inside a meter, the BM235 accuracy calculator, RMS waveforms, ghost
                 voltages.
  scenes/        WebGL scenes on a shared stage (drag or arrow keys to turn, labels pinned to
                 3D points, paused off screen): surface charge on a circuit, a PN junction,
                 a capacitor charging, the Biot–Savart field of a wire and a coil, a MOSFET
                 forming its channel, and the flashlight in an exploded view.
  project.js     The flashlight's perfboard layout, connection checklist and parts list.
  solder.js      Soldering simulator (pad/lead temperatures, wetting, flux, lifted pads) and the
                 joint inspection trainer.
  repair.js      Repair bench: circuits with hidden faults, scored on measurements.
  chapters/      One data module per chapter. Cross-references are written {{ch:voltage}} and
                 render as a link with the current chapter number.
  pages/         Home, Parts, Tools, and the BM235 field guide and complete guide (their content and
                 calculators are in data/bm235.js and data/bm235-guide.js, DOM-free and tested).
```

A figure is plain data. Grid coordinates are in units of 40 px; two-terminal parts have pins `a` and `b`:

```js
{
  title: "A resistor and an LED",
  parts: [
    { id: "B1", type: "battery", a: [1, 2], b: [1, 4], v: 9 },     // a is +
    { id: "R1", type: "resistor", a: [3, 0], b: [5, 0], r: 470 },
    { id: "D1", type: "led", a: [8, 1], b: [8, 3], color: "red" }, // a is the anode
  ],
  wires: ["1,2 1,0 3,0", "5,0 8,0 8,1", "8,3 8,5 1,5 1,4"],
  controls: [{ label: "Resistor", part: "R1", prop: "r", values: [220, 470, 1000], unit: "Ω" }],
  readouts: [{ label: "LED current", value: (q) => q.i("D1"), unit: "A" }],
  goals: [{ id: "my-goal", text: "Run the LED at 10–15 mA", test: (q) => q.i("D1") > 0.01 && q.i("D1") < 0.015 }],
}
```

`npm test` checks the answer reader on real-world notation, that every problem accepts its own answer and that its worked solution states the same one, that every glossary term and chapter link resolves, and the battery model's shape. It runs physics checks on the engine (LED forward voltages, RC/RL time constants, transistor saturation, floating MOSFET gates, inductive kick) and on the inside-the-wire model (no drift without a field, drift proportional to field, heat proportional to field squared, less drift when hot), and simulates every figure in every chapter, checking convergence, unique task ids, valid answers, and that each repair job is broken before its fix and working after. It also checks the BM235 calculators against the manuals' figures.

## Accuracy

The models are idealised teaching models, chosen to be right about the things a beginner needs: LEDs follow a real exponential curve with series resistance; batteries have internal resistance; transistors use Ebers–Moll and square-law models; the MOSFET body diode avalanches at 60 V. The 3D scenes use real numbers where they show them (surface charge per centimetre, plate capacitance, the field of a coil) and say plainly what they exaggerate. Discharge curves are shaped on typical datasheet figures. Datasheet excerpts carry typical values for the named parts. Real parts vary, so the course points learners to their own parts' datasheets throughout.
