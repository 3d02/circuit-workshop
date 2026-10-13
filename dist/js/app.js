import { CHAPTERS, PARTS_OF_COURSE } from "./chapters/index.js";
import { renderChapter, chapterTasks } from "./lesson.js";
import { destroyFigures } from "./figure.js";
import { progress } from "./progress.js";
import { home } from "./pages/home.js";
import { atlas } from "./pages/atlas.js";
import { tools } from "./pages/tools.js";
import { bm235 } from "./pages/bm235.js";
import { bm235Guide } from "./pages/bm235-guide.js";
import { formulas } from "./pages/formulas.js";
import { initTerms, setTermChapters } from "./terms.js";

const main = document.getElementById("main");
let cleanup = null;

// Routes are plain words (#loop, #parts, #part-led, #tools, #bm235): a link to a published
// artifact only passes a bare #word through to the page.
// Links from earlier versions of the site keep working.
const LEGACY = {
  explore: "#parts",
  lab: "#resistance",
  "lab/led": "#leds",
  "lab/ohm": "#resistance",
  "lab/divider": "#dividers",
  "lab/rc": "#capacitors",
  "lab/diode": "#leds",
  "lab/bjt": "#transistors",
  "lab/mosfet": "#transistors",
  "lab/rl": "#transistors",
  "lab/pwm": "#transistors",
  solder: "#soldering",
  meter: "#multimeter",
  path: "#home",
};

function redirect(hash) {
  if (hash.startsWith("/")) {
    const [, section, id] = hash.split("/");
    if (section === "learn" && id) return `#${id}`;
    if (section === "parts") return id ? `#part-${id}` : "#parts";
    if (section === "tools") return "#tools";
    return "#home";
  }
  if (hash.startsWith("explore/")) return `#part-${hash.split("/")[1]}`;
  return LEGACY[hash] || LEGACY[hash.split("/")[0]];
}

function route() {
  const hash = location.hash.replace(/^#/, "");
  const moved = redirect(hash);
  if (moved) {
    location.replace(moved);
    return;
  }
  cleanup?.();
  cleanup = null;
  destroyFigures();
  let nav = "home";
  let title = "Circuit Workshop";
  const i = CHAPTERS.findIndex((c) => c.id === hash);
  if (i >= 0) {
    const chapter = CHAPTERS[i];
    cleanup = renderChapter(chapter, main, { prev: CHAPTERS[i - 1], next: CHAPTERS[i + 1], chapters: CHAPTERS });
    nav = "home";
    title = `${chapter.title} · Circuit Workshop`;
  } else if (hash === "parts" || hash.startsWith("part-")) {
    cleanup = atlas(main, hash.slice(5));
    nav = "parts";
    title = "Parts · Circuit Workshop";
  } else if (hash === "formulas") {
    cleanup = formulas(main);
    nav = "formulas";
    title = "Formulas · Circuit Workshop";
  } else if (hash === "tools") {
    cleanup = tools(main);
    nav = "tools";
    title = "Tools · Circuit Workshop";
  } else if (hash === "bm235") {
    cleanup = bm235(main);
    nav = "meter";
    title = "Brymen BM235 · Circuit Workshop";
  } else if (hash === "bm235-guide") {
    cleanup = bm235Guide(main);
    nav = "meter";
    title = "BM235 complete guide · Circuit Workshop";
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

// The skip link moves focus without touching the route.
document.querySelector(".skip").addEventListener("click", (ev) => {
  ev.preventDefault();
  main.focus();
});

setTermChapters(CHAPTERS);
initTerms();
addEventListener("hashchange", route);
progress.on(updateProgressPill);
route();
updateProgressPill();

export { CHAPTERS, PARTS_OF_COURSE };
