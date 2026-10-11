# Circuit Workshop

A hands-on electronics course built on a live circuit simulator. Learners see voltage (wire colour) and current (moving dots, speed proportional to current), predict what will happen before it happens, break things for free, and then take it to a real bench: building, measuring, soldering and repairing.

Run `npm start`, then open http://127.0.0.1:4173. Run the checks with `npm test`. No build step and no dependencies: everything in `dist/` is served as-is (fonts fall back to system fonts offline).

The site is also published as a Claude artifact. `npm run artifact` writes `artifact/index.html`: the same page as `dist/index.html` without the document wrapper, which the artifact host supplies. Publish it with `dist/style.css` and `dist/js/**` at the same relative paths. Routes are plain words (`#loop`, `#parts`, `#part-led`, `#tools`) because an artifact link only passes a bare `#word` to the page; old `#/learn/...` links redirect. The page follows the viewer's light or dark theme.

## The course

| Part | Chapters |
| --- | --- |
| Electricity you can see | 1 The loop · 2 Inside the wire: charges and fields · 3 Voltage as height · 4 Ohm's law and heat · 5 Series, parallel and dividers |
| Components and measurement | 6 Diodes and LEDs · 7 The multimeter · 8 Capacitors · 9 Transistors |
| At the bench | 10 Soldering (simulator and joint inspection) · 11 Fault finding (six repair jobs) |

Each chapter mixes short prose with live figures and three kinds of activity, all tracked in the browser's local storage:

- **Predictions**: commit to an answer, then the figure demonstrates what really happens, with an explanation tailored to wrong answers.
- **Challenges**: goals the simulation checks for itself ("make exactly 10 mA flow", "measure the resistor with the power off").
- **Quizzes**: a short check at the end of each chapter.

There are also reference pages: **Parts** (17 component families) and **Tools** (colour code, SMD codes, LED resistor and Ohm's-law calculators, glossary).

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
  solder.js      Soldering simulator (pad/lead temperatures, wetting, flux, lifted pads) and the
                 joint inspection trainer.
  repair.js      Repair bench: circuits with hidden faults, scored on measurements.
  chapters/      One data module per chapter. Cross-references are written {{ch:voltage}} and
                 render as a link with the current chapter number.
  pages/         Home, Parts, Tools.
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

`npm test` runs physics checks on the engine (LED forward voltages, RC/RL time constants, transistor saturation, floating MOSFET gates, inductive kick) and on the inside-the-wire model (no drift without a field, drift proportional to field, heat proportional to field squared, less drift when hot), and simulates every figure in every chapter, checking convergence, unique task ids, valid answers, and that each repair job is broken before its fix and working after.

## Accuracy

The models are idealised teaching models, chosen to be right about the things a beginner needs: LEDs follow a real exponential curve with series resistance; batteries have internal resistance; transistors use Ebers–Moll and square-law models; the MOSFET body diode avalanches at 60 V. Real parts vary, so the course points learners to datasheets throughout.
