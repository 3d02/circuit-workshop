// The repair bench: circuits with one hidden fault each. Measure, reason,
// then replace the part you think is guilty.

import { Figure } from "./figure.js";
import { progress } from "./progress.js";

const POWER = { id: "S0", type: "switch", closed: true, name: "Power switch", label: "power", labelSide: "above" };
const METER = { modes: ["V", "R", "C", "D"] };

const torch = (fault) => ({
  title: "A torch",
  iScale: 0.4,
  parts: [
    { id: "B1", type: "battery", a: [1, 2], b: [1, 4], v: 6, r: 0.3, name: "Battery", label: "6 V battery", labelSide: "left" },
    { ...POWER, a: [3, 0], b: [5, 0] },
    { id: "W1", type: "link", a: [5, 0], b: [9, 0], name: "Top wire" },
    { id: "L1", type: "lamp", a: [9, 1.5], b: [9, 3.5], r: 12, rated: 3, name: "Bulb" },
    { id: "W2", type: "link", a: [9, 5], b: [1, 5], name: "Bottom wire" },
  ],
  wires: ["1,2 1,0 3,0", "9,0 9,1.5", "9,3.5 9,5", "1,5 1,4"],
  names: { "battery +": [1, 2], "battery −": [1, 4], "switch, battery side": [3, 0], "switch, lamp side": [5, 0], "lamp top": [9, 1.5], "lamp bottom": [9, 3.5], "bottom wire, lamp end": [9, 5], "bottom wire, battery end": [1, 5] },
  meter: METER,
  faults: fault,
});

const ledCircuit = (fault, extra = {}) => ({
  title: "An indicator light",
  iScale: 0.015,
  parts: [
    { id: "B1", type: "battery", a: [1, 2], b: [1, 4], v: 9, r: 0.5, name: "Battery", labelSide: "left" },
    { ...POWER, a: [3, 0], b: [5, 0] },
    { id: "R1", type: "resistor", a: [6, 0], b: [8, 0], r: 680, label: "680 Ω", name: "Resistor R1" },
    { id: "D1", type: "led", a: [10, 1.5], b: [10, 3.5], color: "red", name: "LED" },
  ],
  wires: ["1,2 1,0 3,0", "5,0 6,0", "8,0 10,0 10,1.5", "10,3.5 10,5 1,5 1,4"],
  names: { "battery +": [1, 2], "battery −": [1, 4], "switch, battery side": [3, 0], "resistor, left end": [6, 0], "resistor, right end": [8, 0], "LED top": [10, 1.5], "LED bottom": [10, 3.5] },
  meter: METER,
  faults: fault,
  ...extra,
});

