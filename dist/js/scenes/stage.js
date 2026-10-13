// The shared stage for 3D scenes: a WebGL view with drag-to-turn, keyboard turning,
// HTML labels pinned to 3D points, a side panel for controls, and a render loop
// that pauses when the scene is off screen. Every scene module builds on this.

import * as THREE from "../vendor/three.module.min.js";
import { progress } from "../progress.js";

export { THREE };

export const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

function webglOK() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function goalsBox(goals) {
  return `<div class="fig-goals"><div class="goals-head">Try this</div><ul>${goals
    .map((g) => `<li data-goal="${g.id}" class="${progress.done(g.id) ? "done" : ""}"><span class="tick"></span><span>${g.text}</span></li>`)
    .join("")}</ul></div>`;
}

// options: title, pill, key (html), side (html), aria (description of the view),
// camera: { fov, distance, yaw, pitch, target }, views: [{ label, yaw, pitch, distance }]
export function createStage(el, opts) {
  el.innerHTML = `
    <div class="scene">
      <div class="scene-stage">
        <div class="fig-bar"><span class="fig-title">${opts.title}</span>${opts.pill ? `<span class="pill">${opts.pill}</span>` : ""}</div>
        <div class="scene-view">
          <div class="scene-labels" aria-hidden="true"></div>
          <div class="scene-tools">
            ${(opts.views || []).map((v, i) => `<button type="button" data-view="${i}">${v.label}</button>`).join("")}
            <button type="button" class="scene-play" aria-pressed="false">Pause</button>
          </div>
          <span class="scene-hint">Drag to turn · arrow keys too</span>
        </div>
        ${opts.key ? `<div class="scene-key">${opts.key}</div>` : ""}
        <div class="fig-status scene-status" role="status" aria-live="polite"></div>
      </div>
      <div class="scene-side">${opts.side || ""}</div>
    </div>`;
  const $ = (s) => el.querySelector(s);
  const view = $(".scene-view");
  const status = $(".scene-status");
  const labelLayer = $(".scene-labels");

  if (!webglOK()) {
    view.innerHTML = `<p class="scene-loading">This 3D view needs WebGL, which isn't available in this browser. ${opts.fallback || ""}</p>`;
    return { failed: true, el, $, status, done: completer(el), destroy() {} };
  }

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", opts.aria || opts.title);
  view.prepend(canvas);

  const scene = new THREE.Scene();
  const cam = { fov: 40, distance: 13, yaw: -0.5, pitch: 0.32, target: new THREE.Vector3(), ...opts.camera };
  const home = { yaw: cam.yaw, pitch: cam.pitch, distance: cam.distance };
  // With `fit` (a radius in scene units), the distance adapts to the view's shape so the
  // whole scene stays in frame; `zoom` on a view is then relative to that.
  let zoom = 1;
  const camera = new THREE.PerspectiveCamera(cam.fov, 1, 0.05, 200);
  scene.add(new THREE.HemisphereLight(0xeaf5e6, 0x1a3029, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(4, 8, 6);
  scene.add(sun);
  const root = new THREE.Group();
  scene.add(root);

  // Orbit: the camera circles the target. Smoothly eased toward the wanted angles.
  const want = { yaw: cam.yaw, pitch: cam.pitch, distance: cam.distance };
  let turned = 0;
  const placeCamera = () => {
    const { yaw, pitch, distance, target } = cam;
    camera.position.set(target.x + distance * Math.sin(yaw) * Math.cos(pitch), target.y + distance * Math.sin(pitch), target.z + distance * Math.cos(yaw) * Math.cos(pitch));
    camera.lookAt(target);
  };
  const clampPitch = (p) => Math.max(-1.35, Math.min(1.35, p));
  let drag = null;
  canvas.addEventListener("pointerdown", (e) => {
    drag = { x: e.clientX, y: e.clientY, id: e.pointerId, touch: e.pointerType === "touch", axis: null };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    // On touch, vertical swipes scroll the page (touch-action: pan-y); only turn sideways.
    if (drag.touch) drag.axis ||= Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    want.yaw -= dx * 0.008;
    if (!drag.touch) want.pitch = clampPitch(want.pitch + dy * 0.006);
    turned += Math.abs(dx * 0.008);
    drag.x = e.clientX;
    drag.y = e.clientY;
  });
  const endDrag = () => (drag = null);
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("keydown", (e) => {
    const step = 0.18;
    if (e.key === "ArrowLeft") want.yaw += step;
    else if (e.key === "ArrowRight") want.yaw -= step;
    else if (e.key === "ArrowUp") want.pitch = clampPitch(want.pitch + step);
    else if (e.key === "ArrowDown") want.pitch = clampPitch(want.pitch - step);
    else if (e.key === "+" || e.key === "=") want.distance = home.distance * (zoom = Math.max(0.35, zoom * 0.9));
    else if (e.key === "-") want.distance = home.distance * (zoom = Math.min(1.6, zoom * 1.1));
    else return;
    turned += e.key.startsWith("Arrow") && (e.key === "ArrowLeft" || e.key === "ArrowRight") ? step : 0;
    e.preventDefault();
  });
  el.querySelectorAll("[data-view]").forEach((b) => {
    b.onclick = () => {
      const v = opts.views[+b.dataset.view];
      zoom = v.zoom ?? 1;
      Object.assign(want, { yaw: v.yaw ?? home.yaw, pitch: v.pitch ?? home.pitch, distance: home.distance * zoom });
      if (v.target) stage.target = v.target;
      else stage.target = cam.homeTarget;
    };
  });
  cam.homeTarget = cam.target.clone();

  // Labels pinned to 3D points.
  const labels = [];
  const v3 = new THREE.Vector3();
  function label(text, at, cls = "") {
    const node = document.createElement("span");
    node.className = `scene-label ${cls}`;
    node.innerHTML = text;
    labelLayer.append(node);
    const l = {
      node,
      at: at.clone ? at.clone() : new THREE.Vector3(...at),
      visible: true,
      set(html) {
        node.innerHTML = html;
      },
      show(on) {
        l.visible = on;
        node.style.opacity = on ? "" : "0";
      },
    };
    labels.push(l);
    return l;
  }

  // Size to the container.
  let w = 0;
  let h = 0;
  const resize = () => {
    w = view.clientWidth || 600;
    h = view.clientHeight || 400;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (cam.fit) {
      const v = (cam.fov * Math.PI) / 180;
      const hf = 2 * Math.atan(Math.tan(v / 2) * camera.aspect);
      home.distance = cam.fit / Math.sin(Math.min(v, hf) / 2);
      want.distance = home.distance * zoom;
      if (!sized) cam.distance = want.distance;
      sized = true;
    }
  };
  let sized = false;
  const ro = new ResizeObserver(resize);
  ro.observe(view);
  resize();

  // Render loop: runs while visible. Reduced motion starts paused.
  const frameFns = [];
  let paused = reducedMotion();
  const playBtn = $(".scene-play");
  const syncPlay = () => {
    playBtn.textContent = paused ? "Play" : "Pause";
    playBtn.setAttribute("aria-pressed", String(paused));
  };
  playBtn.onclick = () => {
    paused = !paused;
    syncPlay();
  };
  syncPlay();
  let visible = true;
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: "80px" });
  io.observe(view);
  let raf = 0;
  let last = performance.now();
  const target = cam.target.clone();
  const tick = (now) => {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!visible) return;
    const k = 1 - Math.exp(-dt * 10);
    cam.yaw += (want.yaw - cam.yaw) * k;
    cam.pitch += (want.pitch - cam.pitch) * k;
    cam.distance += (want.distance - cam.distance) * k;
    cam.target.lerp(stage.target, k);
    placeCamera();
    for (const fn of frameFns) fn(paused ? 0 : dt, dt);
    renderer.render(scene, camera);
    for (const l of labels) {
      v3.copy(l.at).applyMatrix4(root.matrixWorld).project(camera);
      const behind = v3.z > 1;
      l.node.style.transform = `translate(${((v3.x + 1) / 2) * w}px, ${((1 - v3.y) / 2) * h}px) translate(-50%, -50%)`;
      l.node.style.visibility = behind || !l.visible ? "hidden" : "visible";
    }
  };
  raf = requestAnimationFrame(tick);

  const stage = {
    THREE,
    el,
    $,
    scene,
    root,
    camera,
    renderer,
    status,
    target,
    label,
    done: completer(el),
    onFrame: (fn) => frameFns.push(fn),
    get turned() {
      return turned;
    },
    get paused() {
      return paused;
    },
    say(html, level = "") {
      if (status.innerHTML === html && status.dataset.level === level) return;
      status.innerHTML = html;
      status.dataset.level = level;
      status.className = `fig-status scene-status ${level}`;
    },
    destroy() {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      scene.traverse((o) => {
        o.geometry?.dispose();
        const m = o.material;
        (Array.isArray(m) ? m : m ? [m] : []).forEach((x) => {
          x.map?.dispose();
          x.dispose();
        });
      });
      renderer.dispose();
      renderer.forceContextLoss?.();
    },
  };
  return stage;
}

