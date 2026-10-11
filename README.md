# Circuit Workshop

A buildless, responsive electronics learning site for beginner building and repair.

- 17 component families with types, explanations, identification, measurement, and soldering guidance
- 11 adjustable teaching models, explanatory schematics/graphs, and prediction questions
- Guided soldering sequence and visual joint identification exercises
- Multimeter with voltage, resistance, continuity, current, and selectable faults
- Browser-local learning progress, a starter learning path, resistor code tools, and reference links

Run `npm start`, then open http://127.0.0.1:4173. Run the physics checks with `npm test`.

Source and served assets are in `dist/`; no build step or dependencies are needed. Models are educational approximations, documented alongside each experiment. The illustrated PCB is an atlas, not a routed circuit design. Fonts fall back to local sans-serif/monospace fonts when Google Fonts cannot load.
