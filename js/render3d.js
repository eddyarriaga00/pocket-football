/* PocketFootball: 3D renderer (three.js).
   Draws the field, stadium, players and ball. game.js keeps its 2D canvas on top as a transparent overlay
   for letters, tags and the joystick, and asks this module to project field points onto the screen.
   
   Field coordinates are yards: x across, y upfield, z up. In the scene that is (x, z, -y).
   Players are one shared skeleton layout; every body part is an InstancedMesh, so all figures on screen
   cost about a dozen draw calls. Animation is procedural: a pose is 16 joint values, eased toward a target. */
(() => {
  'use strict';
  const T = window.THREE;
  if (!T || !PG.shaders) return;
  const SH = PG.shaders;  // GLSL for the turf, sky, crowd and the players' rim light (shaders.js)

  const FW = 53.33, HIP = 1.0, PSCALE = 1.6;
  const SIDELINE = 20, MAXP = 22, REFS = 3, CREW = 3, CAP = SIDELINE + MAXP + REFS + CREW;  // sideline figures first, then the players, the officials, the chain crew
  const CAM_WALL = -44;  // how far behind the goal line (in field yards) the gameplay camera may sit
  const CREW_X = -3.9, BOX_X = -2.6;  // where the sticks stand off the home sideline, and the down box a step nearer the field (on first down it shares a yard line with the back stick)
  const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const v3 = new T.Vector3(), v3b = new T.Vector3(), col = new T.Color(), col2 = new T.Color(), zAxis = new T.Vector3(0, 0, 1);

  let renderer, scene, camera, post = null, glowAmount = 0.8, W = 1, H = 1;
  let fieldTex, fieldCanvas, crowdMat, skyMat, skyDome, ribbonTex, ribbonCanvas, boardTex, boardCanvas, boardKey = '';
  let tee = null, rimMat = null, padsMat = null, padsCanvas = null, padsTex = null;  // the padded wall round the field, and what is painted on it
  const postPads = [];  // the goal post pads' materials (painted the home color in paintField)
  let parts = [], figs = [], contact, ball, ballShadow, ring, targetRing, losLine, fdLine, sticks, sticks2, chain, downBox;
  const crew = [], downMats = [];
  let hemiLight, sunLight, fillLight, fieldMat, groundMat, wallMat, rainPts, snowPts, envKey = '', envSnow = false, crowdBase = 1, celebT = 0;

  /* Switching ends: the engine always has team 0 going up the field, so when the teams change ends after the first
     and third quarters it is the stadium that turns round instead: the end zones are painted the other way round and
     the sun goes to the other side. The rest of the bowl is the same from either end. ends is which way round it
     stands now; endsT times the crane shot that covers the change. */
  let ends = 0, endsWant = 0, endsT = 9, lastEnv = null, lastTeams = null;
  const shadowSets = [], towerGlow = [], towerPanels = [], towerPoles = [], refs = [];
  let roof = null;  // the roof over a domed stadium (buildRoof), shown only when the game's env says roof
  let teamsKey = '', lastPs = null, time = 0, cheer = 0, debugCam = null, zoom = 1, flashes = null, menuShot = -1, nearModel = false, camDist = 0;
  const FLASHES = 48, flashLife = new Float32Array(FLASHES);
  const TOWERS = [[-70, -78], [FW + 70, -78], [-70, 178], [FW + 70, 178]];  // the four light towers, as field [x, y]
  const posts = [], sideNets = [];
  let nearBoard = [];
  const camPos = new T.Vector3(FW / 2, 30, 20), camLook = new T.Vector3(FW / 2, 0, -50);

  /* ---------- pose layout ---------- */
  const PELY = 0, PELRX = 1, PELRZ = 2, CHRX = 3, CHRY = 4, HEADRX = 5, SLX = 6, SLZ = 7, EL = 8, SRX = 9, SRZ = 10, ER = 11, HL = 12, KL = 13, HR = 14, KR = 15, AL = 16, AR = 17, HLZ = 18, HRZ = 19, ALZ = 20, ARZ = 21, ALY = 22, ARY = 23, HEADRY = 24, CHRZ = 25, NPOSE = 26;  // CHRZ (2026-11-21): the chest rolls against the hips as he walks and runs
  const TG = new Float32Array(NPOSE);

  /* The catch secured (CMU capture 34_01, 2.72 to 2.96 s): rows of SRX, SRZ, ER, SLX, SLZ, EL, CHRX from the ball in
     both hands at the chest to the ball held at the belly. */
  const SECURE = [[0.89, 0, 1.39, 0.87, 0.2, 1.27, -0.02], [0.39, -0.02, 1.93, 0.45, 0.22, 1.68, -0.07], [0.16, 0.03, 2.03, 0.24, 0.13, 1.81, -0.09],
    [0.13, 0.1, 2.02, 0.23, 0.11, 1.81, -0.08], [0.19, 0.14, 1.87, 0.25, 0.13, 1.79, -0.08]], SECURE_CH = [SRX, SRZ, ER, SLX, SLZ, EL, CHRX];
  /* two poses a fallen player passes through on his way up: one knee down with the other foot planted, then standing */
  const KNEEL = new Float32Array(NPOSE), STAND = new Float32Array(NPOSE);

  for (const [i, v] of [[PELY, 0.56], [CHRX, -0.35], [HEADRX, 0.3], [SLX, 0.55], [SRX, 0.95], [EL, 0.4], [ER, 0.7], [HL, 1.5], [KL, -1.55], [HR, -0.1], [KR, -1.6]]) KNEEL[i] = v;
  for (const [i, v] of [[PELY, 1], [CHRX, -0.05], [EL, 0.25], [ER, 0.25]]) STAND[i] = v;

  /* Leg lengths, in figure units (hips at HIP = 1): thigh, knee to ankle, the ankle above the sole, and the toe of
     the shoe ahead of the ankle. The foot turns on the ankle, so a planted sole can lie flat while the shin leans,
     and the heel can peel up over the toe as he pushes off (the shoe is stiff, so the toe is where it hinges). */
  const L1 = 0.5, ANKLE = 0.44, SOLE = 0.067, TOE = 0.2;

  /* ---------- geometry ---------- */
  const cap = (r, len, y) => new T.CapsuleGeometry(r, len, 3, 8).translate(0, y, 0);

  function merge(list) {
    const flat = list.map(g => g.index ? g.toNonIndexed() : g);
    let n = 0;
    for (const g of flat) n += g.attributes.position.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
    let o = 0;
    for (const g of flat) {
      pos.set(g.attributes.position.array, o);
      nor.set(g.attributes.normal.array, o);
      o += g.attributes.position.count * 3;
    }
    const out = new T.BufferGeometry();
    out.setAttribute('position', new T.BufferAttribute(pos, 3));
    out.setAttribute('normal', new T.BufferAttribute(nor, 3));
    return out;
  }

  /* Scenery that never moves: many small shapes in one mesh, each [geometry, color] with its color written into the
     vertices, so a whole sideline of benches, tables and pylons is one draw instead of one each. */
  function mergeC(list) {
    const flat = list.map(([g]) => (g.index ? g.toNonIndexed() : g));
    let n = 0;
    for (const g of flat) n += g.attributes.position.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), cl = new Float32Array(n * 3);
    let o = 0;
    flat.forEach((g, k) => {
      pos.set(g.attributes.position.array, o);
      nor.set(g.attributes.normal.array, o);
      col.set(list[k][1]);
      for (let i = 0; i < g.attributes.position.count; i++) cl.set([col.r, col.g, col.b], o + i * 3);
      o += g.attributes.position.count * 3;
    });
    const out = new T.BufferGeometry();
    out.setAttribute('position', new T.BufferAttribute(pos, 3));
    out.setAttribute('normal', new T.BufferAttribute(nor, 3));
    out.setAttribute('color', new T.BufferAttribute(cl, 3));
    return out;
  }

  /* every geometry is modelled in the space of the joint it hangs from */
  /* a surface of revolution from [radius, y] pairs: tapered limbs and a chest that narrows to the waist.
     three.js faces a lathe outward only when its profile climbs, so a profile written top-down is turned round here.
     (Until 2026-11-12 the limbs were written top-down and drawn inside-out: you saw the far wall of each arm and leg,
     lit as if from the other side, and an arm could sink into the chest it was held in front of.) */
  const lathe = (pts, seg, phi0, phiLen) => {
    const up = pts[0][1] <= pts[pts.length - 1][1] ? pts : pts.slice().reverse();
    return new T.LatheGeometry(up.map(([r, y]) => new T.Vector2(r, y)), seg || 12, phi0 || 0, phiLen || Math.PI * 2);
  };
  const bell = t => Math.exp(-t * t);

  /* A lathe whose points are then pushed about by f(v, front, back); front and back say how squarely the point faces
     forward (-z) or backward (+z), from 0 to 1. Normals are rebuilt, and the two columns that meet at the seam are
     given one normal between them so no line shows there. */
  function sculpt(pts, seg, f) {
    const g = lathe(pts, seg), p = g.attributes.position, v = new T.Vector3(), w = new T.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const r = Math.hypot(v.x, v.z) || 1;
      f(v, Math.max(0, -v.z / r), Math.max(0, v.z / r));
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    const n = g.attributes.normal, rows = pts.length;
    for (let j = 0; j < rows; j++) {
      const k = seg * rows + j;
      v.fromBufferAttribute(n, j).add(w.fromBufferAttribute(n, k)).normalize();
      n.setXYZ(j, v.x, v.y, v.z);
      n.setXYZ(k, v.x, v.y, v.z);
    }
    return g;
  }

  /* The chest: one recipe at two finenesses, so the number on the jersey (laid over this same surface) fits both models.
     Wide at the shoulders, narrow at the waist, three quarters as deep as it is wide, with a little chest in front and
     shoulder blade behind. The hem hangs just over the pants. */
  const TORSO = [[0.01, 0.0], [0.142, 0.004], [0.162, 0.04], [0.174, 0.1], [0.19, 0.2], [0.216, 0.32], [0.24, 0.43], [0.247, 0.5], [0.224, 0.58], [0.158, 0.64], [0.108, 0.675], [0.092, 0.69]];  // an athlete's taper: a narrow waist under a wide chest
  const chestOut = y => 0.02 * bell((y - 0.4) / 0.1), backOut = y => 0.012 * bell((y - 0.45) / 0.11);
  const mkTorso = seg => sculpt(TORSO, seg, (v, front, back) => {
    v.z = v.z * 0.74 - chestOut(v.y) * front + backOut(v.y) * back;  // tucked in: the jersey narrows into the waist of the pants (it used to flare out over them, and he looked to be in a bodysuit)
  });

  /* how far the jersey's surface is from the spine at (x, y), on the front or the back: the chest, or the shoulder pads
     where they sit over it */
  function jerseyZ(x, y, back) {
    let i = 1;
    while (i < TORSO.length - 1 && y > TORSO[i][1]) i++;
    const [r0, y0] = TORSO[i - 1], [r1, y1] = TORSO[i], R = lerp(r0, r1, clamp((y - y0) / (y1 - y0), 0, 1));
    const h = Math.sqrt(Math.max(0, R * R - x * x)), chest = h * 0.74 + (back ? backOut(y) : chestOut(y)) * (R ? h / R : 0);
    const q = 1 - (x / 0.348) ** 2 - ((y - 0.565) / 0.132) ** 2;
    return Math.max(chest, q > 0 ? 0.216 * Math.sqrt(q) : 0);
  }

  /* a jersey decal: a patch of nx by ny quads lying 6 mm off that surface, front (side -1), back (1) or both */
  function decal(w, y0, y1, nx, ny, sides) {
    const pos = [], uv = [];
    for (const side of sides) {
      const pt = (i, j) => {
        const u = i / nx, v = j / ny, x = lerp(-w, w, u) * side, y = lerp(y0, y1, v);
        pos.push(x, y, (jerseyZ(x, y, side > 0) + 0.006) * side);
        uv.push(u, v);
      };
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
        pt(i, j);
        pt(i + 1, j);
        pt(i + 1, j + 1);
        pt(i, j);
        pt(i + 1, j + 1);
        pt(i, j + 1);
      }
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    return g;
  }

  /* The helmet shell, after the real thing: a dome a little longer than it is wide whose sides and back come down past
     the ears into the jaw pads, the back sweeping lower than the front, and the face left open below the brow (the
     shell there is folded back behind the facemask, so the dark of the face shows through the bars). Built from a
     sphere: each point moves by how squarely it faces front and how low it sits. The team decal stays on the side
     above the ear hole. */
  function helmetShell(seg, rows) {
    const g = new T.SphereGeometry(0.17, seg, rows), p = g.attributes.position, v = new T.Vector3(), sm = x => x * x * (3 - 2 * x);
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const r = Math.hypot(v.x, v.z) || 1e-6, front = Math.max(0, -v.z / r), side = Math.abs(v.x) / r, low = Math.max(0, -v.y / 0.17);
      v.y *= 1.02;
      v.z *= 1.12;
      if (v.y < 0) {
        v.y -= 0.04 * (1 - front) * low * low;  // the sides and back reach down to the jaw
        v.z -= 0.022 * side * sm(front) * low;  // the jaw pads come forward along the cheeks
      }
      const face = front > 0.5 && v.y < 0.012 ? sm(Math.min(1, (front - 0.5) / 0.28)) * sm(Math.min(1, (0.012 - v.y) / 0.045)) : 0;
      v.z += face * 0.085;  // the face opening, tucked in behind the mask
      if (v.y > 0.06) v.y += 0.006 * Math.max(0, 1 - Math.abs(v.x) / 0.03) * front;  // a slight ridge over the brow
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }

  const earHoles = s => merge([-1, 1].map(side => new T.CylinderGeometry(0.017, 0.017, 0.008, s).rotateZ(Math.PI / 2).translate(side * 0.158, -0.076, 0.004)));

  /* The limbs: one recipe each, built at two finenesses, so the gameplay model has the same muscle as the close one
     (until 2026-11-13 it was plain tapered tubes). Thigh with quadriceps and hamstring, a calf that swells behind the
     shin, biceps and triceps, a forearm that narrows to the wrist. */
  const THIGH = [[0.123, 0], [0.128, -0.07], [0.122, -0.17], [0.107, -0.29], [0.093, -0.4], [0.087, -0.47]];
  const mkThigh = (seg, pad) => merge([sculpt([[0.01, 0.056], [0.08, 0.04], ...THIGH], seg, (v, front, back) => {
    v.z += -0.018 * bell((v.y + 0.16) / 0.13) * front + 0.012 * bell((v.y + 0.2) / 0.15) * back;  // quadriceps and hamstring
  }), new T.SphereGeometry(0.089, seg, 8).translate(0, -0.5, 0), ...(pad ? [new T.SphereGeometry(0.05, 10, 6).scale(1, 1.15, 0.5).translate(0, -0.49, -0.07)] : [])]);  // the knee, and the pad over it
  const mkShin = seg => sculpt([[0.01, 0.046], [0.058, 0.036], [0.075, 0], [0.081, -0.06], [0.086, -0.13], [0.076, -0.22], [0.06, -0.32], [0.049, -0.42], [0.046, -0.47], [0.01, -0.49]], seg, (v, front, back) => {
    v.z += 0.024 * bell((v.y + 0.14) / 0.09) * back - 0.004 * bell((v.y + 0.2) / 0.12) * front;  // the calf
  });
  const mkUpperArm = seg => merge([sculpt([[0.01, 0.05], [0.062, 0.036], [0.075, 0], [0.078, -0.08], [0.07, -0.18], [0.061, -0.275]], seg, (v, front, back) => {
    v.z += -0.01 * bell((v.y + 0.12) / 0.07) * front + 0.008 * bell((v.y + 0.14) / 0.08) * back;  // biceps in front, triceps behind
  }), new T.SphereGeometry(0.066, seg, 8).translate(0, -0.3, 0)]);  // the elbow: a shade wider than the forearm that turns in it, or the two surfaces cut each other in a ragged line
  const mkForeArm = seg => sculpt([[0.01, 0.04], [0.047, 0.03], [0.06, 0], [0.062, -0.06], [0.053, -0.15], [0.043, -0.23], [0.04, -0.262], [0.01, -0.275]], seg, (v, front, back) => {
    v.z += 0.007 * bell((v.y + 0.07) / 0.06) * back;
  });

  /* The hips, as football pants sit: a yoke wider than it is deep that wraps over the tops of both thighs, so the legs
     come out of the pants instead of hanging under a ball (it was a near-sphere, and read as one from behind a lineman).
     Shallow in front, a seat behind, and it stops higher between the legs. */
  /* ...and they come up to the waist, where the jersey is tucked into them (the uniform rule), with a belt round the
     top (baked into the shading: no extra draw) */
  const mkHips = seg => sculpt([[0.01, -0.2], [0.065, -0.195], [0.135, -0.16], [0.186, -0.095], [0.19, -0.025], [0.182, 0.04], [0.175, 0.094], [0.177, 0.1], [0.177, 0.13], [0.173, 0.136], [0.167, 0.144], [0.163, 0.146], [0.12, 0.152], [0.01, 0.154]], seg, (v, front, back) => {
    const side = Math.abs(v.x) / (Math.hypot(v.x, v.z) || 1);
    v.x *= 1.12;  // out over the thighs
    v.z = v.z * (lerp(0.6, 0.8, clamp(v.y / 0.1, 0, 1)) + 0.06 * back) + 0.015 * bell((v.y + 0.1) / 0.07) * back * (1 - side * 0.6);  // flat in front, the seat behind, round at the waist over the tucked jersey; narrower at the waist than at the hips
    if (v.y < -0.1) v.y += 0.03 * (1 - side) * Math.min(1, (-0.1 - v.y) / 0.08);  // cut up between the legs
  });
  const mkNeck = seg => new T.CylinderGeometry(0.076, 0.092, 0.12, seg).translate(0, 0.69, 0);  // a football neck

  /* a cleat: toe box and heel as two flattened balls pressed onto one flat sole, and a collar where the sock goes in */
  function cleat(seg) {
    const g = merge([new T.SphereGeometry(1, seg, 8).scale(0.063, 0.05, 0.112).translate(0, -0.464, -0.126), new T.SphereGeometry(1, seg, 8).scale(0.058, 0.054, 0.09).translate(0, -0.46, -0.018),  // a real boot: it was a size too small under these legs
      new T.CylinderGeometry(0.052, 0.054, 0.05, seg).translate(0, -0.43, 0.002)]), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) if (p.getY(i) < -0.507) p.setY(i, -0.507);
    return g.translate(0, ANKLE, 0);  // into the ankle joint's space
  }

  /* What holds a helmet on, and what protects it: a chin cup with a strap up each cheek into the shell, and a bumper at the
     back of the neck. White on every helmet. */
  function chinStrap(seg) {
    const list = [new T.SphereGeometry(1, seg, 6).scale(0.052, 0.03, 0.034).translate(0, -0.122, -0.158),
      new T.BoxGeometry(0.062, 0.026, 0.014).rotateX(-0.5).translate(0, -0.116, 0.168)];
    for (const sd of [-1, 1]) for (const [y1, z1] of [[-0.03, -0.04]]) {
      const dx = 0.1 * sd, dy = y1 + 0.118, dz = z1 + 0.15;
      list.push(new T.BoxGeometry(Math.hypot(dx, dy, dz), 0.018, 0.007).rotateZ(Math.atan2(dy, Math.hypot(dx, dz))).rotateY(-Math.atan2(dz, dx)).translate(0.045 * sd + dx / 2, -0.118 + dy / 2, -0.15 + dz / 2));
    }
    return merge(list);
  }

  /* the collar of the jersey, in the trim color, and the white tape a player winds over his sock from the shoe up */
  const collar = (a, b) => new T.TorusGeometry(0.1, 0.02, a, b).rotateX(Math.PI / 2).translate(0, 0.676, 0);
  const ankleTape = seg => lathe([[0.058, -0.462], [0.06, -0.42], [0.068, -0.33], [0.071, -0.3], [0.064, -0.294]], seg);  // wide enough to go over the collar of the shoe, as a spat does

  /* the far model's hand: a mitt with a thumb (it was a ball) */
  const mitt = () => merge([new T.SphereGeometry(1, 8, 6).scale(0.036, 0.072, 0.056).translate(0, -0.31, 0.002), new T.SphereGeometry(1, 6, 4).scale(0.017, 0.034, 0.02).rotateX(0.7).translate(0, -0.3, -0.055)]);

  /* the far model: what you see from the gameplay camera, kept light because 45 figures are drawn every frame */
  const GEO = {
    torso: mkTorso(12),
    pads: merge([new T.SphereGeometry(0.22, 14, 8).scale(1.58, 0.6, 0.98).translate(0, 0.565, 0),
      ...[-1, 1].map(side => new T.SphereGeometry(0.13, 10, 6).scale(1, 0.64, 1.12).translate(side * 0.29, 0.566, 0))]),  // with a cap over each shoulder, as the near model has
    neck: mkNeck(10),
    hips: mkHips(12),
    helmet: helmetShell(16, 12),
    ear: earHoles(8),
    /* a bare head, for the few who are seen without a helmet (a player at the podium, the commissioner): the skull,
       hair or the crown of a cap, and a cap's brim. Hidden on everyone else (PART_DEFS marks them optional). */
    skull: new T.SphereGeometry(0.118, 14, 10).scale(1, 1.08, 1.05).translate(0, 0.005, -0.015),
    hair: new T.SphereGeometry(0.125, 14, 6, 0, Math.PI * 2, 0, Math.PI * 0.5).scale(1, 0.95, 1.05).translate(0, 0.015, -0.015),
    brim: new T.CylinderGeometry(0.1, 0.1, 0.012, 16).scale(1, 1, 0.8).translate(0, 0.014, -0.13),
    stripe: new T.TorusGeometry(0.177, 0.016, 4, 14, Math.PI).rotateY(Math.PI / 2).scale(2.2, 1.02, 1.12),
    logo: merge([-1, 1].map(side => new T.CylinderGeometry(0.058, 0.058, 0.012, 12).rotateZ(Math.PI / 2).translate(side * 0.168, 0.01, 0.01))),
    face: new T.SphereGeometry(0.122, 10, 8).scale(1, 0.62, 0.6).translate(0, -0.04, -0.118),
    visor: new T.SphereGeometry(0.128, 10, 4, 0, Math.PI * 2, Math.PI * 0.36, Math.PI * 0.2).scale(1, 0.6, 0.6).translate(0, -0.035, -0.125),
    mask: merge([
      new T.TorusGeometry(0.162, 0.011, 4, 12, Math.PI).rotateX(-Math.PI / 2).translate(0, -0.05, -0.02),
      new T.TorusGeometry(0.158, 0.011, 4, 12, Math.PI).rotateX(-Math.PI / 2).translate(0, -0.1, -0.02),
      new T.TorusGeometry(0.15, 0.011, 4, 12, Math.PI).rotateX(-Math.PI / 2).translate(0, -0.145, -0.01),
      new T.CylinderGeometry(0.011, 0.011, 0.11, 5).translate(0, -0.095, -0.178),
      new T.CylinderGeometry(0.011, 0.011, 0.11, 5).translate(-0.07, -0.095, -0.158),
      new T.CylinderGeometry(0.011, 0.011, 0.11, 5).translate(0.07, -0.095, -0.158),
    ]),
    /* limbs end in a ball at the joint, so the next segment meets a clean round edge instead of a ragged intersection */
    upperArm: mkUpperArm(10),
    sleeveCap: lathe([[0.01, 0.052], [0.072, 0.04], [0.09, 0.01], [0.088, -0.13], [0.076, -0.136]], 10),
    sleeve: new T.TorusGeometry(0.086, 0.013, 4, 12).rotateX(Math.PI / 2).translate(0, -0.13, 0),
    foreArm: mkForeArm(10),
    wrist: new T.CylinderGeometry(0.053, 0.049, 0.055, 10).translate(0, -0.215, 0),
    hand: mitt(),
    chin: chinStrap(8),
    collar: collar(4, 12),
    tape: ankleTape(12),
    playband: new T.CylinderGeometry(0.064, 0.062, 0.115, 10).translate(0, -0.125, 0),
    /* a towel tucked into the front of the belt, hanging over one thigh (a career player's own choice: optional) */
    towel: merge([new T.BoxGeometry(0.1, 0.05, 0.05).translate(0.08, -0.03, -0.2), new T.BoxGeometry(0.09, 0.22, 0.016).translate(0.08, -0.15, -0.222)]),
    /* a stripe down both sides of the thigh, following its taper */
    pantStripe: merge([Math.PI / 2, Math.PI * 1.5].map(a => lathe(THIGH.map(([r, y]) => [r + 0.004, y]), 3, a - 0.2, 0.4))),
    thigh: mkThigh(12, true),
    shin: mkShin(12),
    foot: cleat(8),
  };

  /* ---------- the near model ----------
     The same parts in the same joint spaces, with rounder outlines and real shapes where the far model has a plain tube:
     thigh and calf muscle, a knee pad, hands with fingers and a thumb, cleats with a heel, caps on the shoulder pads and
     a collar. render() swaps these in when the camera is close (replays, celebrations, the close view), and the
     portraits always use them. A part missing here uses the far model's. */
  /* A hand seen with the arm hanging: the palm faces the thigh, so it is thin from side to side, the fingers hang in a
     row from front to back and the thumb sits in front. That is the same for a left and a right hand, which share this. */
  function hand() {
    return merge([new T.SphereGeometry(1, 10, 6).scale(0.03, 0.058, 0.05).translate(0, -0.3, 0.002),
      ...[-0.032, -0.011, 0.01, 0.031].map((z, i) => new T.CapsuleGeometry(0.013, 0.04 - Math.abs(i - 1.5) * 0.005, 2, 6).rotateX(0.22).translate(0, -0.366, z)),
      new T.CapsuleGeometry(0.015, 0.03, 2, 6).rotateX(0.75).translate(0, -0.322, -0.056)]);
  }

  const GEO_HI = {
    torso: mkTorso(24),
    pads: merge([new T.SphereGeometry(0.22, 24, 14).scale(1.58, 0.6, 0.98).translate(0, 0.565, 0),
      ...[-1, 1].map(side => new T.SphereGeometry(0.13, 14, 8).scale(1, 0.64, 1.12).translate(side * 0.29, 0.566, 0))]),  // a cap over each shoulder
    collar: collar(6, 18),
    neck: mkNeck(16),
    hips: mkHips(20),
    helmet: helmetShell(28, 18),
    ear: earHoles(14),
    stripe: new T.TorusGeometry(0.177, 0.016, 6, 22, Math.PI).rotateY(Math.PI / 2).scale(2.2, 1.02, 1.12),
    logo: merge([-1, 1].map(side => new T.CylinderGeometry(0.058, 0.058, 0.012, 18).rotateZ(Math.PI / 2).translate(side * 0.168, 0.01, 0.01))),
    face: new T.SphereGeometry(0.122, 18, 12).scale(1, 0.62, 0.6).translate(0, -0.04, -0.118),
    visor: new T.SphereGeometry(0.128, 18, 5, 0, Math.PI * 2, Math.PI * 0.36, Math.PI * 0.2).scale(1, 0.6, 0.6).translate(0, -0.035, -0.125),
    mask: merge([new T.TorusGeometry(0.162, 0.011, 6, 18, Math.PI).rotateX(-Math.PI / 2).translate(0, -0.05, -0.02), new T.TorusGeometry(0.158, 0.011, 6, 18, Math.PI).rotateX(-Math.PI / 2).translate(0, -0.1, -0.02),
      new T.TorusGeometry(0.15, 0.011, 6, 18, Math.PI).rotateX(-Math.PI / 2).translate(0, -0.145, -0.01), new T.CylinderGeometry(0.011, 0.011, 0.11, 6).translate(0, -0.095, -0.178),
      new T.CylinderGeometry(0.011, 0.011, 0.11, 6).translate(-0.07, -0.095, -0.158), new T.CylinderGeometry(0.011, 0.011, 0.11, 6).translate(0.07, -0.095, -0.158)]),
    upperArm: mkUpperArm(14),
    sleeveCap: lathe([[0.01, 0.062], [0.072, 0.046], [0.092, 0.012], [0.091, -0.1], [0.087, -0.138], [0.079, -0.141]], 16),
    sleeve: new T.TorusGeometry(0.086, 0.012, 6, 18).rotateX(Math.PI / 2).translate(0, -0.136, 0),
    foreArm: mkForeArm(14),
    wrist: new T.CylinderGeometry(0.053, 0.049, 0.055, 14).translate(0, -0.215, 0),
    hand: hand(),
    pantStripe: merge([Math.PI / 2, Math.PI * 1.5].map(a => lathe(THIGH.map(([r, y]) => [r + 0.0035, y]), 5, a - 0.17, 0.34))),
    thigh: mkThigh(18, true),
    shin: mkShin(18),
    foot: cleat(12),
  };

  /* Soft contact shading, baked into the vertices of both models (the part's color is multiplied by it): darker where
     another part sits over the surface, so the jersey reads as tucked under the pads and the legs as coming out of the
     pants. Each rule gets a point (x, y, z) and its normal's y, in the space of the joint the part hangs from. */
  const ease = (a, b, x) => {
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const SHADE = {
    torso: (x, y) => lerp(0.6, 1, ease(0.57, 0.4, y)) * lerp(0.7, 1, ease(-0.06, 0.03, y)) * (y > 0.2 ? lerp(0.78, 1, ease(0.21, 0.15, Math.abs(x))) : 1),  // under the pads, at the hem, under the arms
    pads: (x, y, z, ny) => lerp(0.66, 1, ease(-0.55, 0.1, ny)),  // the underside
    neck: () => 0.68,
    hips: (x, y) => (y > 0.098 && y < 0.134 ? 0.42 : 1) * (y > 0.14 ? 0.6 : 1) * lerp(0.86, 1, ease(0.12, 0.02, y)),  // the belt, the waistband's lip, a shade under it
    helmet: (x, y, z, ny) => lerp(0.7, 1, ease(-0.8, -0.25, ny)),  // the rim
    upperArm: (x, y) => lerp(0.68, 1, ease(-0.02, -0.17, y)),  // in the sleeve
    foreArm: (x, y) => lerp(0.84, 1, ease(0.03, -0.06, y)),
    thigh: (x, y) => lerp(0.84, 1, ease(0.04, -0.09, y)),  // where the leg leaves the hips (lightly: pants are one garment, and a hard line there drew a pair of briefs on him)
    tape: (x, y) => lerp(0.8, 1, ease(-0.3, -0.33, y)) * (Math.abs(y + 0.37) < 0.006 || Math.abs(y + 0.41) < 0.006 ? 0.86 : 1),  // under its top edge, and two turns of the tape
    chin: (x, y, z, ny) => lerp(0.8, 1, ease(-0.9, 0, ny)),
    shin: (x, y) => lerp(0.8, 1, ease(0.04, -0.05, y)) * (Math.abs(y + 0.075) < 0.012 || Math.abs(y + 0.105) < 0.012 ? 0.5 : 1),  // out of the pants; two bands round the top of the sock
    foot: (x, y, z, ny) => lerp(0.55, 1, ease(-0.9, -0.2, ny)),  // the sole
  };
  for (const table of [GEO, GEO_HI]) for (const name in table) {
    const g = table[name], p = g.attributes.position, n = g.attributes.normal, f = SHADE[name], c = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) c[i * 3] = c[i * 3 + 1] = c[i * 3 + 2] = f ? f(p.getX(i), p.getY(i), p.getZ(i), n.getY(i)) : 1;
    g.setAttribute('color', new T.BufferAttribute(c, 3));
  }

  /* Low-polygon stand-ins, used only to cast shadows: a flattened silhouette does not need the detail, and at night
     every one of these is drawn four times. Open tubes are fine, the ends never show. */
  const SHADOW_GEO = {
    torso: lathe([[0.178, -0.04], [0.215, 0.32], [0.235, 0.47], [0.2, 0.6], [0.09, 0.67]], 6).scale(1, 1, 0.74),
    pads: new T.SphereGeometry(0.22, 6, 4).scale(1.58, 0.6, 0.98).translate(0, 0.565, 0),
    hips: lathe([[0.11, -0.215], [0.166, -0.11], [0.17, 0.13]], 6).scale(1.1, 1, 0.78),
    helmet: new T.SphereGeometry(0.17, 8, 5).scale(1, 1.02, 1.12),
    upperArm: lathe([[0.07, 0], [0.06, -0.3]], 5),
    foreArm: lathe([[0.054, 0], [0.056, -0.08], [0.058, -0.34]], 5),  // long enough to stand in for the hand
    thigh: lathe([[0.108, 0], [0.086, -0.5]], 6),
    shin: lathe([[0.07, 0], [0.084, -0.13], [0.052, -0.46]], 6),
    foot: new T.BoxGeometry(0.12, 0.08, 0.26).translate(0, -0.465 + ANKLE, -0.07),
  };

  /* What each part is made of (see SH.rim): jersey cloth, a helmet's clear coat, the metal of a facemask, the satin of
     the pants; the rest (skin, socks, gloves, shoes) a plain matte. One material per part, shared by every figure. */
  const FINISH = { torso: 'cloth', pads: 'cloth', sleeveCap: 'cloth', helmet: 'gloss', stripe: 'gloss', mask: 'metal', hips: 'satin', thigh: 'satin' };
  let toonRamp = null;
  function partMat(name, rimmed = true) {
    const k = FINISH[name];
    if (SH.toonOn && SH.toonOn()) {
      // the stylized look: three flat bands of light (see SH.rim for the colored shadows and the painted highlight)
      if (!toonRamp) {
        toonRamp = new T.DataTexture(new Uint8Array([95, 175, 255]), 3, 1, T.RedFormat);
        toonRamp.minFilter = toonRamp.magFilter = T.NearestFilter;
        toonRamp.needsUpdate = true;
      }
      const t = new T.MeshToonMaterial({ color: 0xffffff, vertexColors: true, gradientMap: toonRamp });
      return rimmed ? SH.rim(t, k) : t;
    }
    const m = k === 'gloss' ? new T.MeshPhongMaterial({ color: 0xffffff, shininess: 120, specular: 0x9aa0aa, vertexColors: true })
      : k === 'metal' ? new T.MeshPhongMaterial({ color: 0xffffff, shininess: 70, specular: 0xb8bec8, vertexColors: true })
      : k === 'satin' ? new T.MeshPhongMaterial({ color: 0xffffff, shininess: 22, specular: 0x262a30, vertexColors: true })
      : new T.MeshLambertMaterial({ color: 0xffffff, vertexColors: true });
    if (k === 'cloth') m.extensions = { derivatives: true };  // the mesh fades by pixel size (fwidth); WebGL 1 needs asking
    return rimmed ? SH.rim(m, k) : m;
  }

  const OUTLINED = new Set(['torso', 'pads', 'helmet', 'upperArm', 'foreArm', 'hand', 'hips', 'thigh', 'shin', 'foot', 'sleeveCap']);
  let outlineM = null;
  function outlineMat() {
    if (outlineM) return outlineM;
    outlineM = new T.MeshBasicMaterial({ color: 0x0a0e18, side: T.BackSide });
    outlineM.onBeforeCompile = sh => {
      sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += normalize(normal) * 0.018;');
    };
    outlineM.customProgramCacheKey = () => 'pg-outline';
    return outlineM;
  }

  /* [name, joints it follows, color key, what body type scales it ('body', 'limb' or nothing), casts a shadow] */
  const PART_DEFS = [
    ['torso', ['chest'], 'jersey', 'body', 1], ['pads', ['chest'], 'jersey', 'body', 1], ['neck', ['chest'], 'skin'],
    ['collar', ['chest'], 'trim', 'body'], ['hips', ['pelvis'], 'pants', 'body', 1], ['towel', ['pelvis'], 'towel', 'body', 0, 1],
    ['helmet', ['head'], 'helmet', '', 1], ['ear', ['head'], 'visor'], ['face', ['head'], 'skin'], ['skull', ['head'], 'skin', '', 0, 1], ['hair', ['head'], 'helmet', '', 0, 1], ['brim', ['head'], 'helmet', '', 0, 1], ['stripe', ['head'], 'stripe'], ['logo', ['head'], 'stripe'], ['visor', ['head'], 'visor'], ['mask', ['head'], 'mask'], ['chin', ['head'], 'strap'],
    ['upperArm', ['shL', 'shR'], 'arm', 'limb', 1], ['sleeveCap', ['shL', 'shR'], 'jersey', 'limb'], ['sleeve', ['shL', 'shR'], 'trim', 'limb'],
    ['foreArm', ['elL', 'elR'], 'arm', 'limb', 1], ['wrist', ['elL', 'elR'], 'trim', 'limb'], ['hand', ['elL', 'elR'], 'glove'],
    ['playband', ['elL'], 'band', 'limb', 0, 1],  // a quarterback's play-call wristband, on his left forearm
    ['thigh', ['hipL', 'hipR'], 'pants', 'limb', 1], ['pantStripe', ['hipL', 'hipR'], 'stripe', 'limb'],
    ['shin', ['kneeL', 'kneeR'], 'sock', 'limb', 1], ['tape', ['kneeL', 'kneeR'], 'tape', 'limb'], ['foot', ['ankL', 'ankR'], 'shoe', 'limb', 1],  // the shoe widens with the leg, or a thick ankle pokes through it
  ];

  /* Body types: [shoulder and hip width, depth, height, limb thickness]. Linemen are wide and deep, receivers and
     defensive backs lean, so the two lines read as big men even from the gameplay camera. */
  const BUILD = {
    line: [1.24, 1.34, 1.03, 1.2], end: [1.13, 1.12, 1.05, 1.1], big: [1.08, 1.07, 1.02, 1.08], qb: [1, 1, 1.03, 1],
    back: [1.04, 1.06, 0.96, 1.07], slim: [0.93, 0.92, 1.02, 0.91], db: [0.94, 0.93, 0.99, 0.93], ref: [0.96, 1.04, 0.97, 0.94],
  };

  function buildOf(role) {
    if (/^(LT|LG|C|RG|RT)$/.test(role) || /^DT/.test(role)) return BUILD.line;
    if (/^DE/.test(role)) return BUILD.end;
    if (/^(TE|FB|OLB|MLB)/.test(role)) return BUILD.big;
    if (role === 'QB') return BUILD.qb;
    if (role === 'RB') return BUILD.back;
    if (/^(CB|FS|SS)/.test(role)) return BUILD.db;
    return BUILD.slim;
  }

  function setBuild(f, b) {
    f.bodyS.set(b[0], 1, b[1]);
    f.limbS.set(b[3], 1, b[3]);
    f.shL.position.x = -0.31 * b[0];
    f.shR.position.x = 0.31 * b[0];
    f.hipL.position.x = -0.11 * (0.5 + 0.5 * b[0]);
    f.hipR.position.x = 0.11 * (0.5 + 0.5 * b[0]);
    f.num.scale.set(b[0], 1, b[1]);
    f.nameplate.scale.set(b[0], 1, b[1]);
    f.root.scale.setScalar(PSCALE * b[2]);
  }

  /* officials: white shirt with a striped panel, black trousers and cap; no pads or facemask */
  const REF_COLORS = { jersey: '#f4f4f4', pants: '#15171c', helmet: '#15171c', stripe: '#15171c', trim: '#15171c', sock: '#15171c', number: '#15171c',
    skin: '#d7a078', glove: '#d7a078', shoe: '#0c0c10', mask: '#15171c', visor: '#d7a078' };
  const HOOD = t => ({ jersey: t.c1, pants: '#20242c', helmet: t.c1, stripe: t.c1, trim: t.c2, sock: '#20242c', number: t.c1, glove: SKIN[2], shoe: '#0c0c10', mask: t.c1, visor: SKIN[2], skin: SKIN[2] });  // after the game: a team hoodie and cap
  const REF_HIDE = new Set(['pads', 'mask', 'stripe', 'logo', 'sleeve', 'pantStripe', 'wrist', 'ear', 'chin', 'tape']);
  const BARE_HIDE = new Set([...REF_HIDE, 'helmet', 'visor']), CAP_ON = new Set(['skull', 'hair', 'brim']), HAIR_ON = new Set(['skull', 'hair']);  // no helmet: a cap, or hair
  const SUIT = { jersey: '#1d2433', pants: '#1d2433', helmet: '#2b1f17', stripe: '#1d2433', trim: '#1d2433', sock: '#14171f', number: '#1d2433', glove: '#c99a74', shoe: '#0c0c10', mask: '#1d2433', visor: '#c99a74', skin: '#c99a74' };  // a dark suit; the cap is his hair
  const SKIN = ['#f0c8a4', '#d7a078', '#b3764c', '#8a583a', '#66402e'];

  /* the number, front and back, wrapped over the chest */
  const numberGeometry = () => decal(0.15, 0.2, 0.5, 6, 4, [-1, 1]);

  const numCache = new Map();

  function numberMaterial(num, color) {
    const key = color + '|' + num;
    let m = numCache.get(key);
    if (m) return m;
    const c = document.createElement('canvas');
    c.width = c.height = 128;  // twice the old size: the digits stay crisp in the close cameras
    const x = c.getContext('2d');
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.font = '800 88px Archivo, Arial, sans-serif';
    x.lineJoin = 'round';
    x.lineWidth = 7;
    x.strokeStyle = 'rgba(8,12,20,0.5)';  // the stitched edge of a sewn-on number
    x.strokeText(String(num), 64, 70);
    x.fillStyle = color;
    x.fillText(String(num), 64, 70);
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    tex.anisotropy = 4;
    m = new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: T.DoubleSide });
    m.forceSinglePass = true;  // a flat decal: one draw for both faces instead of the two a see-through, two-sided material gets
    m.isNum = true;
    numCache.set(key, m);
    return m;
  }

  /* the name across the shoulders: one small quad on the back, above the number */
  const nameGeometry = () => decal(0.19, 0.505, 0.6, 6, 3, [1]);  // three rows, to follow the curve of the pads

  const NO_NAME = new T.MeshBasicMaterial({ visible: false });

  function nameMaterial(name, color) {
    if (!name) return NO_NAME;
    const key = 'n|' + color + '|' + name;
    let m = numCache.get(key);
    if (m) return m;
    const c = document.createElement('canvas');
    c.width = 160;
    c.height = 40;
    const x = c.getContext('2d'), txt = String(name).toUpperCase();
    x.fillStyle = color;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.font = '800 26px Archivo, Arial, sans-serif';
    x.fillText(txt, 80, 22, 152);  // long names are squeezed to fit, as on a real jersey
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    m = new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
    numCache.set(key, m);
    return m;
  }

  /* a captain's patch: a "C" over a star, sewn on the chest above the number, in the number's color */
  function patchMaterial(color) {
    const key = 'cap|' + color;
    let m = numCache.get(key);
    if (m) return m;
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    x.fillStyle = color;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.font = '800 40px Archivo, Arial, sans-serif';
    x.fillText('C', 32, 25);
    x.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 4 : 9;
      x.lineTo(32 + Math.cos(a) * r, 52 + Math.sin(a) * r);
    }
    x.fill();
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    m = new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
    numCache.set(key, m);
    return m;
  }

  function stripeMaterial() {
    let m = numCache.get('ref');
    if (m) return m;
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    x.fillStyle = '#15171c';
    for (let i = 0; i < 5; i++) x.fillRect(3 + i * 13, 0, 6, 64);
    m = new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false, side: T.DoubleSide });
    m.forceSinglePass = true;
    numCache.set('ref', m);
    return m;
  }

  const TV_GEO = new T.PlaneGeometry(0.105, 0.105), PATCH_GEO = new T.PlaneGeometry(0.1, 0.1);

  /* ---------- figures ---------- */
  function makeFigure() {
    const g = () => new T.Group();
    const f = { root: g(), pelvis: g(), chest: g(), head: g(), shL: g(), elL: g(), shR: g(), elR: g(), hipL: g(), kneeL: g(), ankL: g(), hipR: g(), kneeR: g(), ankR: g() };
    f.root.add(f.pelvis);
    f.pelvis.position.y = HIP;
    f.pelvis.add(f.chest);
    f.chest.add(f.head);
    f.head.position.y = 0.83;
    for (const [sh, el, side] of [[f.shL, f.elL, -1], [f.shR, f.elR, 1]]) {
      sh.position.set(side * 0.31, 0.56, 0);
      el.position.y = -0.3;
      sh.add(el);
      f.chest.add(sh);
    }
    for (const [hip, knee, ank, side] of [[f.hipL, f.kneeL, f.ankL, -1], [f.hipR, f.kneeR, f.ankR, 1]]) {
      hip.position.set(side * 0.11, 0, 0);
      knee.position.y = -L1;
      ank.position.y = -ANKLE;
      hip.add(knee);
      knee.add(ank);
      f.pelvis.add(hip);
    }
    f.root.scale.setScalar(PSCALE);
    f.num = new T.Mesh(numberGeometry(), numberMaterial(0, '#ffffff'));
    f.nameplate = new T.Mesh(nameGeometry(), NO_NAME);
    f.chest.add(f.num, f.nameplate);
    /* the small numbers on top of the shoulder pads (the ones the high cameras read): they wear whatever the big number wears */
    f.tv = [-1, 1].map(side => {
      const q = new T.Mesh(TV_GEO, NO_NAME);
      q.position.set(side * 0.285, 0.652, 0.005);
      q.rotation.set(-Math.PI / 2, side * 0.42, 0, 'YXZ');
      f.chest.add(q);
      return q;
    });
    f.patch = new T.Mesh(PATCH_GEO, NO_NAME);  // the captain's patch, high on his right chest
    f.patch.position.set(0.105, 0.505, -0.258);
    f.patch.rotation.set(0.32, Math.PI, 0, 'YXZ');
    f.chest.add(f.patch);
    f.cur = new Float32Array(NPOSE);
    f.cur[PELY] = HIP;
    f.bodyS = new T.Vector3(1, 1, 1);
    f.limbS = new T.Vector3(1, 1, 1);
    f.hide = null;
    f.heading = 0;
    f.fall = 0;
    f.fallDir = 1;
    f.fallSide = 0;
    f.seed = Math.random() * 6.28;
    f.snap = true;
    f.ph = Math.random() * 6.28;
    f.lean = 0;  // stride phase and how far he is leaning into a cut
    f.gaitT = 0;  // how long he has been striding (the legs follow the stride exactly once it has settled)
    f.turned = false;  // a defender in coverage who has turned to run instead of shuffling
    f.ox = f.oy = 0;
    f.wind = 0;  // how far a quarterback has wound up for the throw (0 to 1)
    f.rg = new Float32Array(NPOSE);  // the rag doll: how far each joint has been thrown off its pose, and how fast it is going (see flop)
    f.rgv = new Float32Array(NPOSE);
    f.imp = 0;
    f.fallT = 0.3;
    f.by = f.bv = f.spin = 0;
    f.landed = false;
    f.pvx = f.pvy = 0;  // how fast he was going a frame ago: what a hit is measured from
    f.look = f.tip = f.twist = 0;  // how far the helmet is turned toward what he is watching and tipped up at it, and how far the shoulders have come round to help
    f.sx = f.sy = f.svx = f.svy = 0;  // how far he is drawn from the engine's spot to make room (back from the man he is blocking, or clear of a pile), and how fast that is changing
    return f;
  }

  function applyPose(f) {
    const c = f.cur;
    f.pelvis.position.y = c[PELY];
    f.pelvis.rotation.x = c[PELRX];
    f.pelvis.rotation.z = c[PELRZ];
    f.chest.rotation.x = c[CHRX];
    f.chest.rotation.y = c[CHRY];
    f.chest.rotation.z = c[CHRZ];
    f.head.rotation.x = c[HEADRX];
    f.head.rotation.y = c[HEADRY];
    f.shL.rotation.x = c[SLX];
    f.shL.rotation.z = c[SLZ];
    f.elL.rotation.x = c[EL];
    f.shR.rotation.x = c[SRX];
    f.shR.rotation.z = c[SRZ];
    f.elR.rotation.x = c[ER];
    f.hipL.rotation.x = c[HL];
    f.kneeL.rotation.x = c[KL];
    f.hipR.rotation.x = c[HR];
    f.kneeR.rotation.x = c[KR];
    f.ankL.rotation.x = c[AL];
    f.ankR.rotation.x = c[AR];
    f.hipL.rotation.z = c[HLZ];
    f.hipR.rotation.z = c[HRZ];
    f.ankL.rotation.z = c[ALZ];
    f.ankR.rotation.z = c[ARZ];
    f.ankL.rotation.y = c[ALY];
    f.ankR.rotation.y = c[ARY];
  }

  const ZERO4 = new T.Matrix4().makeScale(0, 0, 0), fit4 = new T.Matrix4();

  /* Lettering too small to read is not drawn. Every number, name and shoulder number is a draw of its own, and with 48
     figures they were most of the frame's draws: from the game camera a name is under a pixel tall and the bench's
     shoulder numbers are specks. `lod` is on only while the game's own camera is drawing (never for portraits or the
     test strips); the sizes are in screen pixels, so the close cameras, replays and scenes keep every letter. */
  let lod = false, lodOn = true;
  const SMALL_PX = 1.5, NAME_H = 0.045, TV_H = 0.052, NUM_H = 0.148;  // under a pixel and a half tall it is left out; how tall a name's letters, a shoulder number's digits and a chest number's digits are on the model

  function writeFigure(f, i) {
    let name = true, tv = true, num = true;
    if (lod) {
      const rp = f.root.position, ce = camera.matrixWorld.elements, d = Math.hypot(ce[12] - rp.x, ce[13] - rp.y - 1.5, ce[14] - rp.z);
      const ppu = H * 0.5 * camera.projectionMatrix.elements[5] / Math.max(d, 0.5) * f.root.scale.y;  // screen pixels per unit of his own size
      name = ppu * NAME_H > SMALL_PX;
      tv = ppu * TV_H > SMALL_PX;
      num = ppu * NUM_H > SMALL_PX;
    }
    f.nameplate.visible = name;
    if (f.patch) f.patch.visible = tv;  // about the size of a shoulder number: gone when that is
    if (f.num.material.isNum) f.num.visible = num;
    if (f.tv) {
      const nm = f.num.material, on = tv && !!nm.isNum && f.num.visible !== false && !(f.hide && f.hide.has('pads'));
      for (const q of f.tv) {
        if (q.material !== nm) q.material = nm;
        q.visible = on;
      }
    }
    f.root.updateMatrixWorld(true);
    for (const p of parts) {
      const n = p.joints.length, sc = p.fit === 'body' ? f.bodyS : p.fit === 'limb' ? f.limbS : null, gone = (f.hide && f.hide.has(p.name)) || (p.opt && !(f.extra && f.extra.has(p.name)));
      for (let k = 0; k < n; k++) {
        const jm = f[p.joints[k]].matrixWorld;
        p.mesh.setMatrixAt(i * n + k, gone ? ZERO4 : sc ? fit4.copy(jm).scale(sc) : jm);
      }
    }
  }

  function colorFigure(i, c) {
    for (const p of parts) for (let k = 0; k < p.joints.length; k++) p.mesh.setColorAt(i * p.joints.length + k, col.set((c.byPart && c.byPart[p.name]) || c[p.color] || (p.color === 'arm' ? c.skin : '#f1f1f1')));  // 'arm' is bare skin unless he wears sleeves
  }

  /* Grass stains. A uniform gets dirtier through the game the way a real one does: every time a man goes to the
     ground he picks up turf, most of it on the thighs and knees, some on the socks, a little on the jersey and the
     seat. Green-brown on a dry field, mud in the rain, a wet grey in the snow. Kept per player (team and number) for
     the game; drawn by tinting his parts' colors when the next play is set, so it costs nothing per frame and never
     touches how a play runs. */
  const DIRT = new Map(), DIRT_PART = { thigh: 0.5, pantStripe: 0.4, shin: 0.34, hips: 0.2, torso: 0.18, pads: 0.12, sleeveCap: 0.12 }, dcA = new T.Color(), dcB = new T.Color();
  let dirtGame = null;
  function dirtied(c, d, wx) {
    if (!(d > 0)) return c;
    const mud = wx === 'rain' ? '#4b3a26' : wx === 'snow' ? '#6f7377' : '#5f6a33', k = Math.min(1, d / 7), byPart = {};
    for (const name in DIRT_PART) {
      const key = PART_DEFS.find(x => x[0] === name), base = key && c[key[2]];
      if (!base) continue;
      byPart[name] = '#' + dcA.set(base).lerp(dcB.set(mud), DIRT_PART[name] * k).getHexString();
    }
    return { ...c, byPart };
  }

  /* A career player's own look (C.look in career.js): his skin tone, and his own choice of gloves, cleats, socks,
     visor, facemask and bands over the team's kit. 'kit' (or nothing) leaves a piece as the team wears it; 'team' and
     'team2' are the team's two colors. Bands 'none' takes the sleeve and wrist bands off. No yellow in the list. */
  const LOOK_HEX = { white: '#f1f1f1', black: '#17191e', grey: '#aeb6c2', silver: '#d3dae4', clear: '#9db3c7', dark: '#14161c', red: '#c2362f', blue: '#2d6cdf', green: '#1f9d6b', orange: '#e8742a', pink: '#e0569a', purple: '#7c3aed' };
  const LOOK_HIDE = new Set(['sleeve', 'wrist']), EXTRAS = { t: new Set(['towel']), b: new Set(['playband']), tb: new Set(['towel', 'playband']) };

  /* the optional gear a player wears: a towel if he chose one, and every quarterback has a play-call wristband */
  const gearOf = p => EXTRAS[(p.look && p.look.towel && p.look.towel !== 'kit' ? 't' : '') + (p.role === 'QB' ? 'b' : '')] || null;

  function lookColors(c, look, t) {
    if (!look) return c;
    const o = { ...c }, hex = v => (v === 'team' ? t.c1 : v === 'team2' ? t.c2 : LOOK_HEX[v]);
    if (look.skin >= 0 && SKIN[look.skin]) o.skin = SKIN[look.skin];
    for (const k of ['glove', 'shoe', 'sock', 'visor', 'mask', 'trim', 'arm']) if (look[k] && look[k] !== 'kit' && hex(look[k])) o[k] = hex(look[k]);
    if (look.glove === 'bare') o.glove = o.skin;
    o.towel = hex(look.towel) || '#f1f1f1';
    return o;
  }

  /* Socks that show against the pants, as a uniform's do: team color under light pants, white under dark ones (they
     were white at home and the pants' own color away, so half the time the leg was one color from hip to ankle). */
  const lumOf = hex => {
    const n = parseInt(String(hex).slice(1), 16);
    return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  };
  const sockFor = (pants, t) => lumOf(pants) > 0.6 ? (lumOf(t.c1) < 0.6 ? t.c1 : t.c2) : '#f1f1f1';

  function teamColors(t, home, skin) {
    return home
      ? { jersey: t.c1, pants: t.c2, helmet: t.c2, stripe: t.c1, trim: t.c2, sock: sockFor(t.c2, t), number: t.c2, skin, glove: '#f1f1f1', shoe: '#1b1b1f', mask: '#aeb6c2', visor: '#14161c' }
      : { jersey: '#f1f1f1', pants: t.c1, helmet: t.c1, stripe: '#f1f1f1', trim: t.c1, sock: sockFor(t.c1, t), number: t.c1, skin, glove: '#f1f1f1', shoe: '#1b1b1f', mask: '#aeb6c2', visor: '#14161c' };
  }

  /* The height a pass is drawn at. The engine throws from 1.8 yards up to 1.2; the figures are drawn 1.6 times life
     size, so both ends are lifted to match (out of the hand by the ear, in at the numbers) and the arc is left alone. */
  const passZ = a => a.z + (PSCALE - 1) * lerp(1.8, 1.2, Math.min(1, a.t / a.T));

  /* ---------- cutscenes ----------
     game.js stages the actors (ordinary players with an `act`) and times the scene; here are their poses, the props
     each scene needs, and the camera path. */
  function actPose(f, p, tg, s) {
    const a = p.act;
    if (a === 'cheer') return celebrate(f, !!p.lead, tg, p.lead ? 4 : -1, 0);  // the leader roars, the rest jump, clap, wave
    if (a === 'coin' || a === 'flip' || a === 'signalL' || a === 'signalR') {
      // the referee: the coin shown on an open hand at chest height, then a flick of the thumb (the arm comes up),
      // then an arm straight out to the side that won
      tg[CHRX] = 0.04;
      tg[SRX] = 0.9;
      tg[ER] = 1.1;
      tg[SLX] = 0.1;
      tg[EL] = 0.3;
      if (a === 'flip') {
        const u = Math.min(1, (time - (f.flipAt || (f.flipAt = time))) / 0.25);
        tg[SRX] = lerp(0.9, 1.9, u);
        tg[ER] = lerp(1.1, 0.4, u);
      } else f.flipAt = 0;
      if (a === 'signalL' || a === 'signalR') {
        // he faces the camera (heading pi): his left hand is toward +x on screen... so the winning side's arm goes up and out
        const left = a === 'signalR';
        tg[left ? SLX : SRX] = 1.45;
        tg[left ? SLZ : SRZ] = left ? -1.35 : 1.35;
        tg[left ? EL : ER] = 0.05;
        tg[left ? SRX : SLX] = 0.1;
        tg[left ? ER : EL] = 0.3;
        tg[left ? SRZ : SLZ] = 0;
      }
      return false;
    }
    if (a === 'sit') {
      // the cart's driver on his bench: thighs level, shins down, hands forward on the wheel
      tg[PELY] = 0.68;
      tg[HL] = tg[HR] = 1.5;
      tg[KL] = tg[KR] = -1.45;
      tg[SLX] = tg[SRX] = 0.95;
      tg[EL] = tg[ER] = 1.15;
      tg[CHRX] = 0.08;
      return false;
    }
    if (a === 'aid') {
      // a trainer on one knee beside a hurt man, leaning over him, both hands down on him
      for (let i = 0; i < NPOSE; i++) tg[i] = KNEEL[i];
      tg[CHRX] = -0.5;  // over him (forward is negative)
      tg[SLX] = 0.75;
      tg[SRX] = 0.6;
      tg[SLZ] = 0.15;
      tg[SRZ] = -0.15;
      tg[EL] = 0.35;
      tg[ER] = 0.55;
      tg[HEADRX] = 0.45;
      return false;
    }
    if (a === 'wave') {
      // a wave to the crowd, the right arm high, the hand going side to side
      const w = Math.sin(time * 5);
      tg[SRX] = 2.75;
      tg[SRZ] = 0.35 + w * 0.3;
      tg[ER] = 0.4;
      tg[SLX] = 0.1;
      tg[EL] = 0.3;
      tg[CHRX] = 0.08;
      tg[HEADRX] = -0.15;
      return false;
    }
    if (a === 'podium') {
      // both hands on the podium, leaning on it a little, now and then a nod
      tg[SLX] = tg[SRX] = 0.78;
      tg[SLZ] = 0.12;
      tg[SRZ] = -0.12;
      tg[EL] = tg[ER] = 1.05;
      tg[CHRX] = -0.1;
      tg[HEADRX] = 0.05 + Math.max(0, Math.sin(time * 1.7)) * 0.12;
      return false;
    }
    if (a === 'shake') {
      // a handshake: the right hand out low and forward, a little pump
      const k = Math.sin(time * 9) * 0.06;
      tg[SRX] = 0.95 + k;
      tg[SRZ] = -0.12;
      tg[ER] = 0.45;
      tg[CHRX] = -0.04;
      return false;
    }
    if (a === 'hold') {
      // a jersey held up in front of him in both hands, at his chest, his face over it
      tg[SLX] = tg[SRX] = 1.3;
      tg[SLZ] = 0.3;
      tg[SRZ] = -0.3;
      tg[EL] = tg[ER] = 0.85;
      tg[CHRX] = 0.06;
      return false;
    }
    if (a === 'clap') {
      const c = Math.abs(Math.sin(time * 8 + f.seed));
      tg[SLX] = tg[SRX] = 1.25;
      tg[SLZ] = -0.05 - c * 0.3;
      tg[SRZ] = 0.05 + c * 0.3;
      tg[EL] = tg[ER] = 0.75;
      return false;
    }
    if (a === 'trophy') {
      // the trophy over his head in both hands, pumping it up a little, chest out, looking up at it
      const k = Math.abs(Math.sin(time * 2.6));
      tg[SLX] = tg[SRX] = 2.85 + k * 0.15;
      tg[SLZ] = 0.32;
      tg[SRZ] = -0.32;
      tg[EL] = tg[ER] = 0.55 - k * 0.2;
      tg[CHRX] = 0.14;
      tg[HEADRX] = -0.35;
      tg[PELY] = HIP + k * 0.03;
      return false;
    }
    if (a === 'fold' || a === 'point' || a === 'chest') {
      // standing tall, chin up; arms folded across the chest, or the right arm out at the other man, or a fist to the heart
      const b = Math.sin(time * 1.6 + f.seed) * 0.01;
      tg[CHRX] = 0.05 + b;
      tg[HEADRX] = -0.12;
      tg[SLX] = 0.14;  // upper arms down by the sides, elbows bent tight, fists drawn up against the chest
      tg[SLZ] = 0.3;
      tg[EL] = 2.3;
      tg[SRX] = 0.14;
      tg[SRZ] = -0.3;
      tg[ER] = 2.3;
      if (a === 'point') {
        tg[SRX] = 1.55;
        tg[SRZ] = -0.05;
        tg[ER] = 0.08;
        tg[CHRY] = -0.12;
      } else if (a === 'chest') {
        const k = Math.abs(Math.sin(time * 7));
        tg[SRX] = 0.75 + k * 0.25;
        tg[SRZ] = -0.55;
        tg[ER] = 2.35;
        tg[CHRX] = 0.12;
        tg[HEADRX] = -0.3;
      }
      return false;
    }
    return false;  // 'stand'
  }

  let props = null;
  const CUPAT = new T.Vector3();
  const TUN_X = FW / 2 - 10;  // the tunnel stands off to the left of the goal post, at the back of the end zone

  function softTex(stops) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    stops.forEach(([at, col]) => g.addColorStop(at, col));
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 64);
    return new T.CanvasTexture(c);
  }

  function buildProps() {
    const g = new T.Group();
    scene.add(g);
    /* the walkout: an inflatable tunnel at the back of the end zone (a half tube, dark inside, a ring and a sign at
       the mouth), smoke rolling out of it and two jets of flame either side */
    const tun = new T.Group(), skin = new T.MeshLambertMaterial({ color: 0xffffff }), rim = new T.MeshLambertMaterial({ color: 0xffffff });
    const tube = (r, mat) => new T.Mesh(new T.CylinderGeometry(r, r, 11, 28, 1, true, Math.PI / 2, Math.PI).rotateX(Math.PI / 2), mat);
    const back = new T.Mesh(new T.CircleGeometry(2.45, 24, 0, Math.PI).rotateY(Math.PI).translate(0, 0, 5.5), new T.MeshBasicMaterial({ color: 0x07090f }));
    const ring = new T.Mesh(new T.TorusGeometry(2.55, 0.24, 8, 30, Math.PI).translate(0, 0, -5.5), rim);
    const signC = document.createElement('canvas');
    signC.width = 512;
    signC.height = 96;
    const signTex = new T.CanvasTexture(signC);
    signTex.colorSpace = T.SRGBColorSpace;
    const sign = new T.Mesh(new T.PlaneGeometry(4.6, 0.86), new T.MeshBasicMaterial({ map: signTex, transparent: true }));
    sign.rotation.y = Math.PI;
    sign.position.set(0, 3.25, -5.6);
    tun.add(tube(2.5, skin), tube(2.42, new T.MeshBasicMaterial({ color: 0x0b0f18, side: T.BackSide })), back, ring, sign);
    tun.position.set(TUN_X, 0, 9.5);
    g.add(tun);
    const smokeTex = softTex([[0, 'rgba(225,230,240,0.85)'], [0.5, 'rgba(200,206,218,0.35)'], [1, 'rgba(190,196,210,0)']]);
    const smoke = [...Array(26)].map((_, i) => {
      const sp = new T.Sprite(new T.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false, opacity: 0 }));
      sp.userData = { dx: (Math.random() - 0.5) * 4.4, d: (i / 26) * 1.6, rise: 2 + Math.random() * 2.5, out: 2 + Math.random() * 4, size: 2.2 + Math.random() * 2 };
      g.add(sp);
      return sp;
    });
    const flameTex = softTex([[0, 'rgba(255,240,225,1)'], [0.25, 'rgba(255,120,40,0.95)'], [0.6, 'rgba(230,60,20,0.45)'], [1, 'rgba(160,30,10,0)']]);
    const flames = [];
    for (const side of [-1, 1]) for (let k = 0; k < 7; k++) {
      const sp = new T.Sprite(new T.SpriteMaterial({ map: flameTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0, fog: false }));
      sp.userData = { side, k };
      g.add(sp);
      flames.push(sp);
    }
    /* the championship: a stage at midfield (a dark deck on a skirt in team colors), a silver cup with a football on
       the lid, and fireworks over the stadium (each burst a cloud of points flying out and falling) */
    const stage = new T.Group(), skirt = new T.MeshLambertMaterial({ color: 0xffffff });
    stage.add(new T.Mesh(new T.BoxGeometry(9.5, 0.45, 5.4).translate(0, 0.225, 0), skirt), new T.Mesh(new T.BoxGeometry(9.2, 0.04, 5.1).translate(0, 0.47, 0), new T.MeshLambertMaterial({ color: 0x1b2333 })));
    stage.position.set(FW / 2, 0, -50);
    g.add(stage);
    const silver = new T.MeshPhongMaterial({ color: 0xd9dee8, specular: 0xffffff, shininess: 90 });
    const cupG = merge([lathe([[0.3, 0], [0.3, 0.07], [0.2, 0.09], [0.1, 0.17], [0.07, 0.36], [0.09, 0.44], [0.2, 0.52], [0.29, 0.7], [0.31, 0.9], [0.27, 0.95], [0.01, 0.97]], 24),
      ...[-1, 1].map(sd => new T.TorusGeometry(0.15, 0.025, 6, 16, Math.PI).rotateZ(-sd * Math.PI / 2).translate(sd * 0.3, 0.72, 0)),
      new T.SphereGeometry(0.11, 14, 10).scale(1, 0.62, 0.62).rotateZ(0.5).translate(0, 1.07, 0)]);  // and a football on the lid
    const cup = new T.Mesh(cupG, silver);
    cup.scale.setScalar(1.25);
    g.add(cup);
    const sparkTex = softTex([[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(255,255,255,0.75)'], [1, 'rgba(255,255,255,0)']]);  // white, so each burst takes its own color
    const bursts = [...Array(6)].map((_, i) => {
      const n = 70, geo = new T.BufferGeometry(), dir = new Float32Array(n * 3);
      geo.setAttribute('position', new T.BufferAttribute(new Float32Array(n * 3), 3));
      for (let k = 0; k < n; k++) {
        const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u);
        dir.set([r * Math.cos(a), u, r * Math.sin(a)], k * 3);
      }
      const pts = new T.Points(geo, new T.PointsMaterial({ size: 3.2, map: sparkTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false, color: 0xffffff }));
      pts.frustumCulled = false;
      pts.userData = { dir, at: 0.4 + i * 1.2, x: FW / 2 + (i % 2 ? 1 : -1) * (6 + (i % 3) * 9), y: 17 + (i % 3) * 5, z: -50 - 26 - (i % 2) * 8 };  // over the stands behind the stage
      g.add(pts);
      return pts;
    });
    const boardC = document.createElement('canvas');
    boardC.width = 1024;
    boardC.height = 420;
    const boardTex = new T.CanvasTexture(boardC);
    boardTex.colorSpace = T.SRGBColorSpace;
    const draftBoard = new T.Mesh(new T.PlaneGeometry(13, 5.33), new T.MeshBasicMaterial({ map: boardTex }));
    draftBoard.position.set(FW / 2, 3.4, -(50 + 3.3));
    g.add(draftBoard);
    const shirtC = document.createElement('canvas');
    shirtC.width = 256;
    shirtC.height = 280;
    const shirtTex = new T.CanvasTexture(shirtC);
    shirtTex.colorSpace = T.SRGBColorSpace;
    const shirt = new T.Mesh(new T.PlaneGeometry(1.25, 1.37), new T.MeshBasicMaterial({ map: shirtTex, transparent: true, side: T.DoubleSide }));
    g.add(shirt);
    const pod = new T.Group(), podFront = new T.MeshBasicMaterial({ color: 0xffffff }), podC = document.createElement('canvas');
    podC.width = 256;
    podC.height = 256;
    const podTex = new T.CanvasTexture(podC);
    podTex.colorSpace = T.SRGBColorSpace;
    podFront.map = podTex;
    pod.add(new T.Mesh(new T.BoxGeometry(1.5, 2.05, 0.75).translate(0, 1.025, 0), new T.MeshLambertMaterial({ color: 0x161c28 })));
    const plate = new T.Mesh(new T.PlaneGeometry(1.2, 1.2), podFront);
    plate.position.set(0, 1.15, 0.38);
    pod.add(plate);
    const micMat = new T.MeshLambertMaterial({ color: 0x1a1a1e });
    [-0.28, -0.1, 0.1, 0.3].forEach((x, k) => {
      const arm = new T.Mesh(new T.CylinderGeometry(0.018, 0.018, 0.75, 6).translate(0, 0.37, 0), micMat);
      arm.position.set(x, 2.05, 0.25);
      arm.rotation.x = -0.35 - k * 0.05;
      arm.rotation.z = -x * 0.6;
      const head = new T.Mesh(new T.SphereGeometry(0.06, 10, 8).scale(1, 1.3, 1).translate(0, 0.78, 0), micMat);
      arm.add(head);
      pod.add(arm);
    });
    pod.position.set(FW / 2, 0, -(50.4 - 0.85));
    g.add(pod);
    const wallC = document.createElement('canvas');
    wallC.width = 1024;
    wallC.height = 512;
    const wallTex = new T.CanvasTexture(wallC);
    wallTex.colorSpace = T.SRGBColorSpace;
    const wall = new T.Mesh(new T.PlaneGeometry(12, 6), new T.MeshBasicMaterial({ map: wallTex }));
    wall.position.set(FW / 2, 3, -(50.4 + 1.6));
    g.add(wall);
    const popTex = softTex([[0, 'rgba(255,255,255,1)'], [0.2, 'rgba(235,242,255,0.8)'], [1, 'rgba(220,230,255,0)']]);
    const pops = [...Array(5)].map(() => {
      const sp = new T.Sprite(new T.SpriteMaterial({ map: popTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false, opacity: 0 }));
      sp.userData = { at: Math.random() * 4, x: (Math.random() - 0.5) * 7, h: 2 + Math.random() * 1.6 };
      g.add(sp);
      return sp;
    });
    const stone = new T.MeshPhongMaterial({ color: 0xa9b1bc, specular: 0x3a3f48, shininess: 18 }), plinth = new T.MeshLambertMaterial({ color: 0x2a303b });
    const bust = new T.Group();
    bust.add(new T.Mesh(new T.BoxGeometry(0.95, 1.6, 0.95).translate(0, 0.8, 0), plinth),
      new T.Mesh(merge([new T.SphereGeometry(0.42, 18, 10).scale(1.25, 0.55, 0.7).translate(0, 1.82, 0), new T.CylinderGeometry(0.11, 0.13, 0.26, 12).translate(0, 2.05, 0),
        new T.SphereGeometry(0.2, 20, 14).scale(0.9, 1.1, 1).translate(0, 2.3, 0)]), stone));
    const plaqueC = document.createElement('canvas');
    plaqueC.width = 256;
    plaqueC.height = 200;
    const plaqueTex = new T.CanvasTexture(plaqueC);
    plaqueTex.colorSpace = T.SRGBColorSpace;
    const plaque = new T.Mesh(new T.PlaneGeometry(0.8, 0.62), new T.MeshBasicMaterial({ map: plaqueTex }));
    plaque.position.set(0, 0.95, 0.481);
    bust.add(plaque);
    const clothMat = new T.MeshLambertMaterial({ color: 0xffffff }), cloth = new T.Mesh(new T.ConeGeometry(0.62, 1.15, 20).translate(0, 2.1, 0), clothMat);
    bust.add(cloth);
    bust.position.set(FW / 2 + 1.3, 0.45, -(50 + 0.2));
    g.add(bust);
    const coin = new T.Mesh(new T.CylinderGeometry(0.17, 0.17, 0.03, 24), new T.MeshPhongMaterial({ color: 0xd4d9e2, specular: 0xffffff, shininess: 110 }));
    g.add(coin);
    /* the medical cart (an injury scene), built along its own x axis, drawn at the figures' 1.6 scale: a driver's bench
       under a roof at the front, a flat padded bed behind, four wheels, a stripe in the team's color */
    const cart = new T.Group(), white = new T.MeshLambertMaterial({ color: 0xeef1f5 }), dark = new T.MeshLambertMaterial({ color: 0x22262e }), cartStripe = new T.MeshLambertMaterial({ color: 0x3a6fd8 });
    cart.add(new T.Mesh(new T.BoxGeometry(5.6, 0.36, 2.2).translate(0, 0.62, 0), white));  // the chassis
    cart.add(new T.Mesh(new T.BoxGeometry(5.62, 0.14, 2.22).translate(0, 0.5, 0), cartStripe));
    cart.add(new T.Mesh(new T.BoxGeometry(3.1, 0.16, 2.0).translate(-1.15, 0.88, 0), dark));  // the bed's pad
    cart.add(new T.Mesh(new T.BoxGeometry(1.5, 0.3, 2.0).translate(1.6, 1.0, 0), dark));  // the bench
    cart.add(new T.Mesh(new T.BoxGeometry(0.16, 0.95, 2.0).translate(0.85, 1.45, 0), white));  // its back
    for (const [px, pz] of [[2.4, 1.0], [2.4, -1.0], [0.9, 1.0], [0.9, -1.0]]) cart.add(new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 1.9, 6).translate(px, 1.75, pz), dark));  // roof posts
    cart.add(new T.Mesh(new T.BoxGeometry(1.9, 0.1, 2.3).translate(1.65, 2.72, 0), white));  // the roof
    for (const [px, pz] of [[1.95, 1.1], [1.95, -1.1], [-1.9, 1.1], [-1.9, -1.1]]) cart.add(new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 0.3, 14).rotateX(Math.PI / 2).translate(px, 0.42, pz), dark));
    cart.visible = false;
    g.add(cart);
    props = { g, cart, cartStripe, walk: { tun, skin, rim, signC, signTex, smoke, flames }, champ: { stage, skirt, cup, bursts }, coin, draft: { board: draftBoard, boardC, boardTex, shirt, shirtC, shirtTex, key: '' }, press: { pod, podC, podTex, wall, wallC, wallTex, pops, key: '' }, hof: { bust, cloth, clothMat, plaqueC, plaqueTex, key: '' }, teamKey: '' };
  }

  /* The stage board is 13 yards wide: on a phone held upright the close shots saw only its middle, and a long
     team name ran off both edges. The board is drawn narrower there (down to half), and its lines are written
     pre-stretched and sized to fit, so the letters keep their shape. */
  const boardFit = () => Math.round(clamp((camera ? camera.aspect : 1) / 0.95, 0.5, 1) * 20) / 20;

  function boardLines(x, lines) {
    const k = boardFit();
    props.draft.board.scale.x = k;
    x.save();
    x.translate(512, 0);
    x.scale(1 / k, 1);
    x.textAlign = 'center';
    for (const [txt, px, wt, y, col] of lines) {
      let size = px;
      x.font = `${wt} ${size}px Archivo, Arial, sans-serif`;
      while (size > 22 && x.measureText(txt).width > 940 * k) {
        size -= 4;
        x.font = `${wt} ${size}px Archivo, Arial, sans-serif`;
      }
      x.fillStyle = col;
      x.fillText(txt, 0, y);
    }
    x.restore();
  }

  function updateProps(sc, t0, P) {
    if (!sc) {
      if (props) props.g.visible = false;
      return;
    }
    if (!props) buildProps();
    props.g.visible = true;
    const W = props.walk, on = sc.kind === 'walkout', t = sc.t, Ch = props.champ, champ = sc.kind === 'trophy';
    const Ca = sc.kind === 'injury' && sc.cart;
    props.cart.visible = !!Ca;
    if (Ca) {
      props.cart.position.set(Ca.x, 0, -Ca.y);
      props.cart.rotation.y = Ca.h;
      props.cartStripe.color.set(sc.o.c1 || '#3a6fd8');
    }
    W.tun.visible = on;
    for (const sp of W.smoke) sp.visible = on;
    for (const sp of W.flames) sp.visible = on;
    const podium = sc.kind === 'podium', Pr = props.press;
    Pr.pod.visible = Pr.wall.visible = podium;
    for (const sp of Pr.pops) sp.visible = podium;
    if (podium) {
      if (Pr.key !== t0.ab) {
        Pr.key = t0.ab;
        // the backdrop: the team's name repeated in rows over its color, the way a press room wall is printed
        const x = Pr.wallC.getContext('2d');
        x.fillStyle = t0.c1;
        x.fillRect(0, 0, 1024, 512);
        x.textAlign = 'center';
        x.font = '800 44px Archivo, Arial, sans-serif';
        for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) {
          x.fillStyle = (r + c) % 2 ? 'rgba(255,255,255,0.85)' : t0.c2;
          x.fillText((r + c) % 2 ? t0.ab : t0.name.toUpperCase(), c * 230 + (r % 2 ? 115 : 0), 60 + r * 74, 210);
        }
        Pr.wallTex.needsUpdate = true;
        const y = Pr.podC.getContext('2d');
        y.fillStyle = t0.c1;
        y.fillRect(0, 0, 256, 256);
        y.fillStyle = t0.c2;
        y.textAlign = 'center';
        y.font = '800 92px Archivo, Arial, sans-serif';
        y.fillText(t0.ab, 128, 150, 230);
        y.font = '700 26px Archivo, Arial, sans-serif';
        y.fillText('POSTGAME', 128, 200);
        Pr.podTex.needsUpdate = true;
      }
      for (const sp of Pr.pops) {
        // a camera flash: a white burst for a tenth of a second, from where the photographers are
        const d = sp.userData, u = (t - d.at) % 1.7;
        sp.position.set(FW / 2 + d.x, d.h, -(50.4 - 6));
        sp.scale.setScalar(1.6);
        sp.material.opacity = u >= 0 && u < 0.1 ? 1 - u * 10 : 0;
      }
    }
    const draft = sc.kind === 'draft', Dr = props.draft, hof = sc.kind === 'hof', H = props.hof;
    Ch.stage.visible = champ || draft || hof;
    Ch.cup.visible = champ;
    Dr.board.visible = draft || hof;
    H.bust.visible = hof;
    if (hof) {
      Ch.skirt.color.set(t0.c1);
      const key = 'hof|' + t0.ab + '|' + sc.o.name + '|' + sc.o.cls + '|' + boardFit();
      if (H.key !== key) {
        H.key = key;
        H.clothMat.color.set(t0.c1);
        // the board: the hall, the class, the team colors along the foot
        const x = Dr.boardC.getContext('2d'), gr = x.createLinearGradient(0, 0, 0, 420);
        gr.addColorStop(0, '#0b111d');
        gr.addColorStop(1, '#2a3346');
        x.fillStyle = gr;
        x.fillRect(0, 0, 1024, 420);
        x.fillStyle = t0.c1;
        x.fillRect(0, 392, 1024, 28);
        x.textAlign = 'center';
        x.fillStyle = '#c9d3e6';
        boardLines(x, [[`CLASS ${sc.o.cls}`, 40, 700, 92, '#c9d3e6'], ['HALL OF FAME', 108, 800, 228, '#ffffff'], [String(sc.o.name || '').toUpperCase(), 44, 700, 300, '#ffffff']]);
        Dr.boardTex.needsUpdate = true;
        Dr.key = '';  // the draft redraws its own board next time
        const p = H.plaqueC.getContext('2d');
        p.fillStyle = '#39414f';
        p.fillRect(0, 0, 256, 200);
        p.strokeStyle = '#8e99ab';
        p.lineWidth = 6;
        p.strokeRect(8, 8, 240, 184);
        p.fillStyle = '#e6ebf3';
        p.textAlign = 'center';
        p.font = '800 26px Archivo, Arial, sans-serif';
        p.fillText(String(sc.o.name || '').toUpperCase(), 128, 72, 220);
        p.font = '600 18px Archivo, Arial, sans-serif';
        p.fillText(`${sc.o.pos} \u00b7 #${sc.o.num}`, 128, 108, 220);
        p.fillText(`${t0.city} ${t0.name}`, 128, 136, 220);
        p.fillText(`Class ${sc.o.cls}`, 128, 164, 220);
        H.plaqueTex.needsUpdate = true;
      }
      // the cloth: on until the drum roll ends, then lifted off and away
      const u = clamp((t - 2.6) / 0.8, 0, 1);
      H.cloth.visible = u < 1;
      H.cloth.position.y = u * 2.2;
      H.cloth.scale.setScalar(1 - u * 0.7);
    }
    Dr.board.visible = draft || hof;
    Dr.shirt.visible = draft && !!sc.me && sc.me.act === 'hold';
    if (draft) {
      Ch.skirt.color.set(t0.c1);
      const key = t0.ab + '|' + sc.o.pick + '|' + sc.o.num + '|' + sc.o.name + '|' + boardFit();
      if (Dr.key !== key) {
        Dr.key = key;
        // the board: the draft over the team, in its colors
        const x = Dr.boardC.getContext('2d'), gr = x.createLinearGradient(0, 0, 0, 420);
        gr.addColorStop(0, '#0b111d');
        gr.addColorStop(1, t0.c1);
        x.fillStyle = gr;
        x.fillRect(0, 0, 1024, 420);
        x.fillStyle = t0.c1;
        x.fillRect(0, 404, 1024, 16);
        x.textAlign = 'center';
        x.fillStyle = '#c9d3e6';
        boardLines(x, [[`ROUND 1 \u00b7 PICK ${sc.o.pick}`, 40, 700, 92, '#c9d3e6'], [t0.name.toUpperCase(), 112, 800, 230, '#ffffff'], [t0.city.toUpperCase(), 44, 700, 300, '#ffffff']]);
        Dr.boardTex.needsUpdate = true;
        // the jersey: the team color, the name across the shoulders, the number under it
        const s = Dr.shirtC.getContext('2d');
        s.clearRect(0, 0, 256, 280);
        s.fillStyle = t0.c1;
        s.beginPath();
        s.moveTo(70, 10);
        s.lineTo(186, 10);
        s.lineTo(250, 52);
        s.lineTo(222, 104);
        s.lineTo(200, 92);
        s.lineTo(200, 274);
        s.lineTo(56, 274);
        s.lineTo(56, 92);
        s.lineTo(34, 104);
        s.lineTo(6, 52);
        s.closePath();
        s.fill();
        s.fillStyle = t0.c2;
        s.textAlign = 'center';
        s.font = '800 22px Archivo, Arial, sans-serif';
        s.fillText(String(sc.o.name || '').toUpperCase(), 128, 62, 136);
        s.font = '800 116px Archivo, Arial, sans-serif';
        s.fillText(String(sc.o.num), 128, 196);
        Dr.shirtTex.needsUpdate = true;
      }
      const i = P ? P.indexOf(sc.me) : -1, f = i >= 0 ? figs[SIDELINE + i] : null;
      if (f && Dr.shirt.visible) {
        f.head.getWorldPosition(CUPAT);
        Dr.shirt.position.set(CUPAT.x, CUPAT.y - 1.15, CUPAT.z + 0.58);  // held at his chest, in front of him, toward the cameras
      }
    }
    const toss = sc.kind === 'toss', ref = toss && sc.ref;
    props.coin.visible = !!ref;
    if (ref) {
      // in his hand, then up, spinning, and down onto the turf in front of him, where it lies flat
      const u = clamp((t - 1.4) / 1.6, 0, 1), x0 = ref.x + 0.25, z0 = -(ref.y - 0.45), x1 = ref.x + 0.35, z1 = -(ref.y - 1.2);
      const h = t < 1.4 ? 2.35 : lerp(2.6, 0.03, u) + 9 * u * (1 - u) * 1.35;
      props.coin.position.set(lerp(x0, x1, u), h, lerp(z0, z1, u));
      props.coin.rotation.set(u < 1 && t >= 1.4 ? t * 26 : t < 1.4 ? 0 : 0, 0, 0);
    }
    for (const b of Ch.bursts) b.visible = champ;
    if (champ) {
      Ch.skirt.color.set(t0.c1);
      // the cup in the hands of the man holding it up: just above his helmet, turning slowly
      const i = P ? P.findIndex(p => p.act === 'trophy') : -1, f = i >= 0 ? figs[SIDELINE + i] : null;
      if (f) {
        f.head.getWorldPosition(CUPAT);
        Ch.cup.position.set(CUPAT.x, CUPAT.y + 0.42, CUPAT.z);
        Ch.cup.rotation.y = t * 0.6;
      }
      const cols = [t0.c1, t0.c2, '#ffffff', '#9ad1ff'];
      Ch.bursts.forEach((b, k) => {
        const d = b.userData, u = (t - d.at) / 1.9, pos = b.geometry.attributes.position;
        if (u <= 0 || u >= 1) {
          b.material.opacity = 0;
          return;
        }
        b.material.color.set(cols[k % cols.length]);
        const r = 9 * Math.sqrt(u), fall = 6 * u * u;
        for (let n = 0; n < pos.count; n++) pos.setXYZ(n, d.x + d.dir[n * 3] * r, d.y + d.dir[n * 3 + 1] * r - fall, d.z + d.dir[n * 3 + 2] * r);
        pos.needsUpdate = true;
        b.material.opacity = Math.min(1, u * 10) * (1 - u);
      });
    }
    if (!on) return;
    if (props.teamKey !== t0.ab) {
      props.teamKey = t0.ab;
      W.skin.color.set(t0.c1);
      W.rim.color.set(t0.c1).multiplyScalar(0.7);  // the ring a shade darker than the tube
      const x = W.signC.getContext('2d');
      x.clearRect(0, 0, 512, 96);
      x.fillStyle = t0.c1;
      x.fillRect(0, 0, 512, 96);
      x.fillStyle = t0.c2;
      x.font = '800 62px Archivo, Arial, sans-serif';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText(t0.name.toUpperCase(), 256, 52, 490);
      W.signTex.needsUpdate = true;
    }
    for (const sp of W.smoke) {
      const d = sp.userData, u = (t - 0.55 - d.d) / 3.2;
      if (u <= 0 || u >= 1) {
        sp.material.opacity = 0;
        continue;
      }
      sp.position.set(TUN_X + d.dx * (0.6 + u), 0.4 + u * d.rise, -(-4 + u * d.out));
      sp.scale.setScalar(d.size * (0.6 + u * 1.8));
      sp.material.opacity = 0.55 * Math.min(1, u * 8) * (1 - u);
    }
    for (const sp of W.flames) {
      const d = sp.userData, burst = t > 0.9 && t < 2.5 ? Math.min(1, (t - 0.9) * 6) * Math.min(1, (2.5 - t) * 3) : 0, fl = 0.8 + Math.random() * 0.4;
      sp.position.set(TUN_X + d.side * 3.4, 0.3 + d.k * 0.62 * fl, -(-3.4));
      sp.scale.setScalar((1.6 - d.k * 0.12) * fl);
      sp.material.opacity = burst * (1 - d.k * 0.1);
    }
  }

  /* the camera for each scene: where it stands (v3) and what it looks at (v3b), from the scene's clock */
  const SCENECAM = {
    injury(sc, P, v3, v3b) {
      /* low and close on him and the trainers, then wider, following him (or the cart) off to the sideline */
      const me = sc.me || P[0], s = sc.side || -1, late = sc.cut, C = sc.cart && sc.onCart ? sc.cart : null, fx = C ? C.x : me.x, fy = C ? C.y : me.y;
      if (!late) {
        v3.set(fx - s * 6.5, 3.4, -(fy - 5.5));
        v3b.set(fx - s * 0.6, 0.7, -fy);
      } else {
        v3.set(fx - s * 9.5, 4.6, -(fy - 8.5));
        v3b.set(fx, 1.5, -fy);
      }
    },
    hof(sc, P, v3, v3b) {
      const t = sc.t, me = sc.me || P[0];
      if (t < 2.2) {
        v3.set(FW / 2 - 1.5, 3.8, -(50 - 12));  // the stage, the board, the covered bust
        v3b.set(FW / 2, 2.8, -50);
      } else if (t < 4.2) {
        v3.set(FW / 2 + 1.3, 3.2, -(50 - 4.4));  // on the bust as the cloth comes off
        v3b.set(FW / 2 + 1.3, 2.8, -50.2);
      } else {
        v3.set(FW / 2 + 0.3, 3.6, -(50 - 6.5));  // the two of you, the hall behind
        v3b.set(FW / 2 + 0.3, 3, -50);
      }
    },
    podium(sc, P, v3, v3b) {
      const t = sc.t, me = sc.me || P[0], u = Math.min(1, t / 3);
      v3.set(me.x + lerp(1.6, 0.5, u), lerp(3.4, 3.15, u), -(me.y - lerp(7.5, 3.6, u)));  // pushing in from the back of the room to him
      v3b.set(me.x, lerp(2.6, 2.95, u), -me.y);
    },
    draft(sc, P, v3, v3b) {
      const t = sc.t, me = sc.me || P[0];
      if (t < 2.6) {
        v3.set(FW / 2 - 1, 3.6, -(50 - 11.5));  // the stage and the board, you walking up
        v3b.set(FW / 2 - 1.5, 2.6, -50);
      } else if (t < 4.5) {
        v3.set(FW / 2 + 0.3, 3.3, -(50 - 5.2));  // on the handshake
        v3b.set(FW / 2, 3, -49.6);
      } else {
        v3.set(me.x + 0.4, 3.6, -(me.y - 5.4));  // you with the jersey, the board behind
        v3b.set(me.x, 3.5, -me.y);
      }
    },
    toss(sc, P, v3, v3b) {
      const t = sc.t, ref = sc.ref || P[P.length - 1];
      if (t < 1.4) {
        v3.set(ref.x - 1, 3.4, -(ref.y - 10));  // in front of the referee, the two lines of captains either side
        v3b.set(ref.x, 2.2, -ref.y);
      } else if (t < 3.1) {
        v3.set(ref.x - 2.5, 2, -(ref.y - 6.5));  // low, looking up after the coin
        v3b.set(ref.x, lerp(2.6, 4.6, Math.sin(Math.min(1, (t - 1.4) / 1.6) * Math.PI)), -(ref.y - 0.8));
      } else {
        const w = sc.win === 0 ? -1 : 1;
        v3.set(ref.x + w * 0.8, 2.8, -(ref.y - 5.5));  // on the referee's call and the winners
        v3b.set(ref.x + w * 1.6, 2.3, -ref.y);
      }
    },
    trophy(sc, P, v3, v3b) {
      const t = sc.t, me = sc.me || P[0], a = -0.7 + t * 0.16;
      if (t < 3) {
        v3.set(me.x + Math.sin(a) * 7, 2.3, -me.y + Math.cos(a) * 7);  // low, close, circling the stage
        v3b.set(me.x, 3.1, -me.y);
      } else if (t < 6) {
        v3.set(me.x + Math.sin(a) * 5, 3.2, -me.y + Math.cos(a) * 5);  // in on the trophy
        v3b.set(me.x, 3.9, -me.y);
      } else {
        v3.set(me.x + Math.sin(a) * 26, 15, -me.y + Math.cos(a) * 26);  // up over the field, the fireworks over the stands
        v3b.set(me.x, 6, -me.y);
      }
    },
    final(sc, P, v3, v3b) {
      const t = sc.t, u = smooth(clamp((t - 1.6) / 1.6, 0, 1));
      v3.set(FW / 2 + lerp(-2.5, 0.5, u), lerp(5.2, 2.8, u), -(50 - lerp(15, 5.2, u)));  // wide on both sides coming together, then in on the handshake
      v3b.set(FW / 2, lerp(1.8, 2.5, u), -50);
    },
    half(sc, P, v3, v3b) {
      const u = Math.min(1, sc.t / 4.4);
      v3.set(FW / 2 + 22, lerp(9, 16, u), -(50 - lerp(30, 38, u)));  // from high in the corner, pulling up and back as they go
      v3b.set(FW / 2, 1, -50);
    },
    faceoff(sc, P, v3, v3b) {
      const t = sc.t, me = sc.me || P[0], him = sc.him || P[1], mx = (me.x + him.x) / 2, y = me.y;
      if (t < 2.2) {
        const u = t / 2.2;
        v3.set(mx, 2.6, -(y - lerp(7.5, 5, u)));  // side on, both of them in profile, pushing in
        v3b.set(mx, 2.3, -y);
      } else if (t < 3.9) {
        v3.set(me.x - 1.9, 2.75, -(y - 2.4));  // over your shoulder, on him
        v3b.set(him.x, 2.6, -y);
      } else if (t < 5.6) {
        v3.set(him.x + 1.9, 2.75, -(y + 2.4));  // over his shoulder, on you
        v3b.set(me.x, 2.6, -y);
      } else {
        v3.set(mx, 6, -(y - 11));  // up and away
        v3b.set(mx, 1.8, -y);
      }
    },
    walkout(sc, P, v3, v3b) {
      const t = sc.t, L = sc.lead || P[0] || { x: FW / 2, y: 0 };
      if (t < 2.3) {
        v3.set(TUN_X + 1.7, 1.6, -3.2);  // low on the goal line, looking into the tunnel
        v3b.set(TUN_X, 1.5, 9);
      } else if (t < 4.5) {
        v3.set(TUN_X + 6, 1.9, -7);  // out on the field, the team pouring out of the mouth toward it
        v3b.set(TUN_X + 1, 1.4, 1);
      } else {
        v3.set(FW / 2 + 3.5, 6.5, -(L.y + 12));  // up and out in front: the team, the tunnel, the stands behind
        v3b.set(FW / 2, 1.2, -(L.y - 7));
      }
    },
  };

  /* ---------- the stride: feet that stay where they are put ----------
     A run used to be two sine waves on the hips and knees. Measured, the foot was at its lowest for a twentieth of the
     stride, was sliding backward over the turf at about the runner's own speed while it was there, and sank five
     centimetres into the field. Now each foot is given a place to be and the leg is solved to put it there.
     Each foot spends a share of the cycle on the ground (about half at a walk, a quarter flat out) and the rest in the
     air. On the ground it stays exactly where it landed while the hips travel over it, whichever way he is going:
     forward (the heel peeling up over the toe before it leaves), backward, or sideways in a shuffle, where the hips
     open and the feet stay apart instead of crossing. In the air the ankle swings through on an arc that is higher
     the faster he runs. */
  const smooth = x => x * x * (3 - 2 * x);
  /* How quick the legs are (the owner's word, 2026-11-21: "it feels like they walk/run too slow"). The figures are drawn
     half as big again as life, so a stride the right length for the body turned over slowly: 1.5 steps a second at a
     walk and 3.4 flat out, where people take about 1.9 and 4.5. Every step is this much shorter, so the legs and arms
     turn over this much quicker at the same speed over the ground. */
  const CADENCE = 1.22;
  const stepOf = sp => clamp(0.75 + 0.19 * sp, 0.8, 2.5) / CADENCE;  // yards covered by one step at this speed, running
  const sideStepOf = sp => (0.5 + 0.06 * sp) / 1.12;  // and in a shuffle
  const LEG = [0, 0, 0, 0, 0, 0], GAIT = { duty: 0.4, tu: 0, tw: 0, c0: 0, h: 1, heel: 0, lift: 0, fu: 0, fw: 0, piv: 0, base: 0, walk: 1, wk: 0, toeUp: 0, inw: 0, sx: 0.85, roll: 0, run: 0, lat: 0 };
  const HEELB = 0.06;  // the heel of the shoe, behind the ankle

  /* Two bones, and where the ankle should be: w to his right of the hip, u forward of it, y above the turf. h is how
     high the hip is and pitch how far the heel is lifted (0 is a flat sole). The leg folds in its own plane, the knee
     always forward, and the hip swings that plane out to the side when the foot is not straight under it. Fills LEG:
     the hip forward, the knee, the ankle's pitch, the hip sideways, the ankle's roll and its turn. A place the leg cannot reach is aimed
     at as far as it goes. */
  function legIK(w, u, y, h, pitch) {
    const dy = h - y, D = clamp(Math.hypot(w, u, dy), 0.26, L1 + ANKLE - 0.004), inner = Math.acos(clamp((L1 * L1 + ANKLE * ANKLE - D * D) / (2 * L1 * ANKLE), -1, 1));
    const del = Math.asin(clamp(ANKLE * Math.sin(inner) / D, -1, 1)), out = Math.asin(clamp(w / (D * Math.cos(del)), -1, 1));
    const a = Math.atan2(-u, -dy) - Math.atan2(D * Math.sin(del), -D * Math.cos(del) * Math.cos(out));
    LEG[0] = Math.atan2(Math.sin(a), Math.cos(a));
    LEG[1] = inner - Math.PI;
    LEG[3] = out;
    /* The ankle undoes everything above it, so the shoe points where he faces with its sole flat (or tipped up on
       its toe by `pitch`) however the leg is bent or swung out. That is the turn hip-forward, hip-out, knee taken
       backward, written as the three angles the joint is set by. */
    const th = -LEG[0] - pitch, cb = Math.cos(out), sb = -Math.sin(out), ct = Math.cos(th), st = Math.sin(th), ck = Math.cos(LEG[1]), sk = -Math.sin(LEG[1]);
    LEG[2] = Math.atan2(ck * cb * st + sk * ct, ck * ct - sk * cb * st);
    LEG[4] = Math.atan2(sb * ct, cb);
    LEG[5] = Math.asin(clamp(sb * st, -1, 1));
  }

  /* The shape of the stride for a figure moving at sp yards a second. `along` and `side` are the shares of that
     speed in the direction he faces and to his right: 1 and 0 running forward, -1 and 0 backpedalling, 0 and 1
     shuffling to his right. stepLen is the ground one step covers. */
  function gaitOf(f, sp, run, along, side, stepLen) {
    const g = GAIT, sc = f.root.scale.y, cyc = 2 * stepLen / sc, lat = Math.abs(side), fwd = Math.max(0, along);  // cyc: figure lengths covered in one cycle of two steps
    /* A walk and a run are different gaits, not one gait at two speeds (measured on CMU captures 07_01, 08_04, 16_35,
       35_17, 09_01, 2026-11-21). Walking, a foot is down for more than half the cycle (both are down for a moment),
       it lands on the heel with the toe up, and the hips are highest over the planted foot and lowest between steps.
       Running, both feet are in the air between steps and the hips are lowest over the planted foot. wk is how much
       of a walk this is: all of it under about 1.7 hip heights a second, none over 2 (people change gait at about that speed). */
    const wk = (1 - smooth(clamp((sp / sc - 1.7) / 0.3, 0, 1))) * (1 - lat);  // a narrow band: the two rise and fall opposite ways, and half of each is a flat-hipped glide
    g.wk = wk;
    g.run = run;
    g.lat = lat;
    g.duty = clamp(lerp(lerp(lerp(0.56, 0.7, run), 0.78, wk * fwd), 0.4, lat) / cyc, 0.24, 0.6);  // the hips travel a little less far over a planted foot now the steps are shorter (0.62 to 0.8 before), so he is still in the air between them
    g.tu = g.duty * cyc * along;  // how far the hips travel over a planted foot: forward,
    g.tw = g.duty * cyc * side;  // and to his right
    g.c0 = f.ph / (2 * Math.PI) + 0.63;
    const B = (1 - Math.cos(4 * Math.PI * (g.c0 - g.duty / 2))) / 2;  // 0 over the planted foot, 1 between steps
    /* the run's rise and fall is deeper than it was (0.03 to 0.07 of the hips' height against 0.016 to 0.05; a real
       runner's is nearer 0.09), the hips a little lower over the planted foot, the knee bending under the weight */
    g.h = lerp(lerp(0.955, 0.925, run) + lerp(0.03, 0.07, run) * (1 - 0.6 * lat) * B, 0.985 - 0.04 * B, wk) - 0.07 * lat;
    g.piv = smooth(clamp(along * 4, 0, 1));  // going forward the planted point is the toe, otherwise the whole flat foot
    g.heel = lerp(0.4, 0.95, run) * fwd;
    g.lift = lerp(0.09, 0.4, run) * (0.4 + 0.6 * fwd);  // the foot comes up higher behind him
    g.sx = lerp(0.85, 0.5, run * fwd);  // and soonest at a sprint: the heel snaps up as it leaves, then the knee comes through
    g.toeUp = 0.32 * wk * fwd;  // a walker's heel strike
    g.inw = 0.05 * fwd * (1 - lat);  // the feet land nearer the line he is on than straight under the hips
    g.fu = g.tu * lerp(0.5, 0.46, run) + 0.06 * g.piv;  // where the foot lands: ahead of the hip,
    g.fw = g.tw * 0.5;  // and out to the side he is going
    g.base = 0.22 * lat;  // a shuffle keeps the feet wide apart
    g.walk = clamp((sp - 0.25) / 0.5, 0, 1);  // fades the stride in from standing still
    /* the hips roll: the side whose foot is in the air drops a little as the weight goes onto the other leg (about
       0.1 radians in the captures at every speed; less here, under pads) */
    g.roll = -lerp(0.075, 0.055, run) * (1 - lat) * g.walk * Math.cos(2 * Math.PI * (g.c0 - g.duty / 2));
    return g;
  }

  /* Advance a figure's stride for his velocity (field yards a second) and return its shape, or null when he is as
     good as standing. A shuffle takes shorter, quicker steps than a run at the same speed. */
  function stridePhase(f, vx, vy, dt, step) {
    const sp = Math.hypot(vx, vy);
    if (sp <= 0.25) return null;
    const ch = Math.cos(f.heading), sh = Math.sin(f.heading), along = clamp((vy * ch - vx * sh) / sp, -1, 1), side = clamp((vx * ch + vy * sh) / sp, -1, 1);
    const stepLen = step || lerp(stepOf(sp), sideStepOf(sp), Math.abs(side));  // step: a set length (a quarterback's drop is a counted number of steps)
    f.ph += sp * dt * Math.PI / stepLen;
    return gaitOf(f, sp, Math.min(1, sp / 7.5), along, side, stepLen);
  }

  /* both legs for the stride g, with the hips at height h. The hips may be rolled (tg[PELRZ]: the stride's own roll,
     a lean into a cut): each foot is solved from where its hip joint really is, so it stays where it was put. */
  function strideLegs(tg, g, h) {
    const sw = (1 - g.duty) / g.duty * 0.55;  // a foot leaves and lands moving nearly with the turf
    const roll = tg[PELRZ], cr = Math.cos(roll), sr = Math.sin(roll);
    /* the heel strike: the foot lands on its heel with the toe up by q, and rolls flat; where the ankle is then */
    const sq = Math.sin(g.toeUp), cq = Math.cos(g.toeUp), uLand = g.fu - g.piv * TOE - HEELB * (1 - cq) - SOLE * sq, yLand = SOLE * cq + HEELB * sq;
    for (let k = 0; k < 2; k++) {
      let c = g.c0 + k * 0.5, u, w, y, pitch;
      c -= Math.floor(c);
      const sd = k ? 1 : -1, home = sd * (g.base - g.inw) + g.fw;
      if (c < g.duty) {
        const a = c / g.duty, q = g.toeUp * (1 - smooth(clamp(a / 0.22, 0, 1)));
        if (q > 0.002) {
          // on the heel, the toe coming down
          pitch = -q;
          u = g.fu - g.tu * a - g.piv * TOE - HEELB * (1 - Math.cos(q)) - SOLE * Math.sin(q);
          y = SOLE * Math.cos(q) + HEELB * Math.sin(q);
        } else {
          pitch = g.heel * smooth(clamp((a - 0.5) / 0.5, 0, 1));
          u = g.fu - g.tu * a - g.piv * TOE * Math.cos(pitch) + SOLE * Math.sin(pitch);  // the ankle rides up and forward over the toe
          y = g.piv * TOE * Math.sin(pitch) + SOLE * Math.cos(pitch);
        }
        w = home - g.tw * a;
      } else {
        const t = (c - g.duty) / (1 - g.duty), t2 = t * t, t3 = t2 * t, h0 = 2 * t3 - 3 * t2 + 1, h1 = t3 - 2 * t2 + t + t3 - t2, h2 = 3 * t2 - 2 * t3;
        const u0 = g.fu - g.tu - g.piv * TOE * Math.cos(g.heel) + SOLE * Math.sin(g.heel), y0 = g.piv * TOE * Math.sin(g.heel) + SOLE * Math.cos(g.heel);
        u = h0 * u0 - h1 * g.tu * sw + h2 * uLand;
        w = h0 * (home - g.tw) - h1 * g.tw * sw + h2 * home;
        y = lerp(y0, yLand, smooth(t)) + g.lift * Math.pow(Math.sin(Math.PI * Math.pow(t, lerp(g.sx, 0.85, t))), 1.3);  // up early, and down onto the turf as steeply as ever
        pitch = g.heel * (1 - smooth(Math.min(1, t / 0.55))) - g.toeUp * smooth(clamp((t - 0.55) / 0.45, 0, 1));  // the toe comes up before the heel lands
      }
      /* into the rolled hips' own space: the hip joint has moved up or down with the roll, and the leg hangs from it */
      const hx = sd * 0.11, dx = w - hx * (cr - 1), dy = y - h - hx * sr, lx = dx * cr + dy * sr, ly = -dx * sr + dy * cr;
      legIK(lx, u, 0, -ly, pitch);
      tg[k ? HR : HL] = LEG[0] * g.walk;
      tg[k ? KR : KL] = LEG[1] * g.walk;
      tg[k ? AR : AL] = LEG[2] * g.walk;
      tg[k ? HRZ : HLZ] = LEG[3] * g.walk;
      tg[k ? ARZ : ALZ] = (LEG[4] - roll) * g.walk;  // the sole stays flat on the turf under rolled hips
      tg[k ? ARY : ALY] = LEG[5] * g.walk;
    }
  }

  /* The rest of the body on the stride (2026-11-21; the arms, the turn of the shoulders and the lean each had a line
     of their own before, and the hips did not roll at all). From the same captures: a walker's arms hang nearly
     straight and swing about 0.45 either way; a runner's elbows are bent past a right angle at every speed, and the
     hands go further back than forward; the shoulders turn against the hips by about 0.17 at a walk and a run alike;
     the hips roll and the shoulders tip the other way. sn is the sine of the stride's phase, dirn -1 going backward.
     The hips' own roll (g.roll) is the caller's to put in tg[PELRZ], with whatever else leans him. */
  function strideBody(tg, g, sn, dirn) {
    const run = g.run, rk = 1 - g.wk, on = g.walk * (1 - 0.6 * g.lat), back = dirn < 0;
    const amp = (back ? 0.32 : lerp(0.45, lerp(0.42, 0.88, run * run), rk)) * on, mid = back ? 0.1 : lerp(-0.05, -0.14, rk) * on;
    const bend = back ? 1.5 : lerp(0.42, lerp(1.7, 1.9, run), rk * (1 - g.lat) + g.lat * 0.6), open = lerp(0.18, 0.28, rk);
    tg[SLX] = -sn * amp * dirn + mid;
    tg[SRX] = sn * amp * dirn + mid;
    tg[EL] = lerp(0.3, bend + sn * open * dirn * -1, g.walk);  // the elbow closes as the hand comes forward and opens behind him
    tg[ER] = lerp(0.3, bend + sn * open * dirn, g.walk);
    tg[SLZ] = -0.09 * rk * on;  // a runner's elbows ride a little out from the pads
    tg[SRZ] = 0.09 * rk * on;
    const tw = sn * lerp(0.16, 0.2, run) * on * dirn;
    tg[CHRY] = tw;  // the shoulders turn against the hips,
    tg[HEADRY] = -tw * 0.8;  // and the helmet stays on where he is going
    tg[CHRZ] = -g.roll * 1.6;  // the shoulders tip the other way: the spine curves, the head stays level
  }

  /* An arm, like a leg: two bones from the shoulder, and where the hand should be in the chest's own space (x to his
     right, y up, z behind him). The elbow folds the other way from a knee. Fills ARM: the shoulder forward, the
     shoulder out, the elbow. */
  const ARM = [0, 0, 0], UPPER = 0.3, FORE = 0.3;

  function armIK(tx, ty, tz) {
    const D = clamp(Math.hypot(tx, ty, tz), 0.12, UPPER + FORE - 0.004), bend = Math.PI - Math.acos(clamp((UPPER * UPPER + FORE * FORE - D * D) / (2 * UPPER * FORE), -1, 1));
    const del = Math.atan2(FORE * Math.sin(bend), UPPER + FORE * Math.cos(bend)), out = Math.asin(clamp(tx / (D * Math.cos(del)), -1, 1));
    const a = Math.atan2(tz, ty) - Math.atan2(-D * Math.sin(del), -D * Math.cos(del) * Math.cos(out));
    ARM[0] = Math.atan2(Math.sin(a), Math.cos(a));
    ARM[1] = out;
    ARM[2] = bend;
  }

  /* ---------- the throw ----------
     The whole body throws (2026-11-27; before, only the arms and chest moved over a fixed pair of legs, and the ball
     left his chest while the arm was still going back). Six moments, each a row of TK, in the frame of the throw: `a`
     is toward the target and `b` to the thrower's right as he faces it, in figure units from the spot he stands on.
       0    the carry: side-on, both hands on the ball at the back number, feet under him
       1    cocked: shoulders closed past the hips, the ball up behind the ear with the elbow high, the front hand
            off the ball and pointing, the weight on the back leg and the front foot coming off the turf
       1.5  the stride has landed and the hips are opening; the elbow leads the ball
       2    the release: hips and chest square, the arm long and high in front, the back heel up
       2.4  the arm carries on out at the target, the back foot leaving the turf
       3    the finish: the hand down by the far hip, the chest over the front knee, the back foot brought up level
     Columns: the moment; how far the hips are turned to his right of the target; the hips along `a` and their
     height; the front (left) foot a, b, lift and heel pitch; the back foot the same; the chest's lean, turn against
     the hips and tilt; the throwing hand from its shoulder in the chest's own space (right, up, behind); the front
     hand the same. */
  const TK = [
    [0, 0.45, 0, 0.935, 0.24, -0.106, 0, 0, -0.204, 0.123, 0, 0, -0.05, 0, 0, -0.17, -0.2, -0.2, 0.44, -0.21, -0.21],
    [1, 1.2, -0.07, 0.915, 0.3, -0.1, 0.06, -0.15, -0.204, 0.123, 0, 0, 0.06, -0.3, -0.07, 0.13, 0.2, 0.17, -0.12, -0.08, -0.25],
    [1.5, 0.75, 0.07, 0.92, 0.5, -0.08, 0, 0, -0.204, 0.123, 0, 0.25, -0.02, -0.08, 0.08, 0.2, 0.33, 0.02, -0.05, -0.2, -0.2],
    [2, 0.2, 0.2, 0.94, 0.5, -0.08, 0, 0, -0.204, 0.123, 0, 0.6, -0.18, 0.3, 0.16, 0.1, 0.38, -0.4, 0.05, -0.27, -0.12],
    [2.4, 0, 0.24, 0.935, 0.5, -0.08, 0, 0, -0.1, 0.15, 0.05, 0.9, -0.28, 0.42, -0.05, -0.12, 0.06, -0.5, 0.04, -0.29, -0.06],
    [3, -0.15, 0.27, 0.93, 0.5, -0.08, 0, 0, 0.08, 0.2, 0, 0.35, -0.36, 0.5, -0.2, -0.4, -0.33, -0.2, 0.02, -0.3, -0.02]];
  const THV = new Float32Array(21), TH_LEN = 0.6, TH_WHIP = 0.085, TH_COCK = 0.1, TH_FIN = 0.2;

  /* the row for moment x: the feet go from key to key and stop (a planted foot must not drift), everything else runs
     through the keys without stopping, so the whip has no pause in it */
  function throwAt(x) {
    x = clamp(x, 0, 3);
    let i = 0;
    while (i < TK.length - 2 && x > TK[i + 1][0]) i++;
    const A = TK[i], B = TK[i + 1], h = B[0] - A[0], t = (x - A[0]) / h, P0 = TK[Math.max(0, i - 1)], P3 = TK[Math.min(TK.length - 1, i + 2)];
    const t2 = t * t, t3 = t2 * t, st = t2 * (3 - 2 * t);
    for (let c = 1; c < 21; c++) {
      if (c >= 4 && c <= 11) THV[c] = A[c] + (B[c] - A[c]) * st;
      else {
        const m0 = (B[c] - P0[c]) / (B[0] - P0[0]) * h, m1 = (P3[c] - A[c]) / (P3[0] - A[0]) * h;
        THV[c] = (2 * t3 - 3 * t2 + 1) * A[c] + (t3 - 2 * t2 + t) * m0 + (3 * t2 - 2 * t3) * B[c] + (t3 - t2) * m1;
      }
    }
  }

  /* how far into the throw he is `age` seconds after letting go of the button: `wind` is how far the wind-up had taken
     him already (0 to 1), `rel` when the ball leaves his hand */
  function throwX(age, wind, rel) {
    const cock = Math.max(0, rel - TH_WHIP);
    if (age < cock) return lerp(wind, 1, age / cock);
    if (age < rel) return 1 + Math.pow((age - cock) / (rel - cock), 1.25);
    return 2 + (1 - Math.pow(1 - Math.min(1, (age - rel) / TH_FIN), 2));
  }
  const throwRel = (wind, T) => Math.min(TH_COCK * (1 - wind) + TH_WHIP, 0.4 * (T || 9));

  /* The pose at moment x into tg. With `legs`, the hips and feet too (a set throw); without, the chest and arms over
     whatever the legs are doing (a throw on the run). Returns how far his hips are turned to his right of the target;
     TH_OFF is how far forward of his spot they are, in figure units. */
  let TH_OFF = 0;

  function throwBody(f, tg, x, legs) {
    throwAt(x);
    const v = THV, psi = v[1];
    tg[CHRX] = v[12];
    tg[CHRY] = v[13];
    tg[CHRZ] = v[14];
    armIK(v[15], v[16], v[17]);
    tg[SRX] = ARM[0];
    tg[SRZ] = ARM[1];
    tg[ER] = ARM[2];
    armIK(v[18], v[19], v[20]);
    tg[SLX] = ARM[0];
    tg[SLZ] = ARM[1];
    tg[EL] = ARM[2];
    tg[HEADRX] = -v[12] * 0.6;
    TH_OFF = legs ? v[2] : 0;
    if (legs) {
      const c = Math.cos(psi), sn = Math.sin(psi);
      tg[PELY] = v[3];
      tg[PELRX] = tg[PELRZ] = 0;
      for (let k = 0; k < 2; k++) {
        const o = k ? 8 : 4, a = v[o] - v[2], b = v[o + 1], pitch = Math.max(0, v[o + 3]), toeUp = Math.min(0, v[o + 3]);
        legIK(-a * sn + b * c - (k ? f.hipR : f.hipL).position.x, a * c + b * sn + TOE * (1 - Math.cos(pitch)) + SOLE * Math.sin(pitch), v[o + 2] + SOLE * Math.cos(pitch) + TOE * Math.sin(pitch), v[3], pitch + toeUp);
        tg[k ? HR : HL] = LEG[0];
        tg[k ? KR : KL] = LEG[1];
        tg[k ? AR : AL] = LEG[2];
        tg[k ? HRZ : HLZ] = LEG[3];
        tg[k ? ARZ : ALZ] = LEG[4];
        tg[k ? ARY : ALY] = LEG[5] + (k ? clamp(psi - 1.1, -0.5, 0.2) : clamp(psi - 0.3, -0.45, 0.9));  // the front toe stays nearly on the target and the back foot square to it, whatever the hips are doing
      }
    }
    return psi;
  }

  /* the chest and arms of the throw at moment x, blended over the pose so far by k (a throw on the run, a pump fake):
     with no hips to turn, the chest does part of their turning */
  const TH_UP = [CHRX, CHRY, CHRZ, SRX, SRZ, ER, SLX, SLZ, EL, HEADRX], TH_KEEP = new Float32Array(10);

  function throwUpper(f, tg, x, k) {
    for (let i = 0; i < 10; i++) TH_KEEP[i] = tg[TH_UP[i]];
    const psi = throwBody(f, tg, x, false);
    tg[CHRY] -= (psi - 0.2) * 0.6;
    for (let i = 0; i < 10; i++) tg[TH_UP[i]] = lerp(TH_KEEP[i], tg[TH_UP[i]], k);
    return psi;
  }

  /* the ball in the throwing hand: where it is, in the forearm's own space */
  const TH_GRIP = [0, -0.36, -0.03];
  let lastKicker = null;
  const shot = { of: null, x: 0, y: 0, z: 0, t: 0 };  // the cutscene shot the camera is in: where it stands, how long it has been there
  const spike = [0, 0, 0];  // where a spiked ball left the scorer's hand
  const kickFrom = [0, 0, 0];
  const held = { who: null, on: false, x: 0, y: 0, z: 0, fx: 0, fy: 0, fz: 0, t: 0 };  // who had the ball on the last frame and where it was drawn, for the hand-over

  /* the shortest distance between two segments (a0 to a1, b0 to b1), without making anything new */
  const SD1 = new T.Vector3(), SD2 = new T.Vector3(), SR = new T.Vector3();

  function segGap(a0, a1, b0, b1) {
    SD1.subVectors(a1, a0);
    SD2.subVectors(b1, b0);
    SR.subVectors(a0, b0);
    const a = SD1.dot(SD1), e = SD2.dot(SD2), f = SD2.dot(SR), b = SD1.dot(SD2), c = SD1.dot(SR), den = a * e - b * b;
    let u = den > 1e-9 ? clamp((b * f - c * e) / den, 0, 1) : 0, w = e > 1e-9 ? (b * u + f) / e : 0;
    if (w < 0) {
      w = 0;
      u = a > 1e-9 ? clamp(-c / a, 0, 1) : 0;
    } else if (w > 1) {
      w = 1;
      u = a > 1e-9 ? clamp((b - c) / a, 0, 1) : 0;
    }
    return SR.addScaledVector(SD1, u).addScaledVector(SD2, -w).length();
  }

  const DRIVE = new WeakMap();  // a play's tackle drive (see the fall in pose), kept off the game's own state

  /* Keep a body that is going down on top of the turf, and put a tackler where he belongs on his man. The pose in tg
     is tried on the figure standing at (x, z). If the trunk, the head, a shoulder, an elbow or a knee would be under
     the grass, or (over: the runner's figure) his trunk would be inside the man he has tackled once they are down,
     the hips come up by that much: he lies on the runner, not in him. `over` may also be a list of men (a pile): he
     ends up on top of all of them. Then each hand is solved to its place (reach: two points in the
     world, left hand and right), his feet are let down to the grass behind him, and any foot or hand still under it
     is solved back up. */
  const KEEP = new Float32Array(NPOSE), HAND = new T.Vector3(), inv4 = new T.Matrix4(), TRUNK = [new T.Vector3(), new T.Vector3()];
  const BODIES = [0, 1, 2, 3].map(() => [0, 1, 2, 3, 4, 5, 6, 7, 8].map(() => new T.Vector3())), RUN = BODIES[0];  // the centre lines of up to four men to keep out of
  const RUNSEG = [[0, 1, 0.18], [2, 3, 0.1], [4, 5, 0.1], [3, 6, 0.07], [5, 7, 0.07], [1, 8, 0.15]];  // trunk, thighs, shins, neck and helmet: which two points, and how thick

  const BODYSEG = RUNSEG.slice(0, 5);

  /* the points of a man on top of a pile that must clear the men under him: helmet, hips, mid-thighs, knees, mid-shins and ankles ([joint, radius, along the bone]) */
  const PILEPTS = f => [[f.head, 0.15, 0], [f.hipL, 0.1, 0], [f.hipR, 0.1, 0], [f.hipL, 0.1, -L1 / 2], [f.hipR, 0.1, -L1 / 2], [f.kneeL, 0.08, 0], [f.kneeR, 0.08, 0], [f.kneeL, 0.07, -ANKLE / 2],
    [f.kneeR, 0.07, -ANKLE / 2], [f.ankL, 0.06, 0], [f.ankR, 0.06, 0]];

  /* where a man's centre lines are, as he was drawn last */
  function linesOf(o, L) {
    o.pelvis.localToWorld(L[0].set(0, 0, 0));
    o.chest.localToWorld(L[1].set(0, 0.5, 0));
    L[2].setFromMatrixPosition(o.hipL.matrixWorld);
    L[3].setFromMatrixPosition(o.kneeL.matrixWorld);
    L[4].setFromMatrixPosition(o.hipR.matrixWorld);
    L[5].setFromMatrixPosition(o.kneeR.matrixWorld);
    L[6].setFromMatrixPosition(o.ankL.matrixWorld);
    L[7].setFromMatrixPosition(o.ankR.matrixWorld);
    o.head.localToWorld(L[8].set(0, 0.12, 0));
  }

  function settle(f, tg, x, z, reach, over, rest, trail) {
    const sc = f.root.scale.y, tryOn = () => {
      f.cur.set(tg);
      applyPose(f);
      f.root.position.set(x, 0, z);
      f.root.rotation.y = f.heading;
      f.root.updateMatrixWorld(true);
    };
    const under = () => {
      let d = 0;
      for (const [j, y, r] of [[f.head, 0, 0.17], [f.chest, 0.4, 0.18], [f.pelvis, 0, 0.16], [f.shL, 0, 0.1], [f.shR, 0, 0.1], [f.elL, 0, 0.06], [f.elR, 0, 0.06], [f.kneeL, 0, 0.09], [f.kneeR, 0, 0.09]]) {
        d = Math.max(d, r * sc - j.localToWorld(HAND.set(0, y, 0)).y);
      }
      if (nb) {
        f.pelvis.localToWorld(TRUNK[0].set(0, 0, 0));
        f.chest.localToWorld(TRUNK[1].set(0, 0.5, 0));
        for (let b = 0; b < nb; b++) for (const [i, k, r] of trail ? RUNSEG : BODYSEG) {
          // the helmet only counts for a man on top of a pile: a tackler is meant to have his head beside the runner's
          d = Math.max(d, ((r + 0.17) * sc - 0.02 - segGap(TRUNK[0], TRUNK[1], BODIES[b][i], BODIES[b][k])) * rest);  // rest: 0 at the hit (they meet standing), 1 once they are down
          if (nb > 1) for (const [j, rr, along] of PILEPTS(f)) {
            /* on a pile his helmet and legs have to clear the men under him too, not only his trunk */
            j.localToWorld(HAND.set(0, along, 0));
            d = Math.max(d, ((r + rr) * sc - 0.02 - segGap(HAND, HAND, BODIES[b][i], BODIES[b][k])) * rest);
          }
        }
      }
      return d;
    };
    const list = !over ? [] : Array.isArray(over) ? over.filter(Boolean).slice(0, BODIES.length) : [over];
    let nb = list.length;
    list.forEach((o, b) => linesOf(o, BODIES[b]));
    KEEP.set(f.cur);
    const dbg = trail && settle.debug ? (settle.dbg = []) : null;  // test hook: the overlap on each pass, recorded only while besideTest() runs
    for (let pass = 0; pass < (trail ? 6 : 3); pass++) {
      tryOn();
      const d = under();
      if (dbg) dbg.push(Math.round(d * 91.44));
      if (d <= 0.002) break;
      tg[PELY] += d / sc;
    }
    tryOn();
    inv4.copy(f.chest.matrixWorld).invert();
    for (let k = 0; k < 2; k++) {
      const sh = k ? f.shR : f.shL, el = k ? f.elR : f.elL;
      if (reach) {
        HAND.copy(reach[k]);
        if (nb) for (const [i, j, r] of RUNSEG) {
          /* on the runner, not in him: a hand that would be inside his trunk or a leg is pushed out to the surface */
          SD1.subVectors(RUN[j], RUN[i]);
          SD2.subVectors(HAND, RUN[i]).addScaledVector(SD1, -clamp(SD2.subVectors(HAND, RUN[i]).dot(SD1) / (SD1.dot(SD1) || 1), 0, 1));
          const gap = SD2.length(), need = (r + 0.05) * sc;
          if (gap < need) HAND.addScaledVector(SD2, (need - gap) / (gap || 1));
        }
      } else el.localToWorld(HAND.set(0, -0.3, 0));
      if (!reach && HAND.y >= 0.06 * sc) continue;
      HAND.y = Math.max(HAND.y, 0.06 * sc);
      HAND.applyMatrix4(inv4);
      armIK(HAND.x - sh.position.x, HAND.y - sh.position.y, HAND.z - sh.position.z);
      tg[k ? SRX : SLX] = ARM[0];
      tg[k ? SRZ : SLZ] = ARM[1];
      tg[k ? ER : EL] = ARM[2];
    }
    inv4.copy(f.pelvis.matrixWorld).invert();
    for (let k = 0; k < 2; k++) {
      const hip = k ? f.hipR : f.hipL;
      HAND.setFromMatrixPosition((k ? f.ankR : f.ankL).matrixWorld);
      if ((!over || trail) && HAND.y >= SOLE * sc) continue;  // trail: a man on top of a pile lets his legs trail behind him
      HAND.y = SOLE * sc;
      HAND.applyMatrix4(inv4);
      legIK(HAND.x - hip.position.x, -(HAND.z - hip.position.z), 0, -(HAND.y - hip.position.y), 0.5);
      tg[k ? HR : HL] = LEG[0];
      tg[k ? KR : KL] = LEG[1];
      tg[k ? AR : AL] = LEG[2];
      tg[k ? HRZ : HLZ] = LEG[3];
      tg[k ? ARZ : ALZ] = LEG[4];
      tg[k ? ARY : ALY] = LEG[5];
    }
    over = null;  // solving a limb can push its elbow or knee under: one more look at the grass alone
    nb = 0;
    tryOn();
    const d = under();
    if (d > 0.002) tg[PELY] += d / sc;
    f.cur.set(KEEP);
  }

  /* Ease a figure toward the pose in tg at rate k. A stride that has settled is followed almost exactly: easing it
     would round off the very positions that keep the feet planted. */
  function easePose(f, tg, k, striding, dt, kArm) {
    f.gaitT = striding ? f.gaitT + dt : 0;
    const kLeg = lerp(k, Math.max(k, 1 - Math.exp(-dt * 150)), clamp(f.gaitT / 0.2, 0, 1));
    for (let i = 0; i < NPOSE; i++) {
      let d = tg[i] - f.cur[i];
      if (i === SLX || i === SRX) {
        /* a shoulder goes round the short way: an arm asked to go from straight up and a little behind (3.0) to
           straight up and a little in front (-3.0, the same place to the eye) used to swing down through his hips */
        if (d > Math.PI) d -= 2 * Math.PI;
        else if (d < -Math.PI) d += 2 * Math.PI;
      }
      f.cur[i] += d * (i === PELY || i === PELRZ || i >= HL ? kLeg : kArm !== undefined && i >= SLX && i <= ER ? kArm : k);  // the hips' roll too: the legs are solved for it
    }
    for (const i of [SLX, SRX]) if (f.cur[i] > Math.PI) f.cur[i] -= 2 * Math.PI;
    else if (f.cur[i] < -Math.PI) f.cur[i] += 2 * Math.PI;
  }

  /* Stand a set pose on the turf: both soles flat, the hips moved up or down until the lower foot rests exactly on
     the ground, and the other foot let down onto its toe if it is still short of it. (The shoe used to be one piece
     with the shin, so in a crouch the toes were buried in the field.) */
  function plant(tg) {
    let low = 9, hi = 0;
    const sole = [0, 0];
    for (let k = 0; k < 2; k++) {
      const A = tg[PELRX] + tg[k ? HR : HL], B = A + tg[k ? KR : KL];
      tg[k ? AR : AL] = -B;
      sole[k] = tg[PELY] - L1 * Math.cos(A) - ANKLE * Math.cos(B) - SOLE;
      low = Math.min(low, sole[k]);
      hi = Math.max(hi, sole[k]);
    }
    tg[PELY] -= low;
    if (hi - low > 0.004) tg[sole[1] > sole[0] ? AR : AL] -= Math.asin(Math.min(0.9, (hi - low) / TOE));
  }

  const HIPS = new T.Vector3(), REACH = [new T.Vector3(), new T.Vector3()];

  /* ---------- eyes ----------
     Nobody plays football looking straight ahead. Everyone has something to watch: the ball while it is in the air or
     loose; the man carrying it (for the defense); the quarterback, for a receiver whose route has had time to develop;
     before the snap, the quarterback for the defense and the ball for the men split wide. A quarterback in the pocket
     goes through his receivers. watching() fills EYE with the spot (across the field, up the field, and its height
     in yards, or -1 when it is a man and not a ball in the sky) and says whether there is one. */
  const EYE = [0, 0, 0];

  function watching(f, p, s, inPocket) {
    const ps = s.ps, a = ps.air, c = ps.carrier;
    if (a) {
      EYE[0] = a.x;
      EYE[1] = a.y;
      EYE[2] = a.kick ? a.z : passZ(a);
      return true;
    }
    EYE[2] = -1;
    if (ps.loose) {
      EYE[0] = ps.loose.x;
      EYE[1] = ps.loose.y;
      return true;
    }
    if (s.pre) {
      const off = p.team === ps.offTeam;
      if (p === ps.qb || (off && !ps.qb)) return false;
      EYE[0] = off ? ps.bx : ps.qb ? ps.qb.x : ps.bx;
      EYE[1] = off ? ps.los : ps.qb ? ps.qb.y : ps.los;
      return EYE[0] !== undefined && EYE[1] !== undefined;
    }
    if (inPocket && ps.recs && ps.recs.length) {
      const r = ps.recs[Math.floor(time / 0.75 + f.seed) % ps.recs.length];  // first read, second read, third
      EYE[0] = r.x;
      EYE[1] = r.y;
      return true;
    }
    if (c && c === p && s.P && s.live) {
      /* the ball carrier looks at the man about to hit him: the defender closing on him soonest, inside four yards
         (the neck limit below means he only finds one coming from in front or the side) */
      let best = null, soon = 0.9;
      for (const q of s.P) {
        if (q.team === p.team || q.down || q.fell || q.eng || q.block) continue;
        const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy);
        if (d > 4 || d < 0.3) continue;
        const close = -(dx * (q.vx - p.vx) + dy * (q.vy - p.vy)) / d;  // how fast the gap shrinks
        const t = close > 0.5 ? d / close : 9;
        if (t < soon) {
          soon = t;
          best = q;
        }
      }
      if (best) {
        EYE[0] = best.x;
        EYE[1] = best.y;
        return true;
      }
    }
    if (!c || c === p) return false;
    /* the offense looks where it is going, but a receiver looks back for the ball once he is into his route */
    if (p.team === ps.offTeam && !(c === ps.qb && ps.mode === 'pass' && !ps.thrown && ps.recs && ps.recs.includes(p) && ps.t > 0.9 + (f.seed % 1) * 0.7)) return false;
    EYE[0] = c.x;
    EYE[1] = c.y;
    return true;
  }

  /* ---------- hands on the other man ----------
     The pose in tg is tried on the figure standing at (x, z), and each arm is solved to a spot on the other man's
     trunk, on the side of it that faces him: side by side on the chest plate, or (high) a little wider and higher,
     toward the shoulder pads. `drive` moves the hands in and out a little, so a block is a shove and not two statues. */
  const CHEST = new T.Vector3(), MINE = new T.Vector3();

  function handsOn(f, tg, x, z, of, high, drive) {
    const osc = of.root.scale.y, deep = of.bodyS.z;  // a lineman's chest is a third deeper than a receiver's
    KEEP.set(f.cur);
    f.cur.set(tg);
    applyPose(f);
    f.root.position.set(x, 0, z);
    f.root.rotation.y = f.heading;
    f.root.updateMatrixWorld(true);
    of.chest.localToWorld(CHEST.set(0, high ? 0.46 : 0.38, 0));
    f.chest.localToWorld(MINE.set(0, 0.5, 0));
    let ux = MINE.x - CHEST.x, uz = MINE.z - CHEST.z;
    const ul = Math.hypot(ux, uz) || 1;
    ux /= ul;
    uz /= ul;
    /* his own right is (cos h, -sin h) on the ground: the spot further that way is the right hand's */
    const out = (0.18 * deep + 0.024 + drive) * osc, wide = (high ? 0.15 : 0.09) * osc, side = -uz * Math.cos(f.heading) - ux * Math.sin(f.heading) > 0 ? 1 : -1;
    inv4.copy(f.chest.matrixWorld).invert();
    for (let k = 0; k < 2; k++) {
      const w = (k ? 1 : -1) * side * wide, sh = k ? f.shR : f.shL;
      HAND.set(CHEST.x + ux * out - uz * w, CHEST.y, CHEST.z + uz * out + ux * w).applyMatrix4(inv4);
      armIK(HAND.x - sh.position.x, HAND.y - sh.position.y, HAND.z - sh.position.z);
      tg[k ? SRX : SLX] = ARM[0];
      tg[k ? SRZ : SLZ] = ARM[1];
      tg[k ? ER : EL] = ARM[2];
    }
    f.cur.set(KEEP);
  }

  /* ---------- the pile ----------
     When a ball carrier goes down, the defenders who are on top of the play by then (the two nearest, within two yards,
     not counting the tackler) do not pull up: they dive on, and are drawn lying across the runner and the tackler,
     their hips lifted until they rest on top of both (and on each other) rather than inside them. The top of the pile
     gets up first. Chosen once for each play, from where everybody is when the runner is first seen down. */
  let pileFor = null, pileList = [];

  function pileOf(s) {
    const ps = s.ps, c = ps.carrier, tk = ps.tackler;
    if (pileFor === ps) return pileList;
    pileFor = ps;
    pileList = (s.P || []).filter(q => q && q !== c && q !== tk && q.team !== c.team && !q.down && !q.fell && !(q.flat > 0) && Math.hypot(q.x - c.x, q.y - c.y) < 2)
      .sort((a, b) => Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y)).slice(0, 2);
    return pileList;
  }

  /* ---------- room round a tackle ----------
     The engine lets players coast to a stop wherever they are when the whistle goes, and at the size they are drawn
     that often left a man standing inside the tackler's back or the runner's legs. clearOf() says how far, and which
     way, a man standing at (x, z) has to be moved to be `room` yards from the line a-b on the ground, and adds it to
     PUSH; the pose code moves him that far, over a few frames. */
  const PUSH = [0, 0];

  function clearOf(x, z, a, b, room) {
    const abx = b.x - a.x, abz = b.z - a.z, t = clamp(((x - a.x) * abx + (z - a.z) * abz) / (abx * abx + abz * abz || 1), 0, 1);
    const dx = x - (a.x + abx * t), dz = z - (a.z + abz * t), d = Math.hypot(dx, dz);
    if (d >= room) return;
    PUSH[0] += (d > 1e-3 ? dx / d : 1) * (room - d);
    PUSH[1] += (d > 1e-3 ? dz / d : 0) * (room - d);
  }

  /* ---------- animation: fill TG with the pose this player wants ---------- */
  function stanceOf(p, s) {
    if (s.ps.mode === 'ko') return 'wide';
    if (p.isOL || /^D[ET]/.test(p.role) || p.role === 'TE') return 'line';
    if (p.role === 'QB') return Math.abs(p.y - s.ps.los) < 2.6 ? 'under' : 'two';
    return /^(RB|FB|OLB|MLB)/.test(p.role) ? 'two' : 'wide';
  }

  /* touchdown: the scorer does one of eleven celebrations (CELEBS in game.js: jump, spike, strut, kneel, roar, bow,
     shuffle, salute, to the sky, flex, leap). The game picks it (style) when the touchdown is scored; a career player
     can choose his own. His teammates jump, pump a fist, clap, wave to the crowd or shuffle, each to his own seed,
     unless the whole side celebrates together (group 1: everyone jumps on the same beat, 2: everyone shuffles). */
  function shuffleStep(tg, w) {
    // a side-to-side shuffle: the weight goes from foot to foot, shoulders against the hips, elbows bent and swinging
    tg[PELY] = HIP - 0.06 + Math.abs(w) * 0.04;
    tg[PELRZ] = w * 0.1;
    tg[CHRY] = -w * 0.35;
    tg[HL] = tg[HR] = 0.25;
    tg[KL] = -0.35 - 0.25 * Math.max(0, w);
    tg[KR] = -0.35 - 0.25 * Math.max(0, -w);
    tg[SLX] = 0.6 + w * 0.55;
    tg[SRX] = 0.6 - w * 0.55;
    tg[SLZ] = -0.3;
    tg[SRZ] = 0.3;
    tg[EL] = tg[ER] = 1.5;
    tg[HEADRX] = 0.1;
  }

  /* The newer celebrations (1.22), the scorer's twelfth to eighteenth. Each says what the ball is doing (celebBall):
     0 tucked as he carries it, 1 in his throwing hand, 2 on the turf in front of him, 3 the same and spinning,
     4 cradled at his chest, 5 spiked (it leaves his hand and bounces away). */
  const CELEB_N = 18;
  let celebBall = 0;

  function celebMore(f, tg, v) {
    const t = celebT, b = Math.abs(Math.sin(time * 6.5));
    if (v === 11) {
      // a phone call: the ball at his ear, the other hand on his hip, weight on one leg, nodding along; then he hangs up
      const done = t % 3.4 > 2.7 ? smooth((t % 3.4 - 2.7) / 0.3) : 0;
      armIK(-0.19, lerp(0.3, -0.1, done), lerp(-0.08, -0.4, done));
      tg[SRX] = ARM[0];
      tg[SRZ] = ARM[1];
      tg[ER] = ARM[2];
      tg[SLX] = 0.3;
      tg[SLZ] = -0.75;
      tg[EL] = 1.9;
      tg[PELRZ] = 0.07 + Math.sin(time * 2.4) * 0.03;
      tg[CHRZ] = -0.08;
      tg[HEADRX] = 0.08 + Math.max(0, Math.sin(time * 5.5)) * 0.12 * (1 - done);
      tg[HEADRY] = -0.25 * (1 - done);
      tg[HL] = 0.12;
      tg[KL] = -0.3;
      tg[HR] = -0.04;
      celebBall = 1;
      return false;
    }
    if (v === 12) {
      // push-ups beside the ball: down on his hands, body straight, pumping
      const w = Math.abs(Math.sin(time * 4.6)), drop = smooth(Math.min(1, t / 0.5));
      tg[PELY] = lerp(HIP, 0.36 + w * 0.13, drop);
      tg[PELRX] = -1.42 * drop;
      tg[CHRX] = 0;
      tg[HEADRX] = 0.55 * drop;
      tg[SLX] = tg[SRX] = 1.45 * drop;
      tg[SLZ] = -0.25 * drop;
      tg[SRZ] = 0.25 * drop;
      tg[EL] = tg[ER] = lerp(0.3, 1.35 * (1 - w), drop);
      tg[HL] = tg[HR] = 0.03;
      tg[KL] = tg[KR] = -0.06;
      tg[AL] = tg[AR] = 1.0 * drop;
      celebBall = 2;
      return true;
    }
    if (v === 13) {
      // a shimmy: low, arms out, the shoulders shaking fast over slow hips
      const w = Math.sin(time * 17), h = Math.sin(time * 4.2);
      tg[PELY] = HIP - 0.15 + Math.abs(h) * 0.04;
      tg[PELRZ] = h * 0.1;
      tg[CHRX] = -0.12 + h * 0.1;
      tg[CHRY] = w * 0.32;
      tg[CHRZ] = w * 0.1;
      tg[SLX] = tg[SRX] = 0.45;
      tg[SLZ] = -0.95;
      tg[SRZ] = 0.95;
      tg[EL] = tg[ER] = 1.25;
      tg[HL] = tg[HR] = 0.5;
      tg[KL] = tg[KR] = -0.85;
      tg[HLZ] = -0.14;
      tg[HRZ] = 0.14;
      tg[HEADRX] = 0.12;
      plant(tg);
      celebBall = 2;
      return true;
    }
    if (v === 14) {
      // rocking the ball like a baby: cradled in both arms, swaying, his head down over it
      const w = Math.sin(time * 3.1);
      tg[SLX] = tg[SRX] = 0.78;
      tg[SLZ] = 0.26;
      tg[SRZ] = -0.26;
      tg[EL] = tg[ER] = 1.72;
      tg[CHRY] = w * 0.5;
      tg[CHRZ] = w * 0.1;
      tg[CHRX] = -0.1;
      tg[HEADRX] = -0.32;
      tg[PELRZ] = w * 0.06;
      tg[PELY] = HIP - 0.05;
      tg[HL] = tg[HR] = 0.18;
      tg[KL] = tg[KR] = -0.34;
      plant(tg);
      celebBall = 4;
      return false;
    }
    if (v === 15) {
      // the statue: one knee up, one arm straight out in front, the ball tucked, held still
      const up = smooth(Math.min(1, t / 0.45)), wob = Math.sin(time * 2.2) * 0.02;
      tg[SLX] = 1.5 * up;
      tg[SLZ] = -0.1;
      tg[EL] = 0.06;
      tg[SRX] = 0.45;
      tg[ER] = 1.9;
      tg[SRZ] = -0.2;
      tg[HL] = 1.25 * up;
      tg[KL] = -1.5 * up;
      tg[AL] = 0.5 * up;
      tg[HR] = -0.05;
      tg[KR] = -0.12;
      tg[CHRX] = -0.12 + wob;
      tg[CHRY] = 0.2 * up;
      tg[HEADRX] = 0.1;
      tg[PELY] = HIP - 0.02;
      return false;
    }
    if (v === 16) {
      // a bow and arrow at the sky: the front arm long, the back hand drawn to the cheek, let go, watch it fly
      const ph = t % 2.1, draw = ph < 1.1 ? smooth(ph / 1.1) : ph < 1.25 ? 1 - (ph - 1.1) / 0.15 : 0, gone = ph >= 1.25 ? 1 : 0;
      tg[CHRY] = -0.75;
      tg[CHRX] = 0.2;
      tg[HEADRY] = 0.7;
      tg[HEADRX] = -0.3;
      tg[SLX] = 2.05;
      tg[SLZ] = -0.85;
      tg[EL] = 0.05;
      tg[SRX] = lerp(1.9, 1.55, draw) + gone * 0.5;
      tg[SRZ] = lerp(0.2, 0.75, draw);
      tg[ER] = lerp(0.5, 2.3, draw) * (1 - gone * 0.8);
      tg[HLZ] = -0.16;
      tg[HRZ] = 0.16;
      tg[HL] = 0.1;
      tg[HR] = 0.25;
      tg[KR] = -0.4;
      tg[PELY] = HIP - 0.04;
      plant(tg);
      celebBall = 2;
      return false;
    }
    // 17, the ball spun on the turf: down on a knee, a flick of the wrist, then up with both arms wide while it turns
    const dn = t < 1.5 ? smooth(Math.min(1, t / 0.35)) : 1 - smooth(Math.min(1, (t - 1.5) / 0.4));
    for (let i = 0; i < NPOSE; i++) tg[i] = lerp(STAND[i], KNEEL[i], dn);
    tg[SRX] = lerp(2.6, 1.05, dn) + (t > 0.5 && t < 0.8 ? Math.sin((t - 0.5) / 0.3 * Math.PI) * 0.35 : 0);
    tg[ER] = lerp(0.45, 0.25, dn);
    tg[SRZ] = lerp(0.8, 0.1, dn);
    tg[SLX] = lerp(2.6, 0.5, dn);
    tg[SLZ] = lerp(-0.8, -0.2, dn);
    tg[EL] = lerp(0.45, 0.9, dn);
    tg[HEADRX] = lerp(0.2, -0.35, dn);
    if (dn < 0.05) tg[PELY] = HIP + b * 0.06;
    celebBall = t > 0.55 ? 3 : 1;
    return true;
  }

  /* the whole side in on it (group 3 and 4, 1.22). The photograph: everyone turns to the camera and strikes a pose of
     his own, the front ones down on a knee. The wave: arms thrown up one man after another, round the ring. */
  function celebTeam(f, tg, group, order) {
    if (group === 3) {
      const k = Math.floor(f.seed * 1.6) % 4, in0 = smooth(Math.min(1, celebT / 0.6));
      if (k === 0) {
        for (let i = 0; i < NPOSE; i++) tg[i] = lerp(tg[i], KNEEL[i], in0);
        tg[SRX] = 1.5 * in0;
        tg[ER] = 0.1;  // down on a knee, pointing at the camera
        tg[HEADRX] = 0.15;
      } else if (k === 1) {
        tg[SLX] = tg[SRX] = 1.5 * in0;
        tg[SLZ] = -1.3 * in0;
        tg[SRZ] = 1.3 * in0;
        tg[EL] = tg[ER] = 2.2 * in0;  // both arms flexed
        tg[CHRX] = 0.08;
      } else if (k === 2) {
        tg[SLX] = tg[SRX] = 0.75;
        tg[SLZ] = 0.5;
        tg[SRZ] = -0.5;
        tg[EL] = tg[ER] = 1.9;  // arms folded, chin up
        tg[HEADRX] = -0.12;
        tg[CHRX] = 0.1;
      } else {
        tg[SRX] = 2.9 * in0;
        tg[ER] = 0.15;
        tg[SRZ] = 0.2;  // one finger to the sky
        tg[SLX] = 0.3;
        tg[SLZ] = -0.7;
        tg[EL] = 1.8;
        tg[PELRZ] = 0.06;
      }
      return k === 0;
    }
    const w = Math.max(0, Math.sin(time * 5 - order * 0.55));
    tg[SLX] = tg[SRX] = 0.4 + w * 2.6;
    tg[SLZ] = -0.25 - w * 0.2;
    tg[SRZ] = 0.25 + w * 0.2;
    tg[EL] = tg[ER] = 1.2 * (1 - w) + 0.15;
    tg[PELY] = HIP - 0.1 + w * 0.16;
    tg[HL] = tg[HR] = 0.3 * (1 - w);
    tg[KL] = tg[KR] = -0.55 * (1 - w);
    tg[CHRX] = lerp(-0.15, 0.1, w);
    tg[HEADRX] = 0.2 * w;
    return false;
  }

  function celebrate(f, scorer, tg, style, group, order) {
    const u = f.seed / 6.2832, sync = !scorer && (group === 1 || group === 2), b = Math.abs(Math.sin(time * 6.5 + (sync ? 0 : f.seed)));
    const v = scorer ? (style >= 0 ? style % CELEB_N : Math.floor(u * CELEB_N) % CELEB_N) : sync ? (group === 2 ? 4 : 1) : Math.floor(u * 5) % 5;
    if (scorer && v >= 11) return celebMore(f, tg, v);
    if (!scorer && group >= 3) return celebTeam(f, tg, group, order || 0);
    if (scorer && v === 1) celebBall = 5;
    if (!scorer && v === 4) {
      shuffleStep(tg, Math.sin(time * 7 + (sync ? 0 : f.seed)));
      return false;
    }
    if (!scorer && v === 3) {
      // waving to the crowd, one arm high
      const w = Math.sin(time * 6 + f.seed);
      tg[SRX] = 2.7;
      tg[SRZ] = 0.45 + w * 0.35;
      tg[ER] = 0.35;
      tg[SLX] = 0.2;
      tg[SLZ] = -0.2;
      tg[EL] = 0.4;
      tg[CHRX] = 0.06;
      tg[HEADRX] = -0.15;
      tg[PELY] = HIP + b * 0.03;
      return false;
    }
    if (scorer && v === 6) {
      shuffleStep(tg, Math.sin(time * 7.5));
      return false;
    }
    if (scorer && v === 7) {
      // a salute held to the crowd, standing tall
      tg[CHRX] = 0.1;
      tg[HEADRX] = -0.12;
      tg[SRX] = 1.35;
      tg[SRZ] = 0.95;
      tg[ER] = 2.35;
      tg[SLX] = 0.05;
      tg[SLZ] = -0.08;
      tg[EL] = 0.1;
      return false;
    }
    if (scorer && v === 8) {
      // both arms straight to the sky, leaning back, a slow walk
      const w = Math.sin(time * 3 + f.seed);
      tg[CHRX] = 0.25;
      tg[HEADRX] = -0.55;
      tg[SLX] = tg[SRX] = 3.0;
      tg[SLZ] = -0.15;
      tg[SRZ] = 0.15;
      tg[EL] = tg[ER] = 0.05;
      tg[HL] = w * 0.22;
      tg[HR] = -w * 0.22;
      tg[KL] = -0.25 * Math.max(0, w);
      tg[KR] = -0.25 * Math.max(0, -w);
      return false;
    }
    if (scorer && v === 9) {
      // the flex: a crouch, fists pulled in front of his belt, shoulders hunched, shouting, again and again
      const w = 0.5 + 0.5 * Math.sin(time * 5);
      tg[PELY] = HIP - 0.08 - w * 0.03;
      tg[CHRX] = -0.2 - w * 0.12;
      tg[HEADRX] = -0.3;
      tg[SLX] = tg[SRX] = 0.45;
      tg[SLZ] = -0.55;
      tg[SRZ] = 0.55;
      tg[EL] = tg[ER] = 2.0;
      tg[HL] = tg[HR] = 0.35 + w * 0.08;
      tg[KL] = tg[KR] = -0.5 - w * 0.12;
      return false;
    }
    if (scorer && v === 10) {
      // a leap: crouch, spring up with one fist punched at the sky, tuck, land, again
      const ph = (celebT % 1.5) / 1.5;
      if (ph < 0.25) {
        const e = smooth(ph / 0.25);
        tg[PELY] = HIP - 0.16 * e;
        tg[HL] = tg[HR] = 0.65 * e;
        tg[KL] = tg[KR] = -0.95 * e;
        tg[CHRX] = -0.2 * e;
        tg[SLX] = tg[SRX] = -0.4 * e;
        tg[EL] = tg[ER] = 0.3;
      } else if (ph < 0.65) {
        const a = (ph - 0.25) / 0.4;
        tg[PELY] = HIP + Math.sin(Math.PI * a) * 0.6;
        tg[SRX] = 3.1;
        tg[ER] = 0.1;
        tg[SLX] = 0.9;
        tg[SLZ] = -0.6;
        tg[EL] = 1.2;
        tg[HL] = 0.6;
        tg[KL] = -1.1;
        tg[HR] = 0.15;
        tg[KR] = -0.4;
        tg[CHRX] = 0.1;
        tg[HEADRX] = -0.3;
      } else {
        const e = 1 - smooth((ph - 0.65) / 0.35);
        tg[PELY] = HIP - 0.12 * e;
        tg[HL] = tg[HR] = 0.5 * e;
        tg[KL] = tg[KR] = -0.75 * e;
        tg[SRX] = 3.1 * e;
        tg[ER] = 0.2;
        tg[EL] = 0.3;
      }
      return false;
    }
    if (scorer && v === 3) {
      // down on one knee, head bowed; then, still on the knee, both arms to the sky
      for (let i = 0; i < NPOSE; i++) tg[i] = KNEEL[i];
      tg[CHRX] = -0.45;
      tg[HEADRX] = 0.6;
      tg[SLX] = 0.85;
      tg[EL] = 1.0;
      tg[SRX] = 0.35;
      tg[ER] = 1.3;
      if (celebT > 1.3) {
        const e = smooth(Math.min(1, (celebT - 1.3) / 0.4));
        tg[CHRX] = lerp(-0.45, 0.1, e);
        tg[HEADRX] = lerp(0.6, -0.45, e);
        tg[SLX] = tg[SRX] = lerp(0.6, 3.0, e);
        tg[EL] = tg[ER] = lerp(1.1, 0.1, e);
        tg[SLZ] = -0.2 * e;
        tg[SRZ] = 0.2 * e;
      }
      return false;
    }
    if (scorer && v === 4) {
      // a roar: knees bent, arms out wide and flexed, chest up and head thrown back, bouncing
      tg[PELY] = HIP - 0.12 + b * 0.05;
      tg[PELRX] = -0.12;
      tg[CHRX] = 0.12;
      tg[HEADRX] = -0.5;
      tg[SLX] = tg[SRX] = 0.7;
      tg[SLZ] = -1.25;
      tg[SRZ] = 1.25;
      tg[EL] = tg[ER] = 1.7;
      tg[HL] = tg[HR] = 0.55;
      tg[KL] = tg[KR] = -0.75;
      return false;
    }
    if (scorer && v === 5) {
      // a bow to the crowd, again and again: one arm across his waist, the other swept out to the side
      const ph = celebT % 2.2, e = ph < 0.5 ? 0 : ph < 0.9 ? smooth((ph - 0.5) / 0.4) : ph < 1.5 ? 1 : ph < 1.9 ? 1 - smooth((ph - 1.5) / 0.4) : 0;
      tg[PELRX] = -0.55 * e;
      tg[CHRX] = -0.05 - 0.45 * e;
      tg[HEADRX] = 0.3 * e;
      tg[SRX] = lerp(0.2, 0.9, e);
      tg[SRZ] = 0.1;
      tg[ER] = lerp(0.3, 1.7, e);
      tg[SLX] = lerp(0.3, 0.6, e);
      tg[SLZ] = lerp(-0.3, -1.1, e);
      tg[EL] = 0.15;
      tg[HL] = tg[HR] = 0.55 * e;  // the hips fold back so he does not tip over his toes
      return false;
    }
    if (!scorer && v === 2) {
      // clapping, hands meeting in front of his chest
      const c = Math.abs(Math.sin(time * 9 + f.seed));
      tg[SLX] = tg[SRX] = 1.3;
      tg[SLZ] = -0.05 - c * 0.35;
      tg[SRZ] = 0.05 + c * 0.35;
      tg[EL] = tg[ER] = 0.7;
      tg[CHRX] = 0.04;
      tg[PELY] = HIP + b * 0.03;
      return false;
    }
    if (scorer && v === 1) {
      // spike the ball, then arms out wide
      if (celebT < 0.45) {
        tg[SRX] = 3.4;
        tg[ER] = 0.9;
        tg[CHRX] = 0.25;
        tg[SLX] = 0.6;
        tg[EL] = 0.8;
        tg[HL] = 0.3;
        tg[HR] = -0.25;
        tg[KR] = -0.3;
      } else if (celebT < 0.8) {
        tg[SRX] = 0.25;
        tg[ER] = 0.1;
        tg[CHRX] = -0.5;
        tg[SLX] = -0.5;
        tg[EL] = 0.5;
        tg[PELY] = HIP - 0.1;
        tg[HL] = 0.5;
        tg[KL] = -0.6;
        tg[HR] = -0.2;
        tg[KR] = -0.3;
      } else {
        tg[SLX] = 2.6;
        tg[SRX] = 2.6;
        tg[SLZ] = -0.8;
        tg[SRZ] = 0.8;
        tg[EL] = 0.45;
        tg[ER] = 0.45;
        tg[CHRX] = 0.1;
        tg[HEADRX] = 0.25;
        tg[PELY] = HIP + b * 0.07;
        tg[HL] = 0.15;
        tg[HR] = -0.15;
      }
      return true;
    }
    if (scorer && v === 2) {
      // one arm to the sky and a slow strut
      const w = Math.sin(time * 4 + f.seed);
      tg[SRX] = 3.05;
      tg[ER] = 0.05;
      tg[SLX] = 0.15;
      tg[SLZ] = -0.45;
      tg[EL] = 1.6;
      tg[CHRX] = 0.12;
      tg[HEADRX] = 0.35;
      tg[HL] = w * 0.3;
      tg[HR] = -w * 0.3;
      tg[KL] = -0.3 * Math.max(0, w);
      tg[KR] = -0.3 * Math.max(0, -w);
      tg[PELY] = HIP + Math.abs(w) * 0.03;
      return false;
    }
    if (!scorer && v === 0) {
      // fist pump
      const w = Math.sin(time * 9 + f.seed) * 0.5 + 0.5;
      tg[SRX] = 1.6 + w * 1.3;
      tg[ER] = 1.9 - w * 1.5;
      tg[SLX] = 0.3;
      tg[EL] = 1.1;
      tg[CHRX] = 0.05;
      tg[PELY] = HIP + w * 0.08;
      tg[HL] = 0.1;
      tg[HR] = 0.1;
      tg[KL] = -0.2 * (1 - w);
      tg[KR] = -0.2 * (1 - w);
      return false;
    }
    const who = scorer ? 1.4 : 1;  // jumping with both arms up
    tg[PELY] = HIP + b * 0.2 * who;
    tg[CHRX] = 0.08;
    tg[SLX] = 2.95;
    tg[SRX] = 2.95;
    tg[SLZ] = -0.3 - b * 0.2;
    tg[SRZ] = 0.3 + b * 0.2;
    tg[EL] = 0.2;
    tg[ER] = 0.2;
    tg[HL] = 0.1;
    tg[HR] = 0.1;
    tg[KL] = -0.25 * (1 - b);
    tg[KR] = -0.25 * (1 - b);
    tg[HEADRX] = 0.25;
    return false;
  }

  /* an official: jog to a spot, watch the ball, and signal how the play ended ('td', 'fd' first down, 'inc' incomplete,
     'to' a timeout or the two-minute warning: hands crossing above his head, again and again) */
  function poseRef(f, r, sig, bx, by, dt) {
    const tg = TG;
    tg.fill(0);
    const sp = Math.hypot(r.vx, r.vy), run = Math.min(1, sp / 6), gait = stridePhase(f, r.vx, r.vy, dt), sn = Math.sin(f.ph);  // his legs are on the players' stride
    tg[PELY] = gait ? lerp(HIP, gait.h, gait.walk) : HIP;
    tg[CHRX] = -0.03 - 0.2 * run;
    if (gait) {
      strideBody(tg, gait, sn, 1);
      tg[PELRZ] = gait.roll;
    } else tg[EL] = tg[ER] = 0.3;
    let hx = bx - r.x, hy = by - r.y;
    if (sp > 1.2) {
      hx = r.vx;
      hy = r.vy;
    } else if (sig === 'td') {
      tg[SLX] = 3.05;
      tg[SRX] = 3.05;
      tg[EL] = 0.05;
      tg[ER] = 0.05;
      tg[SLZ] = -0.12;
      tg[SRZ] = 0.12;
    } else if (sig === 'fd') {
      tg[SRX] = 1.57;
      tg[ER] = 0.02;
      hx = 0;
      hy = r.fdDir;
    }  // arm straight out toward the line to gain
      else if (sig === 'to') {
        const w = Math.sin(time * 7);
        tg[SLX] = 3.15;
        tg[SRX] = 3.15;
        tg[SLZ] = 0.06 + w * 0.26;
        tg[SRZ] = -0.06 - w * 0.26;
        tg[EL] = 0.04;
        tg[ER] = 0.04;
        tg[CHRX] = 0.04;  // straight arms, crossing at the wrists high above his head
      } else if (sig === 'inc') {
        const w = Math.sin(time * 8);
        tg[SLX] = 1.1;
        tg[SRX] = 1.1;
        tg[SLZ] = w * 0.7;
        tg[SRZ] = -w * 0.7;
        tg[EL] = 0.1;
        tg[ER] = 0.1;
      }
    if (gait) strideLegs(tg, gait, tg[PELY]);
    let d = Math.atan2(-hx, hy) - f.heading;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    f.heading += f.snap ? d : d * (1 - Math.exp(-dt * 8));
    easePose(f, tg, f.snap ? 1 : 1 - Math.exp(-dt * 16), !!gait, dt);
    f.snap = false;
    applyPose(f);
    f.root.position.set(r.x, 0, -r.y);
    f.root.rotation.y = f.heading;
  }

  /* one of the chain crew, moving at v yards a second along the sideline: he walks facing the way he is going, on the
     players' stride, and stands facing the field, his stick held out in one hand */
  function poseCrew(f, v, dt) {
    const tg = TG, run = Math.min(1, Math.abs(v) / 5), want = run > 0.15 ? (v > 0 ? 0 : Math.PI) : -Math.PI / 2;
    let d = want - f.heading;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    f.heading += f.snap ? d : d * (1 - Math.exp(-dt * 8));
    const gait = stridePhase(f, 0, v, dt), sn = Math.sin(f.ph);
    tg.fill(0);
    tg[PELY] = gait ? lerp(HIP, gait.h, gait.walk) : HIP;
    tg[CHRX] = -0.03 - 0.12 * run;
    if (gait) {
      strideBody(tg, gait, sn, 1);  // the free arm swings, the hips roll
      tg[PELRZ] = gait.roll;
      tg[CHRY] *= 0.5;
      tg[SRZ] = 0;
    } else tg[EL] = 0.3;
    tg[SRX] = 1.2;  // the stick, held out in front
    tg[ER] = 0.45;
    if (gait) strideLegs(tg, gait, tg[PELY]);
    easePose(f, tg, f.snap ? 1 : 1 - Math.exp(-dt * 20), !!gait, dt);
    f.snap = false;
    applyPose(f);
  }

  /* a reserve on the sideline: stands and breathes, some with hands on hips or arms folded, and jumps when his team scores */
  function poseBench(f, up, dt, bx, by) {
    const tg = TG;
    tg.fill(0);
    /* About three in ten pace the sideline: a slow walk a yard or two from their place and back, a stop of five to
       thirteen seconds, then off again. The rest stand. Everyone stops to celebrate a score. */
    let walk = 0, bgait = null, hy0 = 0;
    if (f.benchY !== undefined && (f.seed * 3.7) % 1 < 0.3) {
      if (!f.bw) f.bw = { to: f.benchY, wait: 1 + f.seed * 1.5 };
      const at = -f.root.position.z, d = f.bw.to - at;
      if (up || Math.abs(d) < 0.04) {
        f.bw.wait -= dt;
        if (f.bw.wait <= 0 && !up) {
          f.bw.to = f.benchY + (Math.random() - 0.5) * 3.2;
          f.bw.wait = 5 + Math.random() * 8;
        }
      } else {
        walk = Math.sign(d) * Math.min(1.05, Math.abs(d) * 2.5 + 0.35);
        const step = walk * dt;
        f.root.position.z -= Math.abs(step) > Math.abs(d) ? d : step;
      }
      const home = f.root.position.x < FW / 2, face = walk ? (walk > 0 ? 0 : Math.PI) : home ? -Math.PI / 2 : Math.PI / 2;
      let dr = face - f.root.rotation.y;
      dr = Math.atan2(Math.sin(dr), Math.cos(dr));
      f.root.rotation.y += f.snap ? dr : dr * (1 - Math.exp(-dt * 5));
    }
    if (bx !== null && bx !== undefined && !up) {
      /* the reserves watch the play: helmets turn to the ball as it goes up and down the field */
      const rel = Math.atan2(-(bx - f.root.position.x), by + f.root.position.z) - f.root.rotation.y;
      tg[HEADRY] = hy0 = clamp(Math.atan2(Math.sin(rel), Math.cos(rel)), -1.1, 1.1);
    }
    tg[PELY] = HIP;
    tg[CHRX] = -0.04 + Math.sin(time * 1.7 + f.seed) * 0.014;
    tg[EL] = 0.3;
    tg[ER] = 0.3;
    if (up) {
      const b = Math.abs(Math.sin(time * 6 + f.seed));
      tg[PELY] = HIP + b * 0.16;
      tg[SLX] = 2.9;
      tg[SRX] = 2.9;
      tg[SLZ] = -0.35;
      tg[SRZ] = 0.35;
      tg[EL] = 0.2;
      tg[ER] = 0.2;
      tg[KL] = -0.2 * (1 - b);
      tg[KR] = -0.2 * (1 - b);
    } else if (walk) {
      /* walking, on the players' own stride (2026-11-21: his legs were two sine waves, and his feet slid): each foot
         stays where it lands, heel first, and the arms and hips go with it */
      f.heading = f.root.rotation.y;
      f.ph = f.ph || 0;
      bgait = stridePhase(f, 0, walk, dt);
      if (bgait) {
        tg[PELY] = lerp(HIP, bgait.h, bgait.walk);
        strideBody(tg, bgait, Math.sin(f.ph), 1);
        const hy = tg[HEADRY];
        tg[PELRZ] = bgait.roll;
        strideLegs(tg, bgait, tg[PELY]);
        if (bx !== null && bx !== undefined) tg[HEADRY] = hy0 + hy * 0.3;  // still watching the play as he walks
      }
    } else if (f.benchY !== undefined && (f.seed * 3.7) % 1 >= 0.3 && (f.seed * 5.3) % 1 < (window.PG_KNEEL || 0.14)) {
      // PG_KNEEL: a test hook, to look at the pose
      /* one or two of those who do not pace take a knee to watch, as reserves do */
      const hy = tg[HEADRY];
      for (let i = 0; i < NPOSE; i++) tg[i] = KNEEL[i];
      tg[HEADRY] = hy;
    } else if (f.seed > 4.2) {
      tg[SLZ] = -0.45;
      tg[SRZ] = 0.45;
      tg[EL] = 1.6;
      tg[ER] = 1.6;
      tg[SLX] = 0.15;
      tg[SRX] = 0.15;
    } else if (f.seed < 1.2) {
      tg[SLX] = 0.55;
      tg[SRX] = 0.55;
      tg[SLZ] = 0.35;
      tg[SRZ] = -0.35;
      tg[EL] = 1.5;
      tg[ER] = 1.5;
    }
    easePose(f, tg, f.snap ? 1 : 1 - Math.exp(-dt * 10), !!bgait, dt);  // a walker's legs are followed closely, so his feet stay put
    f.snap = false;
    applyPose(f);
  }

  /* ---------- the rag doll (2026-11-21) ----------
     A fall used to be one pose eased to another in three tenths of a second, the same for a shoestring tackle and a
     blind-side hit. Now a hit has a size and a direction, and the body answers it as a body does. The size is how fast
     the two men were closing (their speeds a frame before the hit); the direction is which way that shoves him, in
     his own frame. A hard hit puts him down faster and lifts him off his feet; his arms, legs, head and chest are
     heavy things on springs, so they are left behind when the body is knocked away and whip after it, limp while he
     is falling and stiffening as he gets up; where he lands he bounces, and his limbs flop out and settle. The poses
     the fall eases between are still what he ends in (the ball tucked away, the tackler's hands on him: settle keeps
     everyone on top of the turf and out of each other), so this only adds what was missing: weight. */
  const RAG = [SLX, SLZ, EL, SRX, SRZ, ER, HL, KL, HR, KR, CHRX, CHRY, CHRZ, HEADRX, HEADRY, PELRZ];
  const RAG_LIM = { [SLX]: 1.3, [SRX]: 1.3, [SLZ]: 1.0, [SRZ]: 1.0, [EL]: 1.0, [ER]: 1.0, [HL]: 0.9, [HR]: 0.9, [KL]: 0.9, [KR]: 0.9, [CHRX]: 0.4, [CHRY]: 0.5, [CHRZ]: 0.35, [HEADRX]: 0.5, [HEADRY]: 0.6, [PELRZ]: 0.28 };
  const HITS = new WeakMap();  // a play's tackle: how hard, and which way (field x, y), worked out once and felt by both men

  function hitOf(s) {
    const ps = s.ps, cr = ps.carrier, tq = ps.tackler;
    if (!cr || !tq || cr === tq) return null;
    let h = HITS.get(ps);
    if (h && h.cr === cr && h.tq === tq) return h;
    const fc = s.figOf ? s.figOf(cr) : null, ft = s.figOf ? s.figOf(tq) : null;
    const rx = (ft ? ft.pvx : tq.vx || 0) - (fc ? fc.pvx : cr.vx || 0), ry = (ft ? ft.pvy : tq.vy || 0) - (fc ? fc.pvy : cr.vy || 0), rel = Math.hypot(rx, ry);
    const dx = cr.x - tq.x, dy = cr.y - tq.y, dl = Math.hypot(dx, dy) || 1, k = rel > 1.5 ? 1 / rel : 0;
    const imp = clamp(rel / 11, 0.25, 1.3);  // closing at eleven yards a second, a runner met head on at full speed, is 1
    HITS.set(ps, h = { cr, tq, imp, x: k ? rx * k : dx / dl, y: k ? ry * k : dy / dl, T: lerp(0.36, 0.21, clamp((imp - 0.25) / 0.85, 0, 1)) });
    return h;
  }

  /* he has just been hit: imp how hard (0 to about 1.3), (ux, uy) the way it shoves him on the field. part: how much
     of it his limbs feel (the man tackled all of it, the tackler some). */
  function ragHit(f, imp, ux, uy, part) {
    const ch = Math.cos(f.heading), sh = Math.sin(f.heading), F = -ux * sh + uy * ch, R = ux * ch + uy * sh;  // shoved forward, and to his right
    const A = imp * 9 * part, back = -F, gl = 0.8 + ((f.seed * 7.3) % 1) * 0.45, gr = 0.8 + ((f.seed * 3.1) % 1) * 0.45, odd = (f.seed * 5.7) % 1 > 0.5 ? 1 : -1;
    f.rg.fill(0);
    f.rgv.fill(0);
    f.imp = imp * part;
    f.landed = false;
    f.by = f.bv = 0;
    const v = f.rgv;
    /* knocked backward his arms and legs are left out in front of him and his chin goes to his chest; knocked forward
       they trail behind; knocked sideways everything is left on the side the hit came from */
    v[SLX] = back * A * 0.9 * gl;
    v[SRX] = back * A * 0.9 * gr;
    v[SLZ] = -R * A * 0.7 - Math.abs(back) * A * 0.25 * gl;  // and fly out from his sides
    v[SRZ] = -R * A * 0.7 + Math.abs(back) * A * 0.25 * gr;
    v[EL] = -A * 0.35 * gl;
    v[ER] = -A * 0.35 * gr;
    v[HL] = back * A * 0.55 * gl;
    v[HR] = back * A * 0.55 * gr;
    v[KL] = -A * 0.45 * gr;  // the knees give
    v[KR] = -A * 0.45 * gl;
    v[CHRX] = -back * A * 0.35;
    v[CHRZ] = R * A * 0.3;
    v[CHRY] = odd * A * 0.22 * (0.4 + Math.abs(R));
    v[HEADRX] = -back * A * 0.5;
    v[HEADRY] = odd * A * 0.2;
    v[PELRZ] = -R * A * 0.2;  // the whole body rocks away from a hit in the side
    f.spin = -R * imp * part * 2;  // a hit from the side turns him as he goes down (about half a radian for a hard one)
  }

  /* Another man arrives on one who is already going down or is down (a gang tackle, the pile): the same shove, added
     to whatever his limbs are doing, and if he has landed he is bounced again. A man the rag doll is not working on
     (a slide, a staged fall) is left alone. */
  function ragKick(f, imp, ux, uy, part) {
    if (!f || !(f.imp > 0)) return;
    const ch = Math.cos(f.heading), sh = Math.sin(f.heading), F = -ux * sh + uy * ch, R = ux * ch + uy * sh, A = imp * 7 * part, back = -F, v = f.rgv, odd = (f.seed * 9.1) % 1 > 0.5 ? 1 : -1;
    v[SLX] += back * A * 0.6;
    v[SRX] += back * A * 0.6;
    v[SLZ] += -R * A * 0.7 - A * 0.2;
    v[SRZ] += -R * A * 0.7 + A * 0.2;
    v[EL] += A * 0.3 * odd;
    v[ER] -= A * 0.3 * odd;
    v[HL] += back * A * 0.4 + A * 0.2;
    v[HR] += back * A * 0.4 - A * 0.15;
    v[KL] -= A * 0.4;
    v[KR] -= A * 0.3;
    v[CHRX] += -back * A * 0.3;
    v[CHRZ] += R * A * 0.3;
    v[CHRY] += odd * A * 0.25;
    v[HEADRX] += -back * A * 0.45 + A * 0.2;
    v[HEADRY] += R * A * 0.3;
    v[PELRZ] += -R * A * 0.22;
    f.spin += -R * imp * part * 1.2;
    f.imp = Math.max(f.imp, imp * part);
    if (f.landed) {
      f.bv = Math.max(f.bv, 0.3 + imp * part * 0.7);  // a man landing on him bounces him on the turf again
      f.by = Math.max(f.by, 0.001);
    }
  }

  /* the rag doll for this frame, added to the pose in tg: limp while he is down, stiff as he gets up (up, 0 to 1).
     ballArm: the arm the ball is tucked in keeps most of its hold. Call it before settle. */
  function flop(f, tg, dt, up, fallDir, ballArm) {
    if (!(f.imp > 0)) return;
    const limp = 1 - smooth(clamp(up * 2, 0, 1)), w = lerp(20, f.landed ? 10 : 8, limp), z = lerp(1, f.landed ? 0.42 : 0.3, limp), h = Math.min(dt, 0.034), q = f.rg, v = f.rgv;
    if (!f.landed && f.fall >= 0.8) {
      /* he lands: the body bounces once, and everything loose on it is jolted outward */
      f.landed = true;
      const A = f.imp * 6, gl = 0.8 + ((f.seed * 7.3) % 1) * 0.45, gr = 0.8 + ((f.seed * 3.1) % 1) * 0.45;
      f.bv = 0.45 + f.imp * 0.95;
      v[SLZ] -= A * 0.5 * gl;
      v[SRZ] += A * 0.5 * gr;
      v[SLX] += A * 0.3 * gr;
      v[SRX] += A * 0.3 * gl;
      v[EL] += A * 0.4 * gl;
      v[ER] += A * 0.4 * gr;
      v[HL] += A * 0.35 * gl;
      v[HR] += A * 0.3 * gr;
      v[KL] -= A * 0.5 * gr;
      v[KR] -= A * 0.35 * gl;
      v[HEADRX] -= fallDir * A * 0.45;  // on his back the helmet snaps back onto the turf and rebounds; on his face it nods
      v[CHRX] += fallDir * A * 0.15;
      v[PELRZ] += ((f.seed * 5.7) % 1 > 0.5 ? 1 : -1) * A * 0.18;  // and the body rocks once where it lies
    }
    for (const i of RAG) {
      v[i] += (-w * w * q[i] - 2 * z * w * v[i]) * h;
      q[i] += v[i] * h;
      const lim = RAG_LIM[i];
      if (Math.abs(q[i]) > lim) {
        q[i] = Math.sign(q[i]) * lim;
        v[i] *= -0.25;
      }
      const hold = ballArm && (ballArm === 'R' ? i === SRX || i === SRZ || i === ER : i === SLX || i === SLZ || i === EL) ? 0.2 : 1;
      tg[i] += q[i] * hold * limp;
    }
    /* joints only bend the way joints bend */
    tg[EL] = clamp(tg[EL], 0.04, 2.5);
    tg[ER] = clamp(tg[ER], 0.04, 2.5);
    tg[KL] = clamp(tg[KL], -2.4, -0.04);
    tg[KR] = clamp(tg[KR], -2.4, -0.04);
    tg[HEADRX] = clamp(tg[HEADRX], -0.6, 0.8);
    /* the bounce: up off the turf and down again under his own weight, a second small one, then still */
    if (f.landed && (f.by > 0 || f.bv > 0)) {
      f.bv -= 10 * h;
      f.by += f.bv * h;
      if (f.by <= 0) {
        f.by = 0;
        f.bv = f.bv < -0.5 ? -f.bv * 0.3 : 0;
      }
    }
    tg[PELY] += f.by * limp;
    if (f.spin) {
      f.heading += f.spin * h * limp;
      f.spin *= Math.exp(-h * 4);
      if (Math.abs(f.spin) < 0.02) f.spin = 0;
    }
  }

  /* is he busy with the ball or a tackle, so a gesture would look wrong? */
  const carrierHeld = (p, ps) => p.down || p.fell || p.flat > 0 || !!p.eng || !!p.block;

  /* test hook: pops. With PG.r3d.pops(true) every player's pose is compared with the frame before, and a joint that
     turns more than POP_A in one sixtieth of a second, a heading that swings more than POP_H or a figure drawn more
     than POP_D yards from where it was (beyond what the engine moved him) is counted, under what he was doing.
     PG.r3d.pops() returns the counts, largest first. A figure placed on purpose (f.snap) is not counted. */
  let POPS = null;
  const POP_A = 0.6, POP_H = 0.6, POP_D = 0.3, JN = ['PELY', 'PELRX', 'PELRZ', 'CHRX', 'CHRY', 'HEADRX', 'SLX', 'SLZ', 'EL', 'SRX', 'SRZ', 'ER', 'HL', 'KL', 'HR', 'KR', 'AL', 'AR', 'HLZ', 'HRZ', 'ALZ', 'ARZ', 'ALY', 'ARY', 'HEADRY', 'CHRZ'];

  function popCheck(f, p, s, dt, jumped) {
    const ps = s.ps, k = (1 / 60) / Math.max(dt, 1e-4), c = f.cur, was = f.popWas || (f.popWas = new Float32Array(NPOSE + 4));
    const fresh = f.popP !== p || f.popSt !== s.G.state || jumped || !(dt > 0);
    if (!fresh) {
      const what = (p.down ? 'down ' : p.fell ? 'fell ' : p.flat > 0 ? 'flat ' : '') + (p.thrT > 0 ? 'throwing ' : '') + (ps.carrier === p ? 'carrier ' : '') + (ps.air && ps.air.target === p ? 'target ' : '') + (p.eng ? 'engaged ' : '') + (p.block ? 'blocking ' : '') + (p.jog ? 'walk ' : '') + s.G.state + ' ' + (p.team === ps.offTeam ? 'off' : 'def');
      const hit = (name, d) => {
        const key = name + ' | ' + what, e = POPS[key] || (POPS[key] = { n: 0, max: 0, role: p.role, t: +(ps.t || 0).toFixed(2) });
        e.n++;
        if (d > e.max) {
          e.max = +d.toFixed(2);
          e.role = p.role;
          e.t = +(ps.t || 0).toFixed(2);
        }
      };
      let worst = 0, wi = -1;
      for (let i = 1; i < NPOSE; i++) {
        let d = Math.abs(c[i] - was[i]);
        if ((i === SLX || i === SRX) && d > Math.PI) d = 2 * Math.PI - d;
        d *= k;
        if (d > worst) {
          worst = d;
          wi = i;
        }
      }
      if (worst > POP_A) hit(JN[wi], worst);
      let dh = f.heading - was[NPOSE];
      dh = Math.abs(Math.atan2(Math.sin(dh), Math.cos(dh))) * k;
      if (dh > POP_H && !(p.spinT > 0)) hit('heading', dh);
      const dd = Math.hypot(f.ox - was[NPOSE + 1], f.oy - was[NPOSE + 2]) * k;
      if (dd > POP_D) hit('offset', dd);
      const dy = Math.abs(c[PELY] - was[0]) * k;
      if (dy > 0.12) hit('hips height', dy);
    }
    was.set(c);
    was[NPOSE] = f.heading;
    was[NPOSE + 1] = f.ox;
    was[NPOSE + 2] = f.oy;
    f.popP = p;
    f.popSt = s.G.state;
  }

  function poseFor(f, p, s, dt) {
    if (p.wkx > 1 && p.jog) dt *= p.wkx;  // the walk between plays is shown fast forward: his own clock runs with it
    const tg = TG, ps = s.ps;
    tg.fill(0);
    f.leap = Math.max(0, (f.leap || 0) - dt / 0.3);  // a jump for the ball comes back down over about a third of a second
    f.tap = Math.max(0, (f.tap || 0) - dt / 0.35);  // a toe tap at the sideline, the same
    f.ballL = false;
    let stretch = 0;  // reaching out for a ball off his line: how far into the lunge
    const sp = Math.hypot(p.vx, p.vy), run = Math.min(1, sp / 7.5);
    /* The stride lengthens with speed (about 1.5 yards a step at a jog, 2.5 flat out), and the phase advances by the
       ground actually covered. That keeps the feet moving at the pace of the turf instead of skating over it. */
    let striding = false;
    const carrier = ps.carrier === p && !ps.air, inPocket = carrier && p === ps.qb && ps.mode === 'pass' && !ps.thrown && !ps.open;
    const winding = s.charge >= 0 && carrier && p === ps.qb && !ps.thrown;  // the user is holding a receiver's letter: the power bar is filling
    /* The quarterback's drop. He turns half away from the line, the ball up at his back shoulder, and goes back in
       crossover steps with his eyes downfield: three steps from the shotgun, five from under center, seven on play
       action. The count is the distance to his spot shared out in steps, so the last one lands as he gets there. Then
       he sets: feet apart, front foot at the target, knees bent, the ball in both hands at his chest. */
    const pocketLive = inPocket && s.live && !p.down;
    if (pocketLive && ps.t < 0.06 && ps.drop) {
      const far = Math.hypot(ps.drop.x - p.x, ps.drop.y - p.y);
      f.dropStep = clamp(far / (far > 4.5 ? (ps.pa ? 7 : 5) : 3), 0.6, 1.3);
      f.ph = 0;
    }
    const dropping = pocketLive && !winding && ps.t < 1.8 && p.vy * s.dir < -1, qbSet = pocketLive && sp < 0.6 && ps.t > 0.25;
    const gait = stridePhase(f, p.vx + f.svx, p.vy + f.svy, dt, dropping ? f.dropStep : 0), sn = Math.sin(f.ph);  // being moved clear of a pile is ground covered too: he steps there, he does not slide
    if (gait && dropping) gait.base *= 0.3;  // his feet cross as he goes back: it is not a shuffle
    let hx = null, hy = 0, snap = false, eyes = true, wantX = 0, wantY = 0, thLegs = false, thHead = null, turnRate = 13, inHand = 0, poseRate = 0, armRate = 0, setNow = false;  // thLegs: the throw has placed his feet; thHead: where the throw wants his helmet turned; inHand: the ball is in his throwing hand, not held at his chest
    const thSet = sp < 2;  // a set throw: slow enough to plant and step into it  // eyes: his helmet is free to turn to what he is watching; wantX, wantY: how far from the engine's spot a block, or a pile, wants him drawn
    /* the kicker (s.kicker, found by render): kickV is how far into the swing he is, from a tenth of a second before
       his foot meets the ball; before that, on a kickoff, he is running up to it */
    const kickT = s.kicker === p && ps.air && ps.air.kick ? ps.air.t - (s.kickHit - 0.1) : -9, kickV = kickT >= 0 && kickT < 0.55 && !p.down ? kickT : -1, kickRun = s.kicker === p && kickT < 0.55 && kickT > -8 && !p.down;
    const flat = p.flat > 0 && !p.down && !p.fell;  // run over: on his back for a moment
    const cd = ps.carrier, settled = s.G.state === 'dead' || s.G.state === 'replay';
    const pileOn = !!cd && cd.down && cd !== p && !p.down && !p.fell && !flat && !!s.figOf && settled && pileOf(s).includes(p);  // diving onto the pile (see pileOf)
    if (cd && cd.down && cd !== p && !p.down && !p.fell && !flat && !pileOn && s.figOf && settled) {
      /* a tackle has been made and he is still on his feet beside it: stand him clear of the men on the ground (their
         backs, pelvis to helmet, and their legs), so nobody is left standing in the pile */
      PUSH[0] = PUSH[1] = 0;
      for (let pass = 0; pass < 2; pass++) for (const q of [cd, ps.tackler]) {
        /* each line is cleared from where the last one left him, so the moves do not pile up; twice round settles it */
        const of = q && q !== p ? s.figOf(q) : null;
        if (!of || of === f || !(of.fall > 0.3)) continue;
        const room = 0.2 * (of.root.scale.y + f.root.scale.y);
        TRUNK[0].setFromMatrixPosition(of.pelvis.matrixWorld);
        of.head.localToWorld(TRUNK[1].set(0, 0.1, 0));
        clearOf(p.x + PUSH[0], -p.y + PUSH[1], TRUNK[0], TRUNK[1], room);
        TRUNK[1].setFromMatrixPosition(of.ankL.matrixWorld).add(HAND.setFromMatrixPosition(of.ankR.matrixWorld)).multiplyScalar(0.5);
        clearOf(p.x + PUSH[0], -p.y + PUSH[1], TRUNK[0], TRUNK[1], room * 0.8);
      }
      const far = Math.hypot(PUSH[0], PUSH[1]), most = 0.8;  // a step, not a slide: a man in the very middle of it stays nearer than he should
      wantX = PUSH[0] * (far > most ? most / far : 1);
      wantY = -PUSH[1] * (far > most ? most / far : 1);
    }
    if (!(p.down || p.fell || flat || pileOn)) f.fall = 0;
    if (!(p.dive > 0) && !(p.stun > 0)) f.dove = false;  // back on his feet after a dive
    f.ox = f.oy = 0;  // how far from the engine's spot he is drawn (a tackler closes up on his man)
    tg[PELY] = HIP;
    tg[EL] = 0.25;
    tg[ER] = 0.25;
    tg[CHRX] = -0.05;

    if (p.act && s.G.state === 'scene') {
      // a cutscene's actor doing what the scene asks (actPose); he faces p.face when he is standing still
      eyes = false;
      snap = actPose(f, p, tg, s);
      if (p.face !== undefined && Math.hypot(p.vx, p.vy) < 0.6) {
        hx = -Math.sin(p.face);
        hy = Math.cos(p.face);
      }
    } else if (p.down || p.fell || flat || pileOn) {
      // on the turf (or on the pile)
      eyes = false;
      if (f.fall === 0) {
        // decide once which way he goes down
        const tk = ps.tackler;
        f.fallSide = 0;
        if (p.down && tk && tk !== p) {
          // the ball carrier: away from the hit
          let rel = Math.atan2(-(tk.x - p.x), tk.y - p.y) - f.heading;
          rel = Math.atan2(Math.sin(rel), Math.cos(rel));
          if (Math.abs(rel) < 1.0) f.fallDir = -1;  // met head on: onto his back
          else if (Math.abs(rel) > 2.1) f.fallDir = 1;  // caught from behind: face down
          else {
            f.fallDir = 1;
            f.fallSide = rel > 0 ? -1 : 1;
          }  // hit from the side: bowled over the other way
        } else if (p.fell || pileOn) f.fallDir = 1;  // the tackler, and anyone piling on, lands forward on his man
        else if (p.slide) f.fallDir = -1;  // a quarterback's slide: onto his back, feet first
        if (p.lying) f.fall = 0.999;  // a cutscene's hurt man: already down when it starts
        /* the hit, for the rag doll (see flop): the man tackled feels all of it, the tackler and the pile some; a man
           run over is knocked the way the runner was going; a slide and a staged fall are not hits at all */
        const hit = hitOf(s), mine = hit && p === hit.cr && p.down && !p.slide;
        f.imp = 0;
        f.fallT = 0.3;
        f.spin = 0;
        if (p.lying || p.slide) f.rg.fill(0);
        else if (mine) {
          ragHit(f, hit.imp, hit.x, hit.y, 1);
          f.fallT = hit.T;
        } else if (hit && p === hit.tq) {
          ragHit(f, hit.imp, -hit.x, -hit.y, 0.45);  // he stops, and the rest of him keeps going
          f.fallT = hit.T;
        } else if (flat && ps.carrier && ps.carrier !== p) {
          const cf = s.figOf ? s.figOf(ps.carrier) : null, vx = cf ? cf.pvx : ps.carrier.vx || 0, vy = cf ? cf.pvy : ps.carrier.vy || 0, vl = Math.hypot(vx, vy);
          ragHit(f, clamp(vl / 8, 0.5, 1.1), vl > 0.5 ? vx / vl : 0, vl > 0.5 ? vy / vl : s.dir, 1);
          f.fallT = 0.24;
        } else if (pileOn || p.fell) {
          const vl = Math.hypot(f.pvx, f.pvy);
          f.pimp = clamp(vl / 9, 0.3, 0.9);  // how hard he arrives, from how fast he was coming
          ragHit(f, f.pimp, -Math.sin(f.heading), Math.cos(f.heading), 0.5);
        }
        /* a gang tackle is not one moment: the second man in is a beat behind the first */
        f.pileHit = false;
        f.pileWait = pileOn ? Math.max(0, pileOf(s).indexOf(p)) * 0.12 : 0;
      }
      if (f.pileWait > 0) {
        f.pileWait -= dt;
        f.fall = Math.max(f.fall, 0.0001);
      } else f.fall = Math.min(1, f.fall + dt / f.fallT);
      const e = f.fall * f.fall * (3 - 2 * f.fall), wrap = (p.fell || pileOn) && !p.down && !flat;
      /* After the whistle nobody stays down: up onto a knee, then to his feet. The tackler goes first and the man
         underneath a beat later. */
      const up = s.G.state === 'dead' && !flat ? clamp(((ps.after || 0) - (p.down ? 1.05 : pileOn ? 0.45 : 0.85)) / (pileOn ? 0.5 : 0.75), 0, 1) : 0;  // the top of the pile off first, then the tackler, then the man with the ball
      const tk = wrap && p === ps.tackler && ps.carrier && ps.carrier.down && ps.carrier !== p ? ps.carrier : null;
      let reach = null;
      if (tk) {
        /* The tackle, as two men and not one after the other. He bends to the hit inside a tenth of a second, his
           shoulder at the runner's hip and his arms round him, and rides him down: he finishes lying across the
           runner's legs with his head to one side. He is drawn a little nearer than the engine has him, so that his
           shoulder really is at the hip. */
        const e1 = smooth(Math.min(1, f.fall * 3)), dx = tk.x - p.x, dy = tk.y - p.y, dl = Math.hypot(dx, dy) || 1, pull = (dl - 0.96) * e1 * (1 - smooth(Math.min(1, up * 2)));
        const cf = s.figOf ? s.figOf(tk) : null, sc = f.root.scale.y, side = f.seed > 3.14 ? 1 : -1;
        tg[PELY] = lerp(lerp(HIP, 0.8, e1), 0.46, e);
        tg[PELRX] = -(0.85 * e1 + 0.5 * e);
        tg[HL] = lerp(0.9, 0.62, e);
        tg[KL] = lerp(-0.9, -0.76, e);
        tg[HR] = lerp(0.3, 0.45, e);
        tg[KR] = lerp(-0.5, -0.6, e);
        tg[HEADRX] = 0.5;
        tg[HEADRY] = side * 0.6 * e1;
        f.ox = dx / dl * pull;
        f.oy = dy / dl * pull;
        hx = dx;
        hy = dy;
        if (cf) {
          /* a hand on each side of the runner's hips, reaching a little past him */
          HIPS.setFromMatrixPosition(cf.pelvis.matrixWorld);
          for (let k = 0; k < 2; k++) REACH[k].set(HIPS.x + (-dy * (k ? -1 : 1) * 0.19 + dx * 0.1) / dl * sc, HIPS.y, HIPS.z + (-dx * (k ? -1 : 1) * 0.19 - dy * 0.1) / dl * sc);
          reach = REACH;
        } else {
          tg[SLX] = 1.35;
          tg[SRX] = 1.35;
          tg[SLZ] = 0.55;
          tg[SRZ] = -0.55;
          tg[EL] = 0.75;
          tg[ER] = 0.75;
        }
      } else {
        tg[PELY] = lerp(HIP, wrap ? 0.34 : 0.24, e);
        if (f.fallSide && !flat) {
          tg[PELRZ] = 1.45 * e * f.fallSide;
          tg[PELRX] = -0.25 * e;
        } else tg[PELRX] = -1.5 * e * (flat ? -1 : f.fallDir);
        if (wrap) {
          tg[SLX] = 1.35;
          tg[SRX] = 1.35;
          tg[SLZ] = 0.55;
          tg[SRZ] = -0.55;
          tg[EL] = 0.75;
          tg[ER] = 0.75;
          tg[HEADRX] = 0.45;
        }  // arms locked around the ball
          else if (p.down && ps.carrier === p && (f.fallSide || f.fallDir < 0)) {
            /* the runner goes down on his back or his side with the ball still tucked away and his free arm out to break the fall */
            tg[SRX] = 0.55;
            tg[SRZ] = -0.2;
            tg[ER] = 2.0;
            tg[SLX] = 1.5;
            tg[SLZ] = -0.8;
            tg[EL] = 0.45;
            tg[HEADRX] = 0.25;
            if (f.fallSide > 0) {
              /* rolled onto his free-arm side: that arm goes out past his head along the turf. Held out to break the
                 fall it ended up straight under him, and the ground solver propped his whole body up on that hand. */
              tg[SLX] = 2.7;
              tg[SLZ] = 0.15;
              tg[EL] = 0.3;
            }
          } else if (p.down && ps.carrier === p) {
            /* on his face: the ball held out in front of him in the crook of his arm, the other hand down to break the fall */
            tg[SRX] = 2.5;
            tg[SRZ] = 0.1;
            tg[ER] = 1.1;
            tg[SLX] = 2.2;
            tg[SLZ] = -0.6;
            tg[EL] = 0.7;
            tg[HEADRX] = 0.35;
          } else {
            tg[SLX] = 2.5;
            tg[SRX] = 2.8;
            tg[SLZ] = -0.5;
            tg[SRZ] = 0.4;
            tg[EL] = 0.5;
            tg[ER] = 0.3;
            tg[HEADRX] = 0.2;
          }
        tg[HL] = 0.2;
        tg[KL] = -0.4;
        tg[HR] = -0.1;
        tg[KR] = -0.15;
        if (pileOn) {
          tg[PELRX] = -1.55 * e;  // flat out across the pile
          tg[HL] = tg[HR] = 0.05;
          tg[KL] = -0.25;
          tg[KR] = -0.1;
        }
      }
      /* The drive: a form tackle carries both men a stride on through the hit, together, before they are down: the
         tackler's legs keep going and the runner goes where he is pushed. Worked out once a tackle (from where the
         tackler was to where the runner was, longer the faster he came in) and drawn on both, so the wrap holds. */
      const cr = ps.carrier, tq = ps.tackler;
      if (cr && tq && cr !== tq && cr.down && (p === cr || (p === tq && p.fell))) {
        let dv = DRIVE.get(ps);
        if (!dv) {
          const ddx = cr.x - tq.x, ddy = cr.y - tq.y, dl = Math.hypot(ddx, ddy) || 1, D = clamp(0.5 + Math.hypot(tq.vx || 0, tq.vy || 0) * 0.04, 0.5, 0.8);
          DRIVE.set(ps, dv = { x: ddx / dl * D, y: ddy / dl * D });
        }
        const k = smooth(Math.min(1, f.fall * 1.6));
        f.ox += dv.x * k;
        f.oy += dv.y * k;
      }
      let onto = tk && s.figOf ? s.figOf(tk) : null;
      if (pileOn) {
        /* across the pile: drawn in until his chest is over the runner's, and kept on top of everyone already down */
        const rf = s.figOf(cd), mine = pileOf(s), low = mine.indexOf(p) === 1;
        if (rf) {
          /* Two men join a tackle differently (2026-11-21: both used to lie flat across the runner's chest, arms out,
             and he did not feel them, and with the tackler that made a stack three men high). The first goes high:
             his chest onto the runner's, his arms round him. The second comes in beside him: he lands on the turf at
             the runner's shoulder, a yard short of the others, and gets both hands on him. Each hits as he arrives:
             the runner (and the tackler under him, a little) is shoved the way that man came from, on top of whatever
             the first hit is still doing to him. */
          rf.chest.localToWorld(HIPS.set(0, low ? 0.45 : 0.3, 0));
          const off2 = smooth(Math.min(1, up / 0.6)), dx = HIPS.x - p.x, dy = -HIPS.z - p.y, dl = Math.hypot(dx, dy) || 1, pull = Math.max(0, dl - (low ? 1.75 : 0.55)) * e * (1 - off2);  // a man is about 1.6 yards from hips to helmet at the size he is drawn: the second lies short of the others, his hands the only part of him on the runner
          if (up < 0.3) {
            const sc = f.root.scale.y, wide = low ? 0.13 : 0.22, hy = HIPS.y + 0.05 * sc;
            for (let k = 0; k < 2; k++) REACH[k].set(HIPS.x + (-dy * (k ? -1 : 1) * wide + dx * 0.08) / dl * sc, hy, HIPS.z + (-dx * (k ? -1 : 1) * wide - dy * 0.08) / dl * sc);
            reach = REACH;
          }
          if (!f.pileHit && f.fall >= 0.5) {
            f.pileHit = true;
            const k = f.pimp || 0.4;
            ragKick(rf, k, dx / dl, dy / dl, low ? 0.7 : 0.85);
            ragKick(ps.tackler && s.figOf(ps.tackler), k, dx / dl, dy / dl, 0.35);
            if (f.landed === false && f.imp > 0) f.bv = 0;  // (his own bounce comes when he lands, in flop)
          }
          /* getting up he rolls back off the pile, away from its middle (between the runner and the tackler), not through them */
          const tf = ps.tackler && s.figOf(ps.tackler), mx = tf ? (cd.x + ps.tackler.x) / 2 : cd.x, my = tf ? (cd.y + ps.tackler.y) / 2 : cd.y;
          let bx = p.x - mx, by = p.y - my;
          const bl = Math.hypot(bx, by) || 1;
          bx /= bl;
          by /= bl;
          f.ox = dx / dl * pull + bx * 2 * off2;
          f.oy = dy / dl * pull + by * 2 * off2;
        }
        onto = [rf, ps.tackler && s.figOf(ps.tackler), ...mine.slice(0, mine.indexOf(p)).map(q => s.figOf(q))].filter(Boolean);
        if (onto.length < 2) onto.push(rf);  // always the pile rule (helmet and knees too), even with nobody but the runner down
      }
      /* a hard hit head on takes him off his feet: up and over before he comes down */
      if (f.imp > 0.8 && f.fallDir < 0 && !f.fallSide && !wrap && !flat) tg[PELY] += Math.sin(Math.PI * Math.min(1, f.fall)) * 0.2 * (f.imp - 0.55);
      flop(f, tg, dt, up, flat ? -1 : f.fallDir, p.down && ps.carrier === p ? (f.ballL ? 'L' : 'R') : null);
      const sx = pileOn ? f.sx : 0, sy = pileOn ? f.sy : 0;  // where he will really be drawn: a pile man getting up is also being stepped clear
      settle(f, tg, p.x + f.ox + sx, -(p.y + f.oy + sy), reach, onto, pileOn ? smooth(Math.min(1, f.fall * 2.5)) : smooth(clamp((f.fall - 0.45) / 0.55, 0, 1)), pileOn);  // a man diving onto bodies is held off them from early in the dive  // nothing under the turf; a tackler on his man, hands round him
      if (up > 0 && pileOn) {
        const e2 = smooth(Math.max(0, (up - 0.6) / 0.4));  // first he slides back off the pile still lying on it, then onto his feet once he is clear: no kneeling down through the men under him
        for (let i = 0; i < NPOSE; i++) tg[i] = lerp(tg[i], STAND[i], e2);
      } else if (up > 0) {
        const a1 = Math.min(1, up * 2), a2 = Math.max(0, up * 2 - 1), e1 = a1 * a1 * (3 - 2 * a1), e2 = a2 * a2 * (3 - 2 * a2);
        for (let i = 0; i < NPOSE; i++) tg[i] = lerp(lerp(tg[i], KNEEL[i], e1), STAND[i], e2);
      }
      if (wrap && ps.carrier && ps.carrier.down) {
        hx = ps.carrier.x - p.x;
        hy = ps.carrier.y - p.y;
      }  // facing the man he brought down
      snap = true;
    } else if (p.dive > 0 && p.hit > 0) {
      // hit stick: stays on his feet and drives a shoulder through
      eyes = false;
      tg[PELY] = HIP - 0.22;
      tg[PELRX] = -0.75;
      tg[CHRX] = -0.3;
      tg[HEADRX] = 0.5;
      tg[SLX] = 1.7;
      tg[SRX] = 1.7;
      tg[SLZ] = 0.35;
      tg[SRZ] = -0.35;
      tg[EL] = 0.5;
      tg[ER] = 0.5;
      tg[HL] = 1.6;
      tg[KL] = -1.1;
      tg[HR] = 0.3;
      tg[KR] = -0.4;
      plant(tg);
      hx = p.vx;
      hy = p.vy;
      snap = true;
    } else if (p.dive > 0) {
      /* A dive: he leaves his feet, laid out flat with both arms stretched at the man or the ball, and comes down on
         his chest. u runs 0 to 1 over the flight: he launches off the back leg, is level by the middle, and is on
         the turf at the end (the prone branch below takes over from there). */
      eyes = false;
      if (!f.dove) f.dvT = 0;
      f.dove = true;
      f.dvT += dt;
      f.dvh = [p.vx, p.vy];
      const u = clamp(f.dvT / 0.28, 0, 1), lay = smooth(Math.min(1, u * 1.8));
      tg[PELY] = lerp(0.82, 0.24, u * u) + Math.sin(u * Math.PI) * 0.1;
      tg[PELRX] = lerp(-0.7, -1.52, lay);
      tg[CHRX] = -0.05;
      tg[HEADRX] = 0.55 * lay;  // head up, eyes on what he is diving at
      tg[SLX] = lerp(2.2, 3.0, lay);
      tg[SRX] = lerp(2.2, 3.0, lay);
      tg[SLZ] = -0.12;
      tg[SRZ] = 0.12;
      tg[EL] = 0.08;
      tg[ER] = 0.08;
      tg[HL] = lerp(0.5, 0.05, lay);  // the drive leg straightens behind him
      tg[HR] = lerp(-0.5, -0.12, lay);
      tg[KL] = lerp(-0.9, -0.08, lay);
      tg[KR] = lerp(-0.2, -0.3, lay);
      hx = p.vx;
      hy = p.vy;
      snap = true;
    } else if (p.stun > 0 && f.dove) {
      /* After a dive that missed: face down on the turf where he landed, then up through a knee to his feet over
         the last third of a second (the game holds him out of the play for that long) */
      eyes = false;
      const rise = clamp(1 - p.stun / 0.34, 0, 1), a1 = Math.min(1, rise * 2), a2 = Math.max(0, rise * 2 - 1), e1 = a1 * a1 * (3 - 2 * a1), e2 = a2 * a2 * (3 - 2 * a2);
      tg[PELY] = 0.2;
      tg[PELRX] = -1.52;
      tg[HEADRX] = 0.35;
      tg[SLX] = 2.7;
      tg[SRX] = 2.5;
      tg[SLZ] = -0.3;
      tg[SRZ] = 0.3;
      tg[EL] = 0.7;
      tg[ER] = 0.5;
      tg[HL] = 0.05;
      tg[HR] = -0.1;
      tg[KL] = -0.1;
      tg[KR] = -0.25;
      if (rise > 0) for (let i = 0; i < NPOSE; i++) tg[i] = lerp(lerp(tg[i], KNEEL[i], e1), STAND[i], e2);
      if (f.dvh) {
        hx = f.dvh[0];
        hy = f.dvh[1];
      }
      snap = true;
    } else if (p.stun > 0) {
      // lost his footing
      eyes = false;
      const w = Math.sin(time * 13 + f.seed);
      tg[PELY] = HIP - 0.16;
      tg[CHRX] = -0.8;
      tg[SLX] = 0.7 + w * 0.3;
      tg[SRX] = 0.5 - w * 0.3;
      tg[SLZ] = -0.8;
      tg[SRZ] = 0.8;
      tg[HL] = 0.55;
      tg[KL] = -0.95;
      tg[HR] = -0.3;
      tg[KR] = -0.35;
      tg[HEADRX] = 0.4;
      plant(tg);
    } else if (s.celeb && s.G.state === 'dead' && !(p !== s.celeb.who && sp > 1.3)) {
      // a teammate still running to the scorer runs (the last branch); he celebrates once he is there
      eyes = false;
      if (p.team === s.celeb.team) {
        const w = s.celeb.who, grp = s.celeb.group || 0;
        snap = celebrate(f, p === w, tg, s.celeb.style ?? -1, grp, w ? Math.atan2(p.y - w.y, p.x - w.x) * 2 : 0);
        if (p === w || (grp === 3 && w)) {
          hx = camera.position.x - p.x;  // the scorer plays to the camera, and so does everyone when the side poses for its picture
          hy = -camera.position.z - p.y;
          turnRate = 14;
        } else if (w && Math.hypot(w.x - p.x, w.y - p.y) < 6) {
          hx = w.x - p.x;  // gathered round him, facing him
          hy = w.y - p.y;
        }
      } else {
        // heads down; and some with their hands on their helmets
        tg[CHRX] = -0.18;
        tg[HEADRX] = -0.4;
        tg[SLX] = 0.15;
        tg[SRX] = 0.15;
        tg[SLZ] = -0.4;
        tg[SRZ] = 0.4;
        tg[EL] = 1.5;
        tg[ER] = 1.5;
        if (f.seed > 3.8) {
          tg[CHRX] = 0.05;
          tg[HEADRX] = 0.15;
          tg[SLX] = tg[SRX] = 2.75;
          tg[SLZ] = -0.55;
          tg[SRZ] = 0.55;
          tg[EL] = tg[ER] = 2.25;
        }
      }
    } else if (p.eng || p.block) {
      // locked up in a block
      const o = p.eng || p.block, w = Math.sin(time * 15 + f.seed), of = s.figOf ? s.figOf(o) : null;
      eyes = false;  // on the man in front of him
      hx = o.x - p.x;
      hy = o.y - p.y;
      if (of && of !== f) {
        /* The engine holds the two of them about 0.8 yards apart, and at the size they are drawn that is chest inside
           chest, with no room for an arm. So each is drawn back from the other until there is room for their arms
           between them, and the helmets go past each other instead of through. */
        const dl = Math.hypot(hx, hy) || 1, need = 0.18 * (f.bodyS.z * f.root.scale.y + of.bodyS.z * of.root.scale.y) + 0.58, back = Math.max(0, need - dl) / 2;
        wantX = -hx / dl * back;
        wantY = -hy / dl * back;
        tg[PELRZ] = 0.13;
      }
      /* Four different jobs, four different bodies (until 1.17 every block was the same crouch):
         pass protection sits back, chest up and seat down, on short choppy feet;
         a run block is low and leaning, the legs driving in long pumps;
         a pass rusher leans in behind his hands and, every second or two, throws an arm over to get by;
         a run defender sits low and square, arms long, holding his ground. */
      const mine = p.team === ps.offTeam, passing = ps.mode === 'pass' && !ps.thrown && !ps.open, job = mine ? (passing ? 0 : 1) : passing ? 2 : 3;
      const wj = job === 0 ? Math.sin(time * 19 + f.seed) : w, amp = [0.16, 0.38, 0.32, 0.2][job];
      tg[PELY] = HIP - [0.15, 0.13, 0.1, 0.17][job];
      tg[CHRX] = [-0.12, -0.52, -0.46, -0.26][job] + (of ? 0 : -0.1);
      tg[HEADRX] = [0.12, 0.42, 0.36, 0.24][job];
      tg[SLX] = 1.45;
      tg[SRX] = 1.45;
      tg[EL] = 0.25;
      tg[ER] = 0.25;
      tg[HL] = [0.6, 0.5, 0.48, 0.55][job] + wj * amp;
      tg[HR] = [0.6, 0.5, 0.48, 0.55][job] - wj * amp;
      tg[KL] = tg[KR] = [-1.0, -0.8, -0.75, -0.95][job];
      tg[HLZ] = -0.1;
      tg[HRZ] = 0.1;  // a base wider than his hips
      plant(tg);
      /* hands on him: the blocker's inside, on the chest plate; the defender's wider and higher, on the shoulder pads */
      if (of && of !== f) handsOn(f, tg, p.x + f.sx, -(p.y + f.sy), of, !p.block, w * 0.012);
      if (job === 0) {
        // the punch: one hand, then the other, shot out and brought back
        const pu = Math.max(0, Math.sin(time * 6.5 + f.seed * 3));
        tg[Math.sin(time * 3.25 + f.seed * 1.5) > 0 ? ER : EL] += 0.55 * (1 - pu);
      } else if (job === 2) {
        // the arm over: about a third of a second, on one side or the other
        const ph = (time * 0.55 + f.seed * 0.37) % 1, u = ph < 0.2 ? Math.sin(ph / 0.2 * Math.PI) : 0, sd = Math.floor(time * 0.55 + f.seed * 0.37) % 2 ? 1 : -1;
        if (u > 0) {
          tg[sd > 0 ? SRX : SLX] = lerp(tg[sd > 0 ? SRX : SLX], 2.75, u);
          tg[sd > 0 ? ER : EL] = lerp(tg[sd > 0 ? ER : EL], 0.9, u);
          tg[CHRY] += sd * 0.45 * u;
          tg[PELRZ] += sd * 0.08 * u;
        }
      }
      armRate = 12;  // the hands are solved onto a man who is moving: followed a little softly, they do not chatter
    } else if (p.fc) {
      // fair catch: one arm straight up, waving, eyes on the ball
      tg[SRX] = 3.05;
      tg[SRZ] = 0.25 + Math.sin(time * 9) * 0.22;
      tg[ER] = 0.1;
      tg[HEADRX] = 0.1;
      tg[CHRX] = 0.04;
    } else if (p.thrT > 0 && thSet) {
      /* The throw (see TK): from wherever the wind-up left him through the cock, the stride and the whip to the
         release, then the finish. A quarterback who wound up while the power bar filled is cocked already and goes
         straight to the whip. The finish fits the power: a bullet snaps down with the chest over the front knee, a
         lob is pushed up and out and finishes high. */
      const a = ps.air, pw = p.thrP === undefined ? 0.5 : p.thrP;
      if (a && !a.kick && (a.x1 !== p.x || a.y1 !== p.y)) {
        f.thx = a.x1 - p.x;
        f.thy = a.y1 - p.y;
        f.thRel = throwRel(f.wind || 0, a.T);
      }
      if (f.thx === undefined || !(f.thRel > 0)) {
        f.thx = -Math.sin(f.heading);
        f.thy = Math.cos(f.heading);
        f.thRel = throwRel(f.wind || 0, 9);
      }
      const age = TH_LEN - p.thrT, x = throwX(age, f.wind || 0, f.thRel), psi = throwBody(f, tg, x, true), fin = smooth(clamp(x - 2, 0, 1)), th = Math.atan2(-f.thx, f.thy) - psi, far = Math.hypot(f.thx, f.thy) || 1, off = TH_OFF * f.root.scale.y;
      eyes = false;  // on the man he is throwing to
      tg[SRX] += (0.5 - pw) * 0.5 * fin;
      tg[CHRX] -= (pw - 0.5) * 0.2 * fin;
      thHead = psi - tg[CHRY];
      hx = -Math.sin(th);
      hy = Math.cos(th);
      turnRate = 60;
      wantX = f.thx / far * off;
      wantY = f.thy / far * off;
      thLegs = true;
      inHand = age < f.thRel ? 1 : 0;
      snap = true;
    } else if (s.holder === p && sp < 1 && (s.pre || (ps.air && ps.air.kick && ps.air.t < s.kickHit + 0.3))) {
      /* the holder: down on one knee beside the spot, hands out for the snap, then one finger on top of the ball
         until it is kicked out from under it */
      const d = s.dir;
      tg.set(KNEEL);
      tg[CHRX] = -0.3;
      tg[HEADRX] = 0.25;
      eyes = false;
      hx = ps.bx - p.x - Math.sign(p.x - ps.bx || 1) * 0.6;
      hy = d * 0.9;
      const near = Math.hypot(ball.position.x - p.x, -ball.position.z - p.y) < 2.4 && ball.visible;
      inv4.copy(f.chest.matrixWorld).invert();
      if (near) HAND.copy(ball.position);
      else HAND.set(p.x + (ps.bx - p.x) * 0.85, 0.75, -(p.y + d * 0.5));
      if (near && ps.air && ps.air.t > s.kickHit) HAND.set(p.x + (ps.bx - p.x) * 0.85, 0.5, -p.y);  // it has gone: the hand stays where it was
      HAND.y += near ? 0.16 : 0;
      HAND.applyMatrix4(inv4);
      for (let k = 0; k < 2; k++) {
        const sh = k ? f.shR : f.shL;
        armIK(HAND.x + (near ? 0 : k ? 0.1 : -0.1) - sh.position.x, HAND.y - (near && k ? 0.12 : 0) - sh.position.y, HAND.z - sh.position.z);
        tg[k ? SRX : SLX] = ARM[0];
        tg[k ? SRZ : SLZ] = ARM[1];
        tg[k ? ER : EL] = ARM[2];
      }
      armRate = 30;
      poseRate = 9;
    } else if (kickV >= 0) {
      /* The kick (1.18: until then the leg swung after the ball had gone, and nobody kicked a kickoff at all). The
         ball waits for the foot (see the ball, below). A tenth of a second of backswing into the ball, a high finish
         with a hop off the standing foot, then the leg comes down; a punter's finish is higher. */
      const v = kickV, hit = smooth(clamp(v / 0.1, 0, 1)), up = smooth(clamp((v - 0.1) / 0.16, 0, 1)), dn = smooth(clamp((v - 0.32) / 0.22, 0, 1)), top = s.kickPunt ? 2.15 : 1.6;
      eyes = false;  // head down through the kick
      tg[HR] = lerp(lerp(lerp(-0.95, 0.35, hit), top, up), 0.25, dn);
      tg[KR] = lerp(v < 0.065 ? -1.45 : lerp(-1.45, -0.08, clamp((v - 0.065) / 0.035, 0, 1)), -0.5, dn);
      tg[AR] = -0.35 * (1 - dn);  // the toe pointed
      tg[HL] = lerp(-0.05, -0.3, up) * (1 - dn);
      tg[KL] = -0.22;
      tg[AL] = 0.2 * up * (1 - dn);
      tg[PELY] = HIP - 0.035 + 0.07 * up * (1 - dn);
      tg[CHRX] = lerp(-0.12, 0.16, up) * (1 - dn);
      tg[CHRY] = 0.32 * up * (1 - dn);
      tg[HEADRX] = lerp(0.45, 0.1, up);
      tg[SLX] = 0.25;
      tg[SLZ] = -lerp(0.7, 1.25, hit) * (1 - dn * 0.7);
      tg[EL] = 0.15;
      tg[SRX] = lerp(-0.7, 0.5, up);
      tg[SRZ] = 0.4;
      tg[ER] = 0.5;
      if (s.kickAt) {
        hx = s.kickAt[2];
        hy = s.kickAt[3];
      }
      snap = true;
    } else if (s.pre && sp < 0.4) {
      // set before the snap: he gets down into it over half a second, he does not drop into it
      const st = stanceOf(p, s);
      setNow = true;
      f.stT = (f.stT || 0) + dt;
      poseRate = lerp(7, 60, smooth(clamp(f.stT / 0.5, 0, 1)));
      if (st === 'line') {
        eyes = false;  // a lineman in his stance looks at the man across from him
        tg[PELY] = 0.56;
        tg[CHRX] = -1.2;
        tg[HEADRX] = 0.85;
        tg[HL] = 1.3;
        tg[KL] = -1.85;
        tg[HR] = 1.15;
        tg[KR] = -1.7;
        tg[SRX] = 1.2;
        tg[ER] = 0.05;
        tg[SLX] = 0.7;
        tg[EL] = 1.1;
      } else if (st === 'under') {
        tg[PELY] = 0.8;
        tg[CHRX] = -0.55;
        tg[HEADRX] = 0.4;
        tg[HL] = 0.75;
        tg[KL] = -1.25;
        tg[HR] = 0.75;
        tg[KR] = -1.25;
        tg[SLX] = 0.95;
        tg[SRX] = 0.95;
        tg[EL] = 0.3;
        tg[ER] = 0.3;
      } else if (st === 'two') {
        tg[PELY] = 0.89;
        tg[CHRX] = -0.35;
        tg[HEADRX] = 0.25;
        tg[HL] = 0.5;
        tg[KL] = -0.95;
        tg[HR] = 0.5;
        tg[KR] = -0.95;
        tg[SLX] = 0.3;
        tg[SRX] = 0.3;
        tg[EL] = 1.0;
        tg[ER] = 1.0;
      } else {
        tg[PELY] = 0.95;
        tg[CHRX] = -0.22;
        tg[HEADRX] = 0.15;
        tg[HL] = 0.45;
        tg[KL] = -0.6;
        tg[HR] = -0.1;
        tg[KR] = -0.35;
        tg[SLX] = 0.3;
        tg[EL] = 0.9;
        tg[SRX] = -0.2;
        tg[ER] = 0.7;
      }
      /* talk before the snap: the quarterback in the shotgun points out a defender as he starts his cadence, and on
         most snaps the middle linebacker spreads his arms to set his front. Which snaps, and which way the arm goes,
         come from the play's number and the man's own seed, so it is not the same every time. */
      const pt = s.G.preT || 0, pn = s.G.pn || 0;
      if (ps.mode !== 'kick' && ps.mode !== 'ko') {
        if (p === ps.qb && st === 'two' && pt > 0.55 && pt < 1.35) {
          const e = smooth(clamp((pt - 0.55) / 0.2, 0, 1)) * (1 - smooth(clamp((pt - 1.15) / 0.2, 0, 1)));
          tg[SRX] = lerp(tg[SRX], 1.5, e);
          tg[ER] = lerp(tg[ER], 0.08, e);
          tg[SRZ] = lerp(tg[SRZ], ((pn * 37) % 5 - 2) * 0.16, e);
          tg[CHRX] = lerp(tg[CHRX], -0.12, e);
        } else if (p.role === 'MLB' && p.team !== ps.offTeam && Math.floor(pn * 2.7 + f.seed) % 3 !== 0 && pt > 0.8 && pt < 1.6) {
          const e = smooth(clamp((pt - 0.8) / 0.2, 0, 1)) * (1 - smooth(clamp((pt - 1.4) / 0.2, 0, 1)));
          tg[SLX] = lerp(tg[SLX], 1.0, e);
          tg[SRX] = lerp(tg[SRX], 1.0, e);
          tg[SLZ] = lerp(tg[SLZ], -0.95, e);
          tg[SRZ] = lerp(tg[SRZ], 0.95, e);
          tg[EL] = lerp(tg[EL], 0.2, e);
          tg[ER] = lerp(tg[ER], 0.2, e);
        }
      }
      plant(tg);
      hx = 0;
      hy = p.team === ps.offTeam ? s.dir : -s.dir;
    } else {
      /* on the move, or standing */
      let facing = sp > 1 ? 1 : 0, look = null;
      if (sp > 1) {
        hx = p.vx;
        hy = p.vy;
      }
      const cover = s.live && p.team !== ps.offTeam && !ps.open && !ps.air && p.asg !== 'rush' && ps.qb;
      if (inPocket) {
        const open = dropping ? 1.0 : qbSet ? 0.45 : 0;  // how far his body is turned to his throwing side
        hx = Math.sin(open) * s.dir;
        hy = Math.cos(open) * s.dir;
        facing = p.vy * s.dir >= 0 ? 1 : -1;
      } else if (cover) {
        /* Eyes on the quarterback. At a jog he stays square to him and shuffles or backpedals. When he has real
           ground to cover across the field (or is being run off deep) he turns his hips and runs with it, looking
           back over his shoulder: nobody shuffles at a sprint. */
        hx = ps.qb.x - p.x;
        hy = ps.qb.y - p.y;
        const toQb = (p.vx * hx + p.vy * hy) / ((Math.hypot(hx, hy) || 1) * (sp || 1));  // 1 closing on him, -1 backing straight away
        f.turned = sp > (toQb < -0.8 ? 6.4 : 4.6) - (f.turned ? 1 : 0) && toQb < 0.8;
        if (f.turned) {
          look = Math.atan2(-hx, hy);
          hx = p.vx;
          hy = p.vy;
        } else facing = toQb >= 0 ? 1 : -1;
      } else f.turned = false;
      const back = facing < 0, dirn = back ? -1 : 1, moving = Math.min(1, run * 3);
      /* legs: the stride (see above) gives each foot a place on the turf; the hips ride at the height it asks for */
      const lat = gait ? gait.base / 0.22 : 0;  // how much of this is a sideways shuffle
      /* arms, shoulders, the roll of the hips: the body on the stride (strideBody); standing, the arms hang */
      if (gait) strideBody(tg, gait, sn, dirn);
      else tg[EL] = tg[ER] = 0.3;
      if (lat > 0.05) {
        /* shuffling: elbows bent and a little out, hands ready in front of him */
        tg[SLX] = lerp(tg[SLX], 0.4, lat);
        tg[SRX] = lerp(tg[SRX], 0.4, lat);
        tg[SLZ] = -0.22 * lat;
        tg[SRZ] = 0.22 * lat;
        tg[EL] = lerp(tg[EL], 1.25, lat);
        tg[ER] = lerp(tg[ER], 1.25, lat);
      }
      if (look !== null) {
        const rel = look - f.heading;
        tg[CHRY] += clamp(Math.atan2(Math.sin(rel), Math.cos(rel)), -0.95, 0.95);  // running one way, chest and helmet turned back to the quarterback
      }
      /* The lean. Upright at a walk and further forward the faster he runs (a real jog leans about 0.22: the old line
         leaned a walker nearly as far). A backpedal keeps the chest over the toes and the hips low, as a defensive back
         is taught, instead of leaning back. And he leans with what his speed is doing: into a start, back against a
         stop, the hips sinking as he brakes. */
      const acc = f.snap || !(dt > 0) || f.spWas === undefined ? 0 : clamp((sp - f.spWas) / dt, -30, 30);
      f.spWas = sp;
      f.accS = f.snap ? 0 : (f.accS || 0) + (acc - (f.accS || 0)) * (1 - Math.exp(-dt * 5));
      const push = back || lat > 0.5 ? 0 : clamp(f.accS * 0.013, -0.14, 0.16) * moving;
      tg[CHRX] = lerp(back ? -0.17 * moving : -(0.03 + 0.31 * Math.pow(run, 1.3)) - push, -0.2, lat);
      tg[HEADRX] = -tg[CHRX] * 0.6;
      tg[PELY] = (gait ? lerp(HIP, gait.h, gait.walk) : HIP) - (back ? 0.03 * moving : 0) - Math.max(0, -push) * 0.25;  // the body rises between plants
      tg[PELRZ] = f.lean + (gait ? gait.roll : 0);  // leans into a cut, and rolls with the stride
      if (sp < 0.5) {
        // standing: breathe, and some rest hands on hips
        tg[CHRX] += Math.sin(time * 2 + f.seed) * 0.012;
        if (!s.live && f.seed > 3.6) {
          tg[SLZ] = -0.45;
          tg[SRZ] = 0.45;
          tg[EL] = 1.6;
          tg[ER] = 1.6;
          tg[SLX] = 0.15;
          tg[SRX] = 0.15;
        }
      }
      if (inPocket) {
        tg[SLX] = 0.8;
        tg[SRX] = 0.8;
        tg[SLZ] = 0.25;
        tg[SRZ] = -0.25;
        tg[EL] = 1.75;
        tg[ER] = 1.75;
        tg[CHRX] = -0.06;
        if (dropping) {
          // going back: the ball up by the back shoulder, the front arm across his chest to it, standing tall
          tg[SRX] = 1.15;
          tg[ER] = 2.05;
          tg[SRZ] = -0.1;
          tg[SLX] = 1.0;
          tg[EL] = 1.9;
          tg[SLZ] = 0.5;
          tg[CHRY] = 0.2;
          tg[CHRX] = -0.02;
          tg[PELRZ] = 0;
        } else if (qbSet) {
          // set to throw: the ball a little higher and nearer the throwing shoulder than when he carries it
          tg[SRX] = 1.0;
          tg[ER] = 1.95;
          tg[SRZ] = -0.15;
          tg[SLX] = 0.95;
          tg[EL] = 1.85;
          tg[SLZ] = 0.4;
          tg[CHRX] = -0.04;
        }
      }  // ball in both hands at the chest
        else if (carrier) {
          tg[SRX] = 0.5;
          tg[SRZ] = -0.15;
          tg[ER] = 2.0;
        }  // ball tucked away
      /* Securing a catch: for a quarter of a second after it the ball is pulled into the belly with both hands, the
         left hand coming across to the right and the elbows folding, before it goes under one arm (CMU capture 34_01,
         the receiver's hands from the catch at chest height to the ball held at the belly). */
      if (carrier && ps.caught && p !== ps.qb && f.secPs !== ps) {
        f.secPs = ps;
        f.secT = 0.26;
      }
      if (!carrier) f.secT = 0;
      if (f.secT > 0) {
        f.secT = Math.max(0, f.secT - dt);
        const x = 4 * (1 - f.secT / 0.26), i = Math.min(3, Math.floor(x)), a = x - i, k = Math.min(1, f.secT / 0.08);  // the last few hundredths ease into the carry
        for (let c = 0; c < SECURE_CH.length; c++) tg[SECURE_CH[c]] = lerp(tg[SECURE_CH[c]], lerp(SECURE[i][c], SECURE[i + 1][c], a), k);
      }
      if (ps.mode === 'run' && s.live && ps.runner && ps.runner !== ps.qb) {
        // the exchange
        if (p === ps.qb && !ps.handoff) {
          // both hands on the ball, out in front of his belt where the back will take it (the ball is drawn there)
          armIK(-0.25, 0.11 - f.shR.position.y, -0.31);
          tg[SRX] = ARM[0];
          tg[SRZ] = ARM[1];
          tg[ER] = ARM[2];
          armIK(0.25, 0.11 - f.shL.position.y, -0.31);
          tg[SLX] = ARM[0];
          tg[SLZ] = ARM[1];
          tg[EL] = ARM[2];
        }
          else if (p === ps.qb && ps.t < 1.7) {
            tg[SRX] = 1.25;
            tg[SRZ] = 0.5;
            tg[ER] = 0.15;
            tg[CHRY] = -0.35;
            tg[SLX] = 0.2;
            tg[EL] = 0.9;
          }  // arm left out after the give
          else if (p === ps.runner && !ps.handoff) {
            tg[SLX] = 1.0;
            tg[EL] = 1.5;
            tg[SRX] = 0.45;
            tg[ER] = 1.75;
            tg[SLZ] = 0.2;
            tg[SRZ] = -0.2;
          }  // arms make a pocket
      }
      if (p.pump > 0 && !winding && inPocket) {
        /* the pump fake: the ball goes back by his ear, the arm starts forward, and he pulls it down again */
        const e = Math.sin(clamp(1 - p.pump / 0.42, 0, 1) * Math.PI);
        throwUpper(f, tg, 1.4 * e, Math.min(1, e * 3));
        inHand = Math.min(1, e * 3);
        snap = true;
      }
      if (winding) {
        /* winding up as the power bar fills: he turns side-on to the man he has picked, the ball goes back behind
           the ear with the elbow high, the front hand comes off it, and his weight settles on the back leg */
        const e = smooth(s.charge), r = s.G.chg && ps.recs ? ps.recs[s.G.chg.i] : null;
        eyes = false;  // on the man he has picked
        f.wind = e;
        inHand = Math.min(1, e * 4);
        if (r) {
          f.thx = r.x - p.x;
          f.thy = r.y - p.y;
        } else if (f.thx === undefined) {
          f.thx = 0;
          f.thy = s.dir;
        }
        if (thSet) {
          const psi = throwBody(f, tg, e, true), th = Math.atan2(-f.thx, f.thy) - psi, far = Math.hypot(f.thx, f.thy) || 1, off = TH_OFF * f.root.scale.y;
          thHead = psi - tg[CHRY];
          hx = -Math.sin(th);
          hy = Math.cos(th);
          turnRate = 22;
          wantX = f.thx / far * off;
          wantY = f.thy / far * off;
          thLegs = true;
        } else {
          throwUpper(f, tg, e, Math.min(1, e * 2.5));
          hx = f.thx;
          hy = f.thy;
        }
      } else if (p.thrT > 0) {
        /* a throw on the run: the legs keep going, the chest and arm do the throwing */
        const a = ps.air;
        if (a && !a.kick && (a.x1 !== p.x || a.y1 !== p.y)) {
          f.thx = a.x1 - p.x;
          f.thy = a.y1 - p.y;
          f.thRel = throwRel(f.wind || 0, a.T);
        }
        if (f.thx === undefined || !(f.thRel > 0)) {
          f.thx = -Math.sin(f.heading);
          f.thy = Math.cos(f.heading);
          f.thRel = throwRel(f.wind || 0, 9);
        }
        const age = TH_LEN - p.thrT;
        throwUpper(f, tg, throwX(age, f.wind || 0, f.thRel), 1);
        eyes = false;
        thHead = -tg[CHRY];
        hx = f.thx;
        hy = f.thy;
        turnRate = 30;
        inHand = age < f.thRel ? 1 : 0;
        snap = true;
      }
      if (ps.air && !ps.air.kick && ps.air.T - ps.air.t < 0.5) {
        const a = ps.air, bx = a.x - p.x, by = a.y - p.y;
        if (a.target === p) {
          /* The catch: the chest turns to the ball and both hands go out to meet it, as high as the ball is.
             A ball dropping in over the shoulder is taken with the arms up and the head back. */
          let rel = Math.atan2(-bx, by) - f.heading;
          rel = Math.atan2(Math.sin(rel), Math.cos(rel));
          const over = Math.abs(rel) > 1.9, elev = Math.atan2(passZ(a) - 2.5, Math.max(0.8, Math.hypot(bx, by))), reach = over ? 2.7 : clamp(1.45 + elev, 1.2, 2.8);
          /* a ball at chest height is taken as a real receiver takes it (CMU capture 34_01): hands out in front of the
             chest with the elbows bent, not with the arms locked out; higher balls straighten the arms */
          const chestK = over ? 0 : clamp((1.75 - reach) / 0.4, 0, 1);
          tg[SLX] = lerp(reach, 0.97, chestK);
          tg[SRX] = lerp(reach, 0.97, chestK);
          tg[SLZ] = over ? -0.15 : 0.22;
          tg[SRZ] = over ? 0.15 : -0.22;
          tg[EL] = lerp(0.35, 1.3, chestK);
          tg[ER] = lerp(0.35, 1.3, chestK);
          tg[CHRY] = over ? 0 : clamp(rel, -1.1, 1.1);
          tg[HEADRX] = over ? 0.4 : clamp(elev * 0.7, -0.05, 0.45);
          /* Contested (a defender within 1.8 yards of where it comes down): he goes up for it, both arms high,
             and takes it at the top of the jump, then lands and runs. Off target (it comes down a yard or more off his
             line, with nobody near): he stretches for it, chest out over the front foot and arms long toward the ball. */
          const left = a.T - a.t, cx = a.x1 - p.x, cy = a.y1 - p.y, miss = Math.hypot(cx, cy);
          if (Math.min(a.x1, FW - a.x1) < 2.2 && left < 0.3) {
            // coming down within two yards of the sideline: he gets his toes down in bounds as he takes it (see below)
            f.tap = Math.max(f.tap, smooth(1 - left / 0.3));
            f.tapSide = a.x1 < FW / 2 ? -1 : 1;
          }
          let fight = 99;
          for (const o of s.P || []) if (o.team !== p.team && !o.down) fight = Math.min(fight, Math.hypot(o.x - a.x1, o.y - a.y1));
          if (fight < 1.8 && left < 0.42) {
            // over the shoulder too: a deep ball with a man on him is fought for in the air
            const up = Math.sin(clamp(1 - left / 0.42, 0, 1) * Math.PI / 2);
            f.leap = Math.max(f.leap, up);
            tg[SLX] = tg[SRX] = lerp(reach, 3.0, up);
            tg[EL] = tg[ER] = lerp(0.35, 0.1, up);
            tg[SLZ] = 0.1;
            tg[SRZ] = -0.1;
            tg[CHRY] *= 1 - up;
            tg[CHRX] = 0.12 * up;
            tg[HEADRX] = lerp(tg[HEADRX], 0.5, up);
          } else if (!over && miss > 0.9 && miss < 2.6 && left < 0.36) {
            stretch = smooth(1 - left / 0.36);
            let rl = Math.atan2(-cx, cy) - f.heading;
            rl = Math.atan2(Math.sin(rl), Math.cos(rl));
            tg[CHRY] = clamp(rl, -1.1, 1.1);
            tg[CHRX] = lerp(tg[CHRX], -0.55, stretch);
            tg[SLX] = tg[SRX] = lerp(reach, 1.6, stretch);
            tg[EL] = tg[ER] = lerp(0.35, 0.04, stretch);
            tg[HEADRX] = lerp(tg[HEADRX], -0.05, stretch);
          }
          /* The hands go to the ball itself over the last quarter of a second or so (a ball coming over his shoulder,
             only at the very end): until 1.16 they were held out in its general direction and the ball arrived
             wherever it arrived. Each hand a little to its own side of it. */
          const home = smooth(clamp(1 - left / (over ? 0.12 : 0.28), 0, 1));
          if (home > 0) {
            inv4.copy(f.chest.matrixWorld).invert();
            HAND.set(a.x, passZ(a), -a.y).applyMatrix4(inv4);
            for (let k = 0; k < 2; k++) {
              const sh = k ? f.shR : f.shL;
              armIK(HAND.x + (k ? 0.07 : -0.07) - sh.position.x, HAND.y - sh.position.y, HAND.z + 0.03 - sh.position.z);
              tg[k ? SRX : SLX] = lerp(tg[k ? SRX : SLX], ARM[0], home);
              tg[k ? SRZ : SLZ] = lerp(tg[k ? SRZ : SLZ], ARM[1], home);
              tg[k ? ER : EL] = lerp(tg[k ? ER : EL], ARM[2], home);
            }
            armRate = 45;
          }
        } else if (p.team !== ps.offTeam && a.T - a.t < 0.42 && Math.hypot(p.x - a.x1, p.y - a.y1) < 2.4) {
          // a defender at the catch point gets a hand up; right on it, he goes up with the receiver
          const near = Math.hypot(p.x - a.x1, p.y - a.y1);
          tg[SRX] = 2.75;
          tg[ER] = 0.15;
          tg[HEADRX] = 0.35;
          if (near < 1.5) {
            const up = Math.sin(clamp(1 - (a.T - a.t) / 0.42, 0, 1) * Math.PI / 2) * 0.85;
            f.leap = Math.max(f.leap, up);
            tg[SLX] = lerp(tg[SLX], 2.5, up);
            tg[EL] = 0.25;
          }
          /* and the hand goes for the ball itself as it arrives: the one on the ball's side, or both when he is right
             under it (an interception is made with two hands) */
          const home = smooth(clamp(1 - (a.T - a.t) / 0.22, 0, 1));
          if (home > 0) {
            inv4.copy(f.chest.matrixWorld).invert();
            HAND.set(a.x, passZ(a), -a.y).applyMatrix4(inv4);
            for (let k = 0; k < 2; k++) {
              if (near > 0.9 && (HAND.x > 0) !== !!k) continue;
              const sh = k ? f.shR : f.shL;
              armIK(HAND.x + (near > 0.9 ? 0 : k ? 0.07 : -0.07) - sh.position.x, HAND.y - sh.position.y, HAND.z + 0.03 - sh.position.z);
              tg[k ? SRX : SLX] = lerp(tg[k ? SRX : SLX], ARM[0], home);
              tg[k ? SRZ : SLZ] = lerp(tg[k ? SRZ : SLZ], ARM[1], home);
              tg[k ? ER : EL] = lerp(tg[k ? ER : EL], ARM[2], home);
            }
            armRate = 45;
          }
        }
      }
      /* The juke (reworked 2026-11-17; it was only a tilt of the hips): first the plant, low on the outside foot with
         the shoulders and helmet selling the other way, then the cut, leaning hard into the new direction with the free
         arm thrown out for balance. The side is read from the burst of speed sideways the move gives him (doJuke). */
      if (p.juke > (f.jkLast || 0) + 0.05) {
        f.jk0 = p.juke;
        f.jkSide = Math.sign(p.vx * Math.cos(f.heading)) || 1;  // 1: the cut goes to his right
      }
      f.jkLast = p.juke;
      if (p.juke > 0 && !(p.spinT > 0) && f.jk0) {
        const u = clamp(1 - p.juke / f.jk0, 0, 1), sd = f.jkSide, free = f.ballL ? [SRX, SRZ, ER, 1] : [SLX, SLZ, EL, -1];
        if (u < 0.35) {
          const e = Math.sin(u / 0.35 * Math.PI / 2);
          tg[PELY] -= 0.19 * e;  // a real hard cut takes the hips down to about four fifths of standing height (CMU capture 78_28)
          tg[PELRZ] = sd * 0.22 * e;
          tg[CHRY] = sd * 0.32 * e;
          tg[HEADRY] = sd * 0.25 * e;
          tg[CHRX] = Math.min(tg[CHRX], -0.25 * e);
        } else {
          const e = Math.sin((u - 0.35) / 0.65 * Math.PI);
          tg[PELY] -= 0.1 * e;
          tg[PELRZ] = -sd * 0.42 * e;
          tg[CHRY] = -sd * 0.18 * e;
          tg[CHRX] = Math.min(tg[CHRX], -0.2 * e);
          tg[free[0]] = lerp(tg[free[0]], 0.55, e);
          tg[free[1]] = lerp(tg[free[1]], 0.75 * free[3], e);
          tg[free[2]] = lerp(tg[free[2]], 0.5, e);
        }
      }
      /* the spin: low through it, the ball locked away in both arms against his chest */
      if (p.spinT > 0) {
        const e = Math.sin(clamp(1 - p.spinT / 0.5, 0, 1) * Math.PI);
        tg[PELY] -= 0.12 * e;
        tg[CHRX] = Math.min(tg[CHRX], -0.3 * e);
        tg[SLX] = tg[SRX] = 0.75;
        tg[SLZ] = 0.32;
        tg[SRZ] = -0.32;
        tg[EL] = tg[ER] = 1.85;
        tg[PELRZ] = 0.12 * e;
      }
      /* a broken tackle (game.js counts them on p.shrugN): a stumble through it, chest pitched forward, the free arm
         flung out, a wobble at the hips, then back into his stride */
      if ((p.shrugN || 0) !== (f.shrugSeen || 0)) {
        f.shrugSeen = p.shrugN;
        f.shrug = 0.45;
      }
      if (f.shrug > 0) {
        f.shrug = Math.max(0, f.shrug - dt);
        const e = Math.sin(clamp(1 - f.shrug / 0.45, 0, 1) * Math.PI), free = f.ballL ? [SRX, SRZ, 1] : [SLX, SLZ, -1];
        tg[PELY] -= 0.1 * e;
        tg[CHRX] = Math.min(tg[CHRX], -0.45 * e);
        tg[PELRZ] += Math.sin(time * 26 + f.seed) * 0.13 * e;
        tg[free[0]] = lerp(tg[free[0]], 0.9, e);
        tg[free[1]] = lerp(tg[free[1]], 1.0 * free[2], e);
        tg[HEADRX] = lerp(tg[HEADRX], 0.2, e);
      }
      if (p.truck > 0) {
        // shoulder down, both arms over the ball
        eyes = false;
        tg[CHRX] = -0.85;
        tg[HEADRX] = 0.55;
        tg[SLX] = 0.9;
        tg[SRX] = 0.9;
        tg[SLZ] = 0.3;
        tg[SRZ] = -0.3;
        tg[EL] = 1.7;
        tg[ER] = 1.7;
        tg[PELY] -= 0.1;
      } else if (p.stiff > 0) {
        tg[SLX] = 1.45;
        tg[SLZ] = -0.55;
        tg[EL] = 0.05;
        tg[CHRY] = 0.28;
        /* The stiff arm goes to the man: the nearest defender on his feet within reach, in front of him or beside
           him. The chest turns part of the way, and the free hand is put on his shoulder pad (or as far toward it as
           the arm goes), instead of the arm always locking out to the same side. */
        let near = null, nd = 2.4;
        for (const o of s.P || []) if (o.team !== p.team && !o.down && !o.fell) {
          const d = Math.hypot(o.x - p.x, o.y - p.y);
          if (d < nd) {
            nd = d;
            near = o;
          }
        }
        if (near) {
          const ch = Math.cos(f.heading), sh = Math.sin(f.heading), sc = f.root.scale.y, dx = near.x - p.x, dy = near.y - p.y;
          const rx = (dx * ch + dy * sh) / sc, fz = (-dx * sh + dy * ch) / sc;  // to his right and ahead of him, in his own lengths
          if (fz > -0.3) {
            const ang = Math.atan2(rx, Math.max(0.05, fz)), yaw = clamp(-ang * 0.6, -0.8, 0.5), cy = Math.cos(yaw), sy = Math.sin(yaw);  // a turn of the chest is counted to his left, the man's bearing to his right
            const x = rx * cy + fz * sy, z = rx * sy - fz * cy, far = Math.hypot(x, z) || 1, to = Math.max(0.2, far - 0.26) / far;  // in the turned chest's space (z is behind him); the hand stops at his pads, not inside him
            const k = ang > 0.35 ? 1 : 0, shd = k ? f.shR : f.shL;  // a man on his right gets the right hand: the ball goes under the other arm
            armIK(x * to - shd.position.x, -0.04, z * to - shd.position.z);
            tg[k ? SRX : SLX] = ARM[0];
            tg[k ? SRZ : SLZ] = ARM[1];
            tg[k ? ER : EL] = ARM[2];
            if (k) {
              tg[SLX] = 0.5;
              tg[SLZ] = 0.15;
              tg[EL] = 2.0;
              f.ballL = true;
            }
            tg[CHRY] = yaw;
            eyes = false;
            tg[HEADRY] = clamp(-ang - yaw, -0.6, 0.6) * 0.6;  // a look at the man he is fending off
          }
        }
      }  // free arm locked out, or on the tackler
      if (p.strip > 0) {
        tg[SRX] = 1.4 + Math.sin(time * 28) * 0.45;
        tg[ER] = 0.4;
      }  // swiping at the ball
      if (qbSet && !winding && !(p.thrT > 0)) {
        /* reading the field, he pats the ball: the front hand comes off it and taps it, about once a second */
        const pat = Math.pow(Math.max(0, Math.sin(time * 5.6 + f.seed)), 8);
        tg[EL] -= 0.3 * pat;
        tg[SLZ] -= 0.12 * pat;
      }
      const ge = ps.gest;
      if (ge && ge.who === p && s.G.state === 'dead' && sp < 3.5 && !carrierHeld(p, ps)) {
        /* after the whistle (see gesture() in game.js): in over a quarter of a second, held, and out again before the huddle */
        const a = ps.after || 0, e = smooth(clamp((a - 0.25) / 0.25, 0, 1)) * (1 - smooth(clamp((a - 1.4) / 0.25, 0, 1)));
        if (e > 0) {
          const to = (i, v) => (tg[i] = lerp(tg[i], v, e));
          eyes = false;
          if (ge.kind === 'point') {
            // first down: the free arm straight out upfield, with a jab in it
            const k = ps.carrier === p ? 0 : 1;  // the man with the ball points with the other hand
            to(k ? SRX : SLX, 1.5 + 0.12 * Math.sin(time * 14));
            to(k ? SRZ : SLZ, 0);
            to(k ? ER : EL, 0.05);
            to(CHRX, 0.02);
            hx = 0;
            hy = p.team === ps.offTeam ? s.dir : -s.dir;
          } else if (ge.kind === 'wave') {
            // no catch: both arms out low in front of him, crossing and uncrossing
            const w = Math.sin(time * 10);
            to(SLX, 0.95);
            to(SRX, 0.95);
            to(SLZ, 0.1 + 0.45 * w);
            to(SRZ, -0.1 - 0.45 * w);
            to(EL, 0.12);
            to(ER, 0.12);
            to(CHRX, -0.12);
          } else if (ge.kind === 'pump') {
            // the kick is good: a fist, pumped twice
            to(SRX, 2.2 + 0.35 * Math.sin(time * 12));
            to(ER, 1.7);
            to(SRZ, 0.15);
            to(CHRX, 0.05);
          } else if (ge.kind === 'aw') {
            // the one that got away: both hands on top of his helmet, head down
            to(SLX, 2.75);
            to(SRX, 2.75);
            to(SLZ, 0.25);
            to(SRZ, -0.25);
            to(EL, 2.05);
            to(ER, 2.05);
            to(HEADRX, 0.3);
            to(CHRX, -0.12);
          } else if (ge.kind === 'help') {
            // helping the runner up: he turns to him, bends, and holds a hand down to him
            to(SRX, 0.95);
            to(ER, 0.12);
            to(SRZ, 0.05);
            to(CHRX, -0.5);
            to(HEADRX, 0.3);
            if (ge.to) {
              hx = ge.to.x - p.x;
              hy = ge.to.y - p.y;
            }
          } else {
            // a sack: both arms out and bent up, chest out, a couple of pumps
            const pump = 0.12 * Math.sin(time * 11);
            to(SLX, 0.15);
            to(SRX, 0.15);
            to(SLZ, -1.3);
            to(SRZ, 1.3);
            to(EL, 1.9 + pump);
            to(ER, 1.9 + pump);
            to(CHRX, 0.12);
            to(HEADRX, -0.2);
          }
        }
      }
      if (stretch > 0) tg[PELY] -= 0.12 * stretch;  // lower into the lunge
      if (p.hurdle > 0) {
        // lead leg up and over, trail leg tucked
        const up = Math.sin(clamp(1 - p.hurdle / 0.5, 0, 1) * Math.PI);
        tg[PELY] = HIP + 0.62 * up;
        tg[HL] = 1.5;
        tg[KL] = -0.25;
        tg[HR] = -0.5;
        tg[KR] = -1.5;
        tg[CHRX] = -0.3;
        snap = true;
      } else if (f.leap > 0.03) {
        // off the ground for the ball: knees drawn up under him, one more than the other, toes down
        const up = f.leap;
        tg[PELY] = HIP + 0.5 * up;
        tg[HL] = 0.65 * up;
        tg[KL] = -1.25 * up;
        tg[HR] = 0.2 * up;
        tg[KR] = -0.75 * up;
        snap = true;
      } else if (thLegs) striding = false;
      else if (gait) {
        /* last, so the legs reach the turf from wherever the hips have ended up (lower when he drops a shoulder) */
        strideLegs(tg, gait, tg[PELY]);
        striding = true;
      } else if (qbSet && !(p.thrT > 0)) {
        /* the quarterback set in the pocket: a throwing base, front foot toward the target and back foot behind him,
           knees bent, and a little life in it while he reads */
        tg[PELY] = 0.935 + Math.sin(time * 6 + f.seed) * 0.006;
        for (let k = 0; k < 2; k++) {
          legIK(k ? 0.09 : -0.09, k ? -0.13 : 0.17, SOLE, tg[PELY], 0);
          tg[k ? HR : HL] = LEG[0];
          tg[k ? KR : KL] = LEG[1];
          tg[k ? AR : AL] = LEG[2];
          tg[k ? HRZ : HLZ] = LEG[3];
          tg[k ? ARZ : ALZ] = LEG[4];
          tg[k ? ARY : ALY] = LEG[5];
        }
      } else plant(tg);  // standing still: on the turf, not a centimetre in it
      if (f.tap > 0.05 && !(p.hurdle > 0) && !(f.leap > 0.03)) {
        /* the toe tap: both feet together on the field side, up on the toes with the heels lifted, and the body
           leaning out over the sideline. Blended over his stride by how far into it he is. */
        const e = f.tap, s = Math.sign(f.tapSide * Math.cos(f.heading)) || 1;  // the sideline is to his right (1) or his left (-1)
        tg[PELY] = lerp(tg[PELY], 0.97, e);
        tg[PELRZ] = lerp(tg[PELRZ], -0.3 * s, e);
        for (let k = 0; k < 2; k++) {
          legIK(-s * 0.1 + (k ? 0.05 : -0.05), k ? -0.04 : 0.06, SOLE + TOE * Math.sin(0.9) * 0.5, tg[PELY], 0.9);
          const I = k ? [HR, KR, AR, HRZ, ARZ, ARY] : [HL, KL, AL, HLZ, ALZ, ALY];
          for (let j = 0; j < 6; j++) tg[I[j]] = lerp(tg[I[j]], LEG[j], e);
        }
      }
    }
    if (p.arms === 'over') {
      /* helped off: an arm over each trainer's shoulders, head down, a little bent */
      tg[SLZ] = 1.25;
      tg[SRZ] = -1.25;
      tg[SLX] = 0.25;
      tg[SRX] = 0.25;
      tg[EL] = 0.55;
      tg[ER] = 0.55;
      tg[CHRX] = Math.min(tg[CHRX], -0.05) - 0.12;
      tg[HEADRX] = 0.35;
    } else if (p.arms === 'L' || p.arms === 'R') {
      /* a trainer helping him: the arm on his side round the man's back, the other one holding his wrist in front */
      const near = p.arms === 'L' ? [SLX, SLZ, EL] : [SRX, SRZ, ER], far = p.arms === 'L' ? [SRX, SRZ, ER] : [SLX, SLZ, EL], sg = p.arms === 'L' ? 1 : -1;
      tg[near[0]] = 0.35;
      tg[near[1]] = 0.95 * sg;
      tg[near[2]] = 1.1;
      tg[far[0]] = 0.9;
      tg[far[1]] = -0.35 * sg;
      tg[far[2]] = 1.5;
    }
    /* A forward lean comes partly from the hips: the seat goes back and the jersey stays tucked in,
       instead of the chest folding over a level pelvis. The thighs counter-rotate so the feet stay put. */
    if (tg[PELRX] === 0 && tg[CHRX] < -0.15) {
      const lean = tg[CHRX] * 0.55;
      tg[PELRX] = lean;
      tg[CHRX] -= lean;
      tg[HL] -= lean;
      tg[HR] -= lean;
    }
    if (p.role === 'C' && p.team === ps.offTeam && !p.down && ps.mode !== 'ko') {
      /* the center and the ball (1.20): his hand is on it before the snap, and at the snap the arm fires it back
         between his legs, then comes up into the block. On a kick the same, when the kick is called for. */
      const kt = ps.air && ps.air.kick && s.kickSnap ? ps.air.t : -1, t = kt >= 0 ? kt : s.live && !ps.air && ps.t < 0.3 ? ps.t : -1, on = s.pre && sp < 0.4 ? 1 : t >= 0 && t < 0.3 ? 1 - smooth(clamp((t - 0.14) / 0.16, 0, 1)) : 0;
      if (on > 0) {
        const back = t >= 0 ? smooth(clamp(t / 0.12, 0, 1)) : 0, d = s.dir;
        inv4.copy(f.chest.matrixWorld).invert();
        HAND.set(lerp(ps.bx, p.x, back), lerp(0.24, 0.62, back), -lerp(ps.los, p.y - d * 0.75, back)).applyMatrix4(inv4);
        armIK(HAND.x - f.shR.position.x, HAND.y - f.shR.position.y, HAND.z - f.shR.position.z);
        tg[SRX] = lerp(tg[SRX], ARM[0], on);
        tg[SRZ] = lerp(tg[SRZ], ARM[1], on);
        tg[ER] = lerp(tg[ER], ARM[2], on);
        if (t >= 0) armRate = 50;
      }
    }
    if (kickRun && s.kickAt && kickV < 0) {
      // running up to the ball, facing where it will go
      hx = s.kickAt[2];
      hy = s.kickAt[3];
    }
    /* heading */
    if (hx !== null && (hx || hy)) {
      const want = Math.atan2(-hx, hy);
      let d = want - f.heading;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      f.heading += f.snap ? d : turnRate > 13 ? d * (1 - Math.exp(-dt * turnRate)) : clamp(d * (1 - Math.exp(-dt * turnRate)), -11 * dt, 11 * dt);  // nobody turns right round in a frame or two: about a quarter of a second for a half turn
      f.lean += ((f.snap ? 0 : clamp(d * 0.9 * run, -0.32, 0.32)) - f.lean) * (1 - Math.exp(-dt * 9));
    } else f.lean *= Math.exp(-dt * 9);
    if (p.spinT > 0) f.heading += dt * Math.PI * 2 / 0.5;
    /* eyes: the helmet turns to what he is watching, as far as a neck goes (over the shoulder), and tips up at a ball
       high in the air. What is straight behind him he does not try to see. */
    let yaw = 0, tip = 0, twist = 0;
    if (eyes && !(p.spinT > 0) && watching(f, p, s, inPocket)) {
      const dx = EYE[0] - p.x - f.ox, dy = EYE[1] - p.y - f.oy, far = Math.hypot(dx, dy);
      let rel = Math.atan2(-dx, dy) - f.heading - tg[CHRY];
      rel = Math.atan2(Math.sin(rel), Math.cos(rel));
      if (far > 0.7 && Math.abs(rel) < 2.5) {
        twist = clamp(Math.abs(rel) - 1.0, 0, 0.8) * 0.5 * Math.sign(rel);  // past about sixty degrees the shoulders come round too
        yaw = clamp(rel - twist, -1.2, 1.2);
        if (EYE[2] >= 0 && !(ps.air && ps.air.target === p)) tip = clamp(Math.atan2(EYE[2] - 1.9 * f.root.scale.y, far) * 0.8, 0, 0.55);  // the man it is thrown to has his own way of looking at it (the catch)
      }
    }
    const turn = f.snap ? 1 : 1 - Math.exp(-dt * 8);
    f.look += (yaw - f.look) * turn;
    f.tip += (tip - f.tip) * turn;
    f.twist += (twist - f.twist) * turn;
    tg[HEADRY] += f.look;
    if (thHead !== null) tg[HEADRY] = clamp(thHead, -1.3, 1.3);
    tg[HEADRX] += f.tip;
    tg[CHRY] += f.twist;
    /* standing room (at a block, beside a pile) comes and goes over a few tenths of a second, so nobody jumps */
    const ease = f.snap ? 1 : 1 - Math.exp(-dt * 6), mx = (wantX - f.sx) * ease, my = (wantY - f.sy) * ease;
    f.sx += mx;
    f.sy += my;
    f.svx = f.snap || !(dt > 0) ? 0 : mx / dt;
    f.svy = f.snap || !(dt > 0) ? 0 : my / dt;
    if (thLegs) {
      // the throw moves his hips over his feet itself: followed exactly, and the easing takes him back afterward
      f.sx = wantX;
      f.sy = wantY;
      f.svx = f.svy = 0;
    }
    f.hand = inHand;
    f.ox += f.sx;
    f.oy += f.sy;
    if (!(p.thrT > 0) && !winding) f.wind = 0;
    if (!(p.thrT > 0)) f.thB = null;
    const jumped = f.snap;
    if (kickRun && s.kickAt) {
      // drawn up to the ball: his standing foot beside it, wherever the engine has him (he steps there: see below)
      wantX = s.kickAt[0] - p.x;
      wantY = s.kickAt[1] - p.y;
    }
    if (!setNow) f.stT = 0;
    easePose(f, tg, f.snap ? 1 : poseRate ? 1 - Math.exp(-dt * poseRate) : snap ? 1 - Math.exp(-dt * 60) : 1 - Math.exp(-dt * 28), striding, dt, armRate && !f.snap ? 1 - Math.exp(-dt * armRate) : undefined);
    f.snap = false;
    if (POPS) popCheck(f, p, s, dt, jumped);
    applyPose(f);
    if (!(p.down || p.fell || flat || pileOn)) {
      f.pvx = p.vx;  // how fast he is going, kept for the frame he is hit (the engine has stopped him by then)
      f.pvy = p.vy;
    }
    f.root.position.set(p.x + f.ox, p.lift || 0, -(p.y + f.oy));  // lift: a cutscene's actor standing on a stage
    f.root.rotation.y = f.heading;
  }

  /* ---------- textures ---------- */
  const PAD_X = 6, Y0 = -16, Y1 = 116, TEXW = 1792, TEXS = TEXW / (FW + 2 * PAD_X), TEXH = Math.round((Y1 - Y0) * TEXS);

  function paintField(t0, t1, host, both) {
    lastTeams = [t0, t1, host, both];
    const home = host || t0;  // midfield stays the home side's (the other team's, in a road game)
    if (ends) [t0, t1] = [t1, t0];  // the teams have changed ends: each end zone carries the other side's paint
    if (both) t0 = t1 = home;  // a league game: both end zones are the home team's, the way a real stadium is painted
    const c = fieldCanvas.getContext('2d'), S = TEXS, X = x => (x + PAD_X) * S, Y = y => (Y1 - y) * S;
    c.fillStyle = '#1b5a30';
    c.fillRect(0, 0, TEXW, TEXH);
    c.fillStyle = '#e6ece6';
    c.fillRect(X(-2), Y(112), (FW + 4) * S, 124 * S);  // the white border
    /* each side's team area, where its reserves stand: between the 30s, just outside the border, outlined in white,
       the turf inside worn darker by a game's worth of cleats */
    for (const side of [-1, 1]) {
      const xa = side < 0 ? -5.7 : FW + 2, w = 3.7;
      c.fillStyle = 'rgba(0,0,0,0.12)';
      c.fillRect(X(xa), Y(70), w * S, 40 * S);
      c.fillStyle = '#e6ece6';
      c.fillRect(X(side < 0 ? xa : xa + w - 0.16), Y(70), 0.16 * S, 40 * S);
      c.fillRect(X(xa), Y(70), w * S, 0.16 * S);
      c.fillRect(X(xa), Y(30.16), w * S, 0.16 * S);
    }
    /* the turf: five-yard bands mown one way and then the other, each with a little light across it, and the end zones
       in the team's color with a diagonal weave */
    for (let y = -10; y < 110; y += 5) {
      const ez = y < 0 || y >= 100, base = y < 0 ? t0.c1 : y >= 100 ? t1.c1 : (Math.floor(y / 5) & 1 ? '#2f8f46' : '#277c3c');
      c.fillStyle = base;
      c.fillRect(X(0), Y(y + 5), FW * S, 5 * S + 1);
      if (!ez) {
        const g = c.createLinearGradient(0, Y(y + 5), 0, Y(y));
        g.addColorStop(0, 'rgba(255,255,255,0.05)');
        g.addColorStop(0.5, 'rgba(255,255,255,0)');
        g.addColorStop(1, 'rgba(0,0,0,0.06)');
        c.fillStyle = g;
        c.fillRect(X(0), Y(y + 5), FW * S, 5 * S + 1);
      }
    }
    for (const [ya, yb] of [[-10, 0], [100, 110]]) {
      c.save();
      c.beginPath();
      c.rect(X(0), Y(yb), FW * S, 10 * S);
      c.clip();
      c.strokeStyle = 'rgba(255,255,255,0.07)';
      c.lineWidth = 0.55 * S;
      for (let d = -12; d < FW + 12; d += 2.2) {
        c.beginPath();
        c.moveTo(X(d), Y(ya));
        c.lineTo(X(d + 10), Y(yb));
        c.stroke();
      }
      c.restore();
    }
    /* mower lines across each band, and the grain of the grass */
    c.fillStyle = 'rgba(0,0,0,0.035)';
    for (let x = 0; x < FW; x += 1.6) c.fillRect(X(x), Y(100), 0.1 * S, 100 * S);
    for (let i = 0; i < 30000; i++) {
      c.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.05)';
      c.fillRect(Math.random() * TEXW, Math.random() * TEXH, 2, 6 + Math.random() * 9);
    }
    /* where the game is played the turf is scuffed: duller patches between the numbers, thickest round midfield and in
       front of each goal line */
    for (let i = 0; i < 300; i++) {
      const k = i % 3, y = k === 0 ? 50 + (Math.random() + Math.random() - 1) * 34 : k === 1 ? Math.random() * 100 : (Math.random() < 0.5 ? 4 : 96) + (Math.random() - 0.5) * 9;
      const x = FW / 2 + (Math.random() + Math.random() + Math.random() - 1.5) * 15;
      c.fillStyle = Math.random() < 0.7 ? `rgba(14,40,22,${0.03 + Math.random() * 0.045})` : `rgba(210,225,170,${0.015 + Math.random() * 0.02})`;
      c.beginPath();
      c.ellipse(X(x), Y(y), (0.5 + Math.random() * 1.7) * S, (0.3 + Math.random() * 1.1) * S, Math.random() * 3, 0, 7);
      c.fill();
    }
    /* the lanes the ball lives in: down the middle and along each hash mark the turf is trodden flatter and paler,
       most between the 20s (added 2026-11-17) */
    for (let i = 0; i < 520; i++) {
      const lane = i % 3, y = 8 + Math.random() * 84, mid = 1 - Math.abs(y - 50) / 50;
      if (Math.random() > 0.35 + mid * 0.65) continue;
      const x = lane === 0 ? FW / 2 + (Math.random() - 0.5) * 3.2 : FW / 2 + (lane === 1 ? -3.1 : 3.1) + (Math.random() - 0.5) * 1.6;
      c.fillStyle = Math.random() < 0.6 ? `rgba(198,214,160,${0.018 + Math.random() * 0.03})` : `rgba(12,36,20,${0.025 + Math.random() * 0.035})`;
      c.beginPath();
      c.ellipse(X(x), Y(y), (0.25 + Math.random() * 0.7) * S, (0.4 + Math.random() * 1.3) * S, (Math.random() - 0.5) * 0.6, 0, 7);
      c.fill();
    }
    if (envSnow) {
      // a dusting of snow, thicker in patches
      c.fillStyle = 'rgba(236,243,252,0.46)';
      c.fillRect(0, 0, TEXW, TEXH);
      for (let i = 0; i < 900; i++) {
        c.fillStyle = `rgba(244,249,255,${0.05 + Math.random() * 0.12})`;
        c.beginPath();
        c.ellipse(Math.random() * TEXW, Math.random() * TEXH, 10 + Math.random() * 46, 6 + Math.random() * 22, Math.random() * 3, 0, 7);
        c.fill();
      }
    }
    c.fillStyle = '#ffffff';
    for (let y = 0; y <= 100; y += 5) {
      const h = (y === 0 || y === 100 ? 0.42 : 0.2) * S;
      c.fillRect(X(0), Y(y) - h / 2, FW * S, h);
    }
    for (let y = 1; y < 100; y++) {
      if (y % 5 === 0) continue;
      for (const hx of [FW / 2 - 3.1, FW / 2 + 3.1]) c.fillRect(X(hx - 0.33), Y(y) - 0.07 * S, 0.66 * S, 0.14 * S);
      c.fillRect(X(0.3), Y(y) - 0.07 * S, 0.66 * S, 0.14 * S);
      c.fillRect(X(FW - 0.96), Y(y) - 0.07 * S, 0.66 * S, 0.14 * S);
    }
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `800 ${3.3 * S}px Archivo, Arial, sans-serif`;
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.lineJoin = 'round';
    for (let y = 10; y <= 90; y += 10) {
      const n = String(y <= 50 ? y : 100 - y);
      for (const nx of [9, FW - 9]) {
        // a thin dark edge under the paint, so the numbers stay crisp from far away (the stylized look's ink)
        c.strokeStyle = 'rgba(6,14,10,0.32)';
        c.lineWidth = 0.2 * S;
        c.strokeText(n, X(nx), Y(y));
        c.fillText(n, X(nx), Y(y));
        if (y !== 50) {
          // the small arrow beside each number, pointing at the nearer goal line
          const up = y > 50 ? 1 : -1, ax = X(nx + (nx < FW / 2 ? -3 : 3)), ay = Y(y + up * 0.9);
          c.beginPath();
          c.moveTo(ax, ay - up * 0.75 * S);
          c.lineTo(ax - 0.42 * S, ay + up * 0.25 * S);
          c.lineTo(ax + 0.42 * S, ay + up * 0.25 * S);
          c.fill();
        }
      }
    }
    /* the end zones: a band of the team's second color a yard inside the lines, and the name in white letters edged in
       that color over a dark edge, so they read on any team color (the band added 2026-11-17) */
    c.font = `800 ${5 * S}px Archivo, Arial, sans-serif`;
    c.lineJoin = 'round';
    for (const [t, y] of [[t0, -5], [t1, 105]]) {
      const c2 = t.c2 || '#ffffff';
      c.strokeStyle = c2;
      c.globalAlpha = 0.8;
      c.lineWidth = 0.42 * S;
      c.strokeRect(X(1.2), Y(y + 3.8), (FW - 2.4) * S, 7.6 * S);
      c.globalAlpha = 1;
      c.strokeStyle = 'rgba(6,10,18,0.5)';
      c.lineWidth = 0.6 * S;
      c.strokeText(t.name.toUpperCase(), X(FW / 2), Y(y), (FW - 8) * S);
      c.strokeStyle = c2;
      c.lineWidth = 0.3 * S;
      c.strokeText(t.name.toUpperCase(), X(FW / 2), Y(y), (FW - 8) * S);
      c.fillStyle = 'rgba(255,255,255,0.95)';
      c.fillText(t.name.toUpperCase(), X(FW / 2), Y(y), (FW - 8) * S);
    }
    /* midfield: the home team's disc inside a second-color ring and a white one, the letters edged like the names */
    const mx = X(FW / 2), my = Y(50);
    c.fillStyle = home.c2 || '#ffffff';
    c.globalAlpha = 0.9;
    c.beginPath();
    c.arc(mx, my, 6.1 * S, 0, 7);
    c.fill();
    c.globalAlpha = 0.92;
    c.fillStyle = home.c1;
    c.beginPath();
    c.arc(mx, my, 5.4 * S, 0, 7);
    c.fill();
    c.globalAlpha = 1;
    c.strokeStyle = 'rgba(255,255,255,0.95)';
    c.lineWidth = 0.2 * S;
    c.beginPath();
    c.arc(mx, my, 6.1 * S, 0, 7);
    c.stroke();
    c.font = `800 ${3.9 * S}px Archivo, Arial, sans-serif`;
    c.lineWidth = 0.3 * S;
    c.strokeStyle = 'rgba(6,10,18,0.5)';
    c.strokeText(home.ab, mx, my + 0.15 * S);
    c.fillStyle = '#ffffff';
    c.fillText(home.ab, mx, my + 0.15 * S);
    /* the fifty runs through the logo again, faintly, as the real paint does */
    c.fillStyle = 'rgba(255,255,255,0.22)';
    c.fillRect(mx - 6.1 * S, my - 0.1 * S, 12.2 * S, 0.2 * S);
    /* the small marks a real field carries: the league's shield on both 25s, a cross where the ball is teed up for the
       kickoff, and the short line at the two where a try is snapped */
    for (const y of [25, 75]) {
      const sx = X(FW / 2), sy = Y(y), w = 1.5 * S, h = 1.9 * S;
      const shield = k => {
        c.beginPath();
        c.moveTo(sx - w * k, sy - h * k);
        c.lineTo(sx + w * k, sy - h * k);
        c.lineTo(sx + w * k, sy + h * 0.15 * k);
        c.quadraticCurveTo(sx + w * k, sy + h * 0.8 * k, sx, sy + h * 1.1 * k);
        c.quadraticCurveTo(sx - w * k, sy + h * 0.8 * k, sx - w * k, sy + h * 0.15 * k);
        c.closePath();
      };
      c.globalAlpha = 0.88;
      c.fillStyle = '#f2f5f8';
      shield(1);
      c.fill();
      c.fillStyle = '#16233f';
      shield(0.84);
      c.fill();
      c.fillStyle = '#c2362f';
      c.fillRect(sx - w * 0.84, sy - h * 0.84, w * 1.68, h * 0.3);
      c.fillStyle = '#f2f5f8';
      c.font = `800 ${1.25 * S}px Archivo, Arial, sans-serif`;
      c.fillText('PF', sx, sy + h * 0.22);
      c.globalAlpha = 1;
    }
    c.strokeStyle = 'rgba(255,255,255,0.85)';
    c.lineWidth = 0.1 * S;
    for (const y of [35, 65]) {
      c.beginPath();
      c.moveTo(X(FW / 2 - 0.3), Y(y - 0.3));
      c.lineTo(X(FW / 2 + 0.3), Y(y + 0.3));
      c.moveTo(X(FW / 2 + 0.3), Y(y - 0.3));
      c.lineTo(X(FW / 2 - 0.3), Y(y + 0.3));
      c.stroke();
    }
    c.fillStyle = '#ffffff';
    for (const y of [2, 98]) c.fillRect(X(FW / 2 - 0.5), Y(y) - 0.07 * S, S, 0.14 * S);
    c.strokeStyle = 'rgba(255,255,255,0.7)';
    c.lineWidth = 0.14 * S;  // team areas
    c.strokeRect(X(-5.2), Y(70), 2.6 * S, 40 * S);
    c.strokeRect(X(FW + 2.6), Y(70), 2.6 * S, 40 * S);
    for (const m of postPads) m.color.set(home.c1);  // the goal post pads wear the home team's color
    fieldTex.needsUpdate = true;
  }

  function paintCrowd(t0, t1) {
    const u = crowdMat.uniforms;  // the seats are drawn by the crowd shader; it only needs the colors
    u.uA1.value.set(t0.c1);
    u.uA2.value.set(t0.c2);
    u.uB1.value.set(t1.c1);
    u.uB2.value.set(t1.c2);
    /* ribbon board between the decks: team blocks */
    const r = ribbonCanvas.getContext('2d'), rw = ribbonCanvas.width, rh = ribbonCanvas.height;
    r.textAlign = 'center';
    r.textBaseline = 'middle';
    r.font = '800 22px Archivo, Arial, sans-serif';
    [t0, t1].forEach((t, i) => {
      r.fillStyle = t.c1;
      r.fillRect(i * rw / 2, 0, rw / 2, rh);
      r.fillStyle = 'rgba(255,255,255,0.92)';
      r.fillText(t.name.toUpperCase(), i * rw / 2 + rw / 4, rh / 2 + 1);
    });
    ribbonTex.needsUpdate = true;
    /* the padded wall: sixteen panels, mostly the home team's color with a seam between each, every fourth one a board */
    const w = padsCanvas.getContext('2d'), pw = padsCanvas.width / 16, ph = padsCanvas.height, says = [t0.name.toUpperCase(), 'POCKETFOOTBALL', t0.ab, 'GAME DAY'];
    w.textAlign = 'center';
    w.textBaseline = 'middle';
    for (let i = 0; i < 16; i++) {
      const board = i % 4 === 1, x0 = i * pw;
      w.fillStyle = board ? (i % 8 === 1 ? '#f1f3f6' : t0.c2) : t0.c1;
      w.fillRect(x0, 0, pw, ph);
      w.fillStyle = 'rgba(0,0,0,0.22)';  // the shadow under the rail, and the seam
      w.fillRect(x0, 0, pw, 5);
      w.fillRect(x0, 0, 2, ph);
      w.fillStyle = 'rgba(255,255,255,0.1)';
      w.fillRect(x0 + 2, 5, 2, ph - 5);
      if (board) {
        const light = lumOf(i % 8 === 1 ? '#f1f3f6' : t0.c2) > 0.55;
        w.fillStyle = light ? (lumOf(t0.c1) < 0.55 ? t0.c1 : '#16233f') : '#f1f3f6';
        w.font = '800 30px Archivo, Arial, sans-serif';
        w.fillText(says[(i >> 2) % 4], x0 + pw / 2, ph / 2 + 3, pw - 16);
      }
    }
    padsTex.needsUpdate = true;
  }

  const BOARD_SAYS = /^(First down|Sack!|Interception!|It’s good!|No good|Fumble|Safety|Turnover on downs|Touchback|Pass broken up)/;

  function paintBoard(G, t0, t1, down) {
    const c = boardCanvas.getContext('2d'), w = 512, h = 160;
    c.fillStyle = '#05080f';
    c.fillRect(0, 0, w, h);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    if (!G.ros) {
      c.fillStyle = '#ffffff';
      c.font = '800 54px Archivo, Arial, sans-serif';
      c.fillText('POCKETFOOTBALL', w / 2, h / 2 + 2, w - 40);
    } else {
      c.fillStyle = t0.c1;
      c.fillRect(0, 0, 150, 104);
      c.fillStyle = t1.c1;
      c.fillRect(w - 150, 0, 150, 104);
      c.fillStyle = '#ffffff';
      c.font = '800 30px Archivo, Arial, sans-serif';
      c.fillText(t0.ab, 75, 28);
      c.fillText(t1.ab, w - 75, 28);
      c.font = '800 56px Archivo, Arial, sans-serif';
      c.fillText(G.score[0], 75, 72);
      c.fillText(G.score[1], w - 75, 72);
      const sec = Math.ceil(G.clock || 0);
      c.font = '800 46px Archivo, Arial, sans-serif';
      c.fillText(Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'), w / 2, 44);
      c.font = '700 20px Archivo, Arial, sans-serif';
      c.fillStyle = '#9fb0cc';
      c.fillText(G.q > 4 ? 'OVERTIME' : ['1ST', '2ND', '3RD', '4TH'][G.q - 1] + ' QUARTER', w / 2, 84);
      c.fillStyle = '#0e1626';
      c.fillRect(0, 106, w, 54);
      c.fillStyle = '#ffffff';
      c.font = '800 28px Archivo, Arial, sans-serif';
      c.fillText(G.celeb ? 'TOUCHDOWN ' + (G.celeb.team === 0 ? t0 : t1).name.toUpperCase() : (down || '').toUpperCase(), w / 2, 134, w - 30);
    }
    boardTex.needsUpdate = true;
  }

  /* ---------- scene ---------- */
  function quadMesh(a, b, c, d, mat, ru, rv) {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3));
    g.setAttribute('uv', new T.Float32BufferAttribute([0, 0, ru, 0, ru, rv, 0, 0, ru, rv, 0, rv], 2));
    const m = new T.Mesh(g, mat);
    scene.add(m);
    return m;
  }

  const box = (w, h, d, color, x, y, z, basic) => {
    const m = new T.Mesh(new T.BoxGeometry(w, h, d), basic ? new T.MeshBasicMaterial({ color }) : new T.MeshLambertMaterial({ color }));
    m.position.set(x, y, z);
    scene.add(m);
    return m;
  };

  function buildScene() {
    scene = new T.Scene();
    scene.fog = new T.Fog(0x0a1020, 190, 560);
    skyMat = SH.sky();
    skyDome = new T.Mesh(new T.SphereGeometry(800, 32, 16), skyMat);  // follows the camera, drawn first, never hides anything
    skyDome.renderOrder = -10;
    skyDome.frustumCulled = false;
    scene.add(skyDome);
    hemiLight = new T.HemisphereLight(0xdfe8ff, 0x24402c, 2.4);
    scene.add(hemiLight);
    sunLight = new T.DirectionalLight(0xffffff, 2.2);
    sunLight.position.set(-30, 80, 40);
    scene.add(sunLight);
    fillLight = new T.DirectionalLight(0xcfe0ff, 0.9);
    fillLight.position.set(45, 30, -70);
    scene.add(fillLight);

    groundMat = new T.MeshBasicMaterial({ color: 0x0c1220 });
    const ground = new T.Mesh(new T.PlaneGeometry(900, 900), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(FW / 2, -0.6, -50);
    scene.add(ground);

    fieldCanvas = document.createElement('canvas');
    fieldCanvas.width = TEXW;
    fieldCanvas.height = TEXH;
    fieldTex = new T.CanvasTexture(fieldCanvas);
    fieldTex.colorSpace = T.SRGBColorSpace;
    fieldTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    fieldMat = SH.turf(fieldTex);
    TOWERS.forEach(([x, y], i) => fieldMat.uniforms.uTowers.value[i].set(x, TOWER_H, -y));
    const field = new T.Mesh(new T.PlaneGeometry(FW + 2 * PAD_X, Y1 - Y0), fieldMat);
    field.rotation.x = -Math.PI / 2;
    field.position.set(FW / 2, 0, -(Y0 + Y1) / 2);
    scene.add(field);

    /* the apron: what lies between the turf and the wall (it was the bare ground, a dark void the benches stood in) */
    /* its turf: the same green as the field's edge, mown in long bands, with grain (it was one flat dark green) */
    const apC = document.createElement('canvas');
    apC.width = 256;
    apC.height = 512;
    const ap = apC.getContext('2d');
    ap.fillStyle = '#1b5a30';
    ap.fillRect(0, 0, 256, 512);
    for (let i = 0; i < 16; i++) {
      ap.fillStyle = i % 2 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.04)';
      ap.fillRect(0, i * 32, 256, 32);
    }
    for (let i = 0; i < 9000; i++) {
      ap.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
      ap.fillRect(Math.random() * 256, Math.random() * 512, 1, 2 + Math.random() * 3);
    }
    const apTex = new T.CanvasTexture(apC);
    apTex.colorSpace = T.SRGBColorSpace;
    apTex.anisotropy = 4;
    const apron = new T.Mesh(new T.PlaneGeometry(FW + 28, 148), new T.MeshLambertMaterial({ map: apTex, color: 0xd8e2d8 }));
    apron.rotation.x = -Math.PI / 2;
    apron.position.set(FW / 2, -0.03, -50);
    scene.add(apron);

    /* stands: a lower bowl and an upper deck, each four trapezoids around the field */
    ribbonCanvas = document.createElement('canvas');
    ribbonCanvas.width = 512;
    ribbonCanvas.height = 32;
    ribbonTex = new T.CanvasTexture(ribbonCanvas);
    ribbonTex.colorSpace = T.SRGBColorSpace;
    ribbonTex.wrapS = T.RepeatWrapping;
    const ribbonMat = new T.MeshBasicMaterial({ map: ribbonTex, side: T.DoubleSide });
    crowdMat = SH.crowd();
    const ring4 = (x0, x1, ya, yb, h0, grow, rise, mat, ru, rv) => {
      // inner rectangle, how far it steps out, how high it climbs
      const X0 = x0 - grow, X1 = x1 + grow, YA = ya - grow, YB = yb + grow, h1 = h0 + rise, side = ru || 9, end = ru ? ru * 0.55 : 5, v = rv || 2;
      quadMesh([x0, h0, -ya], [x0, h0, -yb], [X0, h1, -YB], [X0, h1, -YA], mat, side, v);  // left
      quadMesh([x1, h0, -yb], [x1, h0, -ya], [X1, h1, -YA], [X1, h1, -YB], mat, side, v);  // right
      quadMesh([x0, h0, -yb], [x1, h0, -yb], [X1, h1, -YB], [X0, h1, -YB], mat, end, v);  // far end
      quadMesh([x1, h0, -ya], [x0, h0, -ya], [X0, h1, -YA], [X1, h1, -YA], mat, end, v);  // near end
    };
    /* a deck of seats: the same four trapezoids, each carrying its seat grid in world measure (aSeat, see the crowd
       shader): seat along the row (0.55 yards wide), row up the slope (about a yard deep), which stand, how high */
    const crowdRing = (x0, x1, ya, yb, h0, grow, rise, deck) => {
      const X0 = x0 - grow, X1 = x1 + grow, YA = ya - grow, YB = yb + grow, h1 = h0 + rise, rows = Math.round(Math.hypot(grow, rise) / 0.95);
      const quad = (pts, along, id) => {
        const pos = [pts[0], pts[1], pts[2], pts[0], pts[2], pts[3]], seat = [];
        for (const p of pos) seat.push(along(p) / 0.55, (p[1] - h0) / rise * rows, deck * 4 + id, (p[1] - h0) / rise);
        const g = new T.BufferGeometry();
        g.setAttribute('position', new T.Float32BufferAttribute(pos.flat(), 3));
        g.setAttribute('aSeat', new T.Float32BufferAttribute(seat, 4));
        scene.add(new T.Mesh(g, crowdMat));
      };
      quad([[x0, h0, -ya], [x0, h0, -yb], [X0, h1, -YB], [X0, h1, -YA]], p => -p[2], 0);  // left
      quad([[x1, h0, -yb], [x1, h0, -ya], [X1, h1, -YA], [X1, h1, -YB]], p => p[2] + 500, 1);  // right
      quad([[x0, h0, -yb], [x1, h0, -yb], [X1, h1, -YB], [X0, h1, -YB]], p => p[0], 2);  // far end
      quad([[x1, h0, -ya], [x0, h0, -ya], [X0, h1, -YA], [X1, h1, -YA]], p => -p[0] + 300, 3);  // near end
    };
    wallMat = new T.MeshBasicMaterial({ color: 0x0e1628, side: T.DoubleSide });
    crowdRing(-14, FW + 14, -24, 124, 1.6, 40, 22, 0);
    ring4(-54, FW + 54, -64, 164, 23.6, 0.01, 5, ribbonMat, 3, 1);  // ribbon board between the decks
    crowdRing(-55, FW + 55, -65, 165, 28.6, 34, 24, 1);
    /* the rim of the bowl: a fascia over the top row with a strip of lights along it (the stands stopped in a bare edge
       against the sky) */
    const rimC = document.createElement('canvas');
    rimC.width = 256;
    rimC.height = 32;
    const rx = rimC.getContext('2d');
    rx.fillStyle = '#0b111e';
    rx.fillRect(0, 0, 256, 32);
    rx.fillStyle = '#26324a';
    rx.fillRect(0, 26, 256, 6);
    for (let i = 0; i < 16; i++) {
      rx.fillStyle = '#dfe7f7';
      rx.fillRect(i * 16 + 4, 10, 8, 5);
    }
    const rimTex = new T.CanvasTexture(rimC);
    rimTex.colorSpace = T.SRGBColorSpace;
    rimTex.wrapS = T.RepeatWrapping;
    rimMat = new T.MeshBasicMaterial({ map: rimTex, side: T.DoubleSide });
    ring4(-89, FW + 89, -99, 199, 52.4, 0.01, 3.4, rimMat, 14, 1);
    ring4(-14, FW + 14, -24, 124, 0, 0.01, 1.6, wallMat);  // the wall at field level
    /* and its padding: panels in the home team's colors with a few boards between them, a hand's breadth inside the wall */
    padsCanvas = document.createElement('canvas');
    padsCanvas.width = 2048;
    padsCanvas.height = 64;
    padsTex = new T.CanvasTexture(padsCanvas);
    padsTex.colorSpace = T.SRGBColorSpace;
    padsTex.wrapS = T.RepeatWrapping;
    padsTex.anisotropy = 4;
    padsMat = new T.MeshBasicMaterial({ map: padsTex, side: T.DoubleSide });
    ring4(-13.9, FW + 13.9, -23.9, 123.9, 0.12, 0.001, 1.36, padsMat, 2, 1);
    /* video boards behind both end zones */
    boardCanvas = document.createElement('canvas');
    boardCanvas.width = 512;
    boardCanvas.height = 160;
    boardTex = new T.CanvasTexture(boardCanvas);
    boardTex.colorSpace = T.SRGBColorSpace;
    const boardMat = new T.MeshBasicMaterial({ map: boardTex, fog: false });
    for (const [y, ry] of [[128, 0], [-28, Math.PI]]) {
      const m = new T.Mesh(new T.PlaneGeometry(36, 11.25), boardMat);
      m.position.set(FW / 2, 13, -y);
      m.rotation.y = ry;
      scene.add(m);
      const parts3 = [m, box(38, 13.2, 1, 0x05080f, FW / 2, 13, -(y + (ry ? -0.7 : 0.7)), true), box(1.2, 8, 1.2, 0x10182a, FW / 2 - 12, 4, -(y + (ry ? -1 : 1)), true),
        box(1.2, 8, 1.2, 0x10182a, FW / 2 + 12, 4, -(y + (ry ? -1 : 1)), true)];
      if (ry) nearBoard = parts3;  // the one behind the user's own goal: hidden while the camera is behind it
    }
    /* light towers in the four corners */
    const glowC = document.createElement('canvas');
    glowC.width = glowC.height = 64;
    const gx = glowC.getContext('2d'), rg = gx.createRadialGradient(32, 32, 0, 32, 32, 32);
    rg.addColorStop(0, 'rgba(255,255,255,1)');
    rg.addColorStop(0.25, 'rgba(210,225,255,0.55)');
    rg.addColorStop(1, 'rgba(160,190,255,0)');
    gx.fillStyle = rg;
    gx.fillRect(0, 0, 64, 64);
    const glowTex = new T.CanvasTexture(glowC);
    /* a bank of lamps: rows of round lights in a dark frame (it was one white slab) */
    const lampC = document.createElement('canvas');
    lampC.width = 160;
    lampC.height = 72;
    const lx = lampC.getContext('2d');
    lx.fillStyle = '#3a4152';
    lx.fillRect(0, 0, 160, 72);
    for (let i = 0; i < 10; i++) for (let j = 0; j < 4; j++) {
      const g = lx.createRadialGradient(8 + i * 16, 9 + j * 18, 0, 8 + i * 16, 9 + j * 18, 7);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.7, '#f4f7ff');
      g.addColorStop(1, '#8089a0');
      lx.fillStyle = g;
      lx.beginPath();
      lx.arc(8 + i * 16, 9 + j * 18, 7, 0, 7);
      lx.fill();
    }
    const lampTex = new T.CanvasTexture(lampC);
    lampTex.colorSpace = T.SRGBColorSpace;
    for (const [x, y] of TOWERS) {
      towerPoles.push(box(2.2, 78, 2.2, 0x1a2338, x, 39, -y, true));
      const panel = new T.Mesh(new T.BoxGeometry(20, 9, 1), new T.MeshBasicMaterial({ color: 0xf2f6ff, map: lampTex }));
      panel.position.set(x, 80, -y);
      scene.add(panel);
      panel.material.fog = false;
      panel.lookAt(FW / 2, 0, -50);
      const sp = new T.Sprite(new T.SpriteMaterial({ map: glowTex, blending: T.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
      sp.position.set(x, 80, -y);
      sp.scale.setScalar(75);
      scene.add(sp);
      towerPanels.push(panel);
      towerGlow.push(sp);
    }
    buildRoof(glowTex, lampTex);
    /* camera flashes in the lower bowl: a few all night, a burst when the crowd erupts */
    const fg = new T.BufferGeometry();
    fg.setAttribute('position', new T.BufferAttribute(new Float32Array(FLASHES * 3).fill(-999), 3));
    flashes = new T.Points(fg, new T.PointsMaterial({ map: glowTex, size: 5, transparent: true, blending: T.AdditiveBlending, depthWrite: false, fog: false }));
    flashes.frustumCulled = false;
    scene.add(flashes);
    /* goal posts, pylons */
    let netMat = null;
    tee = new T.Mesh(new T.CylinderGeometry(0.05, 0.12, 0.13, 8), new T.MeshLambertMaterial({ color: 0xff7a2f }));  // the kickoff tee
    tee.visible = false;
    scene.add(tee);
    const postMat = new T.MeshLambertMaterial({ color: 0xe9edf5 });
    const cyl = (r, h, x, y, z, rz) => {
      const m = new T.Mesh(new T.CylinderGeometry(r, r, h, 8), postMat);
      m.position.set(x, y, z);
      if (rz) m.rotation.z = rz;
      scene.add(m);
      return m;
    };
    for (const y of [-10.6, 110.6]) {
      const g = new T.Group();
      g.userData.y = y;
      scene.add(g);
      posts.push(g);
      /* a gooseneck: the post stands behind the end line in a pad and curves forward to carry the crossbar over it, and
         a ribbon flies from the top of each upright to show the kicker the wind */
      const back = y < 50 ? -1.9 : 1.9, neck = new T.CatmullRomCurve3([[0, 0], [0, 1.5], [0.12, 2.5], [0.75, 3.12], [1.5, 3.3], [1.9, 3.33]].map(([d, h]) => new T.Vector3(FW / 2, h, -(y + back - Math.sign(back) * d))));
      const pad = new T.Mesh(new T.CylinderGeometry(0.36, 0.36, 2, 12), new T.MeshLambertMaterial({ color: 0x1f2a44 }));
      pad.position.set(FW / 2, 1, -(y + back));
      postPads.push(pad.material);
      const band = new T.Mesh(new T.CylinderGeometry(0.37, 0.37, 0.16, 12), postMat);  // a white band near the top of the pad
      band.position.set(0, 0.62, 0);
      pad.add(band);
      const flags = [-3.1, 3.1].map(dx => {
        const fl = new T.Mesh(new T.PlaneGeometry(0.62, 0.13).translate(0.33, 0, 0), new T.MeshBasicMaterial({ color: 0xe8552a, side: T.DoubleSide }));  // hinged on the upright
        fl.position.set(FW / 2 + dx, 14.72, -y);
        return fl;
      });
      g.userData.flags = flags;
      g.add(new T.Mesh(new T.TubeGeometry(neck, 14, 0.15, 8), postMat), pad, ...flags, cyl(0.12, 6.4, FW / 2, 3.33, -y, Math.PI / 2),
        cyl(0.1, 11.5, FW / 2 - 3.1, 9.1, -y), cyl(0.1, 11.5, FW / 2 + 3.1, 9.1, -y));
      /* the kicking net: two poles and a net behind the uprights, run up only for a field goal or an extra point at this end */
      if (!netMat) {
        const nc = document.createElement('canvas');
        nc.width = nc.height = 32;
        const nx = nc.getContext('2d');
        nx.strokeStyle = 'rgba(235,240,248,0.9)';
        nx.lineWidth = 2;
        nx.strokeRect(0, 0, 32, 32);
        const nt = new T.CanvasTexture(nc);
        nt.wrapS = nt.wrapT = T.RepeatWrapping;
        nt.repeat.set(18, 16);
        netMat = new T.MeshBasicMaterial({ map: nt, transparent: true, opacity: 0.6, side: T.DoubleSide, depthWrite: false });
      }
      const ny = y + (y < 50 ? -3.6 : 3.6), net = new T.Group(), mesh = new T.Mesh(new T.PlaneGeometry(9.4, 8.4), netMat);
      mesh.position.set(FW / 2, 5.6, -ny);
      net.add(cyl(0.07, 10, FW / 2 - 4.7, 5, -ny), cyl(0.07, 10, FW / 2 + 4.7, 5, -ny), mesh);
      net.visible = false;
      g.userData.net = net;
      g.add(net);
    }
    /* The sidelines, all one mesh (see mergeC): the eight pylons, and on each side three benches with a back rail, two
       tables with a pair of coolers and a stack of cups, the equipment trunks and a kicker's practice net frame. */
    const bx = (w, h, d, x, y, z) => new T.BoxGeometry(w, h, d).translate(x, y, z), side = [];
    const ORANGE = '#ff7a2f', ALU = '#aeb6c4', STEEL = '#4b5364', DARK = '#1c2434';
    for (const y of [-10, 0, 100, 110]) for (const x of [0, FW]) side.push([bx(0.2, 0.8, 0.2, x, 0.4, -y), ORANGE], [bx(0.21, 0.09, 0.21, x, 0.68, -y), '#f1f1f1']);
    for (const sd of [-1, 1]) {
      const X = d => (sd < 0 ? -d : FW + d);
      for (const y of [36, 50, 64]) {
        side.push([bx(0.62, 0.07, 9, X(7.6), 0.66, -y), ALU], [bx(0.07, 0.3, 9, X(7.95), 1.12, -y), ALU], [bx(0.5, 0.05, 9, X(7.5), 0.2, -y), STEEL]);  // the seat, the back rail, and the rail for the feet
        for (const dy of [-4.2, -1.4, 1.4, 4.2]) side.push([bx(0.07, 0.66, 0.07, X(7.4), 0.33, -(y + dy)), STEEL], [bx(0.07, 1.27, 0.07, X(7.95), 0.635, -(y + dy)), STEEL]);
      }
      for (const y of [43, 57]) {
        side.push([bx(0.9, 0.06, 2.6, X(9.6), 0.98, -y), '#d9dde4']);
        for (const [dx, dy] of [[-0.4, -1.2], [0.4, -1.2], [-0.4, 1.2], [0.4, 1.2]]) side.push([bx(0.06, 0.95, 0.06, X(9.6 + dx), 0.475, -(y + dy)), STEEL]);
        for (const dy of [-0.75, 0]) side.push([new T.CylinderGeometry(0.3, 0.27, 0.62, 12).translate(X(9.6), 1.32, -(y + dy)), '#e8742a'], [new T.CylinderGeometry(0.31, 0.31, 0.08, 12).translate(X(9.6), 1.67, -(y + dy)), '#f1f1f1']);
        side.push([new T.CylinderGeometry(0.09, 0.07, 0.3, 8).translate(X(9.45), 1.16, -(y + 0.85)), '#f1f1f1'], [new T.CylinderGeometry(0.09, 0.07, 0.22, 8).translate(X(9.75), 1.12, -(y + 1)), '#f1f1f1']);
      }
      for (const y of [31, 69]) side.push([bx(1, 0.72, 1.7, X(9.4), 0.36, -y), DARK], [bx(1.04, 0.07, 1.74, X(9.4), 0.6, -y), ALU], [bx(1.04, 0.07, 1.74, X(9.4), 0.04, -y), ALU]);
      const ny = sd < 0 ? 25 : 75;  // the net a kicker warms up into: an upright frame, the net itself hung in it below
      side.push([bx(0.09, 3.4, 0.09, X(9.6), 1.7, -(ny - 1.3)), STEEL], [bx(0.09, 3.4, 0.09, X(9.6), 1.7, -(ny + 1.3)), STEEL], [bx(0.09, 0.09, 2.69, X(9.6), 3.4, -ny), STEEL], [bx(1.5, 0.08, 0.08, X(9.6), 0.04, -(ny - 1.3)), STEEL], [bx(1.5, 0.08, 0.08, X(9.6), 0.04, -(ny + 1.3)), STEEL]);
      sideNets.push([X(9.6), ny]);
    }
    /* The yardage markers: a small box every ten yards just off the far sideline, its number facing the field (G at the
       goal lines, orange there and white elsewhere). The bodies go in the sideline mesh; the faces are one mesh on a
       small atlas of the six numbers. (Added 2026-11-17.) */
    const MK_X = FW + 2.35, mkFaces = [], mkC = document.createElement('canvas');
    mkC.width = 384;
    mkC.height = 64;
    const mk = mkC.getContext('2d'), LBL = ['G', '10', '20', '30', '40', '50'];
    mk.textAlign = 'center';
    mk.textBaseline = 'middle';
    LBL.forEach((l, k) => {
      mk.fillStyle = k ? '#f4f6f9' : ORANGE;
      mk.fillRect(k * 64, 0, 64, 64);
      mk.fillStyle = '#111827';
      mk.font = `800 ${l.length > 1 ? 36 : 42}px Archivo, Arial, sans-serif`;
      mk.fillText(l, k * 64 + 32, 35);
    });
    for (let y = 0; y <= 100; y += 10) {
      const k = Math.min(y, 100 - y) / 10;
      side.push([bx(0.26, 0.58, 0.82, MK_X, 0.29, -y), k ? '#e9edf3' : ORANGE], [bx(0.3, 0.06, 0.86, MK_X, 0.6, -y), '#1c2434']);
      mkFaces.push([y, k]);
    }
    {
      const pos = [], uv = [], nor = [], idx = [];
      mkFaces.forEach(([y, k], i) => {
        const x = MK_X - 0.135, z0 = -y - 0.36, z1 = -y + 0.36, u0 = k / 6 + 0.004, u1 = (k + 1) / 6 - 0.004;
        pos.push(x, 0.06, z0, x, 0.06, z1, x, 0.54, z1, x, 0.54, z0);  // facing the field (-x): seen from there, z runs left to right
        uv.push(u0, 0, u1, 0, u1, 1, u0, 1);
        for (let j = 0; j < 4; j++) nor.push(-1, 0, 0);
        const b = i * 4;
        idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
      });
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
      g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
      g.setIndex(idx);
      const tex = new T.CanvasTexture(mkC);
      tex.colorSpace = T.SRGBColorSpace;
      tex.anisotropy = 4;
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => {
        LBL.forEach((l, k) => {
          mk.fillStyle = k ? '#f4f6f9' : ORANGE;
          mk.fillRect(k * 64, 0, 64, 64);
          mk.fillStyle = '#111827';
          mk.font = `800 ${l.length > 1 ? 36 : 42}px Archivo, Arial, sans-serif`;
          mk.fillText(l, k * 64 + 32, 35);
        });
        tex.needsUpdate = true;
      });
      scene.add(new T.Mesh(g, new T.MeshLambertMaterial({ map: tex, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })));
    }
    scene.add(new T.Mesh(mergeC(side), new T.MeshLambertMaterial({ vertexColors: true })));
    for (const [x, y] of sideNets) {
      const m = new T.Mesh(new T.PlaneGeometry(2.6, 3.3), netMat);
      m.rotation.y = Math.PI / 2;
      m.position.set(x, 1.7, -y);
      scene.add(m);
    }
    /* line of scrimmage, line to gain, first-down marker */
    const near = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 };
    const strip = color => {
      const m = new T.Mesh(new T.PlaneGeometry(FW, 0.3), new T.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false, ...near }));
      m.rotation.x = -Math.PI / 2;
      m.position.set(FW / 2, 0.03, 0);
      scene.add(m);
      return m;
    };
    losLine = strip(0x4dabf7);
    fdLine = strip(0xff7a2f);
    /* The chain crew's gear: two sticks ten yards apart with a chain between them, and the down box at the line of
       scrimmage with the down on all four faces. Three figures hold them (see updateCrew). */
    const orange = new T.MeshLambertMaterial({ color: 0xff7a2f }), stick = () => {
      const g = new T.Group(), pole = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 2.9, 6), orange), disc = new T.Mesh(new T.CylinderGeometry(0.45, 0.45, 0.06, 14), orange);
      pole.position.y = 1.45;
      disc.rotation.z = Math.PI / 2;
      disc.position.y = 3;
      g.add(pole, disc);
      scene.add(g);
      return g;
    };
    sticks = stick();
    sticks2 = stick();
    chain = new T.Mesh(new T.BoxGeometry(0.05, 0.05, 1), new T.MeshLambertMaterial({ color: 0x2a2f3a }));
    chain.position.set(CREW_X, 0.12, 0);
    scene.add(chain);
    const dark = new T.MeshLambertMaterial({ color: 0x15171c });
    for (let n = 1; n <= 4; n++) {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const x = c.getContext('2d');
      x.fillStyle = '#ff7a2f';
      x.fillRect(0, 0, 64, 64);
      x.fillStyle = '#15171c';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.font = '800 52px Archivo, Arial, sans-serif';
      x.fillText(String(n), 32, 35);
      const tex = new T.CanvasTexture(c);
      tex.colorSpace = T.SRGBColorSpace;
      const face = new T.MeshBasicMaterial({ map: tex });
      downMats[n] = [face, face, dark, dark, face, face];
    }
    downBox = new T.Group();
    const boxPole = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 2.6, 6), orange), cube = new T.Mesh(new T.BoxGeometry(0.62, 0.62, 0.62), downMats[1]);
    boxPole.position.y = 1.3;
    cube.position.y = 2.9;
    downBox.add(boxPole, cube);
    downBox.userData.cube = cube;
    scene.add(downBox);
    /* markers under players */
    const ringGeo = new T.RingGeometry(0.85, 1.08, 28).rotateX(-Math.PI / 2);
    ring = new T.Mesh(ringGeo, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthWrite: false, ...near }));
    ring.position.y = 0.05;
    scene.add(ring);
    targetRing = new T.Mesh(new T.RingGeometry(1.1, 1.3, 28).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false, ...near }));
    targetRing.position.y = 0.05;
    scene.add(targetRing);
    /* ball */
    ball = new T.Group();
    /* a football's own shape: fat in the middle and drawn out to a point at each end (it was a squashed ball), with a
       white stripe near each point and the laces along the top, a strip with eight stitches across it */
    const ballR = z => 0.124 * Math.pow(Math.max(0, 1 - (z / 0.205) ** 2), 0.62), prof = [];
    for (let i = 0; i <= 14; i++) prof.push([Math.max(0.002, ballR(-0.205 + i * 0.41 / 14)), -0.205 + i * 0.41 / 14]);
    /* leather: a pebbled grain, a little darker toward the tips, and a soft sheen */
    const lc = document.createElement('canvas');
    lc.width = 128;
    lc.height = 64;
    const lcx = lc.getContext('2d'), lg = lcx.createLinearGradient(0, 0, 0, 64);
    lg.addColorStop(0, '#4f2c12');
    lg.addColorStop(0.3, '#7a4a21');
    lg.addColorStop(0.7, '#7a4a21');
    lg.addColorStop(1, '#4f2c12');
    lcx.fillStyle = lg;
    lcx.fillRect(0, 0, 128, 64);
    for (let i = 0; i < 1400; i++) {
      lcx.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.16)' : 'rgba(255,220,180,0.07)';
      lcx.beginPath();
      lcx.arc(Math.random() * 128, Math.random() * 64, 0.5 + Math.random() * 0.6, 0, 7);
      lcx.fill();
    }
    const lTex = new T.CanvasTexture(lc);
    lTex.colorSpace = T.SRGBColorSpace;
    const leather = new T.Mesh(lathe(prof, 14).rotateX(Math.PI / 2), new T.MeshPhongMaterial({ map: lTex, shininess: 28, specular: 0x3a2a1c }));
    const white = [];
    for (const z of [-0.135, 0.135]) white.push(lathe([[ballR(z - 0.013) + 0.002, z - 0.013], [ballR(z) + 0.003, z], [ballR(z + 0.013) + 0.002, z + 0.013]], 14).rotateX(Math.PI / 2));
    white.push(new T.BoxGeometry(0.014, 0.01, 0.15).translate(0, 0.126, 0));
    for (let i = 0; i < 8; i++) white.push(new T.BoxGeometry(0.05, 0.009, 0.01).translate(0, 0.128 - Math.abs(i - 3.5) * 0.0012, -0.063 + i * 0.018));
    ball.add(leather, new T.Mesh(merge(white), new T.MeshBasicMaterial({ color: 0xf2f2f2, side: T.DoubleSide })));
    ball.scale.setScalar(1.45);
    scene.add(ball);
    const blob = () => new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false, ...near });
    ballShadow = new T.Mesh(new T.CircleGeometry(0.3, 12).rotateX(-Math.PI / 2), blob());
    ballShadow.position.y = 0.04;
    scene.add(ballShadow);
    contact = new T.InstancedMesh(new T.CircleGeometry(0.5, 16).rotateX(-Math.PI / 2), blob(), CAP);  // a soft patch right under each player
    contact.frustumCulled = false;
    contact.count = 0;
    scene.add(contact);
    /* body parts */
    parts = PART_DEFS.map(([name, joints, color, fit, shadow, opt]) => {
      const mat = partMat(name);
      const mesh = new T.InstancedMesh(GEO[name], mat, CAP * joints.length);
      mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
      mesh.frustumCulled = false;
      mesh.count = 0;
      for (let i = 0; i < CAP * joints.length; i++) mesh.setColorAt(i, col.set(0xffffff));
      scene.add(mesh);
      /* the close-up shape of the same part, for the players only: it reads the same matrices and colors from the
         slot after the last bench figure, so the benches stay on the light model when the camera comes in */
      let hi = null;
      if (GEO_HI[name]) {
        hi = new T.InstancedMesh(GEO_HI[name], mat, (CAP - SIDELINE) * joints.length);
        hi.instanceMatrix = new T.InstancedBufferAttribute(mesh.instanceMatrix.array.subarray(SIDELINE * joints.length * 16), 16);
        hi.instanceMatrix.setUsage(T.DynamicDrawUsage);
        hi.instanceColor = new T.InstancedBufferAttribute(mesh.instanceColor.array.subarray(SIDELINE * joints.length * 3), 3);
        hi.frustumCulled = false;
        hi.visible = false;
        hi.count = 0;
        scene.add(hi);
      }
      /* the stylized look draws an ink outline round the big parts: the same instances, drawn again from the back,
         pushed out along their normals, in near-black */
      let ol = null;
      if (SH.toonOn && SH.toonOn() && OUTLINED.has(name)) {
        ol = new T.InstancedMesh(GEO[name], outlineMat(), CAP * joints.length);
        ol.instanceMatrix = mesh.instanceMatrix;
        ol.frustumCulled = false;
        ol.count = 0;
        scene.add(ol);
      }
      return { name, mesh, hi, ol, joints, color, fit, shadow, opt: !!opt };
    });
    const holder = new T.Group();
    scene.add(holder);
    for (let i = 0; i < CAP; i++) {
      const f = makeFigure();
      figs.push(f);
      holder.add(f.root);
      f.root.visible = false;
    }
    for (let i = 0; i < REFS; i++) {
      const f = figs[SIDELINE + MAXP + i];
      f.hide = REF_HIDE;
      setBuild(f, BUILD.ref);
      f.num.material = stripeMaterial();
      colorFigure(SIDELINE + MAXP + i, { ...REF_COLORS, skin: SKIN[(i * 2 + 1) % SKIN.length], glove: SKIN[(i * 2 + 1) % SKIN.length], visor: SKIN[(i * 2 + 1) % SKIN.length] });
      refs.push({ x: FW / 2, y: 50, vx: 0, vy: 0, anim: 0, fdDir: 1, placed: false });
    }
    for (let i = 0; i < CREW; i++) {
      const n = SIDELINE + MAXP + REFS + i, f = figs[n], skin = SKIN[(i * 2) % SKIN.length];
      f.hide = REF_HIDE;
      setBuild(f, BUILD.ref);
      f.num.material = NO_NAME;
      colorFigure(n, { ...REF_COLORS, jersey: '#ff7a2f', skin, glove: skin, visor: skin });
      crew.push({ y: 50, v: 0, anim: 0, placed: false });
    }
    buildShadows();
    buildWeather(glowTex);
    applyEnv({ time: 'night', weather: 'clear' });
  }

  /* ---------- shadows ----------
     Each light gets a flattened copy of the main body parts: the same geometry and the very same per-player
     matrices, pushed through one matrix that projects everything onto the turf away from that light. The stencil
     buffer makes sure a pixel is darkened once per light even where parts overlap. At night that gives every player
     four faint shadows, one from each light tower; by day, one from the sun. */
  const SHADOW_Y = 0.035, LIGHTS = 4, TOWER_H = 80;

  function buildShadows() {
    for (let L = 0; L < LIGHTS; L++) {
      const mat = new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.17, depthWrite: false, side: T.DoubleSide, forceSinglePass: true, fog: false,
        stencilWrite: true, stencilFunc: T.NotEqualStencilFunc, stencilRef: L + 1, stencilZPass: T.ReplaceStencilOp,
        polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
      const meshes = parts.filter(p => p.shadow).map(p => {
        const m = new T.InstancedMesh(SHADOW_GEO[p.name], mat, 1);
        m.instanceMatrix = p.mesh.instanceMatrix;  // shared with the body part, so it costs no extra work per frame
        m.matrixAutoUpdate = false;
        m.frustumCulled = false;
        m.count = 0;
        m.renderOrder = 2 + L;
        m.userData.src = p.mesh;
        scene.add(m);
        return m;
      });
      shadowSets.push({ mat, meshes, on: false });
    }
  }

  /* Projects onto the plane y = SHADOW_Y. l is [x, y, z, w] in scene space: w = 1 for a lamp at that point, 0 for the direction to the sun. */
  function shadowMatrix(m, l) {
    const x = l[0], y = l[1], z = l[2], w = l[3], h = SHADOW_Y, d = y - h * w;
    return m.set(d, -x, 0, x * h, 0, -h * w, 0, y * h, 0, -z, d, z * h, 0, -w, 0, y);
  }

  /* ---------- time of day and weather ---------- */
  const TIMES = {
    night: { sky: ['#04070e', '#0b1324', '#17223d'], fog: '#0a1020', hemi: ['#dfe8ff', '#24402c', 2.4], sun: ['#ffffff', 2.2, [-30, 80, 40]], fill: 0.9,
      field: [1, 1, 1], crowd: 1, glow: 1, ground: '#0c1220', wall: '#0e1628', towers: true, shade: 0.17,
      stars: 1, cloud: 0.32, cloudCol: '#1b2438', rim: ['#93a8cc', 0.5] },
    dusk: { sky: ['#232a5c', '#8a4f72', '#f39a5e'], fog: '#5b4257', hemi: ['#ffd9c2', '#2c3a2e', 2.1], sun: ['#ffb27a', 2.8, [-95, 36, -20]], fill: 0.7,
      field: [1.02, 0.94, 0.86], crowd: 1.3, glow: 0.7, ground: '#1c1b2b', wall: '#1a1c30', towers: false, shade: 0.3,
      stars: 0.3, cloud: 0.5, cloudCol: '#d18c8a', rim: ['#ff9a5c', 0.5] },
    day: { sky: ['#2c6fd8', '#73abef', '#d3e6fb'], fog: '#bcd5f1', hemi: ['#ffffff', '#3f6a45', 2.8], sun: ['#fff3dc', 3.0, [-45, 90, 55]], fill: 0.55,
      field: [1.13, 1.13, 1.1], crowd: 1.8, glow: 0, ground: '#5a6676', wall: '#3a4662', towers: false, shade: 0.38,
      stars: 0, cloud: 0.45, cloudCol: '#ffffff', rim: ['#d4e3ff', 0.3] },
  };

  /* A roof for the eleven stadiums with one (data.js CLIM 'dome'; the game's env.roof): a shallow vault of steel
     panels from the rim of the bowl up to a crown over midfield, its underside ruled into panels by the trusses, and
     a ring of lights hung under it round the field. Built once, hidden outdoors. */
  function buildRoof(glowTex, lampTex) {
    const g = new T.Group(), X0 = -89, X1 = FW + 89, Y0 = -99, Y1 = 199, H0 = 55.6, RISE = 44, N = 28;
    const pos = [], uv = [], idx = [];
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
      const u = i / N, v = j / N, h = H0 + RISE * Math.cos(Math.PI / 2 * Math.abs(2 * u - 1)) * Math.cos(Math.PI / 2 * Math.abs(2 * v - 1));
      pos.push(lerp(X0, X1, u), h, -lerp(Y0, Y1, v));
      uv.push(u * 10, v * 13);
    }
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    // the underside: dark steel panels, the trusses between them a little lighter
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    x.fillStyle = '#1b2232';
    x.fillRect(0, 0, 128, 128);
    x.fillStyle = '#2b3448';
    x.fillRect(0, 0, 128, 6);
    x.fillRect(0, 0, 6, 128);
    x.strokeStyle = '#252e40';
    x.lineWidth = 2;
    x.beginPath();
    x.moveTo(6, 6);
    x.lineTo(128, 128);
    x.moveTo(128, 6);
    x.lineTo(6, 128);
    x.stroke();
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    tex.wrapS = tex.wrapT = T.RepeatWrapping;
    tex.anisotropy = 4;
    g.add(new T.Mesh(geo, new T.MeshBasicMaterial({ map: tex, side: T.DoubleSide })));
    // the ring of lights: a catwalk round the field under the roof, lamp banks along it facing down, each with a glow
    const RX0 = -34, RX1 = FW + 34, RY0 = -44, RY1 = 144, RH = 70, walk = new T.MeshBasicMaterial({ color: 0x2a3142 });
    for (const [w, d, cx, cy] of [[RX1 - RX0, 1.4, (RX0 + RX1) / 2, RY0], [RX1 - RX0, 1.4, (RX0 + RX1) / 2, RY1], [1.4, RY1 - RY0, RX0, (RY0 + RY1) / 2], [1.4, RY1 - RY0, RX1, (RY0 + RY1) / 2]]) {
      const m = new T.Mesh(new T.BoxGeometry(w, 1, d), walk);
      m.position.set(cx, RH, -cy);
      g.add(m);
    }
    const lamp = new T.MeshBasicMaterial({ color: 0xf2f6ff, map: lampTex, fog: false }), glow = new T.SpriteMaterial({ map: glowTex, blending: T.AdditiveBlending, depthWrite: false, transparent: true, fog: false, opacity: 0.5 });
    const spots = [];
    for (let k = 0; k <= 6; k++) spots.push([lerp(RX0, RX1, k / 6), RY0], [lerp(RX0, RX1, k / 6), RY1]);
    for (let k = 1; k < 9; k++) spots.push([RX0, lerp(RY0, RY1, k / 9)], [RX1, lerp(RY0, RY1, k / 9)]);
    for (const [lx, ly] of spots) {
      const pn = new T.Mesh(new T.BoxGeometry(7, 0.6, 3.2), lamp);
      pn.position.set(lx, RH - 0.8, -ly);
      g.add(pn);
      const sp = new T.Sprite(glow);
      sp.position.set(lx, RH - 1.6, -ly);
      sp.scale.setScalar(11);
      g.add(sp);
    }
    g.visible = false;
    scene.add(g);
    roof = g;
  }

  function applyEnv(e) {
    lastEnv = e;
    const sx = ends ? -1 : 1;  // the sun is on the other side once the stadium has turned round
    const t = TIMES[e.time] || TIMES.night, wet = e.weather === 'rain', snow = e.weather === 'snow', bad = wet || snow, dim = wet ? 0.72 : snow ? 0.88 : 1;
    const dark = t === TIMES.night;
    const su = skyMat.uniforms, grey = col2.set(dark ? '#161b25' : '#98a1ac');
    [su.uTop, su.uMid, su.uHorizon].forEach((u, i) => {
      u.value.set(t.sky[i]);
      if (bad) u.value.lerp(grey, 0.72);
    });
    su.uSunDir.value.set(sx * t.sun[2][0], t.sun[2][1], sx * t.sun[2][2]).normalize();
    su.uSunCol.value.set(t.sun[0]).multiplyScalar(dark || bad ? 0 : 1);
    su.uStars.value = bad ? 0 : t.stars;
    su.uCloud.value = bad ? 1 : t.cloud;
    su.uCloudCol.value.set(bad ? (dark ? '#1c212b' : '#8d96a2') : t.cloudCol);
    col.set(t.fog);
    if (bad) col.lerp(col2.set(dark ? '#161b25' : '#98a1ac'), 0.7);
    scene.fog.color.copy(col);
    scene.fog.near = wet ? 70 : snow ? 50 : 190;
    scene.fog.far = wet ? 340 : snow ? 290 : 560;
    hemiLight.color.set(t.hemi[0]);
    hemiLight.groundColor.set(t.hemi[1]);
    hemiLight.intensity = t.hemi[2] * dim;
    sunLight.color.set(t.sun[0]);
    sunLight.intensity = t.sun[1] * (bad ? 0.45 : 1);
    sunLight.position.set(sx * t.sun[2][0], t.sun[2][1], sx * t.sun[2][2]);
    fillLight.intensity = t.fill;
    crowdBase = t.crowd * dim * 0.62;
    groundMat.color.set(t.ground);
    wallMat.color.set(t.wall);
    rimMat.color.setScalar(dark || bad ? 1 : 0.55);  // its lights only show once it is dark
    padsMat.color.setScalar((dark ? 0.5 : t === TIMES.dusk ? 0.66 : 0.92) * dim);  // painted, not lit from inside: as bright as the light on it
    const lamps = bad ? Math.max(t.glow, 0.8) : t.glow;  // the lights come on when the weather closes in
    for (const sp of towerGlow) {
      sp.visible = lamps > 0;
      sp.material.opacity = lamps;
    }
    for (const pn of towerPanels) pn.material.color.set(lamps > 0 ? '#f2f6ff' : '#5d6675');
    /* under a roof: no sky, no stars, no light towers in the corners (the ring of lights under the roof instead) */
    const covered = !!e.roof;
    if (roof) roof.visible = covered;
    for (const m of [...towerPoles, ...towerPanels, ...towerGlow]) if (covered) m.visible = false;
    if (!covered) {
      for (const m of [...towerPoles, ...towerPanels]) m.visible = true;
      for (const sp of towerGlow) sp.visible = lamps > 0;
    }
    if (covered) {
      su.uStars.value = 0;
      su.uCloud.value = 0;
      scene.fog.color.set('#121826');
    }
    const fu = fieldMat.uniforms;
    fu.uTint.value.setRGB(t.field[0] * dim, t.field[1] * dim, t.field[2] * dim);
    fu.uWet.value = wet ? 1 : 0;
    fu.uSnow.value = snow ? 1 : 0;
    fu.uLamp.value = lamps;
    fu.uSky.value.copy(su.uHorizon.value);
    SH.rimColor.value.set(t.rim[0]).multiplyScalar(t.rim[1] * (bad ? 0.6 : 1));
    glowAmount = dark ? 0.75 : t === TIMES.dusk ? 0.6 : 0.3;
    const shade = t.shade * (bad ? 0.5 : 1);
    shadowSets.forEach((set, i) => {
      set.on = t.towers || i === 0;
      set.mat.opacity = shade;
      shadowMatrix(m4, t.towers ? [TOWERS[i][0], TOWER_H, -TOWERS[i][1], 1] : [t.sun[2][0], t.sun[2][1], t.sun[2][2], 0]);
      for (const m of set.meshes) {
        m.visible = set.on;
        m.matrix.copy(m4);
        m.matrixWorld.copy(m4);
      }
    });
    contact.material.opacity = t.towers ? 0.26 : 0.18;
    rainPts.visible = wet;
    snowPts.visible = snow;
    if (snow !== envSnow) {
      envSnow = snow;
      teamsKey = '';
    }  // repaint the turf with or without its cover of snow
  }

  /* rain and snow: points in a box that follows the camera, wrapped so the box is always full */
  const NDROP = 1300, BOXW = 70, BOXH = 34;

  function buildWeather(dotTex) {
    const mk = (tex, size, opacity) => {
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.BufferAttribute(new Float32Array(NDROP * 3), 3));
      const pts = new T.Points(g, new T.PointsMaterial({ map: tex, size, transparent: true, opacity, depthWrite: false, fog: false }));
      pts.frustumCulled = false;
      pts.visible = false;
      pts.userData.seed = Float32Array.from({ length: NDROP * 3 }, Math.random);
      scene.add(pts);
      return pts;
    };
    const sc = document.createElement('canvas');
    sc.width = 32;
    sc.height = 64;
    const x = sc.getContext('2d'), gr = x.createLinearGradient(0, 0, 0, 64);
    gr.addColorStop(0, 'rgba(214,228,255,0)');
    gr.addColorStop(0.5, 'rgba(214,228,255,0.95)');
    gr.addColorStop(1, 'rgba(214,228,255,0)');
    x.fillStyle = gr;
    x.fillRect(15, 0, 2, 64);
    rainPts = mk(new T.CanvasTexture(sc), 1.7, 0.5);
    snowPts = mk(dotTex, 0.5, 0.9);
  }

  const wrap = (v, c, size) => c - size / 2 + ((((v - c + size / 2) % size) + size) % size);

  function updateWeather(pts, fall, wind) {
    const a = pts.geometry.attributes.position, sd = pts.userData.seed, cx = camLook.x, cz = (camPos.z + camLook.z) / 2 - 8, snow = fall < 10;
    for (let i = 0; i < NDROP; i++) {
      const k = i * 3, sway = snow ? Math.sin(time * 1.3 + sd[k] * 40) * 1.1 : 0;
      a.setXYZ(i, wrap(sd[k] * BOXW + wind * time + sway, cx, BOXW), wrap(sd[k + 1] * BOXH - fall * time * (0.8 + sd[k + 2] * 0.4), BOXH / 2, BOXH), wrap(sd[k + 2] * BOXW, cz, BOXW));
    }
    a.needsUpdate = true;
  }

  /* The three officials. The referee stands behind the offense, the other two work the sidelines at the ball. */
  function updateRefs(G, ps, dt) {
    const base = SIDELINE + MAXP, off = ps.offTeam === 0 ? 1 : -1, pre = G.state === 'pre' || G.state === 'kickm', L = ps.los;
    let bx = ps.bx === undefined ? FW / 2 : ps.bx, by = L;
    const a = ps.air, c = ps.carrier;
    if (a) {
      bx = a.x;
      by = a.y;
    } else if (c && !pre) {
      bx = c.x;
      by = c.y;
    }
    const fy = clamp(by, -4, 104), lx = ps.bx === undefined ? FW / 2 : ps.bx;
    const spots = [[clamp(lx + 9, 5, FW - 5), clamp((pre ? L : by) - off * 14, -8, 108)], [-1.7, pre ? L : fy], [FW + 1.7, pre ? L + off * 7 : fy]];
    const sig = G.state === 'dead' ? G.sig : null;
    for (let i = 0; i < REFS; i++) {
      const f = figs[base + i], r = refs[i], tx = spots[i][0], ty = spots[i][1];
      if (!r.placed) {
        r.x = tx;
        r.y = ty;
        r.vx = r.vy = 0;
        r.placed = true;
        f.snap = true;
      }
      const dx = tx - r.x, dy = ty - r.y, d = Math.hypot(dx, dy), want = d > 1.2 ? Math.min(7, d * 1.6) : 0, k = 1 - Math.exp(-dt * 5);
      r.vx += ((d > 0.01 ? dx / d * want : 0) - r.vx) * k;
      r.vy += ((d > 0.01 ? dy / d * want : 0) - r.vy) * k;
      r.x += r.vx * dt;
      r.y += r.vy * dt;
      r.fdDir = off;
      f.root.visible = true;
      poseRef(f, r, sig === 'fd' && i > 0 ? null : sig, bx, by, dt);
      writeFigure(f, base + i);
      contact.setMatrixAt(base + i, m4.makeTranslation(r.x, 0.04, -r.y));
    }
  }

  /* The chain crew. marks are the three spots along the sideline (line to gain, ten yards back, the ball), or null to
     stay put (a kickoff). Each man walks to his mark and then stands facing the field with his stick in one hand. */
  function updateCrew(on, marks, dt) {
    const base = SIDELINE + MAXP + REFS;
    for (let i = 0; i < CREW; i++) {
      const f = figs[base + i], c = crew[i];
      if (!on) {
        c.placed = false;
        continue;
      }
      const ty = marks ? marks[i] : c.y;
      if (!c.placed) {
        c.y = ty;
        c.placed = true;
        f.snap = true;
      }
      c.v = clamp((ty - c.y) * 2.4, -7, 7);
      c.y += c.v * dt;
      poseCrew(f, c.v, dt);
      /* standing, he is a step behind his stick; walking, beside it */
      const x = (i === 2 ? BOX_X : CREW_X) - 0.75;
      f.root.position.set(x, 0, -c.y);
      f.root.rotation.y = f.heading;
      f.root.visible = true;
      writeFigure(f, base + i);
      contact.setMatrixAt(base + i, m4.makeTranslation(x, 0.04, -c.y));
    }
  }

  function hideFigure(f, i) {
    f.root.visible = false;
    for (const p of parts) for (let k = 0; k < p.joints.length; k++) p.mesh.setMatrixAt(i * p.joints.length + k, ZERO4);
    contact.setMatrixAt(i, ZERO4);
  }

  /* repaint everything that carries team colors, and stand the reserves along the sidelines */
  function setTeams(t0, t1, hs, both) {
    hs = hs || 0;  // which side is at home: its paint at midfield, its colors in the seats, its men in their home jerseys
    paintField(t0, t1, hs ? t1 : t0, both);
    paintCrowd(hs ? t1 : t0, hs ? t0 : t1);
    const kinds = [BUILD.line, BUILD.big, BUILD.slim, BUILD.back, BUILD.db, BUILD.end, BUILD.qb];
    /* the reserves are the team's own (roster.js): ten of its backups a side, each in his own number and name and built
       for his position */
    const benchOf = t => {
      const ti = (PG.TEAMS || []).indexOf(t), all = ti >= 0 && PG.roster ? PG.roster.reserves(ti) : [];
      return all.length ? [...Array(SIDELINE / 2)].map((_, k) => all[Math.floor(k * all.length / (SIDELINE / 2))]) : null;
    };
    const bench = [benchOf(t0), benchOf(t1)];
    for (let i = 0; i < SIDELINE; i++) {
      const home = i < SIDELINE / 2, n = i % (SIDELINE / 2), f = figs[i], t = home ? t0 : t1, kit = (home ? 0 : 1) === hs;  // home: your bench, on the near side
      /* two loose ranks, unevenly spaced, each man turned a little his own way: a sideline, not a parade */
      const x = (home ? -4.2 - (n % 2) * 1.1 : FW + 4.2 + (n % 2) * 1.1) + (Math.random() - 0.5) * 0.7, y = 33 + n * 3.6 + (Math.random() - 0.5) * 2.4;
      const man = bench[home ? 0 : 1] && bench[home ? 0 : 1][n];
      setBuild(f, man ? BUILD[man.build] : kinds[(i * 5 + n) % kinds.length]);
      f.root.position.set(x, 0, -y);
      f.root.rotation.y = (home ? -Math.PI / 2 : Math.PI / 2) + (Math.random() - 0.5) * 0.5;
      f.benchY = y;  // his place on the bench (a few of them pace up and down from it: see poseBench)
      f.bw = null;
      f.root.visible = true;
      f.snap = true;
      const c = teamColors(t, kit, SKIN[Math.floor(Math.random() * SKIN.length)]);
      f.num.material = numberMaterial(man ? man.num : Math.floor(Math.random() * 98) + 1, c.number);
      f.nameplate.material = nameMaterial(man ? man.name : PG.NAMES[Math.floor(Math.random() * PG.NAMES.length)], c.number);
      colorFigure(i, c);
    }
    for (const p of parts) p.mesh.instanceColor.needsUpdate = true;
  }

  /* ---------- public ---------- */
  function init(canvas) {
    renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    camera = new T.PerspectiveCamera(76, 1, 2, 900);
    renderer.info.autoReset = false;  // the finishing pass renders several times a frame; count them all
    post = SH.post(renderer);
    buildScene();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => {
      teamsKey = '';
      boardKey = '';
      numCache.clear();
    });
    return true;
  }

  function resize(w, h, dpr) {
    W = w;
    H = h;
    renderer.setPixelRatio(Math.min(dpr, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    /* upright, a 76-degree lens; on a wide screen a narrower one, so the view across stays near 96 degrees and the stands
       at the edges do not stretch */
    camera.fov = w > h ? clamp(2 * Math.atan(Math.tan(0.84) / camera.aspect) * 180 / Math.PI, 50, 76) : 76;
    camera.updateProjectionMatrix();
  }

  /* field point to screen: { x, y, s } with s = pixels per yard there, or null when it is not in view */
  function project(x, y, z) {
    v3.set(x, z || 0, -y).project(camera);
    if (v3.z > 1 || v3.z < -1) return null;
    const sx = (v3.x + 1) / 2 * W, sy = (1 - v3.y) / 2 * H;
    v3b.set(x + 1, z || 0, -y).project(camera);
    return { x: sx, y: sy, s: Math.abs((v3b.x + 1) / 2 * W - sx) };
  }

  const m4 = new T.Matrix4(), dirV = new T.Vector3(), NIGHT = { time: 'night', weather: 'clear' };

  function turnEnds(w) {
    ends = w;
    if (lastTeams) {
      paintField(lastTeams[0], lastTeams[1], lastTeams[2], lastTeams[3]);
      fieldTex.needsUpdate = true;
    }
    if (lastEnv) applyEnv(lastEnv);
  }

  /* s: { G, P, ps, cam, teams, acc, shake, isCtl } */
  function render(s, dt) {
    time += dt;
    const G = s.G, P = s.P, ps = s.ps, t0 = s.teams[G.tm[0]], t1 = s.teams[G.tm[1]];
    const lg = G.mode === 'career' || G.mode === 'season', key = G.tm[0] + '-' + G.tm[1] + '-' + (G.home || 0) + (lg ? 'L' : ''), e = s.env || NIGHT, ek = e.time + '|' + e.weather + '|' + (e.roof ? 'roof' : '');
    if (ek !== envKey) {
      envKey = ek;
      applyEnv(e);
    }
    if (key !== teamsKey) {
      teamsKey = key;
      boardKey = '';
      setTeams(t0, t1, G.home || 0, lg);
    }
    updateProps(s.scene || null, t0, P);
    /* the second and fourth quarters are played the other way round (see ends) */
    endsWant = G.state !== 'menu' && !G.drill && G.q % 2 === 0 ? 1 : 0;
    if (endsWant !== ends) {
      if (G.state === 'menu' || G.state === 'intro' || G.state === 'over') {
        turnEnds(endsWant);
        endsT = 9;
      } else if (endsT >= 2.6) endsT = 0;  // start the crane
      else if (endsT >= 1.15) turnEnds(endsWant);  // and turn the stadium round at the top of it
    }
    endsT += dt;
    celebT = G.celeb && G.state === 'dead' ? celebT + dt : 0;
    celebBall = 0;
    const msg = G.ros && G.state === 'dead' && !G.celeb && BOARD_SAYS.test(G.last || '') ? G.last : '';  // the board has a word for the big ones
    const bk = G.ros ? [G.score, G.q, Math.ceil(G.clock || 0), s.down, !!G.celeb, msg].join('|') : 'menu';
    if (bk !== boardKey) {
      boardKey = bk;
      paintBoard(G, t0, t1, msg || s.down);
    }

    /* players */
    lod = lodOn;
    const fresh = ps !== lastPs;
    lastPs = ps;
    /* who is kicking, when his foot meets the ball, and where he stands to do it. The engine has the ball in the air
       from the moment of the kick; here it waits for the foot: a tenth of a second for a punt or a place kick, and
       0.45 s on a kickoff, which the kicker runs up to from three yards back. */
    let kicker = null, kickHit = 0.1, kickAt = null, kickPunt = false, kickSnap = 0, kickSpot = null, holder = null;
    if (ps && ps.mode === 'kick' && G.op && G.op.n === 'Field Goal') holder = P.find(q => q.role === 'FB' && q.team === ps.offTeam && !q.down) || null;
    if (ps && ps.air && ps.air.kick && ps.air.t < 1.6) {
      const a = ps.air, far = Math.hypot(a.x1 - a.x0, a.y1 - a.y0) || 1, ux = (a.x1 - a.x0) / far, uy = (a.y1 - a.y0) / far;
      kickPunt = !!(ps.kick && ps.kick.type === 'punt');
      if (ps.mode === 'kick' && ps.qb) {
        /* a punt or a field goal. The snap goes back first (0.4 s to a punter, 0.3 s to the holder, who puts it
           down), the kicker takes his steps, and his foot gets there at 0.8 s or 0.6 s. A kick that is blocked has
           no time for any of that. */
        kicker = ps.qb;
        if (a.T < 1.2 || !ps.los) kickAt = [kicker.x, kicker.y, ux, uy];
        else if (kickPunt) {
          kickSnap = 0.4;
          kickHit = 0.8;
          kickAt = [a.x0 + ux * 1.2, a.y0 + uy * 1.2, ux, uy];
        } else {
          kickSnap = 0.3;
          kickHit = 0.6;
          kickSpot = holder ? [holder.x + (ps.bx - holder.x) * 0.85, ps.los - (G.dir || 1) * 7] : [ps.bx, ps.los - (G.dir || 1) * 7];
          kickAt = [kickSpot[0] - ux * 0.35 - uy * 0.3, kickSpot[1] - uy * 0.35 + ux * 0.3, ux, uy];
        }
      } else {
        let best = 6;
        for (const q of P) if (!q.down && q.team !== ps.offTeam) {
          const dq = Math.hypot(q.x - a.x0, q.y - a.y0);
          if (dq < best && (a.t < 0.05 || q === lastKicker)) {
            best = dq;
            kicker = q;
          }
        }
        if (a.t >= 0.05 && lastKicker && P.indexOf(lastKicker) >= 0) kicker = lastKicker;
        if (kicker) {
          kickHit = 0.45;
          kickAt = [a.x0 - ux * 0.35 - uy * 0.3, a.y0 - uy * 0.35 + ux * 0.3, ux, uy];
        }
      }
      lastKicker = kicker;
    } else lastKicker = null;
    const st = { G, ps, kicker, kickHit, kickAt, kickPunt, kickSnap, holder, pre: G.state === 'pre' || G.state === 'kickm', live: G.state === 'live' || G.state === 'replay', dir: G.dir || 1, celeb: G.celeb || null, charge: s.charge, P, figOf: q => (P.indexOf(q) < 0 ? null : figs[SIDELINE + P.indexOf(q)]) };  // a man who is not on the field has no figure (the slot before the first player's is a reserve on the bench)
    let ctl = null;
    for (let i = 0; i < MAXP; i++) {
      const f = figs[SIDELINE + i], p = P[i];
      if (!p || !ps) {
        hideFigure(f, SIDELINE + i);
        continue;
      }
      if (fresh) {
        f.hide = p.suit || p.hoodie ? BARE_HIDE : p.ref ? REF_HIDE : p.look && p.look.trim === 'none' ? LOOK_HIDE : null;
        f.extra = p.hoodie ? CAP_ON : p.suit ? HAIR_ON : gearOf(p);  // a cutscene's referee is dressed like the officials, the commissioner in a suit
        setBuild(f, p.ref || p.suit ? BUILD.ref : p.hoodie ? BUILD.qb : buildOf(p.role));
        const home = p.team === 0, kit = p.team === (G.home || 0), c = p.hoodie ? HOOD(p.team === 1 ? t1 : t0) : p.suit ? SUIT : p.ref ? { ...REF_COLORS, skin: SKIN[(i * 2 + 1) % SKIN.length], glove: SKIN[(i * 2 + 1) % SKIN.length], visor: SKIN[(i * 2 + 1) % SKIN.length] } : lookColors(teamColors(home ? t0 : t1, kit, SKIN[(p.num * 7 + i) % SKIN.length]), p.look, home ? t0 : t1);  // kit: home colors for the home side, white for the visitors
        if (envSnow && !p.ref && !p.suit && !p.hoodie && !p.look && (p.num * 13 + i) % 5 < 3) c.arm = p.num % 2 ? '#f1f1f1' : '#17191e';  // in the snow most of them wear long sleeves under the jersey, white or black
        if (dirtGame !== G) {
          dirtGame = G;
          DIRT.clear();
        }
        f.dirtKey = p.ref || p.suit || p.hoodie || G.state === 'scene' ? null : p.team + ':' + p.num;
        f.dirtSeen = false;
        colorFigure(SIDELINE + i, f.dirtKey ? dirtied(c, DIRT.get(f.dirtKey), G.env && G.env.weather) : c);
        f.num.material = p.ref ? stripeMaterial() : p.suit || p.hoodie ? NO_NAME : numberMaterial(p.num, c.number);
        f.nameplate.material = p.ref || p.suit || p.hoodie ? NO_NAME : nameMaterial(p.name, c.number);
        f.patch.material = p.capt && !p.ref && !p.suit && !p.hoodie ? patchMaterial(c.number) : NO_NAME;
        f.fall = 0;
        f.fallDir = Math.random() < 0.75 ? 1 : -1;
        f.snap = true;
        f.root.visible = true;
        f.heading = (p.team === ps.offTeam ? st.dir : -st.dir) > 0 ? 0 : Math.PI;
      }
      poseFor(f, p, st, dt);
      if (f.dirtKey && !f.dirtSeen && (p.down || p.fell || p.flat > 0 || p.dive > 0) && G.state !== 'replay') {
        f.dirtSeen = true;  // once a play: he went to the ground (it shows from the next play on)
        const wet = G.env && (G.env.weather === 'rain' || G.env.weather === 'snow');
        DIRT.set(f.dirtKey, (DIRT.get(f.dirtKey) || 0) + (wet ? 1.6 : 1));
      }
      writeFigure(f, SIDELINE + i);
      contact.setMatrixAt(SIDELINE + i, m4.makeTranslation(f.root.position.x, 0.04, f.root.position.z));
      if (s.isCtl(p)) ctl = p;
    }
    /* the benches, then the officials */
    const scored = G.celeb && G.state === 'dead' ? G.celeb.team : -1, seen = ps ? ps.air || ps.loose || ps.carrier || (ps.bx === undefined ? null : { x: ps.bx, y: ps.los }) : null;
    for (let i = 0; i < SIDELINE; i++) {
      const f = figs[i];
      poseBench(f, (i < SIDELINE / 2 ? 0 : 1) === scored, dt, seen ? seen.x : null, seen ? seen.y : 0);
      writeFigure(f, i);
      contact.setMatrixAt(i, m4.makeTranslation(f.root.position.x, 0.04, f.root.position.z));
    }
    if (ps && G.state !== 'menu' && G.state !== 'scene') updateRefs(G, ps, dt);
    else for (const r of refs) r.placed = false;
    /* The chain crew: front stick at the line to gain, back stick ten yards behind it, the down box on the ball.
       Once the whistle has gone they set off for the next play's marks, so after a first down you see them move. */
    const gameOn = G.state !== 'menu' && G.state !== 'over' && G.state !== 'intro' && G.state !== 'scene', now = !!ps && G.state !== 'dead', way = (now ? ps.offTeam : G.poss) === 0 ? 1 : -1;
    const toGain = clamp(now ? ps.fd : G.fd, 0, 100), kick = (!!ps && ps.mode === 'ko') || G.pendKO != null;
    updateCrew(gameOn, kick ? null : [toGain, toGain - way * 10, now ? ps.los : G.los], dt);
    const active = ps && G.state !== 'menu' ? (G.state === 'scene' ? SIDELINE + Math.min(MAXP, P.length) : CAP) : SIDELINE;  // a cutscene draws its own actors and the benches: the empty player slots after them are not sent to the card at all
    for (const p of parts) {
      const n = p.joints.length, close = nearModel && !!p.hi && active > SIDELINE;
      p.mesh.userData.full = active * n;
      p.mesh.count = close ? SIDELINE * n : active * n;
      if (p.ol) p.ol.count = active * n;
      p.mesh.instanceMatrix.needsUpdate = true;
      if (fresh) p.mesh.instanceColor.needsUpdate = true;
      if (p.hi) {
        p.hi.visible = close;
        if (close) {
          p.hi.count = (active - SIDELINE) * n;
          p.hi.instanceMatrix.needsUpdate = true;
          if (p.hi.userData.cv !== p.mesh.instanceColor.version) {
            p.hi.userData.cv = p.mesh.instanceColor.version;  // the colors changed since it was last shown
            p.hi.instanceColor.needsUpdate = true;
          }
        }
      }
    }
    const cast = s.shadows !== false;
    for (const set of shadowSets) for (const m of set.meshes) {
      m.visible = set.on && cast;
      m.count = m.userData.src.userData.full || 0;
    }
    contact.count = active;
    contact.instanceMatrix.needsUpdate = true;

    /* ball */
    let bx = null, by = 0, bz = 0;
    ball.visible = !!ps && G.state !== 'scene';  // a cutscene brings its own props
    if (ps) {
      const a = ps.air, c = ps.carrier;
      if (a) {
        bx = a.x;
        by = a.y;
        bz = a.kick ? a.z : passZ(a);
        const u = Math.min(1, a.t / a.T), vz = a.kick ? a.h * 4 * (1 - 2 * u) / a.T : (-0.6 + a.h * 4 * (1 - 2 * u)) / a.T;
        dirV.set((a.x1 - a.x0) / a.T, vz, -(a.y1 - a.y0) / a.T).normalize();
        ball.quaternion.setFromUnitVectors(zAxis, dirV);
        if (a.kick) {
          ball.rotateX(time * 14);
          if (kicker) {
            /* it waits for the foot, then catches up with its flight */
            const fk = figs[SIDELINE + P.indexOf(kicker)], late = kickHit > 0.2 ? 0.55 : 0.3;
            if (a.t < kickHit) {
              if (a.t < kickSnap) {
                // the snap: back from the line to the punter's hands, or the holder's
                const u = a.t / kickSnap, tx = kickSpot ? kickSpot[0] : a.x0, ty = kickSpot ? kickSpot[1] : a.y0;
                bx = lerp(ps.bx, tx, u);
                by = lerp(ps.los, ty, u);
                bz = lerp(0.18, kickSpot ? 0.55 : 1.25, u) + Math.sin(u * Math.PI) * 0.3;
              } else if (kickPunt && fk) {
                // a punt: held out in front of him as he steps, then dropped onto the foot
                const u = clamp((a.t - (kickHit - 0.12)) / 0.12, 0, 1);
                bx = fk.root.position.x + kickAt[2] * 0.55;
                by = -fk.root.position.z + kickAt[3] * 0.55;
                bz = lerp(1.25, 0.55, u * u);
              } else if (kickSpot) {
                // put down on the spot, the holder's finger on top of it
                bx = kickSpot[0];
                by = kickSpot[1];
                bz = lerp(0.55, 0.2, smooth(clamp((a.t - kickSnap) / 0.12, 0, 1)));
              } else {
                const out = ps.mode === 'ko' ? 0 : 0.42;  // a place kick with no holder is struck a little in front of where he stands
                bx = a.x0 + kickAt[2] * out;
                by = a.y0 + kickAt[3] * out;
                bz = ps.mode === 'ko' ? 0.36 : 0.18;
              }
              ball.rotation.set(0, 0, 0);
              kickFrom[0] = bx;
              kickFrom[1] = by;
              kickFrom[2] = bz;
            } else if (a.t < kickHit + late) {
              const k = smooth((a.t - kickHit) / late);
              bx = lerp(kickFrom[0], bx, k);
              by = lerp(kickFrom[1], by, k);
              bz = lerp(kickFrom[2], bz, k);
            }
          }
        } else {
          /* a pass stays in the thrower's hand until his arm lets it go, then catches up with its flight over the
             next few tenths of a second (the engine has had it in the air since the button was let go) */
          const qi = P.findIndex(q => q.thrT > 0), fq = qi >= 0 ? figs[SIDELINE + qi] : null, age = fq ? TH_LEN - P[qi].thrT : 9;
          if (fq && fq.thRel > 0 && age < fq.thRel) {
            v3.set(TH_GRIP[0], TH_GRIP[1], TH_GRIP[2]).applyMatrix4(fq.elR.matrixWorld);
            fq.thB = fq.thB || [0, 0, 0];
            bx = fq.thB[0] = v3.x;
            by = fq.thB[1] = -v3.z;
            bz = fq.thB[2] = v3.y;
          } else if (fq && fq.thB && fq.thRel > 0) {
            const k = smooth(clamp((age - fq.thRel) / Math.min(0.3, a.T * 0.5), 0, 1));
            bx = lerp(fq.thB[0], bx, k);
            by = lerp(fq.thB[1], by, k);
            bz = lerp(fq.thB[2], bz, k);
            ball.rotateZ(time * 22);
          } else ball.rotateZ(time * 22);
        }
      } else if (ps.loose) {
        bx = ps.loose.x;
        by = ps.loose.y;
        bz = ps.loose.z;
        ball.rotation.set(time * 9, time * 4, 0);
      } else if (c && G.state !== 'pre' && G.state !== 'kickm') {
        // before the snap the ball waits on the turf
        const f = figs[SIDELINE + P.indexOf(c)];
        if (f) {
          const pocket = c === ps.qb && ps.mode === 'pass' && !ps.thrown && !ps.open && !c.down;
          if (pocket) {
            v3.set(0.06, 0.4, -0.27).applyMatrix4(f.chest.matrixWorld);
            if (f.hand > 0) v3.lerp(v3b.set(TH_GRIP[0], TH_GRIP[1], TH_GRIP[2]).applyMatrix4(f.elR.matrixWorld), f.hand);  // winding up, or pumping: it goes back with his hand
          }
          else if (c === ps.qb && ps.mode === 'run' && ps.runner && ps.runner !== c && !ps.handoff && !c.down) v3.set(0, 0.1, -0.33).applyMatrix4(f.chest.matrixWorld);  // riding in both hands at his belt until he gives it
          else v3.set(f.ballL ? -0.03 : 0.03, -0.24, -0.1).applyMatrix4((f.ballL ? f.elL : f.elR).matrixWorld);  // under the other arm when the right hand is the one fending a man off
          let spinning = 0;
          const cb = G.celeb && G.state === 'dead' && G.celeb.who === c ? celebBall : 0;
          if (cb === 1 || (cb === 5 && celebT < 0.62)) v3.set(TH_GRIP[0], TH_GRIP[1], TH_GRIP[2]).applyMatrix4(f.elR.matrixWorld);
          else if (cb === 4) v3.set(0.04, 0.32, -0.3).applyMatrix4(f.chest.matrixWorld);
          else if (cb === 2 || cb === 3) {
            // on the turf, a step in front of him
            v3.set(c.x - Math.sin(f.heading) * 1.15, 0.2, -(c.y + Math.cos(f.heading) * 1.15));
            spinning = cb === 3 ? 1 : 0;
          } else if (cb === 5) {
            // spiked: straight down off the turf, up over his head, and away in smaller bounces
            const tb = celebT - 0.62, hop = Math.abs(Math.sin(tb * 4.4)) * Math.exp(-tb * 1.15) * 3.4;
            v3.set(spike[0] - Math.sin(f.heading) * Math.min(3.2, tb * 1.7), 0.2 + hop, spike[2] - Math.cos(f.heading) * Math.min(3.2, tb * 1.7));
            spinning = 2;
          }
          if (cb === 5 && celebT < 0.62) {
            spike[0] = v3.x;
            spike[2] = v3.z;
          }
          bx = v3.x;
          by = -v3.z;
          bz = v3.y;
          if (c === ps.qb && G.state === 'live' && ps.t < 0.16 && !ps.thrown && !ps.handoff) {
            // the snap: up off the turf and back into his hands, on any play
            const u = ps.t / 0.16;
            bz = lerp(0.18, bz, u) + Math.sin(u * Math.PI) * Math.min(0.25, Math.hypot(bx - ps.bx, by - ps.los) * 0.08);
            bx = lerp(ps.bx, bx, u);
            by = lerp(ps.los, by, u);
          }
          /* Changing hands (a give, a catch, a ball picked up): it is carried across over a tenth of a second or so,
             not gone from one place and in another on the next frame. */
          if (held.who !== c && held.on && Math.hypot(held.x - bx, held.y - by, held.z - bz) < 3) {
            held.t = 0.14;
            held.fx = held.x;
            held.fy = held.y;
            held.fz = held.z;
          }
          held.who = c;
          if (held.t > 0) {
            const k = smooth(1 - held.t / 0.14);
            bx = lerp(held.fx, bx, k);
            by = lerp(held.fy, by, k);
            bz = lerp(held.fz, bz, k);
            held.t -= dt || 0;
          }
          if (spinning === 1) ball.rotation.set(Math.PI / 2, 0, time * 16);
          else if (spinning === 2) ball.rotation.set(time * 11, time * 3, 0);
          else ball.rotation.set(0.35, f.heading, 0);
        }
      } else if (ps.mode !== 'ko' || G.state === 'pre') {
        bx = ps.bx;
        by = ps.los;
        bz = ps.mode === 'ko' ? 0.36 : 0.18;
        ball.rotation.set(ps.mode === 'ko' ? 1.25 * (G.dir || 1) : 0, 0, 0);  // a kickoff: stood up on the tee, leaning back a little toward the kicker
      }
      if (bx === null) ball.visible = false;
      else ball.position.set(bx, bz, -by);
      if (!c || a || ps.loose) held.who = null;
      held.on = bx !== null && G.state !== 'pre' && G.state !== 'kickm' && !(a && a.kick && a.t < 0.2);
      if (bx !== null) {
        held.x = bx;
        held.y = by;
        held.z = bz;
      }
      ballShadow.visible = !!a;
      if (a) ballShadow.position.set(a.x, 0.04, -a.y);
      targetRing.visible = !!(a && !a.kick);
      if (targetRing.visible) {
        const mine = G.lock && a.target && a.target === G.me, pu = 1 + 0.12 * Math.sin(time * 16);
        targetRing.position.set(a.x1, 0.05, -a.y1);
        targetRing.scale.setScalar(mine ? pu : 1);
        targetRing.material.color.set(mine ? s.acc : '#ffffff');
      }
    } else {
      ballShadow.visible = false;
      targetRing.visible = false;
    }
    ring.visible = !!ctl;
    if (ctl) {
      ring.position.set(ctl.x, 0.05, -ctl.y);
      ring.material.color.set(s.acc);
    }

    /* down markers */
    const showLines = G.state !== 'menu' && G.state !== 'over' && G.state !== 'intro' && !(ps && ps.mode === 'ko');
    const L = ps ? ps.los : G.los, FD = ps ? ps.fd : G.fd;
    losLine.visible = showLines;
    fdLine.visible = showLines && FD > 0.1 && FD < 99.9;
    losLine.position.z = -L;
    fdLine.position.z = -FD;
    /* the gear goes where the crew carries it, so it walks down the sideline with them after a first down */
    const gear = crew[0].placed;
    sticks.visible = sticks2.visible = chain.visible = downBox.visible = gear;
    if (gear) {
      sticks.position.set(CREW_X, 0, -crew[0].y);
      sticks2.position.set(CREW_X, 0, -crew[1].y);
      chain.position.z = -(crew[0].y + crew[1].y) / 2;
      chain.scale.z = Math.max(0.1, Math.abs(crew[0].y - crew[1].y));
      downBox.position.set(BOX_X, 0, -crew[2].y);
      downBox.userData.cube.material = downMats[clamp(G.down || 1, 1, 4)];
    }

    /* camera flashes */
    const fp = flashes.geometry.attributes.position, rate = (1.2 + 70 * Math.min(1, cheer)) * dt;
    for (let i = 0; i < FLASHES; i++) {
      if (flashLife[i] > 0) {
        flashLife[i] -= dt;
        if (flashLife[i] <= 0) fp.setY(i, -999);
        continue;
      }
      if (Math.random() > rate / FLASHES * 3) continue;
      const u = Math.random(), v = 0.08 + Math.random() * 0.85, side = Math.floor(Math.random() * 4), g = 40 * v, h = 1.9 + 22 * v;
      if (side === 0) fp.setXYZ(i, -14 - g, h, -lerp(-24 - g, 124 + g, u));
      else if (side === 1) fp.setXYZ(i, FW + 14 + g, h, -lerp(-24 - g, 124 + g, u));
      else if (side === 2) fp.setXYZ(i, lerp(-14 - g, FW + 14 + g, u), h, -(124 + g));
      else fp.setXYZ(i, lerp(-14 - g, FW + 14 + g, u), h, 24 + g);
      flashLife[i] = 0.07 + Math.random() * 0.08;
    }
    fp.needsUpdate = true;
    /* crowd reacts */
    cheer = Math.max(0, cheer - dt * 0.5);
    const cu = crowdMat.uniforms;
    cu.uTime.value = time;
    cu.uCheer.value = Math.min(1, cheer);
    cu.uBase.value = crowdBase;
    skyMat.uniforms.uTime.value = time;

    /* camera */
    const cm = s.cam, menu = G.state === 'menu';
    if (menu) {
      /* behind the menus: four slow shots, sixteen seconds each, with a hard cut between them */
      const shot = Math.floor(time / 16) % 4, u = (time % 16) / 16;
      if (shot !== menuShot) {
        menuShot = shot;
        cm.snap = true;
      }
      if (shot === 0) {
        // high and wide, drifting around the bowl
        const a = -0.6 + u * 0.9;
        v3.set(FW / 2 + Math.sin(a) * 58, 30 + u * 5, -50 + Math.cos(a) * 95);
        v3b.set(FW / 2, 2, -50);
      } else if (shot === 1) {
        // along the sideline at head height
        v3.set(-7, 2.3, -lerp(18, 62, u));
        v3b.set(FW / 2 + 6, 3, -lerp(34, 78, u));
      } else if (shot === 2) {
        // rising behind the goal posts
        v3.set(FW / 2 + lerp(-10, 10, u), lerp(3.5, 26, u * u), 26);
        v3b.set(FW / 2, 5, -50);
      } else {
        // a crane coming down on midfield
        const a = 1.9 + u * 0.7;
        v3.set(FW / 2 + Math.sin(a) * lerp(60, 22, u), lerp(46, 9, u), -50 + Math.cos(a) * lerp(60, 22, u));
        v3b.set(FW / 2, 1, -50);
      }
    } else if (G.state === 'scene' && s.scene && SCENECAM[s.scene.kind]) {
      SCENECAM[s.scene.kind](s.scene, P, v3, v3b);
      /* A change of shot is a cut (1.23: the camera used to glide from one shot's place to the next over half a
         second, through whatever was in between). And within a shot it is never quite still: it eases in on what it
         is looking at by a fifteenth over four seconds, and sways a few inches, the way a held camera does. */
      if (s.scene !== shot.of || Math.hypot(v3.x - shot.x, v3.y - shot.y, v3.z - shot.z) > 2.5) {
        cm.snap = true;
        shot.t = 0;
        shot.of = s.scene;
      }
      shot.x = v3.x;
      shot.y = v3.y;
      shot.z = v3.z;
      shot.t += dt;
      v3.lerp(v3b, 0.07 * smooth(Math.min(1, shot.t / 4)));
      v3.x += Math.sin(time * 0.9) * 0.07;
      v3.y += Math.sin(time * 1.3 + 1) * 0.04;
    } else if (endsT < 2.6 && G.state !== 'live' && G.state !== 'replay' && G.state !== 'intro' && G.state !== 'scene') {
      // the teams change ends: a crane up over midfield and down again, the stadium turning round at the top
      const u = endsT / 2.6, a = -0.4 + u * 1.6, h = Math.sin(Math.PI * u);
      v3.set(FW / 2 + Math.sin(a) * lerp(30, 70, h), lerp(10, 62, h), -50 + Math.cos(a) * lerp(30, 70, h));
      v3b.set(FW / 2, 1, -50);
    } else if (G.state === 'intro') {
      // before kickoff: sweep down into the stadium
      let e = clamp((G.introT || 0) / 3.8, 0, 1);
      e = e * e * (3 - 2 * e);
      const a = lerp(-1.15, -0.25, e);
      v3.set(FW / 2 + Math.sin(a) * 100, lerp(84, 27, e), -50 + Math.cos(a) * 114);
      v3b.set(FW / 2, 4, -50);
    } else if (G.state === 'replay' && ps && G.rpAngle === 1) {
      // the reverse angle: ahead of the play and low, looking back at the ball carrier as he comes on
      const d = G.rpDir || st.dir;
      v3.set(lerp(cm.fx, FW / 2, 0.25), 7, -clamp(cm.fy + d * 16, -12, 112));  // high enough to see over the men between it and him
      v3b.set(cm.fx, 1.2, -cm.fy);
    } else if (G.state === 'replay' && ps) {
      // replay: low, from the middle of the field
      const side = cm.fx > FW / 2 ? -1 : 1;
      v3.set(cm.fx + side * 13, 3.4, -(cm.fy - st.dir * 5));
      v3b.set(cm.fx, 1.5, -cm.fy);
    } else if (G.celeb && G.state === 'dead' && G.celeb.who) {
      /* Touchdown, in three shots (1.22; it was one slow circle, with whoever stood in the way). The camera is out
         toward midfield from him, so the stands are behind him and his teammates gather on the far side (coast() in
         game.js leaves that side open). It pushes in low on him, drifts across his front while he celebrates, and for
         the last second and a half rises and pulls back to take in the whole side. */
      if (celebT < dt * 1.5) cm.snap = true;  // a cut to him, then the push in
      const w = G.celeb.who, t = celebT, mx = FW / 2 - w.x, my = 50 - w.y, ml = Math.hypot(mx, my) || 1, a0 = Math.atan2(my / ml, mx / ml * 0.35);
      const push = smooth(clamp(t / 0.8, 0, 1)), out = smooth(clamp((t - 3.3) / 1.4, 0, 1)), a = a0 + Math.sin(t * 0.5 - 0.6) * 0.55;
      const R = lerp(lerp(10, 4.9, push), 11.5, out), h = lerp(lerp(2.6, 1.5, push), 5.2, out);
      v3.set(w.x + Math.cos(a) * R, h, -(w.y + Math.sin(a) * R));
      v3b.set(w.x, lerp(lerp(1.7, 2.15, push), 1.5, out), -w.y);
    } else {
      /* once a ball carrier is in the open field the camera closes in on him */
      const chase = ps && ps.carrier && !ps.air && (ps.open || ps.mode === 'ko') && (G.state === 'live' || G.state === 'dead');
      zoom += ((chase ? 0.68 : 1) - zoom) * (1 - Math.exp(-dt * 2.4));
      const view = 1 / clamp(s.zoom || 1, 0.5, 2);  // the player's zoom: under 1 pulls the camera back and up, over 1 brings it in and down
      /* a wide screen already shows the whole width of the field, so the camera comes in closer and looks a little further
         ahead: bigger players, the same view downfield */
      const wd = clamp((camera.aspect - 1) / 0.8, 0, 1);
      const up = cm.up, back = (up ? 40 : 46) * zoom * view * (1 - 0.24 * wd), ahead = (up ? 10 : 3) * zoom + (1 - zoom) * 8 + 5 * wd, tx = lerp(FW / 2, cm.fx, 0.75 + (1 - zoom) * 0.6);
      /* The camera may not back out through the end-zone stand (the video board would hide the play). Zoomed out and
         pinned on your own goal line, it stops at the wall and climbs instead, keeping its distance from the ball. */
      let camY = cm.fy - back, camH = 24 * zoom * view * (1 - 0.12 * wd);
      if (camY < CAM_WALL) {
        const reach = Math.hypot(back, camH);
        camY = CAM_WALL;
        camH = Math.sqrt(Math.max(camH * camH, reach * reach - (cm.fy - CAM_WALL) * (cm.fy - CAM_WALL)));
      }
      v3.set(tx, camH, -camY);
      v3b.set(tx, 0, -(cm.fy + ahead));
      if (G.state === 'pre' && ps && ps.mode !== 'ko' && !s.plain) {
        // start close behind the formation, then pull out
        let e = clamp((G.preT - 0.1) / 1.15, 0, 1);
        e = e * e * (3 - 2 * e);
        v3.x = lerp(cm.fx + 2.5, v3.x, e);
        v3.y = lerp(7.5, v3.y, e);
        v3.z = lerp(-(cm.fy - (up ? 15 : 24)), v3.z, e);
        v3b.y = lerp(1.2, 0, e);
      }
    }
    const pre = G.state === 'pre', k = cm.snap ? 1 : pre ? 1 - Math.exp(-dt * 12) : G.state === 'replay' ? 1 - Math.exp(-dt * 6) : 1 - Math.exp(-dt * 4.2);
    cm.snap = false;
    camPos.lerp(v3, k);
    camLook.lerp(v3b, k);
    camera.position.copy(camPos);
    if (s.shake > 0) {
      camera.position.x += (Math.random() - 0.5) * 0.5;
      camera.position.y += (Math.random() - 0.5) * 0.5;
    }
    if (debugCam) {
      camera.position.set(...debugCam.pos);
      camLook.set(...debugCam.look);
    }
    camera.lookAt(camLook);
    /* the near model when the camera is within about 20 yards of what it is looking at; the two limits keep it from flickering */
    camDist = camera.position.distanceTo(camLook);
    const near = s.detail !== false && camDist < (nearModel ? 24 : 20);
    nearModel = near;  // the players' close-up meshes are switched in where the counts are set, next frame
    skyDome.position.copy(camera.position);
    /* Goal posts: never the one the camera sits beside, and during play not the near one when the camera is behind it
       (backed up on your own goal line, its uprights stood between you and your quarterback). */
    const camY = -camera.position.z, inPlay = G.state !== 'menu' && G.state !== 'intro' && G.state !== 'over';
    for (const g of posts) g.visible = Math.abs(camY - g.userData.y) > 14 && !(inPlay && g.userData.y < 0 && camY < g.userData.y);
    const fgTry = !!ps && ps.mode === 'kick' && !!G.op && G.op.n === 'Field Goal' && G.state !== 'scene' && G.state !== 'menu';
    for (const g of posts) for (const [k, fl] of g.userData.flags.entries()) {
      fl.rotation.y = 0.35 * Math.sin(time * 2.3 + k * 1.7) + 0.15 * Math.sin(time * 5.1 + k);  // the wind ribbons stream and flutter
      fl.rotation.x = 0.12 * Math.sin(time * 3.7 + k * 2.1);
    }
    for (const g of posts) g.userData.net.visible = fgTry && (ps.offTeam === 0) === (g.userData.y > 50);
    tee.visible = !!ps && ps.mode === 'ko' && G.state !== 'scene' && G.state !== 'menu' && G.state !== 'over';
    if (tee.visible) tee.position.set(FW / 2, 0.065, -ps.los);
    const behind = camera.position.z > 27;  // the camera has backed up past the near video board: its black back would fill the view
    if (nearBoard[0].visible === behind) for (const m of nearBoard) m.visible = !behind;
    if (rainPts.visible) updateWeather(rainPts, 36, 6);
    if (snowPts.visible) updateWeather(snowPts, 4.2, 1.8);
    renderer.info.reset();
    if (post && s.fx !== false) {
      post.glow.value = glowAmount;
      post.render(scene, camera);
    } else {
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
    }
    lod = false;
  }

  /* ---------- uniform portraits ----------
     A single figure in a team's kit, drawn once into a small off-screen target and handed back as an image URL, for
     the team pickers. It is its own little scene: ordinary meshes on the same skeleton and the same geometry. */
  let studio = null;
  const portraits = new Map();

  const PW = 264, PH = 352;

  function studioOf() {
    if (!studio) {
      const sc = new T.Scene(), f = makeFigure(), cam = new T.PerspectiveCamera(26, PW / PH, 0.5, 60);
      sc.add(new T.HemisphereLight(0xe6eeff, 0x2a3a4a, 2.6));
      const key1 = new T.DirectionalLight(0xffffff, 2.4);
      key1.position.set(-3, 6, 5);
      sc.add(key1);
      sc.add(f.root);
      const meshes = {};
      for (const [name, joints, color,,, opt] of PART_DEFS) {
        meshes[name] = joints.map(j => {
          const m = new T.Mesh(GEO_HI[name] || GEO[name], partMat(name));
          m.userData.color = color;
          if (opt) m.visible = false;  // the studio figure keeps his helmet on
          f[j].add(m);
          return m;
        });
      }
      f.cur.fill(0);
      f.cur[PELY] = HIP;
      f.cur[CHRX] = -0.04;
      f.cur[CHRY] = 0.18;
      f.cur[EL] = 0.35;
      f.cur[ER] = 0.5;
      f.cur[SLZ] = -0.12;
      f.cur[SRZ] = 0.12;
      f.cur[SRX] = 0.25;
      applyPose(f);
      f.root.rotation.y = Math.PI + 0.5;  // three-quarter view, facing the camera
      f.root.scale.setScalar(1);
      cam.position.set(0, 1.05, 5.4);
      cam.lookAt(0, 0.98, 0);
      const rt = new T.WebGLRenderTarget(PW, PH, { samples: 4 });
      rt.texture.colorSpace = T.SRGBColorSpace;
      const floor = new T.Mesh(new T.BoxGeometry(6, 0.02, 1.4).translate(0, -0.01, 0), new T.MeshLambertMaterial({ color: 0x2f6b3a }));
      floor.visible = false;  // only the test strip stands him on turf
      sc.add(floor);
      studio = { sc, f, cam, rt, meshes, floor, buf: new Uint8Array(PW * PH * 4) };
    }
    return studio;
  }

  /* dress the studio figure in a kit */
  function dress(st, team, home, num, look) {
    const c = lookColors(teamColors(team, home, SKIN[(num * 3) % SKIN.length]), look, team);
    for (const name in st.meshes) for (const m of st.meshes[name]) {
      m.material.color.set(c[m.userData.color] || (m.userData.color === 'arm' ? c.skin : '#f1f1f1'));
      if (name === 'playband') m.visible = false;
      if (LOOK_HIDE.has(name)) m.visible = !(look && look.trim === 'none');
      if (name === 'towel') m.visible = !!(look && look.towel && look.towel !== 'kit');
    }
    st.f.num.material = numberMaterial(num, c.number);
  }

  /* draw the studio as it stands into a canvas context at (dx, dy), w wide */
  function shoot(st, x, dx, dy, w) {
    const keepTarget = renderer.getRenderTarget(), keepColor = renderer.getClearColor(col2).getHex(), keepAlpha = renderer.getClearAlpha();
    renderer.setRenderTarget(st.rt);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(st.sc, st.cam);
    const pw = st.pw || PW, ph = st.ph || PH;
    renderer.readRenderTargetPixels(st.rt, 0, 0, pw, ph, st.buf);
    renderer.setRenderTarget(keepTarget);
    renderer.setClearColor(keepColor, keepAlpha);
    const cv = document.createElement('canvas');
    cv.width = pw;
    cv.height = ph;
    const c = cv.getContext('2d'), img = c.createImageData(pw, ph), row = pw * 4;
    for (let y = 0; y < ph; y++) img.data.set(st.buf.subarray((ph - 1 - y) * row, (ph - y) * row), y * row);  // the target is stored bottom row first
    c.putImageData(img, 0, 0);
    x.drawImage(cv, dx, dy, w, w * ph / pw);
  }

  /* w: the picture's width in pixels (the height follows); a big one, for a screen's hero, gets its own target */
  function portrait(team, home, num, look, w) {
    if (!renderer || renderer.getContext().isContextLost()) return null;  // a lost context reads back noise: no picture rather than a wrong one
    w = Math.round(w || PW);
    const key = team.ab + (home ? 'h' : 'a') + num + (look ? JSON.stringify(look) : '') + team.c1 + team.c2 + (w === PW ? '' : '@' + w);
    if (portraits.has(key)) return portraits.get(key);
    const st = studioOf(), cv = document.createElement('canvas'), h = Math.round(w * PH / PW), keep = { rt: st.rt, buf: st.buf };
    dress(st, team, home, num, look);
    if (w !== PW) {
      st.rt = new T.WebGLRenderTarget(w, h, { samples: 4 });
      st.rt.texture.colorSpace = T.SRGBColorSpace;
      st.buf = new Uint8Array(w * h * 4);
      st.pw = w;
      st.ph = h;
    }
    cv.width = w;
    cv.height = h;
    shoot(st, cv.getContext('2d'), 0, 0, w);
    if (w !== PW) {
      st.rt.dispose();
      Object.assign(st, { rt: keep.rt, buf: keep.buf, pw: 0, ph: 0 });
    }
    const url = cv.toDataURL('image/png');
    portraits.set(key, url);
    return url;
  }

  /* test hook: the helmet close up, from the front, three quarters, the side and behind (the near model) */
  function headStrip(team, cell) {
    if (!renderer) return null;
    const st = studioOf(), w = cell || 220, cv = document.createElement('canvas'), x = cv.getContext('2d'), h = new T.Vector3(), keep = { p: st.cam.position.clone(), r: st.f.root.rotation.y };
    dress(st, team || PG.TEAMS[0], true, 12);
    const angles = [Math.PI, Math.PI + 0.75, Math.PI * 1.5, 0];
    cv.width = w * angles.length;
    cv.height = Math.round(w * (st.ph || PH) / (st.pw || PW));
    x.fillStyle = '#0d1524';
    x.fillRect(0, 0, cv.width, cv.height);
    angles.forEach((a, i) => {
      st.f.root.rotation.y = a;
      st.f.root.updateMatrixWorld(true);
      st.f.head.getWorldPosition(h);
      st.cam.position.set(h.x, h.y + 0.05, h.z + 1.45);
      st.cam.lookAt(h.x, h.y - 0.02, h.z);
      shoot(st, x, i * w, 0, w);
    });
    st.cam.position.copy(keep.p);
    st.cam.lookAt(0, 0.98, 0);
    st.f.root.rotation.y = keep.r;
    return cv.toDataURL('image/png');
  }

  /* test hook: the whole figure, large, from in front, three quarters, the side and behind. { far: true } draws the
     gameplay model instead of the close one; { team, home, num, look } dress him. */
  function modelStrip(opts) {
    if (!renderer) return null;
    const o = opts || {}, st = studioOf(), w = o.cell || 420, h = Math.round(w * PH / PW), cv = document.createElement('canvas'), x = cv.getContext('2d'), keep = { r: st.f.root.rotation.y, rt: st.rt, buf: st.buf };
    dress(st, o.team || PG.TEAMS[0], o.home !== false, o.num || 12, o.look);
    for (const name in st.meshes) for (const m of st.meshes[name]) m.geometry = (o.far ? GEO[name] : GEO_HI[name] || GEO[name]);
    st.rt = new T.WebGLRenderTarget(w, h, { samples: 4 });
    st.rt.texture.colorSpace = T.SRGBColorSpace;
    st.buf = new Uint8Array(w * h * 4);
    st.pw = w;
    st.ph = h;
    const angles = [Math.PI, Math.PI + 0.75, Math.PI * 1.5, 0];
    cv.width = w * angles.length;
    cv.height = h;
    x.fillStyle = '#0d1524';
    x.fillRect(0, 0, cv.width, cv.height);
    angles.forEach((a, i) => {
      st.f.root.rotation.y = a;
      shoot(st, x, i * w, 0, w);
    });
    st.rt.dispose();
    Object.assign(st, { rt: keep.rt, buf: keep.buf, pw: 0, ph: 0 });
    st.f.root.rotation.y = keep.r;
    for (const name in st.meshes) for (const m of st.meshes[name]) m.geometry = GEO_HI[name] || GEO[name];
    return cv.toDataURL('image/png');
  }

  /* test hook: the quarterback through the throw (TK), one view a moment from x0 to x1 (0 to 3), seen from angle a
     (0: from in front, pi/2: from his left) */
  function throwStrip(x0, x1, n, a, cell) {
    if (!renderer) return null;
    const st = studioOf(), w = cell || 220, cv = document.createElement('canvas'), x = cv.getContext('2d'), keep = st.f.root.rotation.y;
    dress(st, PG.TEAMS[0], true, 12, null);
    cv.width = w * n;
    cv.height = Math.round(w * PH / PW);
    x.fillStyle = '#0d1524';
    x.fillRect(0, 0, cv.width, cv.height);
    st.f.root.rotation.y = a || 0;
    for (let k = 0; k < n; k++) {
      const c = st.f.cur, rp = st.f.root.position, px = rp.x, pz = rp.z;
      c.fill(0);
      const psi = throwBody(st.f, c, x0 + (x1 - x0) * k / Math.max(1, n - 1), true), ang = a || 0, off = TH_OFF * st.f.root.scale.y;
      c[HEADRY] = clamp(psi - c[CHRY], -1.3, 1.3);
      applyPose(st.f);
      st.f.root.rotation.y = ang - psi;
      rp.x = px - Math.sin(ang) * off;
      rp.z = pz - Math.cos(ang) * off;
      shoot(st, x, k * w, 0, w);
      rp.x = px;
      rp.z = pz;
    }
    st.f.root.rotation.y = keep;
    return cv.toDataURL('image/png');
  }

  /* ---------- test hooks for the stride ----------
     Nobody can watch the game move from a test, so the run is checked two ways: gait() measures the feet of a figure
     running at a steady speed, and strip() draws that run as a row of side views, one stride from left to right. */
  const runner = (speed, how) => {
    /* a player and a play that take poseFor down the "on the move" branch: running forward, or covering (facing a
       quarterback far behind him, or far to one side) so that the same speed is a backpedal or a shuffle */
    const p = { x: 26, y: 30, vx: 0, vy: speed, role: 'WR', team: how ? 1 : 0, asg: 'zone' }, far = { back: [26, -4000], side: [-4000, 30], diag: [-4000, 4030], backdiag: [-4000, -3970] }[how];
    const ps = { carrier: null, air: null, mode: 'pass', offTeam: 0, runner: null, los: 20, qb: far ? { x: far[0], y: far[1] } : null };
    return { p, s: { ps, G: { state: 'live' }, pre: false, live: true, dir: 1, celeb: null } };
  };
  let testFig = null;
  const FACING = { back: Math.PI, side: Math.PI / 2, diag: Math.PI / 4, backdiag: Math.PI * 0.75 };  // the heading each of those settles at

  function gaitTest(speed, opts) {
    const o = opts || {}, f = testFig || (testFig = makeFigure()), dt = 1 / (o.fps || 120), { p, s } = runner(speed, o.how), v = new T.Vector3(), cm = 91.44;
    setBuild(f, BUILD[o.build || 'slim']);
    f.snap = true;
    f.ph = 0;
    f.heading = FACING[o.how] || 0;
    f.gaitT = 0;
    const feet = [{ j: f.ankL, down: 0, n: 0, slips: [], at: null, hat: null, knee: 0 }, { j: f.ankR, down: 0, n: 0, slips: [], at: null, hat: null, knee: 0 }];
    let low = 9, high = 0, hipLo = 9, hipHi = 0;
    for (let t = 0; t < (o.seconds || 3); t += dt) {
      p.y += p.vy * dt;
      if (o.who === 'ref') poseRef(f, p, null, p.x, p.y + 30, dt);  // an official jogging up the field
      else if (o.who === 'crew') {
        poseCrew(f, speed, dt);
        f.root.position.set(p.x, 0, -p.y);
        f.root.rotation.y = f.heading;
      } else poseFor(f, p, s, dt);
      f.root.updateMatrixWorld(true);
      if (t < 0.7) continue;  // let the pose settle first
      hipLo = Math.min(hipLo, f.cur[PELY]);
      hipHi = Math.max(hipHi, f.cur[PELY]);
      feet.forEach((ft, k) => {
        const toe = ft.j.localToWorld(v.set(0, -SOLE, -TOE)), by = toe.y, bz = -toe.z, bx = toe.x;  // the toe,
        const heel = ft.j.localToWorld(v.set(0, -SOLE, HEELB)), hy = heel.y, hz = -heel.z, hx = heel.x, lowest = Math.min(by, hy);  // and the heel
        low = Math.min(low, lowest);
        high = Math.max(high, by);
        ft.n++;
        if (lowest < 0.006) {
          ft.down++;
          ft.knee = Math.max(ft.knee, -f.cur[k ? KR : KL]);
        }
        /* each end of the shoe is followed while it is itself within half a centimetre of the turf (a walker lands on
           the heel with the toe in the air, and leaves from the toe with the heel up): how far it moved while down */
        for (const [key, py, pz, px] of [['at', by, bz, bx], ['hat', hy, hz, hx]]) {
          if (py < 0.006) {
            const a = ft[key] || (ft[key] = [pz, pz, px, px]);
            a[0] = Math.min(a[0], pz);
            a[1] = Math.max(a[1], pz);
            a[2] = Math.min(a[2], px);
            a[3] = Math.max(a[3], px);
          } else if (ft[key]) {
            ft.slips.push(Math.hypot(ft[key][1] - ft[key][0], ft[key][3] - ft[key][2]));
            ft[key] = null;
          }
        }
      });
    }
    const slips = feet[0].slips.concat(feet[1].slips), r1 = x => Math.round(x * 10) / 10;
    return { speed, steps: slips.length, slideCm: r1(Math.max(0, ...slips) * cm), slideAvgCm: r1(slips.reduce((a, b) => a + b, 0) / Math.max(1, slips.length) * cm), sinksCm: r1(Math.max(0, -low) * cm), liftCm: r1(high * cm),
      onGround: Math.round(feet[0].down / feet[0].n * 100) + '%', kneeDeg: Math.round(Math.max(feet[0].knee, feet[1].knee) * 180 / Math.PI), hips: [r1(hipLo * 100) / 100, r1(hipHi * 100) / 100] };
  }

  function strip(speed, frames, opts) {
    if (!renderer) return null;
    const o = opts || {}, n = frames || 8, st = studioOf(), f = st.f, { p, s } = runner(speed, o.how), cell = o.cell || 150, cv = document.createElement('canvas'), dt = 1 / 240;
    const keep = { cur: f.cur.slice(), rot: f.root.rotation.y, pos: f.root.position.clone() };
    cv.width = cell * n;
    cv.height = Math.round(cell * PH / PW);
    const x = cv.getContext('2d');
    x.fillStyle = '#0d1524';
    x.fillRect(0, 0, cv.width, cv.height);
    dress(st, (PG.TEAMS || [{ c1: '#c0392b', c2: '#f1f1f1' }])[o.team || 0], true, 12);
    st.floor.visible = true;
    f.snap = true;
    f.ph = 0;
    f.heading = FACING[o.how] || 0;
    f.gaitT = 0;
    const lat = o.how === 'side' ? 1 : /diag/.test(o.how || '') ? 0.7 : 0, T2 = speed > 0.01 ? 2 * lerp(stepOf(speed), sideStepOf(speed), lat) / speed : 1, steps = Math.round(T2 / n / dt);  // one cycle of two steps
    const sim = k => {
      for (let i = 0; i < k; i++) {
        f.root.scale.setScalar(PSCALE);  // the stride is worked out at the size he has on the field
        p.y += p.vy * dt;
        poseFor(f, p, s, dt);
      }
    };
    sim(Math.round(0.8 / dt));
    for (let i = 0; i < n; i++) {
      sim(steps);
      f.root.scale.setScalar(1);
      f.root.position.set(0, 0, 0);
      f.root.rotation.y = o.view === 'front' ? Math.PI : o.view === 'back' ? 0 : o.how === 'back' ? Math.PI / 2 : -Math.PI / 2;  // from the side, running left to right; or from in front
      shoot(st, x, i * cell, 0, cell);
    }
    st.floor.visible = false;
    f.cur.set(keep.cur);
    applyPose(f);
    f.root.scale.setScalar(1);
    f.root.rotation.y = keep.rot;
    f.root.position.copy(keep.pos);
    return cv.toDataURL('image/png');
  }

  /* ---------- test hooks for the tackle ----------
     A staged tackle: a runner going up the field at six yards a second is met by a tackler coming from `angle`
     (0 head on, 1.57 from the runner's right, 3.14 from behind), and from the hit on the two are moved exactly as
     the engine moves them. tackleTest() measures where they end up; tackleStrip() draws the fall as a row of frames. */
  /* gang: more defenders who are on the play when he goes down ([{ f: a figure, angle: where he comes from }]): they
     arrive a yard and a half from the runner as he is hit, and join the tackle (the pile) */
  function tackleRun(angle, fa, fb, until, each, gang) {
    const ux = Math.sin(angle), uy = Math.cos(angle), so = Math.abs(angle) > 2 ? 8 : 5, dt = 1 / 120;
    const c = { x: 26, y: 30, vx: 0, vy: 6, role: 'RB', team: 0 }, o = { x: 26, y: 30, vx: -ux * so, vy: -uy * so, role: 'MLB', team: 1, asg: 'rush' };
    const more = (gang || []).map((g, k) => ({ f: g.f, ux: Math.sin(g.angle), uy: Math.cos(g.angle), p: { x: 26, y: 30, vx: -Math.sin(g.angle) * 7, vy: -Math.cos(g.angle) * 7, role: k ? 'SS' : 'OLB1', team: 1, asg: 'rush' } }));
    const ps = { carrier: c, air: null, mode: 'run', offTeam: 0, runner: c, los: 10, qb: null, tackler: null, after: 0, handoff: true, t: 3, recs: [] };
    const s = { ps, G: { state: 'live' }, pre: false, live: true, dir: 1, celeb: null, charge: -1, P: [c, o, ...more.map(m => m.p)], figOf: q => (q === c ? fa : q === o ? fb : (more.find(m => m.p === q) || {}).f) };
    for (const m of more) {
      m.f.snap = true;
      m.f.fall = 0;
      m.f.gaitT = 0;
      m.f.ph = 0;
      m.f.heading = Math.atan2(-m.p.vx, m.p.vy);
    }
    for (const f of [fa, fb]) {
      f.snap = true;
      f.fall = 0;
      f.gaitT = 0;
      f.ph = 0;
    }
    fa.heading = 0;
    fb.heading = Math.atan2(-o.vx, o.vy);
    for (let t = -0.6; t <= until; t += dt) {
      if (t < 0) {
        c.y = 30 + c.vy * t;
        o.x = 26 + ux + o.vx * t;
        o.y = 30 + uy + o.vy * t;
        for (const m of more) {
          m.p.x = 26 + m.ux * 1.5 + m.p.vx * t;
          m.p.y = 30 + m.uy * 1.5 + m.p.vy * t;
        }
      } else {
        if (!c.down) {
          for (const m of more) m.p.vx = m.p.vy = 0;  // the whistle: the engine stops everyone where he is
          c.slx = o.slx = o.vx * 0.45 + c.vx * 0.3;
          c.sly = o.sly = o.vy * 0.45 + c.vy * 0.3;
          c.sl = o.sl = 0.32;
          c.down = true;
          o.fell = 1;
          o.vx = o.vy = 0;
          ps.tackler = o;
          s.G.state = 'dead';
          s.live = false;
        }
        for (const q of [c, o]) if (q.sl > 0) {
          q.sl -= dt;
          q.x += q.slx * dt;
          q.y += q.sly * dt;
          q.slx *= Math.pow(0.02, dt);
          q.sly *= Math.pow(0.02, dt);
        }
        ps.after += dt;
      }
      poseFor(fa, c, s, dt);
      fa.root.updateMatrixWorld(true);  // as the game does when it writes a figure out: the next man is posed against where this one really is
      poseFor(fb, o, s, dt);
      fb.root.updateMatrixWorld(true);
      for (const m of more) {
        poseFor(m.f, m.p, s, dt);
        m.f.root.updateMatrixWorld(true);
      }
      if (each) each(t, c, o, s);
    }
    fa.root.updateMatrixWorld(true);
    fb.root.updateMatrixWorld(true);
    return { c, o };
  }

  /* the shortest distance between two segments, each given by its two ends */
  function segDist(p1, q1, p2, q2) {
    const d1 = q1.clone().sub(p1), d2 = q2.clone().sub(p2), r = p1.clone().sub(p2), a = d1.dot(d1), e = d2.dot(d2), f = d2.dot(r), b = d1.dot(d2), c = d1.dot(r), den = a * e - b * b;
    let u = den > 1e-9 ? clamp((b * f - c * e) / den, 0, 1) : 0, w = e > 1e-9 ? (b * u + f) / e : 0;
    if (w < 0) {
      w = 0;
      u = a > 1e-9 ? clamp(-c / a, 0, 1) : 0;
    } else if (w > 1) {
      w = 1;
      u = a > 1e-9 ? clamp((b - c) / a, 0, 1) : 0;
    }
    return d1.multiplyScalar(u).add(p1).distanceTo(d2.multiplyScalar(w).add(p2));
  }

  let testFig2 = null;

  function tackleTest(angle, opts) {
    const o = opts || {}, fa = testFig || (testFig = makeFigure()), fb = testFig2 || (testFig2 = makeFigure()), cm = 91.44, r1 = x => Math.round(x * cm * 10) / 10;
    setBuild(fa, BUILD.back);
    setBuild(fb, BUILD.big);
    tackleRun(angle || 0, fa, fb, o.at === undefined ? 0.5 : o.at);
    const at = (j, x, y, z) => j.localToWorld(new T.Vector3(x, y, z)), sc = fa.root.scale.y;
    /* the runner's centre lines: trunk, thighs, shins */
    const run = [[at(fa.pelvis, 0, 0, 0), at(fa.chest, 0, 0.5, 0), 0.18], [at(fa.hipL, 0, 0, 0), at(fa.kneeL, 0, 0, 0), 0.1], [at(fa.hipR, 0, 0, 0), at(fa.kneeR, 0, 0, 0), 0.1],
      [at(fa.kneeL, 0, 0, 0), at(fa.ankL, 0, 0, 0), 0.07], [at(fa.kneeR, 0, 0, 0), at(fa.ankR, 0, 0, 0), 0.07]];
    const hands = [at(fb.elL, 0, -0.3, 0), at(fb.elR, 0, -0.3, 0)].map(h => Math.min(...run.map(([a, b, rad]) => segDist(h, h, a, b) - rad * sc)));  // from the hand to the runner's surface
    const trunk = [at(fb.pelvis, 0, 0, 0), at(fb.chest, 0, 0.5, 0)];
    const through = Math.max(...run.map(([a, b, rad]) => (rad + 0.17) * sc - segDist(trunk[0], trunk[1], a, b)));  // how far the tackler's trunk is inside the runner
    const low = f => Math.min(at(f.head, 0, 0, 0).y - 0.17 * sc, at(f.elL, 0, -0.3, 0).y - 0.06 * sc, at(f.elR, 0, -0.3, 0).y - 0.06 * sc, at(f.elL, 0, 0, 0).y - 0.06 * sc, at(f.elR, 0, 0, 0).y - 0.06 * sc,
      at(f.shL, 0, 0, 0).y - 0.1 * sc, at(f.shR, 0, 0, 0).y - 0.1 * sc, at(f.kneeL, 0, 0, 0).y - 0.09 * sc, at(f.kneeR, 0, 0, 0).y - 0.09 * sc, at(f.ankL, 0, 0, 0).y - 0.06 * sc, at(f.ankR, 0, 0, 0).y - 0.06 * sc,
      at(f.pelvis, 0, 0, 0).y - 0.16 * sc, at(f.chest, 0, 0.4, 0).y - 0.18 * sc);
    return { handsToRunnerCm: hands.map(r1), trunkInsideRunnerCm: r1(Math.max(0, through)), underTurfCm: { runner: r1(Math.max(0, -low(fa))), tackler: r1(Math.max(0, -low(fb))) },
      apartCm: r1(Math.hypot(fa.root.position.x - fb.root.position.x, fa.root.position.z - fb.root.position.z)) };
  }

  /* a figure with real meshes on its joints, for the test arena (the game itself draws instanced parts) */
  function meshed(sc) {
    const f = makeFigure(), meshes = {};
    sc.add(f.root);
    for (const [name, joints, color] of PART_DEFS) {
      meshes[name] = joints.map(j => {
        const m = new T.Mesh(GEO_HI[name] || GEO[name], partMat(name));
        m.userData.color = color;
        f[j].add(m);
        return m;
      });
    }
    return { f, meshes };
  }

  let arena = null;

  function arenaOf() {
    if (!arena) {
      const sc = new T.Scene(), pw = 400, ph = 300, cam = new T.PerspectiveCamera(24, pw / ph, 0.5, 80), key1 = new T.DirectionalLight(0xffffff, 2.4);
      sc.add(new T.HemisphereLight(0xe6eeff, 0x2a3a4a, 2.6));
      key1.position.set(-3, 6, 5);
      sc.add(key1);
      const floor = new T.Mesh(new T.BoxGeometry(40, 0.02, 40).translate(0, -0.01, 0), new T.MeshLambertMaterial({ color: 0x2f6b3a }));
      sc.add(floor);
      const rt = new T.WebGLRenderTarget(pw, ph, { samples: 4 });
      rt.texture.colorSpace = T.SRGBColorSpace;
      arena = { sc, cam, rt, floor, pw, ph, buf: new Uint8Array(pw * ph * 4), a: meshed(sc), b: meshed(sc) };
    }
    return arena;
  }

  function tackleStrip(angle, opts) {
    if (!renderer) return null;
    const o = opts || {}, ar = arenaOf(), times = o.times || [-0.06, 0.05, 0.12, 0.2, 0.3, 0.5, 0.95, 1.5], cell = o.cell || 300, cv = document.createElement('canvas'), teams = PG.TEAMS || [{ c1: '#c0392b', c2: '#f1f1f1' }];
    cv.width = cell * times.length;
    cv.height = Math.round(cell * ar.ph / ar.pw);
    const x = cv.getContext('2d');
    x.fillStyle = '#0d1524';
    x.fillRect(0, 0, cv.width, cv.height);
    dress(ar.a, teams[0], true, 28);
    dress(ar.b, teams[1] || teams[0], false, 52);
    /* gang: [angle, angle] puts one or two more defenders on the play (see tackleRun) */
    const gang = (o.gang || []).slice(0, 2).map((angle2, k) => {
      const m = ar[k ? 'd' : 'c'] || (ar[k ? 'd' : 'c'] = meshed(ar.sc));
      dress(m, teams[1] || teams[0], false, k ? 31 : 56);
      setBuild(m.f, k ? BUILD.db : BUILD.big);
      return { f: m.f, angle: angle2 };
    });
    for (const k of ['c', 'd']) if (ar[k]) ar[k].f.root.visible = gang.some(g => g.f === ar[k].f);
    times.forEach((t, i) => {
      tackleRun(angle || 0, ar.a.f, ar.b.f, t, null, gang);
      const mx = (ar.a.f.root.position.x + ar.b.f.root.position.x) / 2, mz = (ar.a.f.root.position.z + ar.b.f.root.position.z) / 2;
      ar.floor.position.set(mx, 0, mz);
      if (o.view === 'top') ar.cam.position.set(mx + 0.01, 13, mz + 3.5);
      else if (o.view === 'front') ar.cam.position.set(mx + 4, 2.4, mz - 11);  // from up the field, looking back at the runner
      else ar.cam.position.set(mx + 12, 2.2, mz + 0.01);  // from the side: the runner goes right to left
      ar.cam.lookAt(mx, 1, mz);
      shoot(ar, x, i * cell, 0, cell);
    });
    return cv.toDataURL('image/png');
  }

  /* ---------- test hooks for the catch ----------
     A receiver running up the field at seven yards a second with a pass coming down to him: 'leap', a defender a step
     behind him at the catch point; 'stretch', the ball a yard and a half wide of his line and nobody near. catchTest()
     measures the jump and the reach at the moment of the catch; catchStrip() draws it from the side, frame by frame. */
  function catchRun(kind, fa, fb, until) {
    const dt = 1 / 120, FL = 1.1, wide = kind === 'stretch', v = new T.Vector3();  // FL: the ball's time in the air
    const rec = { x: 26, y: 30, vx: 0, vy: 7, role: 'WR', team: 0, rn: 'go' }, def = { x: 26.7, y: 29.2, vx: 0, vy: 7, role: 'CB1', team: 1, asg: 'man' };
    const land = { x: 26 + (wide ? 1.6 : 0), y: 40 + (wide ? 0.5 : 0) }, from = { x: 26, y: 18 };
    const ps = { carrier: null, air: null, mode: 'pass', offTeam: 0, runner: null, los: 20, qb: from, recs: [rec], thrown: true, t: 2, tackler: null };
    const s = { ps, P: wide ? [rec] : [rec, def], G: { state: 'live' }, pre: false, live: true, dir: 1, celeb: null, charge: -1 };
    for (const f of [fa, fb]) {
      f.snap = true;
      f.fall = 0;
      f.gaitT = 0;
      f.ph = 0;
      f.leap = 0;
      f.heading = 0;
    }
    const m = { hipRise: 0, footClear: 0, arms: 0, lean: 0 };
    for (let t = -FL; t <= until + 1e-9; t += dt) {
      rec.y = 40 + 7 * t;
      def.y = rec.y - 0.8;
      if (t < 0) {
        const u = (t + FL) / FL;
        ps.air = { x0: from.x, y0: from.y, x1: land.x, y1: land.y, t: t + FL, T: FL, h: 5, target: rec, x: lerp(from.x, land.x, u), y: lerp(from.y, land.y, u), z: 1.8 + 5 * 4 * u * (1 - u) * 0.6 };
      } else {
        ps.air = null;
        ps.carrier = rec;
        ps.caught = true;
      }
      poseFor(fa, rec, s, dt);
      if (!wide) poseFor(fb, def, s, dt);
      if (Math.abs(t) < dt / 2 || (t > -dt && t <= 0)) {
        // the moment of the catch
        fa.root.updateMatrixWorld(true);
        m.hipRise = fa.cur[PELY] - HIP;
        m.footClear = Math.min(fa.ankL.localToWorld(v.set(0, -SOLE, 0.06)).y, fa.ankR.localToWorld(v.set(0, -SOLE, 0.06)).y);
        m.arms = (fa.cur[SLX] + fa.cur[SRX]) / 2;
        m.lean = fa.cur[CHRX] + fa.cur[PELRX];
      }
    }
    fb.root.visible = !wide;
    return m;
  }

  function catchTest(kind) {
    const ar = arenaOf(), m = catchRun(kind || 'leap', ar.a.f, ar.b.f, 0.6), r = x => Math.round(x * 100) / 100;
    ar.b.f.root.visible = true;
    const settled = ar.a.f.cur[PELY] - HIP, ok = Object.values(ar.a.f.cur).every(Number.isFinite);
    return { kind: kind || 'leap', hipRiseAtCatch: r(m.hipRise), lowestFootAtCatchCm: Math.round(m.footClear * 91.44), armsDeg: Math.round(m.arms * 57.3), leanDeg: Math.round(m.lean * 57.3), hipAfterLanding: r(settled), finite: ok };
  }

  function catchStrip(kind, opts) {
    if (!renderer) return null;
    const o = opts || {}, ar = arenaOf(), times = o.times || [-0.36, -0.24, -0.12, -0.04, 0, 0.12, 0.24, 0.4], cell = o.cell || 260, cv = document.createElement('canvas'), teams = PG.TEAMS || [{ c1: '#c0392b', c2: '#f1f1f1' }];
    cv.width = cell * times.length;
    cv.height = Math.round(cell * ar.ph / ar.pw);
    const x = cv.getContext('2d');
    x.fillStyle = '#0d1524';
    x.fillRect(0, 0, cv.width, cv.height);
    dress(ar.a, teams[0], true, 81);
    dress(ar.b, teams[1] || teams[0], false, 24);
    times.forEach((t, i) => {
      catchRun(kind || 'leap', ar.a.f, ar.b.f, t);
      const mx = ar.a.f.root.position.x, mz = ar.a.f.root.position.z;
      ar.floor.position.set(mx, 0, mz);
      ar.cam.position.set(mx + 12, 2.4, mz + 0.01);  // from the side: he runs right to left
      ar.cam.lookAt(mx, 1.4, mz);
      shoot(ar, x, i * cell, 0, cell);
    });
    ar.b.f.root.visible = true;
    return cv.toDataURL('image/png');
  }

  /* ---------- test hooks for eyes, blocks and the men beside a tackle ----------
     eyesTest(): a defender running up the field with the ball carrier at each of a set of angles round him; how far
     the helmet ends up from pointing at the carrier. blockTest(): a guard and a tackle locked up at a given distance;
     how far each hand is from the other man's trunk (0 is on him, less is in him). besideTest(): a staged tackle
     with another defender a yard or two off at an angle; whether he ends up standing in the two men on the ground. */
  const helmetYaw = f => {
    f.root.updateMatrixWorld(true);
    const a = f.head.localToWorld(new T.Vector3(0, 0, 0)), b = f.head.localToWorld(new T.Vector3(0, 0, -1));
    return Math.atan2(-(b.x - a.x), -(b.z - a.z));  // as a heading: 0 up the field
  };

  function eyesTest(opts) {
    const o = opts || {}, f = testFig || (testFig = makeFigure()), out = {};
    setBuild(f, BUILD.db);
    for (const deg of o.angles || [0, 30, 60, 90, 120, 150, 180, -45, -100]) {
      const an = deg * Math.PI / 180, c = { x: 26 - Math.sin(an) * 12, y: 30 + Math.cos(an) * 12, vx: 0, vy: 0, team: 0 };
      const p = { x: 26, y: 30, vx: 0, vy: o.speed === undefined ? 5 : o.speed, role: 'MLB', team: 1, asg: 'rush' };
      const ps = { carrier: c, air: null, mode: 'run', offTeam: 0, runner: c, los: 20, qb: null, t: 3, recs: [] };
      if (o.ball) {
        ps.carrier = null;
        ps.air = { x: c.x, y: c.y, z: o.ball, kick: true, t: 1, T: 3 };
      }
      const s = { ps, G: { state: 'live' }, pre: false, live: true, dir: 1, celeb: null, charge: -1 };
      f.snap = true;
      f.heading = 0;
      f.look = f.tip = 0;
      for (let i = 0; i < 120; i++) poseFor(f, p, s, 1 / 120);
      let off = helmetYaw(f) - an;
      off = Math.atan2(Math.sin(off), Math.cos(off));
      out[deg] = { helmetOffDeg: Math.round(off * 1800 / Math.PI) / 10, neckDeg: Math.round(f.cur[HEADRY] * 1800 / Math.PI) / 10, tipDeg: Math.round(f.tip * 1800 / Math.PI) / 10 };
    }
    return out;
  }

  let testFig3 = null;
  const handGaps = (f, of) => {
    /* each hand's distance from the other man's trunk, in centimetres: the palm's centre from the surface */
    f.root.updateMatrixWorld(true);
    of.root.updateMatrixWorld(true);
    const a = of.pelvis.localToWorld(new T.Vector3(0, 0, 0)), b = of.chest.localToWorld(new T.Vector3(0, 0.62, 0)), osc = of.root.scale.y;
    return [f.elL, f.elR].map(el => {
      const h = el.localToWorld(new T.Vector3(0, -0.3, 0));
      return Math.round((segDist(h, h, a, b) - 0.18 * of.bodyS.z * osc) * 91.44 * 10) / 10;
    });
  };

  function blockRun(dist, fa, fb, secs, turn) {
    const b = { x: 26, y: 30, vx: 0, vy: 0, role: 'LG', team: 0 }, d = { x: 26 + Math.sin(turn || 0) * dist, y: 30 + Math.cos(turn || 0) * dist, vx: 0, vy: 0, role: 'DT1', team: 1, asg: 'rush' };
    b.block = d;
    d.eng = b;
    const ps = { carrier: null, air: null, mode: 'pass', offTeam: 0, runner: null, los: 30, qb: null, t: 2, recs: [] };
    const s = { ps, G: { state: 'live' }, pre: false, live: true, dir: 1, celeb: null, charge: -1, figOf: q => (q === b ? fa : fb) };
    setBuild(fa, buildOf(b.role));
    setBuild(fb, buildOf(d.role));
    for (const f of [fa, fb]) {
      f.snap = true;
      f.fall = f.sx = f.sy = 0;
    }
    fa.heading = turn || 0;
    fb.heading = (turn || 0) + Math.PI;
    for (let t = 0; t < secs; t += 1 / 120) {
      poseFor(fa, b, s, 1 / 120);
      fa.root.updateMatrixWorld(true);
      poseFor(fb, d, s, 1 / 120);
      fb.root.updateMatrixWorld(true);
    }
  }

  function blockTest(dist, opts) {
    const o = opts || {}, fa = testFig || (testFig = makeFigure()), fb = testFig2 || (testFig2 = makeFigure());
    blockRun(dist === undefined ? 1 : dist, fa, fb, o.secs || 0.6, o.turn);
    const at = (j, y) => j.localToWorld(new T.Vector3(0, y, 0)), cm = v => Math.round(v * 91.44 * 10) / 10;
    return { blockerHandsCm: handGaps(fa, fb), defenderHandsCm: handGaps(fb, fa), elbowsDeg: [fa.cur[EL], fa.cur[ER], fb.cur[EL], fb.cur[ER]].map(v => Math.round(v * 180 / Math.PI)),
      drawnApartCm: cm(Math.hypot(fa.root.position.x - fb.root.position.x, fa.root.position.z - fb.root.position.z)),
      chestsApartCm: cm(segDist(at(fa.pelvis, 0), at(fa.chest, 0.5), at(fb.pelvis, 0), at(fb.chest, 0.5)) - 0.18 * (fa.bodyS.z * fa.root.scale.y + fb.bodyS.z * fb.root.scale.y)),
      helmetsApartCm: cm(at(fa.head, 0.1).distanceTo(at(fb.head, 0.1)) - 0.17 * (fa.root.scale.y + fb.root.scale.y)) };
  }

  /* the staged tackle of tackleRun() with a third man: a defender `off` yards from the runner at `angle2` when he goes
     down, who coasts to a stop the way the engine has everyone do after the whistle */
  function thirdRun(angle, angle2, fa, fb, fc, until, off) {
    const sx = Math.sin(angle2), sy = Math.cos(angle2);
    let o2 = null, world = null;
    tackleRun(angle, fa, fb, until, (t, c, o, s) => {
      if (!o2) {
        o2 = { x: 0, y: 0, vx: -sx * 4, vy: -sy * 4, role: 'OLB1', team: 1, asg: 'rush' };
        fc.snap = true;
        fc.fall = fc.sx = fc.sy = 0;
        fc.heading = Math.atan2(-o2.vx, o2.vy);
        setBuild(fc, BUILD.big);
        world = { ps: s.ps, G: s.G, pre: false, live: true, dir: 1, celeb: null, charge: -1, P: [c, o, o2], figOf: q => (q === c ? fa : q === o ? fb : fc) };
      }
      if (t < 0) {
        o2.x = 26 + sx * (off || 1.7) + o2.vx * t;
        o2.y = 30 + sy * (off || 1.7) + o2.vy * t;
      } else {
        const k = Math.pow(0.03, 1 / 120);
        o2.x += o2.vx / 120;
        o2.y += o2.vy / 120;
        o2.vx *= k;
        o2.vy *= k;
      }
      world.live = s.live;
      poseFor(fc, o2, world, 1 / 120);
      fc.root.updateMatrixWorld(true);
    });
    return o2;
  }

  /* where a man who was beside the tackle ends up: how far any part of his trunk or legs is inside the runner or the
     tackler (trunks, legs, necks and helmets), and how far from the engine's spot he had to be drawn */
  function besideTest(angle, angle2, opts) {
    const o = opts || {}, fa = testFig || (testFig = makeFigure()), fb = testFig2 || (testFig2 = makeFigure()), fc = testFig3 || (testFig3 = makeFigure()), r1 = x => Math.round(x * 91.44 * 10) / 10;
    setBuild(fa, BUILD.back);
    setBuild(fb, BUILD.big);
    settle.debug = true;
    thirdRun(angle || 0, angle2 === undefined ? 1.8 : angle2, fa, fb, fc, o.at === undefined ? 0.9 : o.at, o.off);
    settle.debug = false;
    const at = (j, x, y, z) => j.localToWorld(new T.Vector3(x, y, z)), sc = fc.root.scale.y;
    for (const f of [fa, fb, fc]) f.root.updateMatrixWorld(true);
    const lines = f => [[at(f.pelvis, 0, 0, 0), at(f.chest, 0, 0.5, 0), 0.18], [at(f.hipL, 0, 0, 0), at(f.kneeL, 0, 0, 0), 0.1], [at(f.hipR, 0, 0, 0), at(f.kneeR, 0, 0, 0), 0.1], [at(f.kneeL, 0, 0, 0), at(f.ankL, 0, 0, 0), 0.07],
      [at(f.kneeR, 0, 0, 0), at(f.ankR, 0, 0, 0), 0.07], [at(f.chest, 0, 0.6, 0), at(f.head, 0, 0.12, 0), 0.15]];  // trunk, thighs, shins, and the neck and helmet
    const mine = lines(fc), inside = set => Math.max(0, ...mine.map(([a, b, r]) => Math.max(...set.map(([c, d, r2]) => (r + r2) * sc - segDist(a, b, c, d)))));
    const NAMES = ['trunk', 'left thigh', 'right thigh', 'left shin', 'right shin', 'helmet'], worst = set => {
      let w = 0, at2 = '';
      mine.forEach(([a, b, r], i) => set.forEach(([c, d, r2], j) => {
        const v = (r + r2) * sc - segDist(a, b, c, d);
        if (v > w) {
          w = v;
          at2 = NAMES[i] + ' in his ' + NAMES[j];
        }
      }));
      return at2;
    };
    const low = Math.min(...[fc.head, fc.pelvis, fc.kneeL, fc.kneeR, fc.elL, fc.elR].map(j => at(j, 0, 0, 0).y - 0.08 * sc));
    const yd = v => Math.round(v * 91.44);
    const geo = { myPelvis: yd(at(fc.pelvis, 0, 0, 0).y), myChest: yd(at(fc.chest, 0, 0.5, 0).y), hisChest: yd(at(fb.chest, 0, 0.5, 0).y), hisHead: yd(at(fb.head, 0, 0.12, 0).y), runnerChest: yd(at(fa.chest, 0, 0.5, 0).y),
      trunkToHelmetCm: yd(segDist(at(fc.pelvis, 0, 0, 0), at(fc.chest, 0, 0.5, 0), at(fb.chest, 0, 0.5, 0), at(fb.head, 0, 0.12, 0))), drawnAt: [+fc.root.position.x.toFixed(2), +(-fc.root.position.z).toFixed(2)],
      tacklerAt: [+fb.root.position.x.toFixed(2), +(-fb.root.position.z).toFixed(2)], runnerAt: [+fa.root.position.x.toFixed(2), +(-fa.root.position.z).toFixed(2)] };
    geo.solver = settle.dbg;
    geo.runner = { side: fa.fallSide, dir: fa.fallDir, pely: +fa.cur[PELY].toFixed(2), pelrz: +fa.cur[PELRZ].toFixed(2), lowest: [['head', fa.head], ['elbowL', fa.elL], ['elbowR', fa.elR], ['handL', fa.elL, -0.3], ['handR', fa.elR, -0.3], ['kneeL', fa.kneeL], ['kneeR', fa.kneeR], ['shL', fa.shL], ['shR', fa.shR]].map(([n, j, y]) => [n, yd(at(j, 0, y || 0, 0).y)]).sort((a, b) => a[1] - b[1]).slice(0, 4).map(x => x.join(' ')).join(', ') };
    return { geo, worstInTackler: worst(lines(fb)), worstInRunner: worst(lines(fa)), pose: { pely: +fc.cur[PELY].toFixed(2), pelrx: +fc.cur[PELRX].toFixed(2), fall: +fc.fall.toFixed(2), scale: +sc.toFixed(2), off: [+fc.ox.toFixed(2), +fc.oy.toFixed(2)], y: +fc.root.position.y.toFixed(2) }, piled: fc.fall > 0, insideRunnerCm: r1(inside(lines(fa))), insideTacklerCm: r1(inside(lines(fb))), movedCm: r1(Math.hypot(fc.sx, fc.sy)), hipsCm: r1(at(fc.pelvis, 0, 0, 0).y), underTurfCm: r1(Math.max(0, -low)) };
  }

  /* every pairing of a tackler from four sides and a bystander from twelve, at three distances: the worst of each number */
  function besideSweep(opts) {
    const worst = { insideRunnerCm: 0, insideTacklerCm: 0, movedCm: 0, underTurfCm: 0 };
    let n = 0, moved = 0, piled = 0;
    for (const off of [1.1, 1.7, 2.3]) for (const a of [0, 1.57, 3.14, -1.57]) for (let b = -3; b <= 3.1; b += 0.5) {
      const r = besideTest(a, b, Object.assign({ off }, opts));
      n++;
      if (r.movedCm > 0.5) moved++;
      if (r.piled) piled++;
      for (const k in worst) worst[k] = Math.max(worst[k], r[k]);
    }
    return Object.assign({ stagings: n, moved, piled }, worst);
  }

  /* a block drawn from the side, from above and from behind the blocker, at the engine's distance */
  function blockStrip(opts) {
    if (!renderer) return null;
    const o = opts || {}, ar = arenaOf(), cell = o.cell || 300, cv = document.createElement('canvas'), teams = PG.TEAMS || [{ c1: '#c0392b', c2: '#f1f1f1' }], views = ['side', 'top', 'back', 'threeq'];
    cv.width = cell * views.length;
    cv.height = Math.round(cell * ar.ph / ar.pw);
    const x = cv.getContext('2d');
    x.fillStyle = '#0d1524';
    x.fillRect(0, 0, cv.width, cv.height);
    dress(ar.a, teams[0], true, 66);
    dress(ar.b, teams[1] || teams[0], false, 94);
    blockRun(o.dist === undefined ? 0.8 : o.dist, ar.a.f, ar.b.f, o.secs || 0.6, 0);
    const mx = (ar.a.f.root.position.x + ar.b.f.root.position.x) / 2, mz = (ar.a.f.root.position.z + ar.b.f.root.position.z) / 2;
    ar.floor.position.set(mx, 0, mz);
    views.forEach((v, i) => {
      if (v === 'top') ar.cam.position.set(mx + 0.01, 12, mz + 2);
      else if (v === 'back') ar.cam.position.set(mx + 1.5, 3.2, mz + 10);
      else if (v === 'threeq') ar.cam.position.set(mx + 7, 3.5, mz + 7);
      else ar.cam.position.set(mx + 11, 2.2, mz + 0.01);
      ar.cam.lookAt(mx, 1.5, mz);
      shoot(ar, x, i * cell, 0, cell);
    });
    return cv.toDataURL('image/png');
  }

  /* a defender running up the field toward the camera with the ball carrier at each angle in turn: where the helmet points */
  function eyesStrip(opts) {
    if (!renderer) return null;
    const o = opts || {}, ar = arenaOf(), angles = o.angles || [0, 45, 90, 130, 180, -60], cell = o.cell || 240, cv = document.createElement('canvas'), teams = PG.TEAMS || [{ c1: '#c0392b', c2: '#f1f1f1' }];
    cv.width = cell * angles.length;
    cv.height = Math.round(cell * ar.ph / ar.pw);
    const x = cv.getContext('2d'), f = ar.a.f;
    x.fillStyle = '#0d1524';
    x.fillRect(0, 0, cv.width, cv.height);
    dress(ar.a, teams[1] || teams[0], false, 52);
    ar.b.f.root.position.set(0, -50, 0);  // the other figure out of the picture
    ar.b.f.root.updateMatrixWorld(true);
    setBuild(f, BUILD.big);
    angles.forEach((deg, i) => {
      const an = deg * Math.PI / 180, c = { x: 26 - Math.sin(an) * 12, y: 30 + Math.cos(an) * 12, vx: 0, vy: 0, team: 0 }, p = { x: 26, y: 30, vx: 0, vy: o.speed === undefined ? 5 : o.speed, role: 'MLB', team: 1, asg: 'rush' };
      const ps = { carrier: c, air: o.ball ? { x: c.x, y: c.y, z: o.ball, kick: true, t: 1, T: 3 } : null, mode: 'run', offTeam: 0, runner: c, los: 20, qb: null, t: 3, recs: [] };
      if (o.ball) ps.carrier = null;
      f.snap = true;
      f.heading = 0;
      f.look = f.tip = f.twist = 0;
      for (let k = 0; k < 150; k++) poseFor(f, p, { ps, G: { state: 'live' }, pre: false, live: true, dir: 1, celeb: null, charge: -1 }, 1 / 120);
      f.root.updateMatrixWorld(true);
      ar.floor.position.set(f.root.position.x, 0, f.root.position.z);
      ar.cam.position.set(f.root.position.x + 0.01, o.high ? 9 : 2.6, f.root.position.z - (o.high ? 4 : 9));  // from up the field, looking back at him: his left is on the right of the picture
      ar.cam.lookAt(f.root.position.x, 1.8, f.root.position.z);
      shoot(ar, x, i * cell, 0, cell);
    });
    return cv.toDataURL('image/png');
  }

  /* every celebration as a picture ({ only: n } for one of the scorer's): the scorer's eighteen, the teammates' five, the beaten side's two, each at `at` seconds */
  function celebStrip(opts) {
    if (!renderer) return null;
    const o = opts || {}, ar = arenaOf(), at = o.at === undefined ? 1.8 : o.at, cell = o.cell || 200, teams = PG.TEAMS || [{ c1: '#c0392b', c2: '#f1f1f1' }];
    const list = o.only !== undefined ? [[true, 0.5, o.only]] : [...Array.from({ length: CELEB_N }, (_, v) => v).map(v => [true, 0.5, v]), ...[0, 1, 2, 3, 4].map(v => [false, (v + 0.5) / 5]), ['lost', 0.3], ['lost', 0.8]];
    const cv = document.createElement('canvas'), x = cv.getContext('2d'), f = ar.a.f, keep = { seed: f.seed, t: celebT };
    cv.width = cell * list.length;
    cv.height = Math.round(cell * ar.ph / ar.pw);
    x.fillStyle = '#0d1524';
    x.fillRect(0, 0, cv.width, cv.height);
    dress(ar.a, teams[0], true, 22);
    ar.b.f.root.position.set(0, -50, 0);
    ar.b.f.root.updateMatrixWorld(true);
    setBuild(f, BUILD.back);
    celebT = at;
    list.forEach(([who, u, style], i) => {
      f.seed = u * 6.2832;
      TG.fill(0);
      TG[PELY] = HIP;
      TG[EL] = TG[ER] = 0.25;
      TG[CHRX] = -0.05;
      if (who === 'lost') {
        const p = { x: 0, y: 0, vx: 0, vy: 0, team: 1 };
        f.snap = true;
        f.heading = 0;
        poseFor(f, p, { ps: { carrier: null, air: null, mode: 'run', offTeam: 0, recs: [] }, G: { state: 'dead' }, celeb: { team: 0, who: null }, pre: false, live: false, dir: 1, charge: -1 }, 1);
      } else {
        celebrate(f, who, TG, style ?? -1, 0);
        f.cur.set(TG);
        applyPose(f);
      }
      f.root.position.set(0, 0, 0);
      f.root.rotation.y = 0;
      f.root.updateMatrixWorld(true);
      ar.floor.position.set(0, 0, 0);
      ar.cam.position.set(2.2, 2.3, -10.5);  // from in front of him, a little to one side
      ar.cam.lookAt(0, 1.55, 0);
      shoot(ar, x, i * cell, 0, cell);
    });
    f.seed = keep.seed;
    celebT = keep.t;
    return cv.toDataURL('image/png');
  }

  PG.r3d = {
    init, resize, render, project, portrait, celebStrip, headStrip, modelStrip, throwStrip,
    get ends() {
      return ends;
    },
    blockStrip, eyesStrip,  // test hooks: a block, and a man watching the ball, drawn as rows of pictures
    eyes: eyesTest, block: blockTest, beside: besideTest, besideSweep,  // test hooks: where a helmet points, where a blocker's hands are, whether a man beside a tackle is standing in it
    tackle: tackleTest, tackleStrip,  // test hooks: measure a staged tackle, and draw it as a row of frames
    catchTest, catchStrip,  // and a staged catch: 'leap' (contested) or 'stretch' (off target)
    /* test hook: the pose player i is drawn in now (the joint angles in the order of the pose layout), and a few of his figure's states */
    bench() {
      // test hook: where each reserve on the bench is, his place, and his stride
      return figs.slice(0, SIDELINE).map(f => ({ x: f.root.position.x, y: -f.root.position.z, home: f.benchY, rot: f.root.rotation.y, hl: f.cur[HL] }));
    },
    poseOf(i) {
      const f = figs[SIDELINE + i];
      return f ? { pose: Array.from(f.cur), heading: f.heading, wind: f.wind, fall: f.fall, off: [f.ox, f.oy] } : null;
    },
    /* test hook: where player i's hand is (k: 0 left, 1 right), as field [x, y, height in yards], and his shoulder pad */
    handOf(i, k) {
      const f = figs[SIDELINE + i];
      if (!f) return null;
      f.root.updateMatrixWorld(true);
      const h = (k ? f.elR : f.elL).localToWorld(new T.Vector3(0, -0.3, 0)), c = f.chest.localToWorld(new T.Vector3(0, 0.45, 0));
      return { hand: [h.x, -h.z, h.y], chest: [c.x, -c.z, c.y] };
    },
    /* test hook: how far into a toe tap player i is (0 to 1) */
    tapOf(i) {
      const f = figs[SIDELINE + i];
      return f ? f.tap || 0 : 0;
    },
    gait: gaitTest, strip,  // test hooks: measure a run, and draw one stride as a row of side views
    cheer(v) {
      cheer = Math.max(cheer, v);
    },
    /* test hook: lodTest(false) draws every number and name whatever its size, to compare a frame with and without */
    pops(on) {
      if (on === true) POPS = {};
      else if (on === false) POPS = null;
      return POPS ? Object.entries(POPS).map(([k, v]) => ({ what: k, ...v })).sort((a, b) => b.n - a.n) : null;
    },
    lodTest(on) {
      lodOn = on !== false;
    },
    get cam() {
      return camera;
    },
    get info() {
      return renderer ? Object.assign({ nearModel, camDist: Math.round(camDist) }, renderer.info.render) : null;
    },
    get scene() {
      return scene;
    },  // test hook
    /* test hook: { pos: [x, height, -y], look: [x, height, -y] } pins the camera for close-ups; null releases it */
    set debugCam(v) {
      debugCam = v;
    },
  };
})();