function completer(el) {
  return (id) => {
    const li = el.querySelector(`[data-goal="${id}"]`);
    if (li && !li.classList.contains("done")) li.classList.add("done", "just-done");
    if (progress.mark(id)) el.dispatchEvent(new CustomEvent("task", { bubbles: true }));
  };
}

// A round sprite texture with a + or − sign, drawn once and shared.
const signCache = new Map();
export function signTexture(sign, color) {
  const key = sign + color;
  if (signCache.has(key)) return signCache.get(key);
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  g.fillStyle = color;
  g.beginPath();
  g.arc(32, 32, 27, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#10241e";
  g.fillRect(17, 28, 30, 8);
  if (sign === "+") g.fillRect(28, 17, 8, 30);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  signCache.set(key, tex);
  return tex;
}

// A hollow ring, for holes in a semiconductor: drawn as camera-facing points.
const ringCache = new Map();
export function ringTexture(color) {
  if (ringCache.has(color)) return ringCache.get(color);
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  g.strokeStyle = color;
  g.lineWidth = 9;
  g.beginPath();
  g.arc(32, 32, 22, 0, Math.PI * 2);
  g.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  ringCache.set(color, tex);
  return tex;
}

// A set of camera-facing points whose positions are updated each frame.
export function pointCloud(n, map, size) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map, size, sizeAttenuation: true, transparent: true, depthWrite: false, alphaTest: 0.2 }));
  pts.set = (i, x, y, z) => geo.attributes.position.setXYZ(i, x, y, z);
  pts.done = () => (geo.attributes.position.needsUpdate = true);
  return pts;
}
