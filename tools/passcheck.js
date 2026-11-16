/* Pass check for Pocket Gridiron: how throws land, yours and the computer's. Needs tools/harness.js loaded first.
   await fetch('tools/passcheck.js?'+Date.now()).then(r=>r.text()).then(t=>(0,eval)(t))
   PC.run(4)       four exhibitions played by the harness's test player (who throws to his most open man)
   PC.run(4, 0)    the same on the easiest difficulty (the slider's stop, 0 to 4)
   Each line: throws, completion %, interceptions, how far the receiver was from the ball when it came down (yards),
   and how many came down more than 1.2 yards from him (a harder catch) or more than 2.2 (out of reach). */
window.PC = (() => {
  const D = () => PG.dbg, q = s => document.querySelector(s);
  function run(games = 4, lvl) {
    const rec = [];
    let cur = null;
    for (let g = 0; g < games; g++) {
      PG.showMenu();
      q('#mE').click();
      if (lvl !== undefined) {
        const s = q('#dif input');
        s.value = lvl;
        s.dispatchEvent(new Event('change'));
      }
      q('#go').click();
      let n = 0;
      while (D().G.state !== 'over' && D().G.state !== 'menu' && n++ < 400000) {
        H.bot();
        D().step(0.02);
        const ps = D().ps, a = ps && ps.air;
        if (a && a.target && a.dist !== undefined && ps.thrown && !cur) cur = { a, off: ps.offTeam, you: ps.offTeam === 0, d: a.dist, c0: D().G.stats[ps.offTeam].comp };
        if (!cur) continue;
        if (a === cur.a) {
          const r = a.target;
          cur.dr = Math.hypot(r.x - a.x1, r.y - a.y1);
        } else {
          cur.comp = D().G.stats[cur.off].comp > cur.c0;
          cur.int = !!(ps && ps.turnover && ps.carrier && ps.carrier.team !== cur.off);
          delete cur.a;
          rec.push(cur);
          cur = null;
        }
      }
    }
    PG.showMenu();
    const sum = f => {
      const s = rec.filter(f), n = s.length || 1;
      return { n: s.length, comp: Math.round(s.filter(x => x.comp).length / n * 100), int: s.filter(x => x.int).length, miss: +(s.reduce((t, x) => t + x.dr, 0) / n).toFixed(2),
        hard: s.filter(x => x.dr > 1.2 && x.dr <= 2.2).length, gone: s.filter(x => x.dr > 2.2).length };
    };
    return { you: sum(x => x.you), youShort: sum(x => x.you && x.d <= 12), youMid: sum(x => x.you && x.d > 12 && x.d <= 20), youDeep: sum(x => x.you && x.d > 20),
      cpu: sum(x => !x.you), cpuDeep: sum(x => !x.you && x.d > 20) };
  }
  return { run };
})();
