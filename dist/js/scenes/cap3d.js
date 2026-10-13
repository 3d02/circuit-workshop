// A parallel-plate capacitor charging and discharging through a resistor, in 3D.
//
// Real numbers: plates 10 cm square, a gap of 0.5–4 mm, air or a plastic sheet
// (relative permittivity 4) between them, charged from 9 V through 1 MΩ.
// C = ε₀ εr A ÷ d is a few hundred picofarads, so τ = R × C is well under a
// millisecond: the animation runs about 10,000 times slower than life.
// Electrons pile onto the plate joined to the battery's − terminal and leave the
// other; the field between the plates grows with the voltage; dots in the wires
// show the current, which flows only while the voltage is changing.

import { createStage, goalsBox, signTexture, THREE } from "./stage.js";
import { si } from "../format.js";

const EPS0 = 8.854e-12;
const AREA = 0.01; // m², 10 cm × 10 cm
const VS = 9;
const R = 1e6;
const SLOW = 1e4; // one animated second is 1/10,000 of a real second
const PLATE = 3; // scene units for 10 cm

export default function cap3d(el) {
  const goals = [
    { id: "cap3d-charge", text: "Charge it, and watch the current in the wires die away as the plates fill" },
    { id: "cap3d-gap", text: "Narrow the gap. What happens to the stored charge at the same 9 V?" },
    { id: "cap3d-slab", text: "Slide in the plastic sheet. Why does it hold more charge now?" },
  ];
  const stage = createStage(el, {
    title: "A capacitor charging, in 3D",
    pill: "slowed down about 10,000×",
    aria: "Two square metal plates facing each other, joined through a resistor and a switch to a battery. As it charges, minus signs gather on one plate, plus signs on the other, and field arrows grow between them. The readouts beside the view give the numbers.",
    camera: { fit: 4.2, yaw: -0.55, pitch: 0.3, fov: 38 },
    views: [{ label: "Side", yaw: -Math.PI / 2 + 0.05, pitch: 0.05 }],
    key: `<span><i style="background:#7fb0ff"></i>extra electrons (−)</span><span><i style="background:#ff8a5c"></i>missing electrons (+)</span><span><i style="background:#ffcc4d;border-radius:2px"></i>electric field</span><span><i style="background:#cfe0ff;width:7px;height:7px"></i>current in the wires</span>`,
    side: `
      <div class="seg" role="group" aria-label="Switch position"><button type="button" class="btn small c-charge">Charge</button><button type="button" class="btn small outline c-dis">Discharge</button></div>
      <label class="ctl"><span class="ctl-top"><span>Gap between the plates</span><output class="o-gap"></output></span><input type="range" class="c-gap" min="0.5" max="4" step="0.1" value="2"></label>
      <label class="ctl-toggle"><input type="checkbox" class="c-slab"><span>Slide a plastic sheet between the plates</span></label>
      <div class="micro-readouts">
        <div class="readout"><span>Capacitance, C = ε₀ εᵣ A ÷ d</span><strong class="r-c">–</strong></div>
        <div class="readout"><span>Voltage across the plates</span><strong class="r-v">–</strong></div>
        <div class="readout"><span>Charge on each plate, Q = C × V</span><strong class="r-q">–</strong></div>
        <div class="readout"><span>Current in the wires</span><strong class="r-i">–</strong></div>
        <div class="readout"><span>Energy stored, ½ C V²</span><strong class="r-e">–</strong></div>
      </div>
      ${goalsBox(goals)}`,
  });
  if (stage.failed) return () => {};
  const { root, $ } = stage;
  const state = { charging: true, gap: 2, slab: false, v: 0, everFull: false, qAt9: null };
  const cap = () => (EPS0 * (state.slab ? 4 : 1) * AREA) / (state.gap / 1000);
  const gapUnits = () => 0.35 + state.gap * 0.45;

  // ---------- plates ----------
  const metal = new THREE.MeshStandardMaterial({ color: "#c9ced2", metalness: 0.6, roughness: 0.35, transparent: true, opacity: 0.5, depthWrite: false });
  const plateGeo = new THREE.BoxGeometry(0.08, PLATE, PLATE);
  const left = new THREE.Mesh(plateGeo, metal);
  const right = new THREE.Mesh(plateGeo, metal);
  root.add(left, right);
  const slab = new THREE.Mesh(new THREE.BoxGeometry(1, PLATE * 0.96, PLATE * 0.96), new THREE.MeshStandardMaterial({ color: "#e8d9a8", transparent: true, opacity: 0.32, depthWrite: false, roughness: 0.2 }));
  root.add(slab);

  // ---------- circuit: wires to a battery, resistor and switch below ----------
  const wireMat = new THREE.MeshStandardMaterial({ color: "#c98a4a", metalness: 0.3, roughness: 0.5 });
  const tubes = new THREE.Group();
  root.add(tubes);
  const tube = (pts) => {
    const curve = new THREE.CurvePath();
    for (let i = 0; i < pts.length - 1; i++) curve.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, pts.length * 12, 0.05, 8, false), wireMat);
    tubes.add(m);
    return curve;
  };
  const battery = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.1, 24), new THREE.MeshStandardMaterial({ color: "#2b3a34" }));
  battery.rotation.z = Math.PI / 2;
  battery.position.set(0, -2.9, 0);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.285, 0.285, 0.35, 24), new THREE.MeshStandardMaterial({ color: "#d6ed99" }));
  band.rotation.z = Math.PI / 2;
  band.position.set(0.3, -2.9, 0);
  const resistor = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.55, 16), new THREE.MeshStandardMaterial({ color: "#d4b778" }));
  resistor.position.set(-2.6, -1.4, 0);
  root.add(battery, band, resistor);

  // ---------- charge signs on the inner faces ----------
  const N_S = 90;
  const minusMat = new THREE.SpriteMaterial({ map: signTexture("−", "#7fb0ff"), depthWrite: false });
  const plusMat = new THREE.SpriteMaterial({ map: signTexture("+", "#ff8a5c"), depthWrite: false });
  const spots = Array.from({ length: N_S }, () => [(Math.random() - 0.5) * PLATE * 0.9, (Math.random() - 0.5) * PLATE * 0.9]);
  const minus = spots.map(() => root.add(new THREE.Sprite(minusMat)).children.at(-1));
  const plus = spots.map(() => root.add(new THREE.Sprite(plusMat)).children.at(-1));
  [...minus, ...plus].forEach((s) => s.scale.setScalar(0.2));

  // ---------- field arrows between the plates ----------
  const FX = 5;
  const chevGeo = new THREE.ConeGeometry(0.06, 0.2, 10);
  chevGeo.rotateZ(-Math.PI / 2);
  const field = new THREE.InstancedMesh(chevGeo, new THREE.MeshBasicMaterial({ color: "#ffcc4d", transparent: true, opacity: 0.95 }), FX * FX);
  root.add(field);

  // ---------- current dots in the wires ----------
  const N_D = 40;
  const dots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.045, 8, 6), new THREE.MeshBasicMaterial({ color: "#cfe0ff" }), N_D * 2);
  root.add(dots);
  let curves = [];
  const dotT = Array.from({ length: N_D }, (_, i) => i / N_D);

  // Dipoles inside the plastic sheet line up with the field.
  const dip = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.035, 0.12, 4, 8), new THREE.MeshBasicMaterial({ color: "#c9a24a" }), 36);
  root.add(dip);

  const lMinus = stage.label("battery −", new THREE.Vector3(-0.75, -3.45, 0));
  const lPlus = stage.label("battery +", new THREE.Vector3(0.75, -3.45, 0));
  stage.label("1 MΩ", new THREE.Vector3(-3.05, -1.4, 0));
  void lMinus;
  void lPlus;

  const layout = () => {
    const g = gapUnits();
    left.position.x = -g / 2;
    right.position.x = g / 2;
    slab.scale.x = g * 0.82;
    slab.visible = state.slab;
    // Wires: left plate → resistor → battery −; right plate → battery +.
    tubes.children.forEach((c) => c.geometry.dispose());
    tubes.clear();
    const pl = [new THREE.Vector3(-g / 2 - 0.04, 0, 0), new THREE.Vector3(-2.6, 0, 0), new THREE.Vector3(-2.6, -2.9, 0), new THREE.Vector3(-0.55, -2.9, 0)];
    const pr = [new THREE.Vector3(g / 2 + 0.04, 0, 0), new THREE.Vector3(2.6, 0, 0), new THREE.Vector3(2.6, -2.9, 0), new THREE.Vector3(0.55, -2.9, 0)];
    curves = [tube(pl), tube(pr)];
    let k = 0;
    for (let i = 0; i < FX; i++)
      for (let j = 0; j < FX; j++) field.userData[k++] = [((i + 0.5) / FX - 0.5) * PLATE * 0.85, ((j + 0.5) / FX - 0.5) * PLATE * 0.85];
  };

  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const X = new THREE.Vector3(1, 0, 0);
  const NEG_X = new THREE.Vector3(-1, 0, 0);
  const V = new THREE.Vector3();
  const S = new THREE.Vector3();
  let current = 0;
  let fullFor = 0;

  const sync = () => {
    $(".c-charge").classList.toggle("outline", !state.charging);
    $(".c-dis").classList.toggle("outline", state.charging);
    $(".c-charge").setAttribute("aria-pressed", String(state.charging));
    $(".c-dis").setAttribute("aria-pressed", String(!state.charging));
    $(".o-gap").textContent = `${state.gap.toFixed(1)} mm`;
    layout();
  };
  $(".c-charge").onclick = () => {
    state.charging = true;
    sync();
  };
  $(".c-dis").onclick = () => {
    state.charging = false;
    sync();
  };
  $(".c-gap").oninput = (e) => {
    const before = cap();
    state.gap = +e.target.value;
    // The charge stays put for an instant; the voltage changes, then the battery tops it up.
    state.v *= before / cap();
    if (state.gap <= 1) stage.done("cap3d-gap");
    sync();
  };
  $(".c-slab").onchange = (e) => {
    const before = cap();
    state.slab = e.target.checked;
    state.v *= before / cap();
    if (state.slab) stage.done("cap3d-slab");
    sync();
  };
  sync();

  stage.onFrame((dt) => {
    const C = cap();
    const tau = R * C; // real seconds
    const dtReal = dt / SLOW;
    const target = state.charging ? VS : 0;
    const before = state.v;
    state.v = target + (state.v - target) * Math.exp(-dtReal / tau);
    current = dt > 0 ? (C * (state.v - before)) / dtReal : (target - state.v) / R;
    const Qc = C * state.v;
    const frac = state.v / VS;

    // Charge signs: how many show is proportional to the charge (at a fixed scale).
    const maxQ = (EPS0 * 4 * AREA) / 0.0005 * VS;
    const n = Math.round(N_S * Math.min(1, Math.sqrt(Qc / maxQ) * 1.2));
    const g = gapUnits();
    spots.forEach(([y, z], i) => {
      minus[i].visible = i < n;
      plus[i].visible = i < n;
      minus[i].position.set(-g / 2 + 0.12, y, z);
      plus[i].position.set(g / 2 - 0.12, y, z);
    });

    // Field arrows: point from + plate to − plate, sized with the field E = V ÷ d. (With the
    // sheet in, the plates hold four times the charge, but the sheet's lined-up molecules
    // cancel three quarters of its field, so E is still V ÷ d.)
    const E = state.v / (state.gap / 1000);
    const k = E > 1 ? 0.55 + 0.9 * Math.sqrt(Math.min(1, E / 18000)) : 0;
    q.setFromUnitVectors(X, NEG_X);
    for (let i = 0; i < FX * FX; i++) {
      const [y, z] = field.userData[i];
      field.setMatrixAt(i, m4.compose(V.set(0, y, z), q, S.set(k, k, k)));
    }
    field.instanceMatrix.needsUpdate = true;

    // Dipoles in the sheet: tilt toward the field direction as it grows.
    for (let i = 0; i < 36; i++) {
      const y = ((i % 6) + 0.5) / 6 - 0.5;
      const z = (Math.floor(i / 6) + 0.5) / 6 - 0.5;
      const ang = (1 - Math.min(1, frac * 1.2)) * (((i * 37) % 11) / 11 - 0.5) * 2.4;
      q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2 + ang);
      dip.setMatrixAt(i, m4.compose(V.set(0, y * PLATE * 0.85, z * PLATE * 0.85), q, S.set(state.slab ? 1 : 0, state.slab ? 1 : 0, state.slab ? 1 : 0)));
    }
    dip.instanceMatrix.needsUpdate = true;

    // Current dots: conventional current flows from battery + to the right plate while charging
    // (electrons the other way). Speed proportional to the current.
    const speed = (current / (VS / R)) * 0.6;
    for (let i = 0; i < N_D; i++) dotT[i] = (((dotT[i] + speed * dt) % 1) + 1) % 1;
    for (let c = 0; c < 2; c++) {
      const curve = curves[c];
      for (let i = 0; i < N_D; i++) {
        const t = c === 0 ? dotT[i] : 1 - dotT[i];
        const p = curve.getPointAt(t);
        const show = Math.abs(current) > (VS / R) * 0.01;
        dots.setMatrixAt(c * N_D + i, m4.compose(p, q.identity(), S.setScalar(show ? 1 : 0)));
      }
    }
    dots.instanceMatrix.needsUpdate = true;

    $(".r-c").textContent = si(C, "F");
    $(".r-v").textContent = `${state.v.toFixed(2)} V`;
    $(".r-q").textContent = `${si(Qc, "C")} (${fmtCount(Qc / 1.602e-19)} electrons)`;
    $(".r-i").textContent = Math.abs(current) < 1e-9 ? "0" : si(Math.abs(current), "A");
    $(".r-e").textContent = si(0.5 * C * state.v * state.v, "J");
    const full = Math.abs(state.v - target) < 0.05;
    if (state.charging && full) fullFor += dt;
    else fullFor = 0;
    if (fullFor > 0.8) stage.done("cap3d-charge");
    stage.say(
      state.charging
        ? full
          ? `Full: the plates are at the battery's 9 V, so nothing pushes any more charge on. The current has stopped, yet the charge stays.`
          : `Charging: electrons flow onto the left plate from the battery's − terminal and off the right plate toward +. The fuller it gets, the less push is left, so the current slows (τ = RC = ${si(tau, "s")}).`
        : state.v > 0.05
          ? "Discharging: the capacitor is now the source, pushing its charge back round through the resistor."
          : "Empty. Charge it again.",
      full && state.charging ? "good" : "",
    );
  });

  return () => stage.destroy();
}

function fmtCount(n) {
  if (n < 1e6) return Math.round(n).toLocaleString("en-GB");
  const e = Math.floor(Math.log10(n));
  if (e < 12) {
    const k = Math.floor(e / 3) * 3;
    return `${+(n / 10 ** k).toPrecision(2)} ${{ 6: "million", 9: "billion" }[k]}`;
  }
  return `${+(n / 10 ** e).toPrecision(2)} × 10${String(e).replace(/./g, (c) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[c])}`;
}
