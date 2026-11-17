/* PocketFootball: GLSL shaders for the 3D renderer.
   render3d.js asks this file for four things: the turf, the sky dome, the crowd in the stands and a rim light
   that is patched into the players' materials. Everything is procedural, so there are still no image files.
   
   Colors given as uniforms are THREE.Color (linear working space); every shader converts to the screen's
   color space at the end with three's own colorspace chunk. */
(() => {
  'use strict';
  const T = window.THREE;
  if (!T) return;

  /* shared noise: a cheap hash, value noise and a three-octave fractal sum */
  const NOISE = /* glsl */ `
    float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
    }
    float fbm(vec2 p) { return noise(p) * 0.5 + noise(p * 2.03 + 7.1) * 0.3 + noise(p * 4.1 + 3.7) * 0.2; }
  `;

  /* ---------- turf ----------
     The painted field texture carries the lines, numbers and end zones. The shader adds what a texture cannot:
     blade-scale detail near the camera (faded out with distance so it never shimmers), slow mottling, mowing
     stripes that brighten or darken with the viewing angle like real cut grass, and on a wet night the
     stretched reflections of the four light towers. */
  function turf(map) {
    const m = new T.ShaderMaterial({
      fog: true,
      uniforms: T.UniformsUtils.merge([T.UniformsLib.fog, {
        map: { value: null }, uTint: { value: new T.Color(1, 1, 1) }, uWet: { value: 0 }, uSnow: { value: 0 }, uLamp: { value: 1 }, uStyle: { value: toonOn() ? 1 : 0 },
        uSky: { value: new T.Color(0.1, 0.13, 0.2) }, uTowers: { value: [new T.Vector3(), new T.Vector3(), new T.Vector3(), new T.Vector3()] },
      }]),
      vertexShader: /* glsl */ `
        varying vec2 vUv; varying vec3 vWorld;
        #include <fog_pars_vertex>
        void main() {
          vUv = uv;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorld = wp.xyz;
          vec4 mvPosition = viewMatrix * wp;
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D map; uniform vec3 uTint; uniform float uWet; uniform float uSnow; uniform float uLamp; uniform vec3 uSky; uniform vec3 uTowers[4]; uniform float uStyle;
        varying vec2 vUv; varying vec3 vWorld;
        #include <common>
        #include <fog_pars_fragment>
        ${NOISE}
        void main() {
          vec3 c = texture2D(map, vUv).rgb;
          vec2 p = vWorld.xz;
          vec3 toCam = cameraPosition - vWorld;
          float dist = length(toCam);
          vec3 V = toCam / dist;
          float lum = dot(c, vec3(0.299, 0.587, 0.114));
          float paint = smoothstep(0.45, 0.85, lum);                       // white lines and numbers take less grain
          float near = 1.0 - smoothstep(14.0, 60.0, dist);
          float blades = noise(p * vec2(26.0, 10.0)) * 0.6 + noise(p * vec2(55.0, 21.0)) * 0.4;
          float patches = noise(p * 0.33) * 0.6 + noise(p * 1.2) * 0.4 * (1.0 - smoothstep(40.0, 120.0, dist));
          float grain = 1.0 - uStyle * 0.85;  // the stylized look keeps the turf clean: bold stripes, little grain
          c *= 1.0 + ((blades - 0.5) * 0.26 * near + (patches - 0.5) * 0.11) * grain * (1.0 - paint * 0.7) * (1.0 - uSnow * 0.6);
          /* mowing stripes: every other five-yard band leans the other way, so which ones look light depends on where you stand */
          float y = -vWorld.z, inField = step(0.0, y) * step(y, 100.0) * step(0.0, vWorld.x) * step(vWorld.x, 53.33);
          float band = mod(floor(y / 5.0), 2.0) * 2.0 - 1.0;
          c *= 1.0 + band * V.z * (0.07 + uStyle * 0.05) * inField * (1.0 - paint) * (1.0 - uSnow);
          /* wear: down the middle between the hashes, where every play is run, the turf is thinner in patches and the
             soil shows through a little; it fades out toward the sidelines and the goal lines (not on the paint, not in snow) */
          float wear = inField * (1.0 - smoothstep(4.0, 15.0, abs(vWorld.x - 26.665))) * smoothstep(6.0, 18.0, y) * (1.0 - smoothstep(82.0, 94.0, y))
            * smoothstep(0.42, 0.72, fbm(p * 0.32) * 0.7 + noise(p * 1.7) * 0.3);
          c = mix(c, c * vec3(1.1, 0.98, 0.76) + vec3(0.025, 0.018, 0.0), wear * 0.55 * (1.0 - paint) * (1.0 - uSnow) * (1.0 - uStyle));
          /* rain: the turf picks up the sky at grazing angles and the towers leave long streaks */
          if (uWet > 0.0) {
            /* the wet surface ripples smoothly: sums of sines, not the lattice noise, whose cells showed in the
               towers' reflection as a patch of blocks */
            vec2 w = vec2(sin(p.x * 1.9 + sin(p.y * 1.3) * 1.7) + 0.5 * sin(p.y * 4.3 + p.x * 2.1), sin(p.y * 1.6 + sin(p.x * 1.1) * 1.9) + 0.5 * sin(p.x * 3.7 - p.y * 2.9));
            vec3 N = normalize(vec3(w.x * 0.034, 1.0, w.y * 0.034));
            float fres = pow(1.0 - max(dot(N, V), 0.0), 4.0);
            c = mix(c, uSky, fres * 0.45 * uWet);
            vec3 R = reflect(-V, N);
            float spec = 0.0;
            for (int i = 0; i < 4; i++) spec += pow(max(dot(R, normalize(uTowers[i] - vWorld)), 0.0), 110.0);
            c += vec3(0.85, 0.92, 1.0) * spec * 0.42 * uWet * uLamp;
          }
          gl_FragColor = vec4(min(c * uTint, vec3(0.86)), 1.0);     // stays under the glow threshold: lamps bloom, yard lines do not
          #include <colorspace_fragment>
          #include <fog_fragment>
        }`,
    });
    m.uniforms.map.value = map;  // set after the merge above, which would have cloned the texture
    return m;
  }

  /* ---------- sky ----------
     A dome that follows the camera: a three-stop gradient, a sun with a soft halo, stars that twinkle at night
     and drifting clouds. uCloud is how much of the sky they cover; 1 is a full overcast. */
  function sky() {
    return new T.ShaderMaterial({
      side: T.BackSide, depthWrite: false, depthTest: false, fog: false,
      uniforms: {
        uTop: { value: new T.Color() }, uMid: { value: new T.Color() }, uHorizon: { value: new T.Color() },
        uSunDir: { value: new T.Vector3(0, 1, 0) }, uSunCol: { value: new T.Color(0, 0, 0) }, uCloudCol: { value: new T.Color(1, 1, 1) },
        uStars: { value: 1 }, uCloud: { value: 0.3 }, uTime: { value: 0 },
      },
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uHorizon; uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uCloudCol;
        uniform float uStars; uniform float uCloud; uniform float uTime;
        varying vec3 vDir;
        ${NOISE}
        void main() {
          vec3 d = normalize(vDir);
          float h = max(d.y, 0.0);
          vec3 c = mix(uHorizon, uMid, smoothstep(0.0, 0.22, h));
          c = mix(c, uTop, smoothstep(0.18, 0.75, h));
          float sd = max(dot(d, uSunDir), 0.0);
          c += uSunCol * (pow(sd, 420.0) * 3.0 + pow(sd, 14.0) * 0.28 + pow(sd, 3.0) * 0.06);
          if (uStars > 0.0) {
            vec2 sp = d.xz / (d.y + 0.4) * 70.0, cell = floor(sp);
            float r = hash(cell);
            vec2 f = fract(sp) - 0.5 - (vec2(hash(cell + 3.1), hash(cell + 7.7)) - 0.5) * 0.6;
            float star = smoothstep(0.10, 0.0, length(f)) * step(0.86, r) * (0.7 + 0.3 * sin(uTime * 2.0 + r * 60.0));
            c += star * uStars * smoothstep(0.04, 0.3, d.y) * (0.5 + r * 0.6);
          }
          if (uCloud > 0.0) {
            vec2 cp = d.xz / (d.y + 0.15) * 1.5 + vec2(uTime * 0.006, uTime * 0.002);
            float n = fbm(cp) * 0.75 + fbm(cp * 2.7 + 11.0) * 0.25;
            float cover = smoothstep(1.0 - uCloud * 0.75, 1.0 - uCloud * 0.75 + 0.3, n + uCloud * 0.35);
            vec3 lit = uCloudCol * (0.72 + 0.28 * smoothstep(0.3, 0.9, n)) + uSunCol * pow(sd, 6.0) * 0.35;
            c = mix(c, lit, cover * smoothstep(0.0, 0.14, d.y) * (0.55 + 0.45 * min(uCloud, 1.0)));
          }
          gl_FragColor = vec4(c, 1.0);
          #include <colorspace_fragment>
        }`,
    });
  }

  /* ---------- crowd ----------
     Every seat is worked out in the shader. The stands are built by render3d.js with a seat grid measured in the
     world (aSeat: the seat along the row, the row up the slope, which stand, how high up it is), so a seat is the
     same width everywhere and a row a yard deep. Twenty-seat sections between concrete stairways with a handrail,
     tunnels into the lower bowl, a rail along the front; each row lit on top and in the shadow of the one in front.
     The fans: mostly in the home team's colors, plain clothes among them, a pocket of visitors in one corner; a head
     with hair or a cap, shoulders, a little sway all the time, and when the crowd erupts they stand, hop and throw
     their arms up. Far off, where a seat is smaller than a pixel, it all settles to the crowd's average color with a
     slow mottle, instead of the speckle of single seats. */
  function crowd() {
    return new T.ShaderMaterial({
      side: T.DoubleSide, fog: true, extensions: { derivatives: true },
      uniforms: T.UniformsUtils.merge([T.UniformsLib.fog, {
        uA1: { value: new T.Color() }, uA2: { value: new T.Color() }, uB1: { value: new T.Color() }, uB2: { value: new T.Color() },
        uCheer: { value: 0 }, uBase: { value: 0.6 }, uTime: { value: 0 }, uStyle: { value: toonOn() ? 1 : 0 },
      }]),
      vertexShader: /* glsl */ `
        attribute vec4 aSeat;
        varying vec4 vSeat;
        #include <fog_pars_vertex>
        void main() {
          vSeat = aSeat;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uA1; uniform vec3 uA2; uniform vec3 uB1; uniform vec3 uB2; uniform float uCheer; uniform float uBase; uniform float uTime; uniform float uStyle;
        varying vec4 vSeat;
        #include <common>
        #include <fog_pars_fragment>
        ${NOISE}
        vec3 shirt(float r, float vis) {
          if (vis > 0.5) return r < 0.5 ? uB1 : r < 0.7 ? uB2 : r < 0.85 ? vec3(0.6, 0.62, 0.66) : vec3(0.08, 0.09, 0.12);
          if (r < 0.26) return uA1;                        // the home team's jersey
          if (r < 0.35) return uA2;
          if (r < 0.39) return mix(uA1, vec3(0.9), 0.55);  // a washed-out old one
          if (r < 0.44) return uB1;                        // a visitor among them
          if (r < 0.6) return vec3(0.07, 0.08, 0.11);      // black
          if (r < 0.7) return vec3(0.5, 0.52, 0.55);       // heather grey
          if (r < 0.8) return vec3(0.12, 0.17, 0.3);       // navy
          if (r < 0.9) return vec3(0.7, 0.7, 0.68);        // white
          if (r < 0.95) return vec3(0.26, 0.3, 0.24);      // olive
          return vec3(0.42, 0.14, 0.12);                   // brick
        }
        void main() {
          vec2 g = vSeat.xy, cell = floor(g), f = fract(g);
          float stand = vSeat.z, up = vSeat.w;
          /* every edge is softened by the size of a pixel in seat units: crisp up close, blending smoothly into the
             neighbors far off (hard edges sparkled, and flat per-seat blocks looked like a mosaic) */
          float fx = fwidth(g.x), fy = fwidth(g.y), fw = max(fx, fy), aa = clamp(fw * 0.7, 0.004, 0.5);
          #define EDGE(a, x) smoothstep((a) - aa, (a) + aa, x)
          float col = mod(cell.x, 21.0), sec = floor(cell.x / 21.0);
          float aisle = step(col, 0.5);
          float r = hash(cell + stand * 17.3), r2 = hash(cell + 31.7 + stand), r3 = hash(cell + 77.1 - stand * 3.1);
          /* the visitors' corner: one end of the lower bowl, a few sections wide */
          float vis = step(abs(stand - 2.0), 0.1) * step(-40.0, cell.x) * step(cell.x, 22.0);
          /* a full house, with a few gaps in clumps (late arrivals, the concession line) */
          float here = step(r3, 0.93 - 0.3 * smoothstep(0.62, 0.9, noise(cell * vec2(0.09, 0.2) + stand * 5.0))) * (1.0 - aisle);
          /* tunnels into the lower bowl: halfway up every other section */
          float vom = step(stand, 3.5) * step(mod(sec, 2.0), 0.5) * step(8.0, col) * step(col, 13.0) * step(18.0, cell.y) * step(cell.y, 21.0);
          here *= 1.0 - vom;
          /* standing and cheering: on a big play most of the crowd is up, and they hop on their own beats */
          float stood = uCheer * step(0.25, r2);
          float hop = stood * abs(sin(uTime * (5.0 + r2 * 3.0) + r * 6.2832)) * 0.1;
          float sway = sin(uTime * (0.6 + r * 0.5) + r2 * 6.2832) * 0.035 * (1.0 - stood);
          vec2 q = vec2(f.x - sway, f.y - hop);
          float top = 0.5 + stood * 0.16;
          /* torso and shoulders, rounded at the corners */
          vec2 bq = vec2(abs(q.x - 0.5), q.y);
          float body = EDGE(bq.x, 0.27) * EDGE(0.02, q.y) * EDGE(q.y, top);
          body *= EDGE(length(max(vec2(bq.x - 0.17, q.y - (top - 0.1)), 0.0)), 0.1);
          float hy = top + 0.135;
          float hd = length((q - vec2(0.5, hy)) * vec2(1.0, 0.86));
          float head = EDGE(hd, 0.118);
          float capOn = step(0.9, r);  // a cap in team colors
          float hair = head * EDGE(hy + 0.015 - capOn * 0.03, q.y) * max(step(0.45, r2), capOn);
          float arms = stood * step(0.45, r) * EDGE(abs(abs(q.x - 0.5) - 0.32), 0.06) * EDGE(top - 0.12, q.y) * EDGE(q.y, top + 0.32);
          /* seats: the home team's color, dark; the row's step lit on top, its riser in shadow */
          vec3 seat = mix(vec3(0.03, 0.04, 0.07), uA1 * 0.3, 0.3);
          seat *= mix(0.55, 1.0, smoothstep(0.0, 0.3, f.y)) * mix(1.0, 1.25, EDGE(0.86, f.y));
          vec3 skin = mix(mix(vec3(0.78, 0.6, 0.48), vec3(0.55, 0.38, 0.27), step(0.35, r3)), vec3(0.33, 0.22, 0.16), step(0.7, r3));
          vec3 cloth = shirt(r, vis) * (0.55 + 0.45 * clamp(q.y / top, 0.0, 1.0));  // lit from above
          vec3 c = mix(seat, cloth, body * here);
          c = mix(c, skin * 0.82, max(head, arms) * here);
          c = mix(c, mix(vec3(0.05, 0.04, 0.035), vis > 0.5 ? uB1 : uA1, capOn) * 0.8, hair * here);
          /* the stairway: treads and risers, a handrail down the middle */
          vec3 conc = vec3(0.13, 0.14, 0.17) * mix(0.6, 1.0, step(0.4, f.y));
          conc = mix(conc, vec3(0.5, 0.53, 0.58), step(abs(f.x - 0.5), 0.05));
          c = mix(c, conc, aisle);
          /* a tunnel: a dark opening framed in concrete, with a rail across the top */
          vec3 tun = mix(vec3(0.01, 0.012, 0.02), vec3(0.42, 0.45, 0.5), step(20.75, g.y) * step(g.y, 20.9));
          c = mix(c, tun, vom);
          /* the front of the deck: a rail across the first row */
          c = mix(c, vec3(0.32, 0.35, 0.4), step(g.y, 0.35) * step(0.22, g.y));
          /* far off, the average of it all, with a slow mottle, instead of a speckle of single seats */
          vec3 avg = mix(vec3(0.05, 0.06, 0.09), mix(uA1, vec3(0.2, 0.22, 0.26), 0.62), 0.6) * (0.85 + 0.3 * noise(g * vec2(0.08, 0.15) + stand));
          avg = mix(avg, mix(uB1, vec3(0.2), 0.5), vis * 0.7);
          /* seen edge-on (a side stand from the end), the seats along the row blur but the rows do not: keep the rows,
             each a band of heads over a darker step, so the stand still reads as tiers and not as a flat wall */
          vec3 rowsOnly = avg * mix(0.55, 1.15, smoothstep(0.15, 0.55, f.y));
          avg = mix(rowsOnly, avg, smoothstep(0.3, 0.8, fy));
          c = mix(c, avg, smoothstep(0.5, 1.1, fw));
          /* the higher rows sit a little further from the lights */
          c *= mix(1.0, 0.8, up);
          c = mix(vec3(dot(c, vec3(0.299, 0.587, 0.114))), c, 1.0 + uStyle * 0.35);
          gl_FragColor = vec4(c * uBase * (1.0 + 0.35 * uCheer), 1.0);
          #include <colorspace_fragment>
          #include <fog_fragment>
        }`,
    });
  }

  /* ---------- players ----------
     A rim light: surfaces that turn away from the camera pick up the color of the stadium lights or the sky, which
     lifts the figures off the turf. It is added to three's own Lambert and Phong shaders rather than replacing them,
     so instancing, per-player colors and fog keep working. All materials share one uniform. */
  const rimColor = { value: new T.Color(0.4, 0.45, 0.55) };

  /* kind: what the part is made of, each with its own finish on top of the rim light.
     'cloth': a jersey's athletic mesh (a fine grid of holes, faded out where it would be smaller than a pixel) and
       soft folds, laid on the part's own shape so it moves with the man;
     'gloss': a helmet's clear coat, the stadium's ring of lights and the sky reflected in it, stronger at the edges;
     'metal' and 'satin' change only the material (render3d.js makes them Phong). */
  const CLOTH = /* glsl */ `
    varying vec3 vLocal;
    ${NOISE}
    float clothOf(vec3 p) {
      vec2 m = vec2(p.x + p.z, p.y) * 210.0, cm = fract(m) - 0.5;
      float fw = max(fwidth(m.x), fwidth(m.y));
      float holes = (1.0 - smoothstep(0.18, 0.3, length(cm))) * (1.0 - smoothstep(0.25, 0.6, fw));
      float folds = noise(vec2(p.x * 9.0 + p.z * 6.0, p.y * 30.0)) * 0.6 + noise(vec2(p.x * 22.0, p.y * 55.0 + p.z * 9.0)) * 0.4;
      return 1.0 - holes * 0.2 + (folds - 0.5) * 0.34;
    }`;

  /* toon: the stylized look (PG.SET.look === 'toon'). Players are cel-shaded (MeshToonMaterial, three bands) with
     shadows tinted cool instead of only darker, a crisp painted highlight on helmets, and no cloth noise: a clean,
     bold, not-realistic finish. render3d.js decides which material; this patch adds the rest. */
  const toonOn = () => !!(window.PG && PG.SET && PG.SET.look === 'toon');

  function rim(material, kind) {
    const toon = toonOn();
    if (toon && kind === 'cloth') kind = '';
    material.onBeforeCompile = shader => {
      shader.uniforms.uRim = rimColor;
      /* how high above the turf this point is, in the world: near the ground less light reaches (the man's own body
         and the grass block it), so the legs settle into the turf instead of floating, lit the same top to toe */
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying float vGroundY;')
        .replace('#include <project_vertex>', `#include <project_vertex>
          {
            vec4 pgW = vec4(transformed, 1.0);
            #ifdef USE_INSTANCING
              pgW = instanceMatrix * pgW;
            #endif
            vGroundY = (modelMatrix * pgW).y;
          }`);
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vGroundY;');
      if (kind === 'cloth') {
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vLocal;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocal = position;');
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', '#include <common>\n' + CLOTH)
          .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= clothOf(vLocal);');
      }
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec3 uRim;')
        .replace('#include <opaque_fragment>', `
          outgoingLight *= mix(${toon ? '0.82' : '0.68'}, 1.0, smoothstep(0.0, 1.0, vGroundY)) * (1.0 + 0.06 * smoothstep(1.4, 2.0, vGroundY));
          ${toon ? `
          {
            // cool, colored shadows: where a band is darker than the paint, it leans blue-violet instead of grey
            float pgL = dot(outgoingLight, vec3(0.299, 0.587, 0.114)), pgB = max(dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114)), 0.02);
            outgoingLight *= mix(vec3(0.8, 0.84, 1.12), vec3(1.0), smoothstep(0.5, 0.9, pgL / pgB));
          }` : ''}
          float rimAmount = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 3.0);
          outgoingLight += uRim * rimAmount;
          ${kind === 'gloss' && toon ? `
          {
            vec3 Vv = normalize(vViewPosition), Rv = reflect(-Vv, normalize(normal));
            float hl = step(0.86, dot(Rv, normalize(vec3(0.35, 0.8, 0.5))));  // a painted, hard-edged highlight
            outgoingLight += vec3(0.9, 0.95, 1.0) * hl * 0.55;
          }` : ''}
          ${kind === 'gloss' && !toon ? `
          {
            vec3 Vv = normalize(vViewPosition), Rv = reflect(-Vv, normalize(normal));
            float ring = smoothstep(-0.08, 0.2, Rv.y) * (1.0 - smoothstep(0.28, 0.62, Rv.y));  // the lights around the rim of the bowl
            float sky = smoothstep(0.55, 1.0, Rv.y);
            float fres = 0.35 + 0.65 * pow(1.0 - clamp(dot(normalize(normal), Vv), 0.0, 1.0), 2.0);
            outgoingLight *= 1.0 - 0.22 * smoothstep(-0.05, -0.55, Rv.y) * fres;  // the dark of the stands below the lights
            outgoingLight += (vec3(0.85, 0.9, 1.0) * ring * 0.5 + uRim * sky * 0.35) * fres;
          }` : ''}
          #include <opaque_fragment>`);
    };
    material.customProgramCacheKey = () => 'pg-rim-' + (kind || '') + (toon ? '-toon' : '');
    return material;
  }

  /* ---------- finishing pass ----------
     The scene is drawn into an off-screen target (with 4x anti-aliasing), then three small programs run over it:
     keep only the brightest pixels, blur them at a quarter of the size, and add that glow back with a soft
     vignette and a little extra color. Lamps, wet turf and white helmets bloom; everything else is untouched.
     Returns null when the device cannot do it, and the renderer then draws straight to the screen. */
  function post(renderer) {
    try {
      const target = (w, h, opts) => {
        const rt = new T.WebGLRenderTarget(w, h, Object.assign({ depthBuffer: false, stencilBuffer: false }, opts));
        rt.texture.colorSpace = T.SRGBColorSpace;  // stored gamma-encoded, so dark night scenes keep their gradation in 8 bits
        return rt;
      };
      const full = target(4, 4, { depthBuffer: true, stencilBuffer: true, samples: 4 }), a = target(2, 2), b = target(2, 2);
      const tri = new T.Mesh(new T.BufferGeometry().setAttribute('position', new T.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3)));
      tri.frustumCulled = false;
      const stage = new T.Scene(), cam = new T.Camera();
      stage.add(tri);
      const VS = 'varying vec2 vUv; void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }';
      const pass = (fragmentShader, uniforms) => new T.ShaderMaterial({ vertexShader: VS, fragmentShader, uniforms, depthTest: false, depthWrite: false });
      const bright = pass( /* glsl */ `
        uniform sampler2D tex; varying vec2 vUv;
        void main() {
          vec3 c = texture2D(tex, vUv).rgb;
          gl_FragColor = vec4(c * smoothstep(0.88, 1.0, max(c.r, max(c.g, c.b))), 1.0);
        }`, { tex: { value: null } });
      const blur = pass( /* glsl */ `
        uniform sampler2D tex; uniform vec2 uDir; varying vec2 vUv;
        void main() {
          vec3 c = texture2D(tex, vUv).rgb * 0.227;
          c += (texture2D(tex, vUv + uDir * 1.385).rgb + texture2D(tex, vUv - uDir * 1.385).rgb) * 0.316;
          c += (texture2D(tex, vUv + uDir * 3.231).rgb + texture2D(tex, vUv - uDir * 3.231).rgb) * 0.070;
          gl_FragColor = vec4(c, 1.0);
        }`, { tex: { value: null }, uDir: { value: new T.Vector2() } });
      const out = pass( /* glsl */ `
        uniform sampler2D tex; uniform sampler2D glow; uniform float uGlow; uniform float uVignette; uniform float uSat; varying vec2 vUv;
        void main() {
          vec3 c = texture2D(tex, vUv).rgb + texture2D(glow, vUv).rgb * uGlow;
          c = mix(vec3(dot(c, vec3(0.2126, 0.7152, 0.0722))), c, uSat);
          vec2 q = vUv - 0.5;
          c *= 1.0 - uVignette * smoothstep(0.18, 0.75, dot(q, q) * 1.6);
          gl_FragColor = vec4(max(c, 0.0), 1.0);
          #include <colorspace_fragment>
        }`, { tex: { value: null }, glow: { value: null }, uGlow: { value: 0.8 }, uVignette: { value: 0.32 }, uSat: { value: toonOn() ? 1.28 : 1.1 } });
      const run = (material, to) => {
        tri.material = material;
        renderer.setRenderTarget(to);
        renderer.render(stage, cam);
      };
      const size = new T.Vector2();
      return {
        glow: out.uniforms.uGlow,
        render(scene, camera) {
          renderer.getDrawingBufferSize(size);
          if (full.width !== size.x || full.height !== size.y) {
            full.setSize(size.x, size.y);
            const w = Math.max(2, size.x >> 2), h = Math.max(2, size.y >> 2);
            a.setSize(w, h);
            b.setSize(w, h);
          }
          renderer.setRenderTarget(full);
          renderer.render(scene, camera);
          bright.uniforms.tex.value = full.texture;
          run(bright, a);
          for (let i = 0; i < 2; i++) {
            // two rounds of a separable blur, the second one wider
            const r = 1 + i * 1.6;
            blur.uniforms.tex.value = a.texture;
            blur.uniforms.uDir.value.set(r / a.width, 0);
            run(blur, b);
            blur.uniforms.tex.value = b.texture;
            blur.uniforms.uDir.value.set(0, r / a.height);
            run(blur, a);
          }
          out.uniforms.tex.value = full.texture;
          out.uniforms.glow.value = a.texture;
          run(out, null);
        },
      };
    } catch (e) {
      console.warn('finishing pass unavailable', e);
      return null;
    }
  }

  PG.shaders = { turf, sky, crowd, rim, rimColor, post, toonOn };
})();