export const JOBS = [
  {
    id: "repair-battery",
    title: "The torch that won't light",
    complaint: "“I switched it on and nothing happens. I'm sure the bulb is fine.”",
    spec: torch({ parts: { B1: { v: 0.9 } } }),
    culprit: "B1",
    works: (q) => q.power("L1") > 2,
    hints: [
      "Always start with the supply. Is the battery actually providing its voltage? Put the meter on V and measure across the battery's two terminals, with the power switched on.",
      "A healthy 6 V battery reads close to 6 V. This one reads well under 1 V. That's your answer: replace the battery.",
    ],
    lesson: "Always check the supply first. It's the most common fault of all, and the quickest to rule out. (A tired battery can even read fine with nothing connected and then collapse under load, so measure it while the circuit is switched on.)",
  },
  {
    id: "repair-wire",
    title: "Same torch, new battery, still dark",
    complaint: "“I put a brand new battery in. Still nothing!”",
    spec: torch({ parts: { W2: { broken: true } } }),
    culprit: "W2",
    works: (q) => q.power("L1") > 2,
    hints: [
      "Check the supply first: the battery reads 6 V, so it's fine. Now work your way round the loop measuring across each piece: the switch, each wire, the bulb.",
      "Everything that should conduct (switch, wires) should have almost 0 V across it. The part with the full 6 V across it is where the loop is broken.",
      "Measure from one end of the bottom wire to the other.",
    ],
    lesson: "In a broken loop, the full supply voltage appears across the break, and 0 V across everything else. Walk round the loop with the meter and the break announces itself. (Continuity mode with the power off would also find it: no beep from end to end.)",
  },
  {
    id: "repair-led",
    title: "A brand-new build that won't light",
    complaint: "“I built this from a kit. Battery's new, everything's soldered. The LED never comes on.”",
    spec: ledCircuit({ parts: { D1: { swap: true } } }),
    culprit: "D1",
    works: (q) => q.i("D1") > 0.005,
    hints: [
      "Battery first: it's fine. Now measure across the resistor, then across the LED.",
      "There's 0 V across the resistor, so no current is flowing. And the LED has the whole 9 V across it: it isn't conducting at all.",
      "An LED with the full supply across it and no current is either dead or fitted backwards. With the power off, try diode mode across it, both ways round.",
    ],
    lesson: "A new build that's dead is often a part fitted the wrong way round. LEDs, diodes, electrolytic capacitors and chips all have a correct orientation. Diode mode would have shown it: it reads a forward voltage one way and nothing the other way, so you can tell which leg is which.",
  },
  {
    id: "repair-resistor",
    title: "The LED that's barely on",
    complaint: "“It lights, but you can only just see it in the dark.”",
    spec: ledCircuit({ parts: { R1: { r: 68000 } } }),
    culprit: "R1",
    works: (q) => q.i("D1") > 0.005,
    hints: [
      "Some current is flowing, just not much. What sets the current in an LED circuit?",
      "Switch the power off and measure the resistor's resistance with the meter in Ω mode. Compare it with what's printed on the circuit diagram.",
      "The diagram says 680 Ω. The meter says 68 kΩ: a hundred times too big. Someone read a colour band wrong (blue-grey-<i>brown</i> versus blue-grey-<i>orange</i>).",
    ],
    lesson: "Dim, slow or weak usually means a wrong value rather than a broken part. Compare what you measure with what the circuit diagram says it should be. A swapped colour band is an easy mistake to make when building.",
  },
  {
    id: "repair-short",
    title: "The fuse that keeps blowing",
    complaint: "“The fuse blew, so I put a new one in. It blew again instantly.”",
    spec: {
      title: "An indicator with a fuse and a smoothing capacitor",
      iScale: 0.015,
      parts: [
        { id: "B1", type: "battery", a: [1, 2], b: [1, 4], v: 9, r: 0.3, name: "Battery", labelSide: "left" },
        { ...POWER, a: [2, 0], b: [4, 0] },
        { id: "F1", type: "fuse", a: [5, 0], b: [7, 0], rating: 0.5, name: "Fuse" },
        { id: "C1", type: "cap", a: [8, 1.5], b: [8, 3.5], c: 100e-6, name: "Capacitor C1", labelSide: "left" },
        { id: "R1", type: "resistor", a: [10, 0], b: [12, 0], r: 680, label: "680 Ω", name: "Resistor R1" },
        { id: "D1", type: "led", a: [13, 1.5], b: [13, 3.5], color: "red", name: "LED" },
      ],
      wires: ["1,2 1,0 2,0", "4,0 5,0", "7,0 8,0 10,0", "8,0 8,1.5", "12,0 13,0 13,1.5", "13,3.5 13,5 8,5 1,5 1,4", "8,3.5 8,5"],
      names: { "battery +": [1, 2], "battery −": [1, 4], "fuse, left end": [5, 0], "fuse, right end": [7, 0], "capacitor top": [8, 1.5], "capacitor bottom": [8, 3.5], "resistor, right end": [12, 0], "LED top": [13, 1.5], "LED bottom": [13, 3.5] },
      meter: METER,
      faults: { parts: { C1: { short: true } } },
    },
    culprit: "C1",
    works: (q) => q.i("D1") > 0.005 && !q.part("F1").burnt,
    hints: [
      "A fuse that blows straight away means a short circuit: something is connecting the supply rails together. Replacing the fuse won't fix it. Switch the power off and hunt for the short.",
      "Use continuity or Ω mode (power off) across each part that sits between the top rail and the bottom rail.",
      "The capacitor beeps: it's measuring almost 0 Ω. A capacitor should block DC completely. This one has failed short. Replace it, then replace the fuse.",
    ],
    lesson: "A blown fuse is a symptom. Find the short with the power off, using continuity or resistance mode, before fitting a new fuse. Capacitors across the supply are a classic cause: when they fail, they often fail short.",
  },
  {
    id: "repair-transistor",
    title: "The switch that switches nothing",
    complaint: "“The power light circuit works, but flipping the control switch does nothing.”",
    spec: {
      title: "A transistor-switched LED",
      iScale: 0.015,
      parts: [
        { id: "B1", type: "battery", a: [1, 3], b: [1, 5], v: 9, r: 0.5, name: "Battery", labelSide: "left" },
        { id: "S1", type: "switch", a: [3, 1], b: [3, 3], closed: true, name: "Control switch", label: "control", labelSide: "left" },
        { id: "RB", type: "resistor", a: [4, 5], b: [6, 5], r: 10000, label: "10 kΩ", labelSide: "below", name: "Base resistor" },
        { id: "R2", type: "resistor", a: [8, 0], b: [8, 2], r: 470, label: "470 Ω", name: "LED resistor" },
        { id: "D1", type: "led", a: [8, 2], b: [8, 4], color: "red", label: false, name: "LED" },
        { id: "Q1", type: "npn", at: [7, 5], name: "Transistor" },
      ],
      wires: ["1,3 1,0 3,0 8,0", "3,0 3,1", "3,3 3,5 4,5", "6,5 7,5", "8,6 8,7 1,7 1,5"],
      names: { "battery +": [1, 3], "battery −": [1, 5], "switch output": [3, 3], "base resistor, switch end": [4, 5], "base (B)": [7, 5], "collector (C)": [8, 4], "emitter (E)": [8, 6] },
      meter: METER,
      faults: { parts: { RB: { r: Infinity } } },
    },
    culprit: "RB",
    works: (q) => q.i("D1") > 0.005,
    hints: [
      "The transistor needs base current to turn on. Is any reaching it? Measure the voltage at the base (black probe on the bottom rail).",
      "The base sits at 0 V: a working transistor's base would be at about 0.7 V. Follow the path back toward the switch. Measure across the base resistor.",
      "The full 9 V across the base resistor means no current through it: it's open circuit. Replace it.",
    ],
    lesson: "Trace the control path, not just the power path. A transistor that won't turn on is usually missing its base drive. Here, the base resistor had cracked open. Measuring the voltage at each point along the path found it in three readings.",
  },
];

