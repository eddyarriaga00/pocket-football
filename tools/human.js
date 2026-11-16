/* A test quarterback that throws like a person, for judging how passing feels. Needs tools/harness.js loaded first.
   await fetch('tools/human.js?'+Date.now()).then(r=>r.text()).then(t=>(0,eval)(t))
   HP.run(6)               six exhibitions; returns completion rate, picks, sacks, points and why passes failed
   HP.run(6, { learned: true })  a player who has learned the green ring and the power bar's white band
   On each pass play he waits a human beat, looks the field over with a person's misjudgment (each man's room off by
   a yard or so either way), leans toward the deeper man, throws early when the rush is on him, and holds the power
   for as long as people do: a quick tap, a half press or a full one (or, learned, for the white band, with a
   person's timing error). Everything else (the toss, the play call, the snap, defense) is the harness's test player.
   It works on older versions of the game too (without the ring or the band it plays as unlearned). */
window.HP = (() => {
  const D = () => PG.dbg, q = s => document.querySelector(s);
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 0.5;
  let plan = null, held = null;

  function key(down, n) {
    dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code: 'Digit' + n, key: String(n) }));
  }

  function think(o) {
    const G = D().G, ps = D().ps;
    if (held) {
      if (!G.chg || G.state !== 'live' || G.chg.t >= held.t) {
        key(false, held.n);
        held = null;
      }
      return true;
    }
    if (!(G.state === 'live' && G.pad === 'pass' && ps && ps.recs && !ps.thrown)) {
      plan = null;
      return false;
    }
    if (!plan || plan.ps !== ps) plan = { ps, at: 1.25 + Math.random() * 1.7 };
    const qb = ps.qb, rush = qb && D().P.some(p => p.team !== qb.team && !p.down && Math.hypot(p.x - qb.x, p.y - qb.y) < 2.6);
    if (ps.t < plan.at && !(rush && ps.t > 0.9)) return true;
    let best = 0, bs = -1e9;
    ps.recs.forEach((r, i) => {
      if (r.down) return;
      let o2 = 99;
      for (const p of D().P) if (p.team !== r.team && !p.down) o2 = Math.min(o2, Math.hypot(p.x - r.x, p.y - r.y));
      const dep = (r.y - ps.los) * G.dir;
      let s = Math.min(o2, 6) + gauss() * 1.2 + Math.max(-2, Math.min(20, dep)) * 0.06;
      if (o.learned && D().roomFor && D().roomFor(r) >= 2.4 && Math.random() < 0.75) s += 4;
      if (s > bs) {
        bs = s;
        best = i;
      }
    });
    const r = ps.recs[best], C = 0.55;
    let t;
    if (o.learned && D().idealPow) t = Math.max(0.02, D().idealPow(qb, r) * C + gauss() * 0.06);
    else {
      const u = Math.random();
      t = u < 0.35 ? 0.03 + Math.random() * 0.12 : u < 0.75 ? 0.18 + Math.random() * 0.22 : 0.42 + Math.random() * 0.3;
    }
    held = { n: best + 1, t };
    key(true, best + 1);
    return true;
  }

  function run(games = 6, o = {}) {
    const rec = [];
    let cur = null, errs = [], pts = [0, 0];
    for (let g = 0; g < games; g++) {
      try {
        PG.showMenu();
        q('#mE').click();
        const s = q('#dif input');
        if (s) {
          s.value = o.lvl ?? 2;  // the slider's step (0 Rookie to 4 Legend)
          s.dispatchEvent(new Event('change'));
        } else {
          const b = q(`#dif button[data-d="${[0, 0, 1, 2, 2][o.lvl ?? 2]}"]`);  // before the slider: Rookie, Pro, All-Pro
          if (b) b.click();
        }
        const ql = q('#qls button[data-q="180"]');  // three-minute quarters, the same in every version
        if (ql) ql.click();
        if (q('#tod button[data-v="night"]')) q('#tod button[data-v="night"]').click();
        if (q('#wx button[data-v="clear"]')) q('#wx button[data-v="clear"]').click();
        q('#go').click();
        let n = 0;
        while (D().G.state !== 'over' && D().G.state !== 'menu' && n++ < 400000) {
          if (!think(o)) H.bot();
          D().step(0.02);
          const ps = D().ps, a = ps && ps.air;
          if (a && a.target && a.dist !== undefined && ps.thrown && !cur && ps.offTeam === 0) cur = { a, d: a.dist, c0: D().G.stats[0].comp, q: a.q };
          if (!cur) continue;
          if (a === cur.a) {
            cur.nd = Math.min(...D().P.filter(p => p.team !== 0 && !p.down).map(p => Math.hypot(p.x - a.x1, p.y - a.y1)));
          } else {
            cur.comp = D().G.stats[0].comp > cur.c0;
            cur.int = !!(ps && ps.turnover && ps.carrier && ps.carrier.team === 1);
            cur.why = D().G.last || '';
            delete cur.a;
            rec.push(cur);
            cur = null;
          }
        }
        pts[0] += D().G.score[0];
        pts[1] += D().G.score[1];
      } catch (e) {
        errs.push(String(e.stack).slice(0, 300));
      }
    }
    if (held) key(false, held.n);
    held = plan = null;
    PG.showMenu();
    const n = rec.length || 1, why = {};
    for (const x of rec) if (!x.comp) why[x.why] = (why[x.why] || 0) + 1;
    const pct = f => Math.round(rec.filter(f).length / n * 100);
    const tight = rec.filter(x => x.nd < 1.6);
    return { throws: rec.length, comp: pct(x => x.comp), int: rec.filter(x => x.int).length, deep: rec.filter(x => x.d > 20).length,
      deepComp: Math.round(rec.filter(x => x.d > 20 && x.comp).length / (rec.filter(x => x.d > 20).length || 1) * 100),
      tight: tight.length, tightComp: Math.round(tight.filter(x => x.comp).length / (tight.length || 1) * 100),
      ptsFor: +(pts[0] / games).toFixed(1), ptsAgainst: +(pts[1] / games).toFixed(1), why, errs };
  }
  return { run };
})();
