// Inside an N-channel MOSFET, in 3D.
//
// A slab of p-type silicon (full of holes) with two n-type islands, the source and
// the drain. Above the gap between them: a very thin insulating oxide and a metal gate.
// The gate and the silicon under it form a tiny capacitor. Charge the gate positive
// and it pushes holes away, then pulls electrons into a thin layer under the oxide:
// an n-type channel joining source to drain. Above the threshold voltage, current
// flows. The drain current uses the same square-law model as the circuit simulator.

import { createStage, goalsBox, signTexture, ringTexture, pointCloud, THREE } from "./stage.js";
import { si } from "../format.js";

const VTH = 1.6;
const K = 8; // A/V², as in the course's flashlight MOSFET
const VDS = 0.5;
const W = 7; // slab length (x)
const D = 3; // slab depth (z)
const Hs = 2.4; // slab height (y)

// Square-law drain current at a small drain voltage (the switch's "on" region).
export function drainCurrent(vgs, vds = VDS) {
  const ov = vgs - VTH;
  if (ov <= 0) return 0;
  return vds < ov ? K * (ov * vds - (vds * vds) / 2) : (K / 2) * ov * ov;
}

export default function mosfet3d(el) {
  const goals = [
    { id: "mos3d-channel", text: "Raise the gate voltage until a channel of electrons joins source and drain" },
    { id: "mos3d-th", text: "Find the threshold: the lowest gate voltage where current starts to flow" },
  ];
  const stage = createStage(el, {
    title: "Inside a MOSFET",
    pill: "cross-section, hugely magnified",
    aria: "A slab of silicon in 3D with source and drain islands, a thin oxide and a metal gate on top. As the gate voltage rises, holes are pushed away and a layer of electrons forms under the gate. The readouts beside it give the gate voltage and drain current.",
    camera: { fit: 3.7, yaw: -0.3, pitch: 0.42, fov: 38 },
    views: [{ label: "Front", yaw: 0, pitch: 0.08 }],
    key: `<span><i style="background:transparent;border:2px solid #ffb38a"></i>hole (+)</span><span><i style="background:#8fb8ff"></i>free electron (−)</span><span><i style="background:#ff8a5c"></i>+ charge on the gate</span>`,
    side: `
      <label class="ctl"><span class="ctl-top"><span>Gate voltage (from the source)</span><output class="o-vg"></output></span><input type="range" class="m-vg" min="0" max="5" step="0.05" value="0"></label>
      <div class="micro-readouts">
        <div class="readout"><span>Drain current, with ${VDS} V from drain to source</span><strong class="r-id">–</strong></div>
        <div class="readout"><span>So it behaves like a resistance of</span><strong class="r-r">–</strong></div>
        <div class="readout"><span>Current into the gate</span><strong>0: it's insulated</strong></div>
      </div>
      ${goalsBox(goals)}`,
  });
  if (stage.failed) return () => {};
  const { root, $ } = stage;
  const state = { vg: 0 };

  // ---------- structure ----------
  const sub = new THREE.Mesh(new THREE.BoxGeometry(W, Hs, D), new THREE.MeshStandardMaterial({ color: "#c98a7a", transparent: true, opacity: 0.16, depthWrite: false }));
  root.add(sub);
  root.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(W, Hs, D)), new THREE.LineBasicMaterial({ color: "#9fb8a8", transparent: true, opacity: 0.35 })));
  const nMat = new THREE.MeshStandardMaterial({ color: "#5f86c9", transparent: true, opacity: 0.35, depthWrite: false });
  const WELL = 1.9;
  const wellH = 0.9;
  const wellY = Hs / 2 - wellH / 2;
  for (const sx of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.BoxGeometry(WELL, wellH, D * 0.98), nMat);
    w.position.set(sx * (W / 2 - WELL / 2), wellY, 0);
    root.add(w);
  }
  const oxide = new THREE.Mesh(new THREE.BoxGeometry(W - 2 * WELL + 0.5, 0.12, D * 0.98), new THREE.MeshPhysicalMaterial({ color: "#e8f2ee", transparent: true, opacity: 0.45, roughness: 0.05, depthWrite: false }));
  oxide.position.y = Hs / 2 + 0.06;
  const gate = new THREE.Mesh(new THREE.BoxGeometry(W - 2 * WELL + 0.4, 0.22, D * 0.96), new THREE.MeshStandardMaterial({ color: "#c9ced2", metalness: 0.75, roughness: 0.3 }));
  gate.position.y = Hs / 2 + 0.23;
  root.add(oxide, gate);
  const metal = new THREE.MeshStandardMaterial({ color: "#c0c6bf", metalness: 0.8, roughness: 0.3 });
  for (const sx of [-1, 1]) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, D * 0.5), metal);
    c.position.set(sx * (W / 2 - WELL / 2), Hs / 2 + 0.3, 0);
    root.add(c);
  }
  stage.label("source", new THREE.Vector3(-(W / 2 - WELL / 2), Hs / 2 + 0.9, 0));
  stage.label("drain", new THREE.Vector3(W / 2 - WELL / 2, Hs / 2 + 0.9, 0));
  stage.label("gate", new THREE.Vector3(0, Hs / 2 + 0.75, 0));
  stage.label("p-type silicon", new THREE.Vector3(0, -Hs / 2 - 0.35, D / 2));
  const lChan = stage.label("channel", new THREE.Vector3(0, Hs / 2 - 0.25, D / 2 + 0.1));

  // ---------- charges ----------
  const rnd = (a, b) => a + Math.random() * (b - a);
  const N_H = 120;
  const holes = pointCloud(N_H, ringTexture("#ffc7a6"), 0.24);
  root.add(holes);
  const hs = Array.from({ length: N_H }, () => ({ x: rnd(-W / 2 + 0.2, W / 2 - 0.2), y: rnd(-Hs / 2 + 0.15, Hs / 2 - 0.15), z: rnd(-D / 2 + 0.15, D / 2 - 0.15), ph: Math.random() * 6 }));
  const N_W = 90;
  const elecGeo = new THREE.SphereGeometry(0.055, 10, 8);
  const wellE = new THREE.InstancedMesh(elecGeo, new THREE.MeshBasicMaterial({ color: "#8fb8ff" }), N_W);
  root.add(wellE);
  const ws = Array.from({ length: N_W }, (_, i) => ({ side: i % 2 ? 1 : -1, x: rnd(0, WELL - 0.15), y: rnd(-wellH / 2 + 0.08, wellH / 2 - 0.08), z: rnd(-D / 2 + 0.12, D / 2 - 0.12), ph: Math.random() * 6 }));
  const N_C = 80;
  const chanE = new THREE.InstancedMesh(elecGeo, new THREE.MeshBasicMaterial({ color: "#8fb8ff" }), N_C);
  root.add(chanE);
  const cs = Array.from({ length: N_C }, () => ({ x: rnd(-W / 2 + WELL, W / 2 - WELL), y: rnd(0, 0.18), z: rnd(-D / 2 + 0.12, D / 2 - 0.12) }));
  const plusMat = new THREE.SpriteMaterial({ map: signTexture("+", "#ff8a5c"), depthWrite: false });
  const gatePlus = Array.from({ length: 40 }, (_, i) => {
    const s = new THREE.Sprite(plusMat);
    s.scale.setScalar(0.17);
    s.position.set(-((W - 2 * WELL) / 2) + 0.15 + ((i % 10) / 9) * (W - 2 * WELL - 0.3), Hs / 2 + 0.38, -D / 2 + 0.3 + (Math.floor(i / 10) / 3) * (D - 0.6));
    root.add(s);
    return s;
  });

  const m4 = new THREE.Matrix4();
  const qNone = new THREE.Quaternion();
  const one = new THREE.Vector3(1, 1, 1);
  const zero = new THREE.Vector3(0, 0, 0);
  const V = new THREE.Vector3();
  let t = 0;

  const update = () => {
    $(".o-vg").textContent = `${state.vg.toFixed(2)} V`;
    const id = drainCurrent(state.vg);
    $(".r-id").textContent = id < 1e-6 ? "none" : si(id, "A");
    $(".r-r").textContent = id < 1e-6 ? "open: off" : si(VDS / id, "Ω");
    const ov = state.vg - VTH;
    stage.say(
      state.vg < 0.3
        ? "Gate at 0 V: source and drain are two n-type islands in p-type silicon, with no path for electrons between them. Off."
        : ov <= 0
          ? "The gate's + charge pushes holes away from the surface, but there aren't enough electrons there yet to make a path. Still off."
          : `Above the threshold (${VTH} V), a thin layer of electrons gathers under the oxide: an n-type channel from source to drain. The higher the gate voltage, the more electrons, the lower the resistance.`,
      ov > 0 ? "good" : "",
    );
    if (ov > 1.5) stage.done("mos3d-channel");
    if (ov > 0 && ov < 0.25) stage.done("mos3d-th");
  };
  $(".m-vg").oninput = (e) => {
    state.vg = +e.target.value;
    update();
  };
  update();

  stage.onFrame((dt, real) => {
    t += real;
    const vg = state.vg;
    const ov = Math.max(0, vg - VTH);
    // Holes: pushed down from the surface under the gate as the gate charges.
    const clear = Math.min(1, vg / 2.5) * 0.9;
    hs.forEach((h, i) => {
      const under = Math.abs(h.x) < W / 2 - WELL + 0.1;
      const top = Hs / 2 - 0.15 - (under ? clear : 0);
      const inWell = !under;
      const y = Math.min(h.y, top) + 0.02 * Math.sin(t * 3 + h.ph);
      const hide = inWell && h.y > Hs / 2 - wellH - 0.05;
      if (hide) holes.set(i, 0, -999, 0);
      else holes.set(i, h.x + 0.03 * Math.cos(t * 2 + h.ph), y, h.z);
    });
    holes.done();
    ws.forEach((w, i) => {
      const x = w.side * (W / 2 - 0.1 - w.x);
      wellE.setMatrixAt(i, m4.compose(V.set(x + 0.03 * Math.cos(t * 2.4 + w.ph), wellY + w.y, w.z), qNone, one));
    });
    wellE.instanceMatrix.needsUpdate = true;
    // Channel electrons: how many appear grows with the overdrive; they drift from
    // source to drain (conventional current flows drain to source).
    const nShow = Math.round(N_C * Math.min(1, ov / 2.4));
    const id = drainCurrent(vg);
    const speed = Math.min(2.2, id * 0.9);
    cs.forEach((c, i) => {
      c.x += speed * dt;
      if (c.x > W / 2 - WELL) c.x = -W / 2 + WELL;
      chanE.setMatrixAt(i, m4.compose(V.set(c.x, Hs / 2 - 0.08 - c.y, c.z), qNone, i < nShow ? one : zero));
    });
    chanE.instanceMatrix.needsUpdate = true;
    const nPlus = Math.round(40 * Math.min(1, vg / 5));
    gatePlus.forEach((s, i) => (s.visible = i < nPlus));
    lChan.show(ov > 0.1);
  });

  return () => stage.destroy();
}