export function repairBench(el) {
  let index = Math.max(0, JOBS.findIndex((j) => !progress.done(j.id)));
  if (index < 0) index = 0;
  let fig = null;

  const render = () => {
    fig?.destroy();
    const job = JOBS[index];
    let measurements = 0;
    let wrong = 0;
    let hintsShown = 0;
    let fixed = false;
    let usedXray = false;
    el.innerHTML = `
      <div class="bench">
        <div class="bench-head">
          <div class="bench-jobs">${JOBS.map((j, i) => `<button type="button" data-job="${i}" class="${i === index ? "current" : ""} ${progress.done(j.id) ? "done" : ""}" aria-label="Job ${i + 1}: ${j.title}">${progress.done(j.id) ? "✓" : i + 1}</button>`).join("")}</div>
          <div class="eyebrow">Repair job ${index + 1} of ${JOBS.length}</div>
          <h3>${job.title}</h3>
          <p class="complaint">${job.complaint}</p>
        </div>
        <div class="bench-fig"></div>
        <div class="bench-tools">
          <div class="bench-stats"><span><b class="m-count">0</b> measurements</span><span><b class="w-count">0</b> wrong replacements</span></div>
          <div class="bench-actions">
            <button type="button" class="btn small pick-btn">🔧 Replace a part…</button>
            <button type="button" class="btn small outline hint-btn">💡 Hint</button>
          </div>
          <div class="pick-panel" hidden><p>Click the faulty part on the circuit, or choose it here:</p><select class="pick-select"><option value="">Choose a part…</option>${job.spec.parts
            .filter((p) => p.id && p.type !== "text" && p.type !== "label" && p.type !== "ground")
            .map((p) => `<option value="${p.id}">${p.name || p.id}</option>`)
            .join("")}</select> <button type="button" class="linkish cancel-pick">cancel</button></div>
          <div class="hints"></div>
          <div class="bench-result" hidden></div>
        </div>
      </div>`;
    const $ = (s) => el.querySelector(s);
    const hasPower = job.spec.parts.some((p) => p.id === "S0");
    fig = new Figure($(".bench-fig"), {
      ...job.spec,
      xray: false,
      controls: [
        { type: "toggle", label: hasPower ? "Power switch on" : "Control switch on", part: hasPower ? "S0" : "S1", prop: "closed" },
        {
          type: "toggle",
          label: "X-ray view (shows voltage and current; counts as a hint)",
          get: (f) => f.xray,
          set: (f, on) => {
            f.xray = on;
            if (on && !usedXray) {
              usedXray = true;
              hintsShown++;
            }
          },
        },
      ],
    });
    fig.on((type, probe) => {
      if (type === "probe" && fig.meter.probes.red.at && fig.meter.probes.black.at) $(".m-count").textContent = ++measurements;
    });

    const stopPicking = () => {
      fig.picking = null;
      fig.host.classList.remove("picking");
      $(".pick-panel").hidden = true;
      $(".pick-btn").classList.remove("on");
    };
    const replace = (id) => {
      stopPicking();
      const part = fig.part(id);
      const name = part.name || id;
      if (id === job.culprit && !fixed) {
        fixed = true;
        delete fig.net.faults.parts[id];
        part.burnt = false;
        part.damage = 0;
        fig.drawPart(part);
        fig.net.build();
        fig.say(`You replaced the ${name.toLowerCase()}.`, "good");
        setTimeout(checkFixed, 600);
      } else {
        $(".w-count").textContent = ++wrong;
        part.burnt = false;
        part.damage = 0;
        fig.drawPart(part);
        fig.net.build();
        fig.highlight(id);
        setTimeout(() => fig.highlight(id, false), 2000);
        fig.say(`You replaced the ${name.toLowerCase()} with a new one, but that wasn't the problem: nothing has changed. Every unnecessary replacement costs time and money, so measure first.`, "warn", 8);
      }
    };
    const checkFixed = () => {
      const q = fig.query();
      if (job.works(q)) return success();
      fig.say(`Replaced. ${job.id === "repair-short" ? "Now replace the blown fuse too (the button in this message bar, once it appears) and switch on." : "Switch the power on and check it works."}`, "good", 10);
      const wait = setInterval(() => {
        if (!fig.net.sim) return clearInterval(wait);
        if (job.works(fig.query())) {
          clearInterval(wait);
          success();
        }
      }, 300);
    };
    const success = () => {
      progress.mark(job.id);
      el.dispatchEvent(new CustomEvent("task", { bubbles: true }));
      const r = $(".bench-result");
      r.hidden = false;
      const rating =
        measurements === 0
          ? "Fixed, but without a single measurement: a lucky guess. On a real job, the meter is how you'd know before you start desoldering. Try the next one with measurements first."
          : wrong === 0 && hintsShown === 0
            ? "Clean diagnosis: no hints, no wasted parts."
            : wrong === 0
              ? "No wasted parts."
              : `${wrong} unnecessary replacement${wrong > 1 ? "s" : ""}: measure before you swap.`;
      r.innerHTML = `<div class="eyebrow">Fixed, in ${measurements} measurement${measurements === 1 ? "" : "s"}</div><p><b>${rating}</b></p><p>${job.lesson}</p>${index < JOBS.length - 1 ? `<button type="button" class="btn small next-job">Next job →</button>` : `<p><b>That's every job on the bench.</b> You've got the method: supply first, then follow the path with the meter, and replace only what the evidence points to.</p>`}`;
      r.querySelector(".next-job")?.addEventListener("click", () => {
        index++;
        render();
      });
      $(".bench-jobs").querySelectorAll("button")[index].classList.add("done");
    };

    $(".pick-btn").onclick = () => {
      if (fig.picking) return stopPicking();
      fig.picking = (part) => replace(part.id);
      fig.host.classList.add("picking");
      $(".pick-panel").hidden = false;
      $(".pick-btn").classList.add("on");
    };
    $(".cancel-pick").onclick = stopPicking;
    $(".pick-select").onchange = (e) => e.target.value && replace(e.target.value);
    $(".hint-btn").onclick = () => {
      if (hintsShown >= job.hints.length) return;
      $(".hints").insertAdjacentHTML("beforeend", `<p class="hint"><b>Hint ${hintsShown + 1}.</b> ${job.hints[hintsShown]}</p>`);
      hintsShown++;
      if (hintsShown >= job.hints.length) $(".hint-btn").disabled = true;
    };
    el.querySelectorAll("[data-job]").forEach((b) => {
      b.onclick = () => {
        index = +b.dataset.job;
        render();
      };
    });
  };
  render();
  return () => fig?.destroy();
}
