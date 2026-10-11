import { CHAPTERS, PARTS_OF_COURSE } from "../chapters/index.js";
import { chapterTasks } from "../lesson.js";
import { Figure } from "../figure.js";
import { progress } from "../progress.js";
import { si } from "../format.js";

const DEMO = {
  title: "Try it: flip the switch, then turn the knob",
  layout: "compact",
  iScale: 0.012,
  parts: [
    { id: "B1", type: "battery", a: [1, 2], b: [1, 4], v: 9, r: 0.5, labelSide: "left" },
    { id: "S1", type: "switch", a: [3, 0], b: [5, 0], closed: false, label: "switch", labelSide: "above" },
    { id: "R1", type: "resistor", a: [6, 0], b: [8, 0], r: 680, label: (p) => si(p.r, "Ω") },
    { id: "D1", type: "led", a: [10, 1.5], b: [10, 3.5], color: "green" },
  ],
  wires: ["1,2 1,0 3,0", "5,0 6,0", "8,0 10,0 10,1.5", "10,3.5 10,5 1,5 1,4"],
  controls: [{ label: "Resistor", part: "R1", prop: "r", values: [220, 330, 470, 680, 1000, 2200, 4700, 10000], unit: "Ω" }],
  readouts: [{ label: "LED current", value: (q) => q.i("D1"), unit: "A" }],
};

export function home(main) {
  const status = CHAPTERS.map((c) => {
    const tasks = chapterTasks(c);
    const done = progress.count(tasks);
    return { c, tasks: tasks.length, done };
  });
  const next = status.find((s) => s.done < s.tasks) || status[0];
  const started = status.some((s) => s.done > 0);

  main.innerHTML = `
    <section class="home-hero">
      <div class="hero-text">
        <div class="eyebrow">A hands-on electronics course</div>
        <h1>See electricity.<br><em>Then build with it.</em></h1>
        <p class="lede">Every circuit in this course is a live simulation. Colour shows voltage, moving dots show current, and everything reacts as you flip switches, cut wires, and occasionally set things on fire (for free). Then you take it to a real bench: building, measuring, soldering and fixing.</p>
        <div class="hero-actions">
          <a class="btn" href="#/learn/${next.c.id}">${started ? `Continue: ${next.c.title}` : "Start with chapter 1"} →</a>
          <a class="btn outline" href="#/learn/repair">Jump to the repair bench</a>
        </div>
      </div>
      <div class="hero-demo"></div>
    </section>

    <section class="home-pillars">
      <div><span class="pillar-icon">?</span><h3>Predict, then see</h3><p>Before most experiments you commit to a prediction. Then the circuit shows you what really happens, and why.</p></div>
      <div><span class="pillar-icon">⚡</span><h3>Real physics underneath</h3><p>A circuit simulator solves every figure live: LEDs have real curves, capacitors charge, coils kick back.</p></div>
      <div><span class="pillar-icon">✓</span><h3>Challenges that check themselves</h3><p>Hit a target current, pick the right resistor, find the fault. The course notices when you've done it.</p></div>
    </section>

    <section class="course-map" aria-label="Course chapters">
      ${PARTS_OF_COURSE.map(
        (part, pi) => `
        <div class="map-part">
          <div class="map-part-head"><span class="map-part-num">Part ${pi + 1}</span><h2>${part.name}</h2><p>${part.blurb}</p></div>
          <div class="map-chapters">
            ${status
              .filter((s) => part.ids.includes(s.c.id))
              .map(({ c, tasks, done }) => {
                const pct = tasks ? Math.round((done / tasks) * 100) : 0;
                const state = pct === 100 ? "done" : done > 0 ? "started" : "";
                return `<a class="map-card ${state}" href="#/learn/${c.id}">
                  <span class="map-num">${pct === 100 ? "✓" : c.num}</span>
                  <span class="map-body"><strong>${c.title}</strong><small>${c.lede.split(". ")[0]}.</small>
                  <span class="map-meta"><span>${c.minutes} min</span><span class="map-bar"><i style="width:${pct}%"></i></span><span>${done}/${tasks}</span></span></span>
                </a>`;
              })
              .join("")}
          </div>
        </div>`,
      ).join("")}
    </section>

    <section class="home-bench">
      <div class="white-card">
        <div class="eyebrow">When you're ready for a real bench</div>
        <h3>A small, sensible starter kit</h3>
        <ul class="kit-list">
          <li>Breadboard, jumper wires, a 9 V battery clip and a switched 3×AA holder</li>
          <li>A pack of resistors (an E12 assortment), red/green/blue LEDs, a few 100 µF and 1000 µF capacitors, buttons, a couple of NPN transistors and logic-level MOSFETs</li>
          <li>A digital multimeter with continuity and diode modes and a fused current input</li>
          <li>A temperature-controlled soldering iron with a stand, a chisel tip, brass-wool tip cleaner, flux-cored solder, solder wick and a practice board</li>
          <li>Flush cutters, tweezers, a wire stripper, eye protection and a small fan or fume extractor</li>
        </ul>
        <p class="small-note">Skip giant random component kits until you know what you use. An oscilloscope and hot-air station can wait until a project needs them.</p>
      </div>
      <div class="white-card safety-card">
        <div class="eyebrow">Safety, in four lines</div>
        <h3>Low voltage only</h3>
        <ul class="kit-list">
          <li>Everything in this course runs on batteries. Keep your experiments there too: mains electricity can kill.</li>
          <li>Never short-circuit a battery, especially lithium ones. They can burn or catch fire.</li>
          <li>Big capacitors can stay charged after the power is off. Discharge them through a resistor and check with a meter.</li>
          <li>Soldering irons are about 350 °C. Always use the stand, wear eye protection, and ventilate the fumes.</li>
        </ul>
      </div>
    </section>
    <p class="reset-row"><button type="button" class="linkish reset-progress">Reset my progress</button></p>`;

  const fig = new Figure(main.querySelector(".hero-demo"), DEMO);
  main.querySelector(".reset-progress").onclick = () => {
    if (confirm("Clear all your progress in this browser?")) {
      progress.reset();
      dispatchEvent(new HashChangeEvent("hashchange"));
    }
  };
  return () => fig.destroy();
}
