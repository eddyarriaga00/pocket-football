/* Filming: nobody can watch the game move from a test, so a motion is checked as a grid of frames taken by a camera
   put next to the player. Load after harness.js, in the test pane, with a viewport size set.

     F.start()                      a watched exhibition (every play shown)
     F.until(() => PG.dbg.G.chg)    plays on until the test is true (returns the steps taken, or -1)
     F.grid(() => PG.dbg.ps.qb, { n: 8, every: 2, cols: 4, r: 3.4, ang: 1.57, h: 1.9, toward: [x, y] })
                                    n frames, `every` steps apart, from r yards away at `ang` round from the line to
                                    `toward` (or up the field), shown over the page; F.hide() takes it away
   Screenshots of the pane come back 800 pixels wide, so four frames a row is about the most that can be read. */
window.F = (() => {
  const d = () => PG.dbg, q = s => document.querySelector(s);

  function show(url) {
    let el = q('#film');
    if (!el) {
      el = document.createElement('div');
      el.id = 'film';
      el.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#0d1524;overflow:auto';
      document.body.appendChild(el);
    }
    el.innerHTML = `<img src="${url}" style="display:block;width:100%">`;
  }

  function hide() {
    const el = q('#film');
    if (el) el.remove();
  }

  function start(set) {
    Object.assign(PG.SET, { wx: 'clear', tod: 'day', snd: false }, set || {});
    PG.audio.deaf(true);
    window.H_WATCH = 1;
    PG.showMenu();
    q('#mE').click();
    q('#go').click();
  }

  function until(test, max) {
    let n = 0;
    while (n++ < (max || 60000)) {
      H.bot();
      d().step(1 / 60);
      if (test()) return n;
      if (d().G.state === 'over' || d().G.state === 'menu') return -1;
    }
    return -1;
  }

  function grid(who, o) {
    o = o || {};
    const gl = q('#gl'), N = o.n || 8, C = o.cols || 4, every = o.every || 2, cw = o.cw || 400, ch = Math.round(cw * 1.15), cv = document.createElement('canvas'), x = cv.getContext('2d'), R = o.r || 3.4;
    cv.width = cw * C;
    cv.height = ch * Math.ceil(N / C);
    for (let k = 0; k < N; k++) {
      const p = who(), t = o.toward || [p.x, p.y + (d().G.dir || 1) * 10], ang = Math.atan2(-(t[1] - p.y), t[0] - p.x) + (o.ang === undefined ? Math.PI / 2 : o.ang);
      PG.r3d.debugCam = { pos: [p.x + Math.cos(ang) * R, o.h || 1.9, -p.y + Math.sin(ang) * R], look: [p.x, o.look || 1.5, -p.y] };
      d().render();
      const s = Math.min(gl.width, gl.height) * 0.95;
      x.drawImage(gl, (gl.width - s / 1.15) / 2, (gl.height - s) / 2, s / 1.15, s, (k % C) * cw, Math.floor(k / C) * ch, cw, ch);
      for (let i = 0; i < every; i++) {
        if (!o.still) H.bot();
        d().step(1 / 60);
        if (i < every - 1) d().render();
      }
    }
    PG.r3d.debugCam = null;
    show(cv.toDataURL());
  }

  return { start, until, grid, show, hide };
})();
