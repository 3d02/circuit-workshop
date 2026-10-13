// The finished flashlight in 3D, with an exploded view: pull the slider and the
// parts slide apart along the torch's axis so you can see how they fit together.

import { createStage, goalsBox, THREE } from "./stage.js";

export default function torch3d(el) {
  const goals = [{ id: "torch-explode", text: "Pull the torch apart and find each part from the parts list" }];
  const stage = createStage(el, {
    title: "Your flashlight, taken apart",
    pill: "one way to package it",
    aria: "A 3D model of the finished flashlight: a clear tube holding four AA cells, a switch, the driver board, the LED on its heatsink, a reflector and a lens. A slider pulls the parts apart along the torch's length.",
    camera: { fit: 4.5, yaw: -0.32, pitch: 0.3, fov: 36 },
    views: [{ label: "Side", yaw: 0, pitch: 0.05 }],
    side: `
      <label class="ctl"><span class="ctl-top"><span>Take it apart</span><output class="o-x"></output></span><input type="range" class="t-x" min="0" max="1" step="0.01" value="0.85"></label>
      <label class="ctl-toggle"><input type="checkbox" class="t-on" checked><span>Switched on</span></label>
      <label class="ctl-toggle"><input type="checkbox" class="t-body" checked><span>Show the body tube</span></label>
      <p class="small-note">The body could be a 40 mm plastic pipe with end caps, or a small project box. The electronics don't mind: only the LED's heatsink needs some air or metal around it.</p>
      ${goalsBox(goals)}`,
  });
  if (stage.failed) return () => {};
  const { root, $ } = stage;
  const parts = [];
  // A part sits at `x` when assembled and moves to `x + spread` when fully exploded.
  const add = (obj, x, spread, label, ly = 1.25) => {
    obj.position.x = x;
    root.add(obj);
    const l = label ? stage.label(label, new THREE.Vector3(x, ly, 0)) : null;
    parts.push({ obj, x, spread, l, ly });
    return obj;
  };
  const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.1, ...extra });
  const alu = mat("#c9ced2", { metalness: 0.75, roughness: 0.3 });

  // Batteries: four AA cells, two by two, in a holder.
  const pack = new THREE.Group();
  const holder = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.08, 1.2), mat("#1f2a25"));
  holder.position.y = -0.62;
  pack.add(holder);
  for (const [y, z] of [[-0.3, -0.3], [-0.3, 0.3], [0.3, -0.3], [0.3, 0.3]]) {
    const cell = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 2.4, 24), mat("#3d6b8a", { metalness: 0.3 }));
    body.rotation.z = Math.PI / 2;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.285, 0.285, 0.5, 24), mat("#d6ed99"));
    band.rotation.z = Math.PI / 2;
    band.position.x = 0.7;
    const nub = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 12), alu);
    nub.rotation.z = Math.PI / 2;
    nub.position.x = 1.24;
    cell.add(body, band, nub);
    cell.position.set(0, y, z);
    pack.add(cell);
  }
  add(pack, -2.1, -2.0, "4 × AA NiMH (BT1)", 1.0);

  // Switch, on the side of the body.
  const sw = new THREE.Group();
  sw.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.5), mat("#2b3a34")));
  const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.18, 16), mat("#ed975c"));
  btn.position.y = 0.22;
  sw.add(btn);
  sw.position.y = 0.6;
  add(sw, 0.0, 0.5, "switch (SW1)", 1.5);

  // Driver board.
  const board = new THREE.Group();
  board.add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 1.0), mat("#c9b27a")));
  const to220 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.55, 0.12), mat("#1b1f1d"));
  to220.position.set(0.25, 0.3, 0.1);
  const tab = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.04), alu);
  tab.position.set(0.25, 0.42, 0.02);
  const to92 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.22, 16, 1, false, 0, Math.PI), mat("#1b1f1d"));
  to92.position.set(-0.35, 0.14, -0.15);
  const r1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 12), mat("#d4b778"));
  r1.rotation.z = Math.PI / 2;
  r1.position.set(-0.2, 0.09, 0.3);
  const r2 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.42, 12), mat("#5f86c9"));
  r2.rotation.z = Math.PI / 2;
  r2.position.set(0.3, 0.1, -0.32);
  board.add(to220, tab, to92, r1, r2);
  add(board, 1.0, 0.9, "driver board", -0.85);

  // Heatsink, LED star and LED.
  const sink = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.2, 32), alu);
  disc.rotation.z = Math.PI / 2;
  sink.add(disc);
  for (let i = 0; i < 6; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.3, 0.06), alu);
    fin.position.set(-0.25, 0, -0.5 + i * 0.2);
    sink.add(fin);
  }
  add(sink, 2.0, 1.4, "heatsink", 1.2);
  const star = new THREE.Group();
  const starDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 6), alu);
  starDisc.rotation.z = Math.PI / 2;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: "#fff7d6", transparent: true, opacity: 0.9, roughness: 0.1, emissive: "#fff4cc", emissiveIntensity: 0 }));
  dome.rotation.z = -Math.PI / 2;
  dome.position.x = 0.04;
  star.add(starDisc, dome);
  add(star, 2.16, 2.0, "LED (D1)", -0.85);

  // Reflector and lens.
  const refl = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.22, 0.9, 40, 1, true), new THREE.MeshStandardMaterial({ color: "#e6eae6", metalness: 0.95, roughness: 0.12, side: THREE.DoubleSide }));
  refl.rotation.z = -Math.PI / 2;
  const reflG = new THREE.Group();
  reflG.add(refl);
  add(reflG, 2.65, 2.6, "reflector", 1.2);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.86, 0.06, 40), new THREE.MeshPhysicalMaterial({ color: "#ffffff", transparent: true, opacity: 0.2, roughness: 0.02, depthWrite: false }));
  lens.rotation.z = Math.PI / 2;
  const lensG = new THREE.Group();
  lensG.add(lens);
  add(lensG, 3.15, 3.2, "lens", -1.1);

  // The body tube and end cap.
  const tubeMat = new THREE.MeshPhysicalMaterial({ color: "#dfe9e2", transparent: true, opacity: 0.16, roughness: 0.15, depthWrite: false, side: THREE.DoubleSide });
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 6.6, 48, 1, true), tubeMat);
  tube.rotation.z = Math.PI / 2;
  const tubeG = new THREE.Group();
  tubeG.add(tube);
  root.add(tubeG);
  tubeG.position.x = -0.1;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.2, 40), mat("#2b3a34"));
  cap.rotation.z = Math.PI / 2;
  const capG = new THREE.Group();
  capG.add(cap);
  add(capG, -3.45, -2.9, "end cap", -1.05);

  // Wires: battery → switch → board → LED, drawn as simple curves that stretch with the parts.
  const wireMats = { red: new THREE.MeshStandardMaterial({ color: "#c2402c" }), black: new THREE.MeshStandardMaterial({ color: "#1f2a25" }) };
  const wires = new THREE.Group();
  root.add(wires);
  const pos = (i) => parts[i].obj.position;
  const wire = (pts, color) => {
    const curve = new THREE.CatmullRomCurve3(pts);
    wires.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.025, 6, false), wireMats[color]));
  };
  const rewire = () => {
    wires.children.forEach((w) => w.geometry.dispose());
    wires.clear();
    const [b, s, d, , st] = [pos(0), pos(1), pos(2), pos(3), pos(4)];
    wire([new THREE.Vector3(b.x + 1.3, 0.2, 0.55), new THREE.Vector3((b.x + s.x) / 2, 0.55, 0.5), new THREE.Vector3(s.x - 0.2, 0.6, 0.2)], "red");
    wire([new THREE.Vector3(s.x + 0.2, 0.6, 0.2), new THREE.Vector3((s.x + d.x) / 2, 0.45, 0.4), new THREE.Vector3(d.x - 0.7, 0.05, 0.4)], "red");
    wire([new THREE.Vector3(b.x + 1.3, -0.2, -0.55), new THREE.Vector3((b.x + d.x) / 2, -0.4, -0.55), new THREE.Vector3(d.x - 0.7, 0.05, -0.4)], "black");
    wire([new THREE.Vector3(d.x + 0.7, 0.05, 0.3), new THREE.Vector3((d.x + st.x) / 2, 0.35, 0.45), new THREE.Vector3(st.x, 0.25, 0.3)], "red");
    wire([new THREE.Vector3(d.x + 0.7, 0.05, -0.3), new THREE.Vector3((d.x + st.x) / 2, -0.35, -0.45), new THREE.Vector3(st.x, -0.25, -0.3)], "black");
  };

  // The beam: a soft cone of light from the reflector, when switched on.
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 2.6, 5, 40, 1, true),
    new THREE.MeshBasicMaterial({ color: "#fff4cc", transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }),
  );
  beam.rotation.z = -Math.PI / 2;
  root.add(beam);
  const lamp = new THREE.PointLight(0xfff1c8, 0, 6, 1.5);
  root.add(lamp);

  let explode = 0.85;
  const update = () => {
    $(".o-x").textContent = explode < 0.05 ? "assembled" : `${Math.round(explode * 100)}%`;
    for (const p of parts) {
      p.obj.position.x = p.x + p.spread * explode;
      if (p.l) {
        p.l.at.set(p.obj.position.x, p.ly, 0);
        p.l.show(explode > 0.25);
      }
    }
    tubeG.position.y = explode * 2.4;
    tubeMat.opacity = $(".t-body").checked ? 0.16 * (1 - explode * 0.6) : 0;
    rewire();
    const on = $(".t-on").checked;
    const front = parts[5].obj.position.x;
    beam.visible = on;
    beam.position.x = front + 2.6;
    lamp.position.set(parts[4].obj.position.x + 0.3, 0, 0);
    lamp.intensity = on ? 3 : 0;
    dome.material.emissiveIntensity = on ? 1.4 : 0;
    stage.say(
      explode < 0.1
        ? "Assembled. Pull it apart to see how the pieces fit."
        : "From the back: the cells, the switch in the + lead, the driver board, then the LED's heatsink, the LED on its star, the reflector and the lens. Red wires are +, black are 0 V.",
    );
    if (explode > 0.8) stage.done("torch-explode");
  };
  $(".t-x").oninput = (e) => {
    explode = +e.target.value;
    update();
  };
  $(".t-on").onchange = update;
  $(".t-body").onchange = update;
  update();

  return () => stage.destroy();
}
