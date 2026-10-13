// Inside an LED: a PN junction in 3D.
//
// p-type material (left) is full of holes; n-type (right) is full of free electrons.
// Where they meet, electrons fill nearby holes and leave a depletion zone of fixed,
// charged atoms: negative on the p side, positive on the n side. That makes a built-in
// field which stops further crossing. A forward bias shrinks the zone; once it nears
// the built-in voltage, carriers cross, meet, recombine and release one photon each,
// with an energy close to e × V. A reverse bias widens the zone and nothing flows.
// The current uses the same Shockley model as the circuit simulator.

import { createStage, goalsBox, signTexture, ringTexture, pointCloud, THREE } from "./stage.js";
import { LEDS } from "../sim.js";
import { si } from "../format.js";

const COLOURS = {
  red: { name: "Red", nm: 630, led: "red", glow: "#ff5a3c" },
  yellow: { name: "Yellow", nm: 590, led: "yellow", glow: "#ffd23c" },
  blue: { name: "Blue", nm: 465, led: "blue", glow: "#5b8cff" },
};
const H = 6.626e-34;
const C = 2.998e8;
const Q = 1.602e-19;
const photonEV = (nm) => (H * C) / (nm * 1e-9) / Q;
const ledCurrent = (key, v) => {
  const d = LEDS[COLOURS[key].led];
  return v > 0 ? d.is * (Math.exp(v / (d.n * 0.025852)) - 1) : -d.is;
};

// Block geometry (scene units).
const LEN = 8; // along x
const HGT = 2.4;
const DEP = 2.4;
const W0 = 0.9; // depletion width with no bias

