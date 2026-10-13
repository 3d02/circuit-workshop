// The magnetic field of a current, in 3D: a straight wire, or a coil.
//
// The field is calculated, not drawn by hand: the Biot–Savart law summed over short
// pieces of the wire. Field lines are traced through that field, and compass needles
// point along it. Switching the current off shows why a coil kicks back: its field
// can't vanish instantly, and the collapsing field drives a voltage V = L × ΔI ÷ Δt.

import { createStage, goalsBox, THREE } from "./stage.js";
import { si } from "../format.js";

const TURNS = 10;
const RADIUS = 1;
const HALF = 1.5; // half the coil's length
const L_COIL = 0.05; // H: a small relay coil
const SWITCH_TIME = 10e-6; // s: how fast a transistor switch opens
const MU0 = 4e-7 * Math.PI;

// The coil as a chain of short straight pieces, and Biot–Savart over them.
function helix(segsPerTurn = 36) {
  const pts = [];
  const n = TURNS * segsPerTurn;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = 2 * Math.PI * TURNS * t;
    pts.push(new THREE.Vector3(-HALF + 2 * HALF * t, RADIUS * Math.cos(a), RADIUS * Math.sin(a)));
  }
  return pts;
}
const COIL = helix();
const dl = new THREE.Vector3();
const rv = new THREE.Vector3();
const cr = new THREE.Vector3();
function fieldCoil(p, out) {
  out.set(0, 0, 0);
  for (let i = 0; i < COIL.length - 1; i++) {
    const a = COIL[i];
    const b = COIL[i + 1];
    dl.subVectors(b, a);
    rv.set(p.x - (a.x + b.x) / 2, p.y - (a.y + b.y) / 2, p.z - (a.z + b.z) / 2);
    const r2 = rv.lengthSq() + 0.004;
    cr.crossVectors(dl, rv).multiplyScalar(1 / (r2 * Math.sqrt(r2)));
    out.add(cr);
  }
  return out;
}
// A long straight wire along y: the field circles it, strength ∝ 1 / distance.
function fieldWire(p, out) {
  // Current along +y: B points along ŷ × r̂ (the right-hand grip rule).
  const r2 = p.x * p.x + p.z * p.z + 0.004;
  return out.set(p.z / r2, 0, -p.x / r2).multiplyScalar(2);
}

