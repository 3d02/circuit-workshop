import { CHAPTERS, PARTS_OF_COURSE } from "./chapters/index.js";
import { renderChapter, chapterTasks } from "./lesson.js";
import { destroyFigures } from "./figure.js";
import { progress } from "./progress.js";
import { home } from "./pages/home.js";
import { atlas } from "./pages/atlas.js";
import { tools } from "./pages/tools.js";

const main = document.getElementById("main");
let cleanup = null;

// Links from the previous version of the site keep working.
const LEGACY = {
  explore: "#/parts",
  lab: "#/learn/resistance",
  "lab/led": "#/learn/leds",
  "lab/ohm": "#/learn/resistance",
  "lab/divider": "#/learn/dividers",
  "lab/rc": "#/learn/capacitors",
  "lab/diode": "#/learn/leds",
  "lab/bjt": "#/learn/transistors",
  "lab/mosfet": "#/learn/transistors",
  "lab/rl": "#/learn/transistors",
  "lab/pwm": "#/learn/transistors",
  solder: "#/learn/soldering",
  meter: "#/learn/multimeter",
  path: "#/",
};

function route() {
  const hash = location.hash.replace(/^#/, "");
  if (LEGACY[hash] || LEGACY[hash.split("/")[0]]) {
    location.replace(LEGACY[hash] || LEGACY[hash.split("/")[0]]);
    return;
  }
  if (hash.startsWith("explore/")) {
    location.replace(`#/parts/${hash.split("/")[1]}`);
    return;
  }
  cleanup?.();
  cleanup = null;
  destroyFigures();
  const [, section, id] = hash.split("/");
  let nav = "home";
  let title = "Circuit Workshop — learn electronics by watching it work";
  if (section === "learn") {
    const i = CHAPTERS.findIndex((c) => c.id === id);
    if (i < 0) return location.replace("#/");
    const chapter = CHAPTERS[i];
    cleanup = renderChapter(chapter, main, { prev: CHAPTERS[i - 1], next: CHAPTERS[i + 1], chapters: CHAPTERS });
    nav = id === "soldering" || id === "repair" ? id : "home";
    title = `${chapter.title} — Circuit Workshop`;
  } else if (section === "parts") {
    cleanup = atlas(main, id);
    nav = "parts";
    title = "Parts — Circuit Workshop";
  } else if (section === "tools") {
    cleanup = tools(main);
    nav = "tools";
    title = "Tools — Circuit Workshop";
  } else {
    cleanup = home(main);
  }
  document.title = title;
  document.querySelectorAll("[data-nav]").forEach((a) => {
    const on = a.dataset.nav === nav;
    a.classList.toggle("active", on);
    if (on) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  scrollTo(0, 0);
  main.focus({ preventScroll: true });
}

function updateProgressPill() {
  const all = CHAPTERS.flatMap(chapterTasks);
  const pct = all.length ? Math.round((progress.count(all) / all.length) * 100) : 0;
  document.querySelector(".progress-text").textContent = `${pct}%`;
  document.querySelector(".progress-pill .fill").style.strokeDashoffset = String(94.25 * (1 - pct / 100));
  document.querySelector(".progress-pill").setAttribute("aria-label", `Course progress: ${pct}% of activities done`);
}

addEventListener("hashchange", route);
progress.on(updateProgressPill);
route();
updateProgressPill();

export { CHAPTERS, PARTS_OF_COURSE };