export default function junction3d(el) {
  const goals = [
    { id: "pn-glow", text: "Forward-bias the junction until it glows steadily" },
    { id: "pn-reverse", text: "Reverse-bias it. What happens to the depletion zone, and to the current?" },
    { id: "pn-blue", text: "Switch to blue. How much more voltage does it need to glow?" },
  ];
  const stage = createStage(el, {
    title: "Inside an LED: the PN junction",
    pill: "a few atoms wide, hugely magnified",
    aria: "A block of semiconductor in 3D: p-type on the left with holes, n-type on the right with free electrons, and a depletion zone between them. The readouts beside it give the voltage, current and photon energy.",
    camera: { fit: 4.3, yaw: -0.35, pitch: 0.32, fov: 38 },
    views: [{ label: "Front", yaw: 0, pitch: 0.05 }],
    key: `<span><i style="background:transparent;border:2px solid #ffb38a"></i>hole (+)</span><span><i style="background:#8fb8ff"></i>free electron (−)</span><span><i style="background:#3a4f6b;border-radius:2px"></i>fixed charged atoms</span><span><i style="background:#fff3b0"></i>photon</span>`,
    side: `
      <label class="ctl"><span class="ctl-top"><span>Voltage across the junction</span><output class="o-v"></output></span><input type="range" class="pn-v" min="-3" max="3.2" step="0.02" value="0"></label>
      <label class="ctl"><span class="ctl-top"><span>LED colour</span></span><select class="pn-c">${Object.entries(COLOURS).map(([k, c]) => `<option value="${k}">${c.name}, ${c.nm} nm</option>`).join("")}</select></label>
      <div class="micro-readouts">
        <div class="readout"><span>Current</span><strong class="r-i">–</strong></div>
        <div class="readout"><span>Depletion zone</span><strong class="r-w">–</strong></div>
        <div class="readout"><span>Energy of each photon</span><strong class="r-e">–</strong></div>
      </div>
      ${goalsBox(goals)}`,
  });
  if (stage.failed) return () => {};
  const { root, $ } = stage;
  const state = { v: 0, colour: "red", w: W0 };

  // ---------- the block ----------
  const pMat = new THREE.MeshStandardMaterial({ color: "#c98a7a", transparent: true, opacity: 0.18, depthWrite: false, roughness: 0.6 });
  const nMat = new THREE.MeshStandardMaterial({ color: "#7a96c9", transparent: true, opacity: 0.18, depthWrite: false, roughness: 0.6 });
  const pBox = new THREE.Mesh(new THREE.BoxGeometry(LEN / 2, HGT, DEP), pMat);
  pBox.position.x = -LEN / 4;
  const nBox = new THREE.Mesh(new THREE.BoxGeometry(LEN / 2, HGT, DEP), nMat);
  nBox.position.x = LEN / 4;
  root.add(pBox, nBox);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(LEN, HGT, DEP)), new THREE.LineBasicMaterial({ color: "#9fb8a8", transparent: true, opacity: 0.35 }));
  root.add(edges);
  // Metal contacts at each end.
  const metal = new THREE.MeshStandardMaterial({ color: "#c0c6bf", metalness: 0.8, roughness: 0.3 });
  for (const sx of [-1, 1]) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.16, HGT * 1.04, DEP * 1.04), metal);
    c.position.x = sx * (LEN / 2 + 0.08);
    root.add(c);
  }
  // The depletion zone: a darker slab whose width changes with the bias.
  const zone = new THREE.Mesh(new THREE.BoxGeometry(1, HGT * 0.995, DEP * 0.995), new THREE.MeshBasicMaterial({ color: "#0e1d18", transparent: true, opacity: 0.45, depthWrite: false }));
  root.add(zone);

  // Fixed ions in the zone: − on the p side, + on the n side.
  const ionMinus = new THREE.SpriteMaterial({ map: signTexture("−", "#8aa0c0"), depthWrite: false, opacity: 0.9, transparent: true });
  const ionPlus = new THREE.SpriteMaterial({ map: signTexture("+", "#c0a08a"), depthWrite: false, opacity: 0.9, transparent: true });
  const IONS = 70;
  const ionPos = Array.from({ length: IONS }, (_, i) => ({ side: i % 2 ? 1 : -1, f: Math.random(), y: (Math.random() - 0.5) * HGT * 0.85, z: (Math.random() - 0.5) * DEP * 0.85 }));
  const ions = ionPos.map((p) => {
    const s = new THREE.Sprite(p.side < 0 ? ionMinus : ionPlus);
    s.scale.setScalar(0.2);
    root.add(s);
    return s;
  });

  // Built-in field arrow across the zone, pointing from + (n side) to − (p side).
  const fieldArrow = new THREE.ArrowHelper(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0.5, HGT / 2 + 0.35, 0), 1, 0xffcc4d, 0.25, 0.16);
  root.add(fieldArrow);

  // ---------- carriers ----------
  const N_C = 140;
  const holes = pointCloud(N_C, ringTexture("#ffc7a6"), 0.27);
  const elecs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: "#8fb8ff" }), N_C);
  root.add(holes, elecs);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const newCarrier = (kind, fresh) => ({
    kind,
    x: kind === "h" ? rnd(-LEN / 2 + 0.1, fresh ? -LEN / 2 + 0.4 : -0.6) : rnd(fresh ? LEN / 2 - 0.4 : 0.6, LEN / 2 - 0.1),
    y: rnd(-HGT / 2 + 0.12, HGT / 2 - 0.12),
    z: rnd(-DEP / 2 + 0.12, DEP / 2 - 0.12),
    vx: rnd(-1, 1),
    vy: rnd(-1, 1),
    vz: rnd(-1, 1),
  });
  const hs = Array.from({ length: N_C }, () => newCarrier("h"));
  const es = Array.from({ length: N_C }, () => newCarrier("e"));

  // ---------- photons ----------
  const N_P = 60;
  const photonMat = new THREE.SpriteMaterial({ map: glowTexture(), color: COLOURS.red.glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const photons = Array.from({ length: N_P }, () => {
    const s = new THREE.Sprite(photonMat);
    s.scale.setScalar(0.35);
    s.visible = false;
    root.add(s);
    return { s, life: 0, v: new THREE.Vector3() };
  });
  const glowLight = new THREE.PointLight(0xff5a3c, 0, 8, 1.5);
  root.add(glowLight);
  let emitted = 0;

  // ---------- labels ----------
  stage.label("p-type", new THREE.Vector3(-LEN / 4, -HGT / 2 - 0.45, DEP / 2));
  stage.label("n-type", new THREE.Vector3(LEN / 4, -HGT / 2 - 0.45, DEP / 2));
  const lZone = stage.label("depletion zone", new THREE.Vector3(0, -HGT / 2 - 0.45, DEP / 2));
  const lL = stage.label("", new THREE.Vector3(-LEN / 2 - 0.5, 0, 0), "big");
  const lR = stage.label("", new THREE.Vector3(LEN / 2 + 0.5, 0, 0), "big");

  const m4 = new THREE.Matrix4();
  const q4 = new THREE.Quaternion();
    const V3 = new THREE.Vector3();
  const ONE = new THREE.Vector3(1, 1, 1);
  const ZERO = new THREE.Vector3(0, 0, 0);
  let current = 0;
  let glowFor = 0;

  const update = () => {
    const c = COLOURS[state.colour];
    const vbi = LEDS[c.led].vf - 0.1;
    $(".o-v").textContent = `${state.v.toFixed(2)} V`;
    current = ledCurrent(state.colour, state.v);
    const shown = Math.max(0, current);
    $(".r-i").textContent = state.v < 0 || shown < 1e-6 ? "almost none" : shown > 0.05 ? "far too much: it would burn out" : si(shown, "A");
    // Depletion width ∝ √(Vbi − V), collapsing toward a minimum as V nears Vbi.
    state.w = W0 * Math.sqrt(Math.max(0.04, (vbi - Math.min(state.v, vbi)) / vbi));
    $(".r-w").textContent = state.w > W0 * 1.05 ? "wider" : state.w < W0 * 0.5 ? "almost gone" : state.w < W0 * 0.95 ? "narrower" : "as made";
    const ev = photonEV(c.nm);
    $(".r-e").textContent = `${ev.toFixed(2)} eV (${c.nm} nm)`;
    photonMat.color.set(c.glow);
    glowLight.color.set(c.glow);
    lL.set(state.v > 0.02 ? "+" : state.v < -0.02 ? "−" : "");
    lR.set(state.v > 0.02 ? "−" : state.v < -0.02 ? "+" : "");
    stage.say(
      state.v < -0.05
        ? "Reverse bias: the battery pulls holes and electrons away from the junction. The depletion zone widens and almost no current flows: the diode blocks."
        : shown < 1e-4
          ? `Not enough push yet. The built-in field across the depletion zone stops carriers crossing. A ${c.name.toLowerCase()} LED needs about ${LEDS[c.led].vf.toFixed(1)} V.`
          : shown > 0.05
            ? "Too far: past the knee, a little more voltage makes a huge current. A real LED would burn out here, which is why it always needs a resistor or a current regulator."
            : `Forward bias: electrons and holes cross the shrunken zone, meet, and recombine. Each recombination releases about ${ev.toFixed(2)} eV as one photon of ${c.nm} nm light.`,
      state.v < -0.05 || shown > 0.05 ? "warn" : shown > 1e-3 ? "good" : "",
    );
    if (state.v < -1) stage.done("pn-reverse");
  };
  $(".pn-v").oninput = (e) => {
    state.v = +e.target.value;
    update();
  };
  $(".pn-c").onchange = (e) => {
    state.colour = e.target.value;
    update();
  };
  update();

  // Rate of crossings shown, per second: compressed so 1 mA and 20 mA are both visible.
  const crossRate = () => (current > 1e-5 ? Math.min(40, 6 * Math.log10(current / 1e-5)) : 0);

  stage.onFrame((dt, real) => {
    // Zone and ions.
    zone.scale.x = state.w;
    ionPos.forEach((p, i) => {
      ions[i].position.set(p.side * p.f * (state.w / 2), p.y, p.z);
      ions[i].visible = p.f * (state.w / 2) > 0.04;
    });
    fieldArrow.setLength(Math.max(0.3, state.w + 0.2), 0.22, 0.14);
    fieldArrow.position.set(state.w / 2 + 0.1, HGT / 2 + 0.35, 0);
    lZone.at.set(0, -HGT / 2 - 0.45, DEP / 2);

    // Carriers: random thermal motion, kept out of the zone, plus drift toward
    // the junction under forward bias (away from it under reverse).
    const rate = crossRate();
    const pull = state.v < 0 ? -0.6 : Math.min(1.6, rate * 0.06);
    let toCross = rate * dt;
    for (const [list, sign] of [
      [hs, -1],
      [es, 1],
    ]) {
      for (const c of list) {
        c.vx += (Math.random() - 0.5) * 6 * dt - sign * pull * dt * 2;
        c.vy += (Math.random() - 0.5) * 6 * dt;
        c.vz += (Math.random() - 0.5) * 6 * dt;
        const sp = Math.hypot(c.vx, c.vy, c.vz);
        if (sp > 0.9) {
          c.vx *= 0.9 / sp;
          c.vy *= 0.9 / sp;
          c.vz *= 0.9 / sp;
        }
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.z += c.vz * dt;
        const edge = sign < 0 ? -state.w / 2 : state.w / 2;
        // Keep inside the block.
        if (Math.abs(c.y) > HGT / 2 - 0.1) c.vy = -c.vy, (c.y = Math.sign(c.y) * (HGT / 2 - 0.1));
        if (Math.abs(c.z) > DEP / 2 - 0.1) c.vz = -c.vz, (c.z = Math.sign(c.z) * (DEP / 2 - 0.1));
        const outer = sign * (LEN / 2 - 0.1);
        if (sign * c.x > sign * outer) c.vx = -c.vx, (c.x = outer);
        // At the zone's edge: bounce back, unless this one gets to cross and recombine.
        if (sign * c.x < sign * edge) {
          if (toCross > 0 && Math.random() < 0.5) {
            toCross -= 0.5;
            emit(c);
            Object.assign(c, newCarrier(c.kind, true));
          } else {
            c.vx = -c.vx;
            c.x = edge;
          }
        }
      }
    }
    hs.forEach((c, i) => holes.set(i, c.x, c.y, c.z));
    holes.done();
    es.forEach((c, i) => elecs.setMatrixAt(i, m4.compose(V3.set(c.x, c.y, c.z), q4.identity(), ONE)));
    elecs.instanceMatrix.needsUpdate = true;

    // Photons fly outward and fade.
    for (const p of photons) {
      if (!p.s.visible) continue;
      p.life -= real;
      p.s.position.addScaledVector(p.v, real);
      p.s.material.opacity = 1;
      if (p.life <= 0) p.s.visible = false;
    }
    const lit = Math.min(1, rate / 25);
    glowLight.intensity = lit * 4;
    if (rate > 8) glowFor += real;
    else glowFor = 0;
    if (glowFor > 1.5) stage.done("pn-glow");
    if (state.colour === "blue" && rate > 8 && glowFor > 0.8) stage.done("pn-blue");
    void ZERO;
  });

  function emit(c) {
    emitted++;
    const p = photons[emitted % N_P];
    p.s.visible = true;
    p.life = 1.4;
    p.s.position.set((Math.random() - 0.5) * 0.2, c.y, c.z);
    p.v.set(rnd(-0.6, 0.6), rnd(-1, 1), rnd(-1, 1)).normalize().multiplyScalar(2.6);
  }

  return () => stage.destroy();
}

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.25, "rgba(255,255,255,0.7)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