export default function coil3d(el) {
  const goals = [
    { id: "coil-wire", text: "Look at a straight wire's field. Which way do the needles point when you reverse the current?" },
    { id: "coil-coil", text: "Wind it into a coil. Where is the field strongest?" },
    { id: "coil-kick", text: "Switch the coil off without a diode, then with one. Compare the voltages." },
  ];
  const stage = createStage(el, {
    title: "The magnetic field of a current",
    pill: "calculated with the Biot–Savart law",
    aria: "A wire or a coil in 3D with field lines and compass needles around it showing the magnetic field. The readouts beside it give the field strength and, when switched off, the voltage the coil makes.",
    camera: { fit: 4.3, yaw: -0.55, pitch: 0.38, fov: 38 },
    views: [{ label: "Along the axis", yaw: Math.PI / 2 - 0.02, pitch: 0.02 }],
    key: `<span><i style="background:#c98a4a"></i>copper wire</span><span><i style="background:#cfe0ff;width:7px;height:7px"></i>current (conventional)</span><span><i style="background:#86d1c4;border-radius:2px"></i>magnetic field line</span><span><i style="background:#e0785c;border-radius:2px"></i>compass needle (north end)</span>`,
    side: `
      <div class="seg" role="group" aria-label="Shape"><button type="button" class="btn small k-wire">Straight wire</button><button type="button" class="btn small outline k-coil">Coil</button></div>
      <label class="ctl"><span class="ctl-top"><span>Current</span><output class="o-i"></output></span><input type="range" class="k-i" min="0" max="2" step="0.05" value="1"></label>
      <button type="button" class="btn small outline k-rev">⇄ Reverse the current</button>
      <div class="k-coilonly">
        <label class="ctl-toggle"><input type="checkbox" class="k-diode"><span>Flyback diode across the coil</span></label>
        <button type="button" class="btn big k-off">Switch the current off</button>
      </div>
      <div class="micro-readouts">
        <div class="readout"><span class="r-blabel">Field 1 cm from the wire</span><strong class="r-b">–</strong></div>
        <div class="readout k-coilonly"><span>Energy stored in the field, ½ L I²</span><strong class="r-e">–</strong></div>
        <div class="readout k-coilonly"><span>Voltage spike as it switches off (50 mH coil, switch opening in 10 µs)</span><strong class="r-kick">–</strong></div>
      </div>
      ${goalsBox(goals)}`,
  });
  if (stage.failed) return () => {};
  const { root, $ } = stage;
  const state = { mode: "wire", amps: 1, sign: 1, diode: false, offAt: null, kick: 0 };
  const fieldAt = (p, out) => (state.mode === "coil" ? fieldCoil(p, out) : fieldWire(p, out));

  // ---------- the conductor ----------
  const copper = new THREE.MeshStandardMaterial({ color: "#c98a4a", metalness: 0.4, roughness: 0.4 });
  const wireMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 7, 16), copper);
  const coilCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(-HALF - 1.4, -2.4, RADIUS), new THREE.Vector3(-HALF - 0.4, -0.2, RADIUS), ...COIL, new THREE.Vector3(HALF + 0.4, -0.2, 0), new THREE.Vector3(HALF + 1.4, -2.4, 0)]);
  coilCurve.arcLengthDivisions = 3000;
  const coilMesh = new THREE.Mesh(new THREE.TubeGeometry(coilCurve, 900, 0.055, 8, false), copper);
  root.add(wireMesh, coilMesh);
  const wireCurve = new THREE.LineCurve3(new THREE.Vector3(0, -3.5, 0), new THREE.Vector3(0, 3.5, 0));

  // Current dots along the conductor.
  const N_D = 70;
  const dots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: "#cfe0ff" }), N_D);
  root.add(dots);
  const dotT = Array.from({ length: N_D }, (_, i) => i / N_D);

  // ---------- field lines ----------
  const lineMat = new THREE.LineBasicMaterial({ color: "#86d1c4", transparent: true, opacity: 0.7 });
  const lines = new THREE.Group();
  root.add(lines);
  const chevGeo = new THREE.ConeGeometry(0.06, 0.18, 8);
  chevGeo.rotateZ(-Math.PI / 2);
  const chevs = new THREE.InstancedMesh(chevGeo, new THREE.MeshBasicMaterial({ color: "#86d1c4" }), 400);
  root.add(chevs);

  // ---------- compass needles ----------
  const needleGeo = new THREE.ConeGeometry(0.07, 0.4, 4);
  needleGeo.rotateZ(-Math.PI / 2);
  const needleTail = new THREE.ConeGeometry(0.07, 0.4, 4);
  needleTail.rotateZ(Math.PI / 2);
  const GRID = [];
  const needles = new THREE.InstancedMesh(needleGeo, new THREE.MeshStandardMaterial({ color: "#e0785c" }), 160);
  const tails = new THREE.InstancedMesh(needleTail, new THREE.MeshStandardMaterial({ color: "#d9dfd5" }), 160);
  root.add(needles, tails);

  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const X = new THREE.Vector3(1, 0, 0);
  const B = new THREE.Vector3();
  const P = new THREE.Vector3();
  const S = new THREE.Vector3();

  function trace(start, dir, maxSteps = 700) {
    const pts = [start.clone()];
    const p = start.clone();
    const k1 = new THREE.Vector3();
    const mid = new THREE.Vector3();
    for (let i = 0; i < maxSteps; i++) {
      fieldAt(p, k1);
      if (k1.lengthSq() < 1e-10) break;
      k1.normalize().multiplyScalar(0.05 * dir);
      mid.copy(p).addScaledVector(k1, 0.5);
      fieldAt(mid, k1);
      k1.normalize().multiplyScalar(0.05 * dir);
      p.add(k1);
      pts.push(p.clone());
      if (p.length() > 5.2) break;
      if (i > 40 && p.distanceTo(start) < 0.05) break;
    }
    return pts;
  }

  function rebuild() {
    lines.children.forEach((c) => c.geometry.dispose());
    lines.clear();
    const all = [];
    if (state.mode === "wire") {
      for (const y of [-1.6, 0, 1.6])
        for (const r of [0.45, 0.9, 1.5, 2.3]) {
          const pts = [];
          for (let i = 0; i <= 64; i++) {
            const a = (i / 64) * Math.PI * 2;
            pts.push(new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a)));
          }
          all.push(pts);
        }
    } else {
      // Field lines start in the coil's middle plane and are traced both ways; the
      // coil is symmetric about its axis, so each traced line is copied round it.
      for (const r of [0.2, 0.5, 0.8]) {
        const start = new THREE.Vector3(0, r, 0);
        const fwd = trace(start, 1);
        const back = trace(start, -1).reverse();
        const pts = [...back, ...fwd.slice(1)];
        for (const ang of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
          const rot = new THREE.Matrix4().makeRotationX(ang);
          all.push(pts.map((p) => p.clone().applyMatrix4(rot)));
        }
      }
    }
    let c = 0;
    for (const pts of all) {
      lines.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
      for (let i = 20; i < pts.length - 2 && c < 400; i += 45) chevs.userData[c++] = [pts[i].clone(), fieldAt(pts[i], new THREE.Vector3()).normalize()];
    }
    chevs.count = c;

    // Needles on a grid in the plane through the conductor.
    GRID.length = 0;
    if (state.mode === "wire") {
      for (let x = -3; x <= 3.01; x += 1) for (let z = -3; z <= 3.01; z += 1) if (Math.hypot(x, z) > 0.4 && Math.hypot(x, z) < 3.3) GRID.push(new THREE.Vector3(x, -2.6, z));
    } else {
      for (let x = -3.6; x <= 3.61; x += 1.2) for (let y = -3; y <= 3.01; y += 1) if (!(Math.abs(Math.abs(y) - RADIUS) < 0.35 && Math.abs(x) < HALF + 0.3)) GRID.push(new THREE.Vector3(x, y, -2));
    }
    needles.count = tails.count = GRID.length;
    wireMesh.visible = state.mode === "wire";
    coilMesh.visible = state.mode === "coil";
    el.querySelectorAll(".k-coilonly").forEach((n) => (n.hidden = state.mode !== "coil"));
    $(".k-wire").classList.toggle("outline", state.mode !== "wire");
    $(".k-coil").classList.toggle("outline", state.mode !== "coil");
    $(".r-blabel").textContent = state.mode === "wire" ? "Field 1 cm from the wire, B = μ₀ I ÷ 2πr" : "Field inside a 100-turn, 5 cm coil, B = μ₀ n I";
    if (state.mode === "coil") stage.done("coil-coil");
  }

  const amps = () => state.amps * state.sign;
  let currentNow = amps();
  const update = () => {
    $(".o-i").textContent = `${state.amps.toFixed(2)} A`;
    const I = Math.abs(currentNow);
    $(".r-b").textContent = si(state.mode === "wire" ? (MU0 * I) / (2 * Math.PI * 0.01) : MU0 * 2000 * I, "T");
    $(".r-e").textContent = si(0.5 * L_COIL * I * I, "J");
  };
  $(".k-wire").onclick = () => {
    state.mode = "wire";
    rebuild();
    update();
  };
  $(".k-coil").onclick = () => {
    state.mode = "coil";
    state.offAt = null;
    currentNow = amps();
    rebuild();
    update();
  };
  $(".k-i").oninput = (e) => {
    state.amps = +e.target.value;
    state.offAt = null;
    currentNow = amps();
    update();
  };
  $(".k-rev").onclick = () => {
    state.sign *= -1;
    state.offAt = null;
    currentNow = amps();
    if (state.mode === "wire") stage.done("coil-wire");
    update();
  };
  $(".k-diode").onchange = (e) => (state.diode = e.target.checked);
  const kicks = { bare: false, diode: false };
  $(".k-off").onclick = () => {
    if (state.offAt !== null) {
      state.offAt = null;
      currentNow = amps();
      $(".k-off").textContent = "Switch the current off";
      return;
    }
    state.offAt = 0;
    state.kickFrom = currentNow;
    const I = Math.abs(currentNow);
    // Without a diode the current is forced to stop in the switch's opening time;
    // with one it circulates and dies away with τ = L ÷ R, while the diode holds the voltage near 0.7 V.
    state.kick = state.diode ? 0.7 : (L_COIL * I) / SWITCH_TIME;
    $(".r-kick").textContent = I < 0.01 ? "0 V" : state.diode ? "about 0.7 V: the diode clamps it" : `tries for ${si(state.kick, "V", 2)}: something breaks down first`;
    kicks[state.diode ? "diode" : "bare"] = I > 0.1;
    if (kicks.bare && kicks.diode) stage.done("coil-kick");
    $(".k-off").textContent = "Switch it back on";
  };

  rebuild();
  update();

  stage.onFrame((dt, real) => {
    // After switching off: fast collapse without a diode (shown slowed), slow with one.
    if (state.offAt !== null) {
      state.offAt += real;
      const tau = state.diode ? 0.9 : 0.12;
      currentNow = state.kickFrom * Math.exp(-state.offAt / tau);
      if (Math.abs(currentNow) < 0.002) currentNow = 0;
      update();
    }
    const strength = Math.min(1, Math.abs(currentNow) / 2);
    const sgn = Math.sign(currentNow) || 1;
    lineMat.opacity = 0.15 + 0.6 * strength;
    lines.visible = strength > 0.01;
    for (let i = 0; i < chevs.count; i++) {
      const [p, d] = chevs.userData[i];
      q.setFromUnitVectors(X, S.copy(d).multiplyScalar(sgn));
      const k = strength > 0.01 ? 0.6 + 0.6 * strength : 0;
      chevs.setMatrixAt(i, m4.compose(p, q, S.set(k, k, k)));
    }
    chevs.instanceMatrix.needsUpdate = true;
    GRID.forEach((g, i) => {
      fieldAt(g, B).multiplyScalar(sgn);
      const mag = B.length();
      const k = strength > 0.01 ? Math.min(1, 0.45 + 0.25 * Math.log10(1 + mag * 20)) : 0.55;
      if (strength <= 0.01) B.set(0, 0, -1); // with no current, needles point to Earth's north
      q.setFromUnitVectors(X, B.normalize());
      m4.compose(P.copy(g).addScaledVector(B, 0.2 * k), q, S.set(k, k, k));
      needles.setMatrixAt(i, m4);
      m4.compose(P.copy(g).addScaledVector(B, -0.2 * k), q, S.set(k, k, k));
      tails.setMatrixAt(i, m4);
    });
    needles.instanceMatrix.needsUpdate = true;
    tails.instanceMatrix.needsUpdate = true;

    const curve = state.mode === "coil" ? coilCurve : wireCurve;
    const speed = currentNow * 0.12 * (state.mode === "coil" ? 0.5 : 1);
    for (let i = 0; i < N_D; i++) {
      dotT[i] = (((dotT[i] + speed * dt) % 1) + 1) % 1;
      dots.setMatrixAt(i, m4.compose(curve.getPointAt(dotT[i]), q.identity(), S.setScalar(Math.abs(currentNow) > 0.01 ? 1 : 0)));
    }
    dots.instanceMatrix.needsUpdate = true;

    stage.say(
      state.offAt !== null && Math.abs(currentNow) > 0.01
        ? state.diode
          ? "Switched off, with a flyback diode: the coil's current keeps circling through the diode and dies away gently. The voltage stays under a volt."
          : `Switched off, with nowhere for the current to go: the field collapses in microseconds, and the coil tries to drive ${si(state.kick, "V", 2)} across the switch until something breaks down. Shown slowed down enormously.`
        : state.mode === "wire"
          ? "The field circles the wire. Point your right thumb along the current and your fingers curl the way the field goes. It weakens with distance: twice as far, half as strong."
          : "Each turn adds its field to the others: strong and nearly uniform inside the coil, spreading out and looping round outside, like a bar magnet's.",
      state.offAt !== null && !state.diode && Math.abs(currentNow) > 0.01 ? "bad" : "",
    );
  });

  return () => stage.destroy();
}
