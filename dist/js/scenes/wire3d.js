// Surface charge on a battery-and-lamp circuit, in 3D.
//
// The model: the potential falls steadily along the path (a little along each
// copper wire, almost all of it across the lamp's filament), and the surface charge
// at each point is proportional to how far that point's potential is above or below
// the circuit's middle. That's the simplified picture used in Chabay & Sherwood's
// Matter & Interactions: positive near the + terminal, negative near −, changing
// most steeply where the field inside is strongest. With the switch open, every
// conductor sits at one of two potentials and the charge piles up on the gap faces.

import { createStage, goalsBox, signTexture, THREE } from "./stage.js";
import { si } from "../format.js";

// Real-world numbers behind the readouts (a 10 Ω lamp, 0.5 mm² copper, wires 5 cm apart).
const R_LAMP = 10;
const RHO_CU = 1.7e-8;
const AREA = 0.5e-6;
const FILAMENT = 0.02; // m
const EPS0 = 8.854e-12;
const E = 1.602e-19;
const LINE_C = (Math.PI * EPS0) / Math.log(50 / 0.4); // F/m for two wires 5 cm apart, 0.4 mm radius
const FREE_PER_CM = 8.5e28 * AREA * 0.01;

// The loop, as a path with segments. Conventional current runs along it in order.
const P = (x, y) => new THREE.Vector3(x, y, 0);
const PATH = [
  { kind: "wire", from: P(-4, 1.2), to: P(-4, 2.4) },
  { kind: "wire", from: P(-4, 2.4), to: P(-1.6, 2.4) },
  { kind: "switch", from: P(-1.6, 2.4), to: P(-0.6, 2.4) },
  { kind: "wire", from: P(-0.6, 2.4), to: P(4, 2.4) },
  { kind: "wire", from: P(4, 2.4), to: P(4, 1.25) },
  { kind: "lamp", from: P(4, 1.25), to: P(4, -1.25) },
  { kind: "wire", from: P(4, -1.25), to: P(4, -2.4) },
  { kind: "wire", from: P(4, -2.4), to: P(-4, -2.4) },
  { kind: "wire", from: P(-4, -2.4), to: P(-4, -1.2) },
];
let s0 = 0;
for (const seg of PATH) {
  seg.len = seg.from.distanceTo(seg.to);
  seg.s0 = s0;
  seg.dir = seg.to.clone().sub(seg.from).normalize();
  s0 += seg.len;
}
const TOTAL = s0;
const GAP = { a: 1.0, b: 1.35 }; // the switch's gap, as a fraction of its segment (opened)
const WIRE_R = 0.15;
const LAMP_R = 0.07;
const COPPER_SHARE = 0.1; // of the voltage, dropped along the copper: exaggerated about 10,000× so you can see it

export default function wire3d(el) {
  const goals = [
    { id: "w3d-turn", text: "Turn the circuit round. Is the charge on the outside or inside of the wire?" },
    { id: "w3d-open", text: "Open the switch. Where does the charge go?" },
    { id: "w3d-volts", text: "Turn the battery down to 4.5 V or less. What happens to the charge?" },
  ];
  const stage = createStage(el, {
    title: "Surface charge, in 3D",
    pill: "charge hugely exaggerated",
    aria: "A battery, a switch and a lamp joined in a loop by copper wires, drawn in 3D. Plus and minus signs on the wires' surfaces show the surface charge; arrows inside show the electric field. The readouts beside the view describe it in numbers.",
    camera: { fit: 5.6, yaw: -0.42, pitch: 0.26, fov: 38 },
    views: [
      { label: "Front", yaw: 0, pitch: 0.05 },
      { label: "Close-up", yaw: -0.3, pitch: 0.42, zoom: 0.3, target: new THREE.Vector3(1.6, 2.4, 0) },
    ],
    key: `<span><i style="background:#ff8a5c"></i>extra + charge</span><span><i style="background:#7fb0ff"></i>extra − charge</span><span><i style="background:#ffcc4d;border-radius:2px"></i>field inside</span><span><i style="background:#cfe0ff;width:7px;height:7px"></i>free electrons</span>`,
    side: `
      <button type="button" class="btn big w3d-switch" aria-pressed="true">Open the switch</button>
      <label class="ctl"><span class="ctl-top"><span>Battery voltage</span><output class="o-v">9 V</output></span><input type="range" class="volts" min="1.5" max="12" step="0.5" value="9"></label>
      <label class="ctl-toggle"><input type="checkbox" class="t-signs" checked><span>Show the surface charge</span></label>
      <label class="ctl-toggle"><input type="checkbox" class="t-field" checked><span>Show the field inside</span></label>
      <label class="ctl-toggle"><input type="checkbox" class="t-electrons" checked><span>Show free electrons</span></label>
      <div class="micro-readouts">
        <div class="readout"><span>Extra charges on 1 cm of wire near the + terminal</span><strong class="r-charge">–</strong></div>
        <div class="readout"><span>…out of this many free electrons in that centimetre</span><strong class="r-free">–</strong></div>
        <div class="readout"><span>Field inside the copper</span><strong class="r-ecu">–</strong></div>
        <div class="readout"><span>Field inside the filament</span><strong class="r-efil">–</strong></div>
      </div>
      ${goalsBox(goals)}`,
    fallback: "The chapter text above describes the same picture.",
  });
  if (stage.failed) return () => {};
  const { root, $ } = stage;
  const state = { closed: true, volts: 9, signs: true, field: true, electrons: true };

  // ---------- the physics along the path ----------
  // Potential at path position s (volts above the − terminal).
  const segAt = (s) => PATH.find((g) => s >= g.s0 - 1e-9 && s <= g.s0 + g.len + 1e-9) || PATH.at(-1);
  const gapS = () => {
    const g = PATH[2];
    return [g.s0 + g.len * 0.38, g.s0 + g.len * 0.62];
  };
  const copperLen = PATH.filter((g) => g.kind !== "lamp").reduce((a, g) => a + g.len, 0);
  function potential(s) {
    const V = state.volts;
    if (!state.closed) {
      const [a] = gapS();
      return s <= a ? V : 0;
    }
    // Copper takes COPPER_SHARE of the voltage in proportion to length; the lamp the rest.
    let v = V;
    for (const g of PATH) {
      const along = Math.min(Math.max(s - g.s0, 0), g.len);
      const drop = g.kind === "lamp" ? V * (1 - COPPER_SHARE) : (V * COPPER_SHARE * g.len) / copperLen;
      v -= (drop * along) / g.len;
      if (s <= g.s0 + g.len) break;
    }
    return v;
  }
  // Field along the path (V per scene unit), in the direction of conventional current.
  function field(s) {
    if (!state.closed) return 0;
    const g = segAt(s);
    return g.kind === "lamp" ? (state.volts * (1 - COPPER_SHARE)) / g.len : (state.volts * COPPER_SHARE) / copperLen;
  }
  // Surface charge: proportional to the potential above or below the middle.
  const sigma = (s) => (potential(s) - state.volts / 2) / 6;

  // Nearest path position to a point in the loop's plane.
  function nearestS(p) {
    let best = { d: Infinity, s: 0 };
    for (const g of PATH) {
      const t = Math.min(Math.max(p.clone().sub(g.from).dot(g.dir), 0), g.len);
      const d = g.from.clone().addScaledVector(g.dir, t).distanceTo(p);
      if (d < best.d) best = { d, s: g.s0 + t };
    }
    return best.s;
  }

  // ---------- conductors, coloured by their surface charge ----------
  const copper = new THREE.Color("#c98a4a");
  const plus = new THREE.Color("#ff6a3d");
  const minus = new THREE.Color("#4f86ff");
  const conductors = [];
  const tubeMat = new THREE.MeshStandardMaterial({ vertexColors: true, transparent: true, opacity: 0.42, roughness: 0.45, metalness: 0.2, depthWrite: false, side: THREE.DoubleSide });
  function tube(from, to, r, kind) {
    const len = from.distanceTo(to);
    const geo = new THREE.CylinderGeometry(r, r, len, 28, Math.max(2, Math.round(len * 6)), true);
    geo.translate(0, len / 2, 0);
    geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize()));
    geo.translate(from.x, from.y, from.z);
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 3), 3));
    const mesh = new THREE.Mesh(geo, tubeMat);
    mesh.renderOrder = 2;
    root.add(mesh);
    conductors.push({ mesh, kind, base: kind === "lamp" ? new THREE.Color("#8a8f86") : copper });
    return mesh;
  }
  function joint(p) {
    const geo = new THREE.SphereGeometry(WIRE_R, 20, 14);
    geo.translate(p.x, p.y, p.z);
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 3), 3));
    const mesh = new THREE.Mesh(geo, tubeMat);
    root.add(mesh);
    conductors.push({ mesh, kind: "wire", base: copper });
  }
  const sw = PATH[2];
  const swA = sw.from.clone().lerp(sw.to, 0.38);
  const swB = sw.from.clone().lerp(sw.to, 0.62);
  for (const g of PATH) {
    if (g.kind === "wire") tube(g.from, g.to, WIRE_R, "wire");
    if (g.kind === "lamp") {
      tube(g.from, g.from.clone().lerp(g.to, 0.25), WIRE_R * 0.6, "wire");
      tube(g.from.clone().lerp(g.to, 0.25), g.from.clone().lerp(g.to, 0.75), LAMP_R, "lamp");
      tube(g.from.clone().lerp(g.to, 0.75), g.to, WIRE_R * 0.6, "wire");
    }
  }
  tube(sw.from, swA, WIRE_R, "wire");
  tube(swB, sw.to, WIRE_R, "wire");
  [P(-4, 2.4), P(4, 2.4), P(4, -2.4), P(-4, -2.4)].forEach(joint);

  // The switch's moving blade: bridges the gap when closed, lifts when open.
  const blade = new THREE.Mesh(new THREE.BoxGeometry(swB.x - swA.x + 0.36, 0.08, 0.26), new THREE.MeshStandardMaterial({ color: "#d9c27a", metalness: 0.6, roughness: 0.35 }));
  const hinge = new THREE.Group();
  hinge.position.copy(swA);
  blade.position.set((swB.x - swA.x) / 2, 0.19, 0);
  hinge.add(blade);
  root.add(hinge);
  const faceMat = new THREE.MeshStandardMaterial({ color: "#c98a4a", metalness: 0.4, roughness: 0.4 });
  for (const p of [swA, swB]) {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(WIRE_R * 1.25, WIRE_R * 1.25, 0.06, 24), faceMat);
    disc.rotation.z = Math.PI / 2;
    disc.position.copy(p);
    root.add(disc);
  }

  // The battery, along the left side: + at the top.
  const batt = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 2.2, 36), new THREE.MeshStandardMaterial({ color: "#2b3a34", roughness: 0.5, metalness: 0.3 }));
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.7, 36), new THREE.MeshStandardMaterial({ color: "#d6ed99", roughness: 0.5 }));
  band.position.y = 0.55;
  const nub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.16, 20), new THREE.MeshStandardMaterial({ color: "#c0c6bf", metalness: 0.8, roughness: 0.3 }));
  nub.position.y = 1.18;
  batt.add(body, band, nub);
  batt.position.set(-4, 0, 0);
  root.add(batt);

  // The lamp: a glass bulb round the filament, glowing with the power.
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.95, 32, 22), new THREE.MeshPhysicalMaterial({ color: "#eef6e6", transparent: true, opacity: 0.12, roughness: 0.05, depthWrite: false }));
  bulb.position.set(4, 0, 0);
  root.add(bulb);
  const glow = new THREE.PointLight(0xffc35a, 0, 6, 1.6);
  glow.position.set(4, 0, 0.4);
  root.add(glow);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture(), color: 0xffd27a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.set(3.2, 3.2, 1);
  halo.position.set(4, 0, 0);
  root.add(halo);

  // ---------- surface charge signs ----------
  const SIGN_POOL = 170;
  const plusMat = new THREE.SpriteMaterial({ map: signTexture("+", "#ff8a5c"), depthWrite: false });
  const minusMat = new THREE.SpriteMaterial({ map: signTexture("−", "#7fb0ff"), depthWrite: false });
  const signs = Array.from({ length: SIGN_POOL }, () => {
    const sp = new THREE.Sprite(plusMat);
    sp.scale.setScalar(0.21);
    sp.visible = false;
    root.add(sp);
    return sp;
  });

  // Seeded random numbers, so the signs don't jump about on every change.
  let seed = 11;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  function placeSigns() {
    // Weight each small stretch of conductor by |σ| × its surface area.
    const pieces = [];
    const step = 0.08;
    for (const g of PATH) {
      for (let t = 0; t < g.len; t += step) {
        const s = g.s0 + t + step / 2;
        let r = g.kind === "lamp" && t / g.len > 0.25 && t / g.len < 0.75 ? LAMP_R : g.kind === "lamp" ? WIRE_R * 0.6 : WIRE_R;
        if (g.kind === "switch") {
          const f = (t + step / 2) / g.len;
          if (f > 0.38 && f < 0.62) {
            if (state.closed) r = 0.05;
            else continue;
          }
        }
        pieces.push({ g, t: t + step / 2, s, r, w: Math.abs(sigma(s)) * r * step });
      }
    }
    // With the switch open, the gap faces carry a large concentrated charge.
    const faces = [];
    if (!state.closed) {
      const fw = (state.volts / 9) * 0.16;
      faces.push({ at: swA, sign: 1, w: fw }, { at: swB, sign: -1, w: fw });
    }
    const total = pieces.reduce((a, p) => a + p.w, 0) + faces.reduce((a, f) => a + f.w, 0);
    // How many signs to show scales with the voltage.
    const count = Math.round(SIGN_POOL * Math.min(1, state.volts / 12));
    seed = 11;
    let used = 0;
    const place = (sp, pos, positive) => {
      sp.position.copy(pos);
      sp.material = positive ? plusMat : minusMat;
      sp.visible = state.signs;
      used++;
    };
    for (const f of faces) {
      const n = Math.round((count * f.w) / total);
      for (let i = 0; i < n && used < SIGN_POOL; i++) {
        const a = rand() * Math.PI * 2;
        const rr = Math.sqrt(rand()) * WIRE_R * 1.2;
        place(signs[used], new THREE.Vector3(f.at.x + f.sign * 0.06, f.at.y + Math.cos(a) * rr, Math.sin(a) * rr), f.sign > 0);
      }
    }
    let acc = 0;
    let next = rand() * (total / count);
    for (const p of pieces) {
      acc += p.w;
      while (acc > next && used < SIGN_POOL) {
        next += total / count;
        const a = rand() * Math.PI * 2;
        const along = p.g.from.clone().addScaledVector(p.g.dir, p.t + (rand() - 0.5) * 0.08);
        // A unit vector round the wire, perpendicular to its direction.
        const n1 = new THREE.Vector3(0, 0, 1);
        const n2 = new THREE.Vector3().crossVectors(p.g.dir, n1);
        const out = n1.multiplyScalar(Math.cos(a)).add(n2.multiplyScalar(Math.sin(a)));
        place(signs[used], along.addScaledVector(out, p.r + 0.06), sigma(p.s) > 0);
      }
    }
    for (let i = used; i < SIGN_POOL; i++) signs[i].visible = false;
  }

  function colourConductors() {
    const tmp = new THREE.Vector3();
    const c = new THREE.Color();
    for (const { mesh, base } of conductors) {
      const pos = mesh.geometry.attributes.position;
      const col = mesh.geometry.attributes.color;
      for (let i = 0; i < pos.count; i++) {
        tmp.fromBufferAttribute(pos, i);
        const q = sigma(nearestS(tmp.setZ(0)));
        const k = Math.min(1, Math.abs(q) * (state.volts > 0 ? 1.5 : 0));
        c.copy(base).lerp(q > 0 ? plus : minus, k * 0.85);
        col.setXYZ(i, c.r, c.g, c.b);
      }
      col.needsUpdate = true;
    }
  }

  // ---------- field chevrons inside the conductors (and across the gap) ----------
  const chevGeo = new THREE.ConeGeometry(0.07, 0.22, 12);
  chevGeo.rotateZ(-Math.PI / 2); // point along +x
  const chevMat = new THREE.MeshBasicMaterial({ color: "#ffcc4d", transparent: true, opacity: 0.95 });
  const CHEV = [];
  for (const g of PATH) for (let t = 0.3; t < g.len - 0.1; t += 0.55) CHEV.push({ g, t, s: g.s0 + t });
  const gapChevs = [-0.12, 0, 0.12].flatMap((dy) => [-0.12, 0.12].map((dz) => ({ dy, dz })));
  const chevs = new THREE.InstancedMesh(chevGeo, chevMat, CHEV.length + gapChevs.length);
  chevs.renderOrder = 1;
  root.add(chevs);
  const m4 = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const X = new THREE.Vector3(1, 0, 0);
  function placeChevrons() {
    const maxE = (state.volts * (1 - COPPER_SHARE)) / PATH[5].len || 1;
    CHEV.forEach((c, i) => {
      const e = field(c.s);
      const inGap = c.g.kind === "switch";
      const k = inGap || !state.closed || !state.field ? 0 : 0.35 + 1.4 * Math.sqrt(e / maxE);
      quat.setFromUnitVectors(X, c.g.dir);
      m4.compose(c.g.from.clone().addScaledVector(c.g.dir, c.t), quat, new THREE.Vector3(k, k, k));
      chevs.setMatrixAt(i, m4);
    });
    gapChevs.forEach((c, j) => {
      const k = !state.closed && state.field ? 0.8 + 0.6 * (state.volts / 12) : 0;
      quat.setFromUnitVectors(X, sw.dir);
      m4.compose(new THREE.Vector3((swA.x + swB.x) / 2, swA.y + c.dy, c.dz), quat, new THREE.Vector3(k * 0.7, k, k));
      chevs.setMatrixAt(CHEV.length + j, m4);
    });
    chevs.instanceMatrix.needsUpdate = true;
  }

  // ---------- free electrons drifting inside the copper ----------
  const N_E = 260;
  const eGeo = new THREE.SphereGeometry(0.032, 8, 6);
  const eMat = new THREE.MeshBasicMaterial({ color: "#cfe0ff" });
  const electrons = new THREE.InstancedMesh(eGeo, eMat, N_E);
  root.add(electrons);
  const eState = Array.from({ length: N_E }, () => ({ s: Math.random() * TOTAL, a: Math.random() * Math.PI * 2, r: Math.sqrt(Math.random()) * 0.1, jit: Math.random() * 10 }));
  const tmpP = new THREE.Vector3();
  function stepElectrons(dt, real) {
    const current = state.closed ? state.volts / R_LAMP : 0;
    const speed = current * 0.55; // scene units per second: drift, enormously sped up
    for (let i = 0; i < N_E; i++) {
      const e = eState[i];
      e.s -= speed * dt; // electrons drift against the conventional current
      if (e.s < 0) e.s += TOTAL;
      e.jit += real * 3;
      const g = segAt(e.s);
      const r = g.kind === "lamp" ? Math.min(e.r, LAMP_R * 0.7) : e.r;
      const t = e.s - g.s0;
      tmpP.copy(g.from).addScaledVector(g.dir, t);
      const n2 = new THREE.Vector3().crossVectors(g.dir, new THREE.Vector3(0, 0, 1));
      const wob = 0.25 * Math.sin(e.jit);
      tmpP.addScaledVector(n2, Math.cos(e.a + wob) * r).add(new THREE.Vector3(0, 0, Math.sin(e.a + wob) * r));
      const hide = !state.electrons || (g.kind === "switch" && !state.closed && t / g.len > 0.38 && t / g.len < 0.62);
      m4.makeScale(hide ? 0 : 1, hide ? 0 : 1, hide ? 0 : 1).setPosition(tmpP);
      electrons.setMatrixAt(i, m4);
    }
    electrons.instanceMatrix.needsUpdate = true;
  }

  // ---------- labels ----------
  const lPlus = stage.label("+", P(-4.65, 1.25), "big");
  const lMinus = stage.label("−", P(-4.65, -1.25), "big");
  stage.label("battery", P(-5.45, 0));
  stage.label("switch", P(-1.1, 3.05));
  stage.label("lamp", P(5.3, 0.2));
  const lGap = stage.label("", P(-1.1, 1.75));
  void lPlus;
  void lMinus;

  // ---------- controls ----------
  let bladeAngle = 0;
  const update = () => {
    $(".w3d-switch").textContent = state.closed ? "Open the switch" : "Close the switch";
    $(".w3d-switch").setAttribute("aria-pressed", String(state.closed));
    $(".o-v").textContent = `${state.volts} V`;
    colourConductors();
    placeSigns();
    placeChevrons();
    const I = state.closed ? state.volts / R_LAMP : 0;
    const lambda = LINE_C * state.volts; // C per metre on each wire
    $(".r-charge").textContent = state.volts ? `about ${fmtBig((lambda * 0.01) / E)}` : "0";
    $(".r-free").textContent = fmtBig(FREE_PER_CM);
    $(".r-ecu").textContent = state.closed ? `${si((I * RHO_CU) / AREA, "V/m")}` : "0 V/m";
    $(".r-efil").textContent = state.closed ? `${si(state.volts / FILAMENT, "V/m")}` : "0 V/m";
    const p = I * state.volts;
    glow.intensity = state.closed ? (p / 14.4) * 6 : 0;
    halo.material.opacity = state.closed ? Math.min(0.9, (p / 14.4) * 0.9) : 0;
    lGap.set(state.closed ? "" : `${state.volts} V across the gap`);
    lGap.show(!state.closed);
    stage.say(
      state.closed
        ? `Current flows. The wire from <b>+</b> carries extra + charge, the return wire extra − charge. The charge changes most steeply across the filament, so that's where the field inside is strongest. All of it sits on the <em>surface</em>.`
        : `Switch open. The charge piles up on the two faces of the gap, just enough to cancel the field inside every conductor, so the electrons stop drifting. The whole ${state.volts} V is now across the gap.`,
      state.closed ? "" : "warn",
    );
    if (!state.closed) stage.done("w3d-open");
    if (state.volts <= 4.5) stage.done("w3d-volts");
  };
  $(".w3d-switch").onclick = () => {
    state.closed = !state.closed;
    update();
  };
  $(".volts").oninput = (e) => {
    state.volts = +e.target.value;
    update();
  };
  $(".t-signs").onchange = (e) => {
    state.signs = e.target.checked;
    placeSigns();
  };
  $(".t-field").onchange = (e) => {
    state.field = e.target.checked;
    placeChevrons();
  };
  $(".t-electrons").onchange = (e) => {
    state.electrons = e.target.checked;
  };
  update();
  stepElectrons(0, 0);

  stage.onFrame((dt, real) => {
    stepElectrons(dt, real);
    // Ease the blade open or shut.
    const want = state.closed ? 0 : 0.85;
    bladeAngle += (want - bladeAngle) * (1 - Math.exp(-real * 8));
    hinge.rotation.z = bladeAngle;
    if (stage.turned > 1.1) stage.done("w3d-turn");
  });

  return () => stage.destroy();
}

function fmtBig(n) {
  if (n < 1e4) return Math.round(n).toLocaleString("en-GB");
  const e = Math.floor(Math.log10(n));
  const words = { 6: "million", 9: "billion", 12: "trillion" };
  if (e < 15) {
    const k = Math.floor(e / 3) * 3;
    return `${+(n / 10 ** k).toPrecision(2)} ${words[k] || ""}`.trim();
  }
  const m = +(n / 10 ** e).toPrecision(2);
  return `${m} × 10${String(e).replace(/./g, (c) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[c])}`;
}

function haloTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,240,200,1)");
  grad.addColorStop(0.3, "rgba(255,200,90,0.5)");
  grad.addColorStop(1, "rgba(255,170,40,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
