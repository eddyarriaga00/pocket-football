/* PocketFootball: the league that Career and Season modes share.
   32 teams in two conferences of four divisions (data.js), on the NFL's calendar since 2026-11-17 (L.fmt 3): seventeen
   games in eighteen weeks, one bye each (weeks 6 to 11). The opponents follow the NFL's formula: the three division
   rivals twice, the four teams of a division of the same conference (a three-season rotation), the four of a division
   of the other conference (a four-season one), the teams that finished in the same place last season in the other
   two divisions of the conference, and one more from the other conference (the seventeenth game, at home for one
   conference one year and the other the next). The last week is all division games. Seven teams of each conference
   make the playoffs: the four division winners seeded 1 to 4, then three wild cards; the first seed has a bye, the
   wild card round is 2 v 7, 3 v 6 and 4 v 5, the first seed then meets the lowest seed left, then the conference
   championships and the championship game.
   L.fmt 2 (a ten-week season, the four division winners in the playoffs) and an older save with no L.fmt (eight
   teams, a round robin) finish their season the old way; the next season starts on the NFL calendar.
   Every function works on a plain save object L that has { team } and gets
   { fmt, ovrs, week, phase, sched, tab, po, around, lg } filled in. phase is 'reg', 'wc', 'qf', 'semi', 'final' or 'done'. */
(() => {
  'use strict';
  const { TEAMS, rnd, pick, clamp } = PG;
  const { CONF, DIV } = PG.data;
  const full2 = L => L.fmt >= 2;  // the 32-team league (ten weeks, or the NFL's eighteen)
  const nfl = L => L.fmt === 3;
  const ids = L => [...Array(L.tab.length).keys()];  // the teams in this league (eight in a season saved before it grew)
  const divOf = i => TEAMS[i].conf * 4 + TEAMS[i].div;
  const divTeams = (conf, div) => TEAMS.map((_, i) => i).filter(i => TEAMS[i].conf === conf && TEAMS[i].div === div);
  const divName = i => `${CONF[TEAMS[i].conf]} ${DIV[TEAMS[i].div]}`;

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd(i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* the old league: every team meets every other once (the circle method) */
  function roundRobin(n) {
    const t = shuffle([...Array(n).keys()]), rounds = [];
    for (let r = 0; r < n - 1; r++) {
      const week = [];
      for (let i = 0; i < n / 2; i++) week.push([t[i], t[n - 1 - i]]);
      rounds.push(week);
      t.splice(1, 0, t.pop());
    }
    return rounds;
  }

  /* The full league's ten weeks. Every week every team plays, so each week is 16 games. lg counts the seasons: which
     division of its conference a division crosses over with turns over from one season to the next. */
  function schedule(lg) {
    const divs = [];
    for (let c = 0; c < 2; c++) for (let d = 0; d < 4; d++) divs.push(shuffle(divTeams(c, d)));
    const rr = g => [[[g[0], g[1]], [g[2], g[3]]], [[g[0], g[2]], [g[1], g[3]]], [[g[0], g[3]], [g[1], g[2]]]];  // a division's three rounds
    /* each pair is [home, visitor]: the middle round of a leg is turned round so nobody opens with three at home, and
       the return games are the first leg's the other way round: five home games each, mixed through the season (a
       road trip of three or four can still happen where the crossover weeks meet the division ones, as in real life) */
    const leg = r => divs.flatMap(g => rr(g)[r].map(([a, b]) => (r % 2 ? [b, a] : [a, b])));
    const first = [0, 1, 2].map(leg);
    const second = [2, 0, 1].map(r => leg(r).map(([a, b]) => [b, a]));
    const pairs = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]][(lg || 0) % 3], cross = [];
    for (let r = 0; r < 4; r++) {
      const week = [];
      for (let c = 0; c < 2; c++) for (const [x, y] of pairs) {
        const X = divs[c * 4 + x], Y = divs[c * 4 + y];
        for (let i = 0; i < 4; i++) week.push(r % 2 ? [Y[(i + r) % 4], X[i]] : [X[i], Y[(i + r) % 4]]);
      }
      cross.push(week);
    }
    return [...first, ...shuffle(cross), ...second];
  }

  /* The NFL's season: seventeen rounds in which every team plays (the formula above), laid out over eighteen weeks.
     place[i] is where team i finished in its division last season (0 first), for the same-place games. Each round is
     a perfect matching of the 32 teams; a team's bye moves the rest of its season one week later, which only works if
     the teams it meets after its bye are moved too: so byes come in the weeks of division games (a division sits out
     together, and its teams only meet each other then). Returns the weeks, each a list of [home, visitor]. */
  function schedule3(lg, place) {
    const divs = [];
    for (let c = 0; c < 2; c++) for (let d = 0; d < 4; d++) divs.push(divTeams(c, d).sort((a, b) => place[a] - place[b]));  // each in last season's order
    const D = (c, d) => divs[c * 4 + d];
    /* the division's six rounds: the three pairings, then the same the other way round */
    const rr = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]], ord = shuffle([0, 1, 2]);
    const divRound = k => divs.flatMap(g => rr[ord[k % 3]].map(([a, b]) => ((k % 3) % 2 ? [g[b], g[a]] : [g[a], g[b]])).map(p => (k >= 3 ? [p[1], p[0]] : p)));
    /* four rounds against a whole division: X[i] meets Y[(i + r) % 4], at home in two of the four */
    const vsDiv = (X, Y) => [0, 1, 2, 3].map(r => [0, 1, 2, 3].map(i => (r % 2 ? [Y[(i + r) % 4], X[i]] : [X[i], Y[(i + r) % 4]])));
    const pairs = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]][lg % 3];  // the same-conference pairing this season
    const intra = [0, 1, 2, 3].map(r => [0, 1].flatMap(c => pairs.flatMap(([x, y]) => vsDiv(D(c, x), D(c, y))[r])));
    const inter = [0, 1, 2, 3].map(r => [0, 1, 2, 3].flatMap(d => vsDiv(D(0, d), D(1, (d + lg) % 4))[r]));
    /* the three same-place rounds: within a conference each division meets the two it does not play in full (a ring
       of four: two rounds), and across, the division two along from its full one (one round) */
    const other = d => pairs.find(p => !p.includes(d)), host = lg % 2;  // which conference hosts the seventeenth game
    const ring = [0, 1].map(c => {
      const [a, b] = pairs.find(p => p.includes(0)), [x, y] = other(0);  // the ring a-x-b-y-a
      return [[a, x], [x, b], [b, y], [y, a]].map(([u, v]) => [u, v]);
    })[0];
    const same = [0, 1].map(k => [0, 1].flatMap(c => [0, 1, 2, 3].flatMap(p => ring.filter((_, e) => e % 2 === k).map(([u, v]) => [D(c, u)[p], D(c, v)[p]]))));
    same.push([0, 1, 2, 3].flatMap(d => [0, 1, 2, 3].map(p => {
      const a = D(0, d)[p], b = D(1, (d + lg + 2) % 4)[p];
      return host === 0 ? [a, b] : [b, a];
    })));
    /* the order: four same-conference rounds, a same-place one, five division rounds (the byes), the four against the
       other conference, two more same-place rounds and the last division round */
    const rounds = [...shuffle(intra), same[0], ...[0, 1, 2, 3, 4].map(divRound), ...shuffle(inter), same[1], same[2], divRound(5)];
    /* the byes: the eight divisions over weeks 6 to 11 (two weeks carry two divisions) */
    const byeW = shuffle([5, 6, 7, 8, 9, 10, 5 + Math.floor(rnd(6)), 5 + Math.floor(rnd(6))]), bye = {};
    divs.forEach((g, k) => g.forEach(t => (bye[t] = byeW[k])));
    const weeks = [...Array(18)].map(() => []);
    rounds.forEach((rd, k) => rd.forEach(g => weeks[k < bye[g[0]] ? k : k + 1].push(g)));
    return weeks;
  }

  /* where each team finished in its division, for next season's same-place games */
  const places = L => {
    const o = {};
    for (let c = 0; c < 2; c++) for (let d = 0; d < 4; d++) divTeams(c, d).sort(L.tab ? better(L) : () => rnd() - 0.5).forEach((t, k) => (o[t] = k));
    return o;
  };

  /* a save's ratings cover every team, also one made before the league grew */
  function fix(L) {
    if (L.ovrs && L.ovrs.length < TEAMS.length) L.ovrs = L.ovrs.concat(TEAMS.slice(L.ovrs.length).map(t => t.ovr));
  }

  /* a new season: ratings drift a little from the last one */
  function start(L) {
    fix(L);
    L.ovrs = L.ovrs ? L.ovrs.map(o => clamp(o + Math.round(rnd(-3, 3)), 76, 93)) : TEAMS.map(t => t.ovr);
    const place = places(L.tab && L.tab.length === TEAMS.length ? L : {});  // last season's finish, before the table is cleared
    L.fmt = 3;
    L.lg = (L.lg || 0) + 1;
    L.week = 0;
    L.phase = 'reg';
    L.sched = schedule3(L.lg, place);
    L.bye = null;
    // four of your games under the lights, never the opener or your bye week
    L.prime = shuffle([...Array(L.sched.length - 1).keys()].map(i => i + 1).filter(w => L.sched[w].some(p => p.includes(L.team)))).slice(0, 4).sort((a, b) => a - b);
    L.pend = null;
    L.tab = TEAMS.map(() => ({ w: 0, l: 0, t: 0, pf: 0, pa: 0 }));
    L.h2h = {};  // who beat whom this season, for the tie-breaks
    L.po = null;
    L.around = [];
  }

  function record(L, a, b, sa, sb) {
    const A = L.tab[a], B = L.tab[b];
    A.pf += sa;
    A.pa += sb;
    B.pf += sb;
    B.pa += sa;
    if (sa > sb) {
      A.w++;
      B.l++;
    } else if (sb > sa) {
      B.w++;
      A.l++;
    } else {
      A.t++;
      B.t++;
    }
    /* each side's run of results: +3 is three wins in a row, -2 two defeats (a tie ends a run) */
    if (L.phase === 'reg') for (const [T, d] of [[A, sa - sb], [B, sb - sa]]) T.sk = d > 0 ? Math.max(0, T.sk || 0) + 1 : d < 0 ? Math.min(0, T.sk || 0) - 1 : 0;
    /* for the tie-breaks: who beat whom, and each side's record inside its own division and its own conference
       (regular season only) */
    if (L.phase === 'reg' && sa !== sb) {
      const lo = Math.min(a, b), hi = Math.max(a, b), k = lo + '-' + hi, win = sa > sb ? a : b;
      L.h2h = L.h2h || {};
      L.h2h[k] = (L.h2h[k] || 0) + (win === lo ? 1 : -1);
      if (divOf(a) === divOf(b)) {
        const W = L.tab[win], X = L.tab[win === a ? b : a];
        W.dw = (W.dw || 0) + 1;
        X.dl = (X.dl || 0) + 1;
      }
      if (TEAMS[a].conf === TEAMS[b].conf) {
        const W = L.tab[win], X = L.tab[win === a ? b : a];
        W.cw = (W.cw || 0) + 1;
        X.cl = (X.cl || 0) + 1;
      }
    }
  }

  /* a simulated final score, on the same scale as played games */
  function simScore(L, a, b) {
    const pa = 1 / (1 + Math.pow(10, -(L.ovrs[a] - L.ovrs[b]) / 10)), aWins = rnd() < pa;
    const w = pick([10, 13, 14, 17, 17, 20, 21, 24, 27, 31]), l = Math.max(0, w - pick([1, 3, 3, 4, 7, 7, 10, 10, 14]));
    return aWins ? [w, l] : [l, w];
  }

  const simWinner = (L, a, b) => {
    const [x, y] = simScore(L, a, b);
    return x > y ? a : b;
  };

  /* better record first; level on record, the side that won more of their meetings, then the better record inside
     the division, then points for minus points against (a season saved before the meetings were kept goes straight
     to the points) */
  const better = L => (a, b) => {
    const A = L.tab[a], B = L.tab[b], rec = (B.w + B.t / 2) - (A.w + A.t / 2);
    if (rec) return rec;
    const lo = Math.min(a, b), hi = Math.max(a, b), net = (L.h2h && L.h2h[lo + '-' + hi]) || 0;
    if (net) return (net > 0 ? lo : hi) === a ? -1 : 1;
    /* then, as the pro game has it: the record inside the division for two sides of the same division, the record
       inside the conference, and last the points */
    const dv = divOf(a) === divOf(b) ? ((B.dw || 0) - (B.dl || 0)) - ((A.dw || 0) - (A.dl || 0)) : 0;
    return dv || ((B.cw || 0) - (B.cl || 0)) - ((A.cw || 0) - (A.cl || 0)) || (B.pf - B.pa) - (A.pf - A.pa);
  };
  const seeds = L => ids(L).sort(better(L));
  /* a conference's playoff seeds: its four division winners, best record first */
  const confSeeds = (L, c) => [0, 1, 2, 3].map(d => divTeams(c, d).sort(better(L))[0]).sort(better(L));
  /* the NFL's seven: the division winners 1 to 4 by record, then the three best of the rest */
  const confSeeds7 = (L, c) => {
    const win = confSeeds(L, c);
    return win.concat(TEAMS.map((_, i) => i).filter(i => TEAMS[i].conf === c && !win.includes(i)).sort(better(L)).slice(0, 3));
  };
  const recTxt = (L, i) => {
    const r = L.tab[i];
    return `${r.w}-${r.l}${r.t ? '-' + r.t : ''}`;
  };
  const label = L => L.phase === 'reg' ? `Week ${L.week + 1} of ${L.sched.length}` : L.phase === 'wc' ? 'Playoffs · Wild Card round' : L.phase === 'qf' ? 'Playoffs · Divisional round' : L.phase === 'semi' ? (full2(L) ? 'Playoffs · Conference final' : 'Playoffs · Semifinal') : 'Championship game';
  const short = L => L.phase === 'reg' ? `Wk ${L.week + 1}` : L.phase === 'wc' ? 'Wild Card' : L.phase === 'qf' ? 'Divisional' : L.phase === 'semi' ? (full2(L) ? 'Conf. final' : 'Semifinal') : 'Final';
  /* the week of the year, for the weather and the light: the playoffs come after the last regular week */
  const weekNo = L => L.phase === 'reg' ? L.week : nfl(L) ? L.sched.length + ({ wc: 0, qf: 1, semi: 2, final: 4 }[L.phase] ?? 4) : L.sched.length + ({ qf: 0, semi: 1, final: 2 }[L.phase] ?? 2) - (full2(L) ? 0 : 1);  // the NFL leaves a week before the final
  /* the last third of the regular season and the playoffs: winter weather */
  const late = L => L.phase !== 'reg' || L.week >= Math.round(L.sched.length * (nfl(L) ? 0.62 : 0.6));
  /* the words for each stage, for the hubs' "continue" lines */
  const stage = L => L.phase === 'reg' ? `week ${L.week + 1}` : L.phase === 'wc' ? 'wild card round' : L.phase === 'qf' ? 'divisional round' : L.phase === 'semi' ? (full2(L) ? 'conference final' : 'semifinal') : L.phase === 'final' ? 'championship game' : 'offseason';

  /* primetime: the week's showcase game at night, the whole league watching. Three of yours in a season, and the
     conference final and the championship always */
  const prime = L => (L.phase === 'reg' ? !!(L.prime && L.prime.includes(L.week)) : L.phase === 'semi' || L.phase === 'final') && full2(L);

  /* the rest of this week's games, played out before yours kicks off, so the broadcast can follow them as they go and
     the standings get the same results afterwards: [team, score, team, score] */
  function preWeek(L) {
    if (L.phase !== 'reg') return null;
    if (L.pend && L.pend.week === L.week && L.pend.lg === L.lg) return L.pend.games;
    const games = L.sched[L.week].filter(g => !g.includes(L.team)).map(([a, b]) => {
      const [sa, sb] = simScore(L, a, b);
      return [a, sa, b, sb];
    });
    L.pend = { week: L.week, lg: L.lg, games };
    return games;
  }

  /* Is this week's game at home? In the season the schedule says (each pair is [home, visitor]; the division return
     games are the other way round). In the playoffs the better seed hosts, and the championship the better record.
     The old eight-team league played every game at home. */
  function home(L) {
    if (!full2(L)) return true;
    if (L.phase === 'reg') return L.sched[L.week].find(p => p.includes(L.team))[0] === L.team;
    const o = L.po.opp;
    if (L.phase !== 'final' && L.po.seeds) {
      const s = L.po.seeds[TEAMS[L.team].conf];
      return s.indexOf(L.team) < s.indexOf(o);
    }
    return better(L)(L.team, o) <= 0;
  }

  function nextOpp(L) {
    if (L.phase !== 'reg') return L.po.opp;
    const m = L.sched[L.week].find(p => p.includes(L.team));
    return m[0] === L.team ? m[1] : m[0];
  }

  /* The user's game is over: record it, simulate the rest, move the season on. Returns how the season ended
     ('Champion', 'Runner-up', 'Lost in the conference final', 'Lost in the divisional round', 'Semifinalist' in the
     old league, 'Missed the playoffs') or null if it goes on. */
  function advance(L, opp, us, them) {
    const won = us > them, end = finish => {
      L.po.finish = finish;
      L.phase = 'done';
      return finish;
    };
    if (L.phase === 'reg') {
      record(L, L.team, opp, us, them);
      L.around = [];
      const pre = L.pend && L.pend.week === L.week && L.pend.lg === L.lg ? L.pend.games : null;
      L.pend = null;
      for (const [a, b] of L.sched[L.week]) {
        if (a === L.team || b === L.team) continue;
        const g = pre && pre.find(x => x[0] === a && x[2] === b), [sa, sb] = g ? [g[1], g[3]] : simScore(L, a, b);  // the scores the broadcast already showed
        record(L, a, b, sa, sb);
        L.around.push([a, sa, b, sb]);
      }
      L.week++;
      L.bye = null;
      /* your bye: that week is played without you, and you go on to the one after (L.bye says so, for the hubs) */
      if (L.week < L.sched.length && !L.sched[L.week].some(p => p.includes(L.team))) {
        const games = L.sched[L.week].map(([a, b]) => {
          const [sa, sb] = simScore(L, a, b);
          record(L, a, b, sa, sb);
          return [a, sa, b, sb];
        });
        L.bye = { week: L.week, games };
        L.week++;
      }
      if (L.week < L.sched.length) return null;
      if (PG.milestones) PG.milestones.regEnd(L.tab[L.team]);  // the regular season is over: an achievement (unbeaten: another)
      return nfl(L) ? bracket3(L, end) : full2(L) ? bracket2(L, end) : bracket1(L, end);
    }
    if (L.phase === 'wc') return wildCard(L, won, opp, end);
    return full2(L) ? playoff2(L, won, opp, end) : playoff1(L, won, opp, end);
  }

  /* The NFL's playoffs. games: w, the six wild card games (the Union's three, then the Frontier's), then as in the ten-week
     league: q, the four divisional games, c, the conference championships, f, the final. */
  function bracket3(L, end) {
    const S = [confSeeds7(L, 0), confSeeds7(L, 1)];
    const gm = { w: S.flatMap(s => [[s[1], s[6], null], [s[2], s[5], null], [s[3], s[4], null]]), q: null, c: [[null, null, null], [null, null, null]], f: [null, null, null] };
    L.po = { fmt: 3, seeds: S, games: gm };
    const me = L.team, k = gm.w.findIndex(g => g.includes(me));
    if (k >= 0) {
      L.phase = 'wc';
      L.po.opp = gm.w[k][0] === me ? gm.w[k][1] : gm.w[k][0];
      return null;
    }
    gm.w.forEach(g => (g[2] = simWinner(L, g[0], g[1])));
    divisional(L);
    if (S[TEAMS[me].conf][0] !== me) {
      simRest(L, 'q');
      return end('Missed the playoffs');
    }
    // the first seed: a week off, then the divisional round
    L.phase = 'qf';
    L.po.byeWk = true;
    const g = gm.q.find(x => x.includes(me));
    L.po.opp = g[0] === me ? g[1] : g[0];
    return null;
  }
  /* after the wild card round: the first seed meets the lowest seed left, the other two winners each other (the higher
     seed at home: first in each pair) */
  function divisional(L) {
    const gm = L.po.games;
    gm.q = [0, 1].flatMap(c => {
      const s = L.po.seeds[c], left = [s[0], ...gm.w.slice(c * 3, c * 3 + 3).map(g => g[2])].sort((a, b) => s.indexOf(a) - s.indexOf(b));
      return [[left[0], left[3], null], [left[1], left[2], null]];
    });
  }
  function wildCard(L, won, opp, end) {
    const gm = L.po.games, me = L.team;
    gm.w.find(g => g.includes(me))[2] = won ? me : opp;
    gm.w.forEach(g => {
      if (g[2] == null) g[2] = simWinner(L, g[0], g[1]);
    });
    divisional(L);
    if (!won) {
      simRest(L, 'q');
      return end('Lost in the wild card round');
    }
    L.phase = 'qf';
    const g = gm.q.find(x => x.includes(me));
    L.po.opp = g[0] === me ? g[1] : g[0];
    return null;
  }

  /* the full league's playoffs. games: q, the four divisional games (the Union's two, then the Frontier's), c, the two
     conference finals, f, the championship, each as [team, team, winner] with null until it is known */
  function bracket2(L, end) {
    const A = confSeeds(L, 0), B = confSeeds(L, 1);
    const gm = { q: [[A[0], A[3], null], [A[1], A[2], null], [B[0], B[3], null], [B[1], B[2], null]], c: [[null, null, null], [null, null, null]], f: [null, null, null] };
    L.po = { fmt: 2, seeds: [A, B], games: gm };
    const k = gm.q.findIndex(g => g.includes(L.team));
    if (k < 0) {
      simRest(L, 'q');
      return end('Missed the playoffs');
    }
    L.phase = 'qf';
    L.po.opp = gm.q[k][0] === L.team ? gm.q[k][1] : gm.q[k][0];
    return null;
  }

  /* plays out everything from a round on: what is not decided yet is simulated */
  function simRest(L, from) {
    const gm = L.po.games, play = g => {
      if (g[2] == null) g[2] = simWinner(L, g[0], g[1]);
    };
    if (from === 'q') gm.q.forEach(play);
    if (from === 'q' || from === 'c') {
      gm.c = [[gm.q[0][2], gm.q[1][2], gm.c[0][2]], [gm.q[2][2], gm.q[3][2], gm.c[1][2]]];
      gm.c.forEach(play);
    }
    gm.f = [gm.c[0][2], gm.c[1][2], gm.f[2]];
    play(gm.f);
    L.po.champ = gm.f[2];
  }

  function playoff2(L, won, opp, end) {
    const gm = L.po.games, me = L.team, mine = rd => rd.find(g => g.includes(me));
    if (L.phase === 'qf') {
      mine(gm.q)[2] = won ? me : opp;
      gm.q.forEach(g => {
        if (g[2] == null) g[2] = simWinner(L, g[0], g[1]);
      });
      gm.c = [[gm.q[0][2], gm.q[1][2], null], [gm.q[2][2], gm.q[3][2], null]];
      if (!won) {
        simRest(L, 'c');
        return end('Lost in the divisional round');
      }
      const g = mine(gm.c);
      L.phase = 'semi';
      L.po.opp = g[0] === me ? g[1] : g[0];
      return null;
    }
    if (L.phase === 'semi') {
      mine(gm.c)[2] = won ? me : opp;
      gm.c.forEach(g => {
        if (g[2] == null) g[2] = simWinner(L, g[0], g[1]);
      });
      gm.f = [gm.c[0][2], gm.c[1][2], null];
      if (!won) {
        simRest(L, 'f');
        return end('Lost in the conference final');
      }
      L.phase = 'final';
      L.po.opp = gm.f[0] === me ? gm.f[1] : gm.f[0];
      return null;
    }
    L.po.champ = gm.f[2] = won ? me : opp;
    return end(won ? 'Champion' : 'Runner-up');
  }

  /* the old league's playoffs: the top four, 1 v 4 and 2 v 3, then the final */
  function bracket1(L, end) {
    const s = seeds(L).slice(0, 4), i = s.indexOf(L.team);
    L.po = { seeds: s, games: { s1: [s[0], s[3], null], s2: [s[1], s[2], null], f: [null, null, null] } };
    if (i < 0) {
      const w1 = simWinner(L, s[0], s[3]), w2 = simWinner(L, s[1], s[2]);
      L.po.champ = simWinner(L, w1, w2);
      L.po.games.s1[2] = w1;
      L.po.games.s2[2] = w2;
      L.po.games.f = [w1, w2, L.po.champ];
      return end('Missed the playoffs');
    }
    const rest = [0, 1, 2, 3].filter(k => k !== i && k !== 3 - i);
    L.phase = 'semi';
    L.po.opp = s[3 - i];
    L.po.other = [s[rest[0]], s[rest[1]]];
    return null;
  }

  function playoff1(L, won, opp, end) {
    const gm = L.po.games;  // a season saved before the bracket was recorded has none
    if (L.phase === 'semi') {
      const other = simWinner(L, L.po.other[0], L.po.other[1]);
      if (gm) {
        const mine = gm.s1.includes(L.team) ? gm.s1 : gm.s2, theirs = mine === gm.s1 ? gm.s2 : gm.s1;
        mine[2] = won ? L.team : opp;
        theirs[2] = other;
        gm.f = [gm.s1[2], gm.s2[2], null];
      }
      if (won) {
        L.phase = 'final';
        L.po.opp = other;
        return null;
      }
      L.po.champ = simWinner(L, opp, other);
      if (gm) gm.f[2] = L.po.champ;
      return end('Semifinalist');
    }
    L.po.champ = won ? L.team : opp;
    if (gm) gm.f[2] = L.po.champ;
    return end(won ? 'Champion' : 'Runner-up');
  }

  /* the playoff bracket, once the regular season has set it */
  function bracketHtml(L) {
    const gm = L.po && L.po.games;
    if (!gm) return '';
    const seedOf = t => (L.po.fmt >= 2 ? L.po.seeds[TEAMS[t].conf].indexOf(t) : L.po.seeds.indexOf(t)) + 1;
    /* a slot: the team's color, its seed and its name (its abbreviation in the later rounds, where the column is narrow) */
    const slot = (t, w, ab) => t == null ? '<span class="tbd">TBD</span>'
      : `<span class="${w === t ? 'w' : w != null ? 'out' : ''}${t === L.team ? ' me' : ''}"><i style="--c:${TEAMS[t].c1}"></i><em>${seedOf(t)}</em>${ab ? TEAMS[t].ab : TEAMS[t].name}</span>`;
    const game = (g, ab) => `<div class="gm">${slot(g[0], g[2], ab)}${slot(g[1], g[2], ab)}</div>`;
    const champ = c => `<div class="gm">${c == null ? '<span class="tbd">TBD</span>' : slot(c, c, true)}</div>`;
    if (L.po.fmt === 3) {
      const q = c => gm.q ? gm.q.slice(c * 2, c * 2 + 2) : [[L.po.seeds[c][0], null, null], [null, null, null]];
      return `<h2>Playoffs</h2>${[0, 1].map(c => `<h3 class="brh">${CONF[c]} Conference</h3><div class="brk b4"><div><small>Wild Card</small>${gm.w.slice(c * 3, c * 3 + 3).map(g => game(g, true)).join('')}<p class="byl${L.po.seeds[c][0] === L.team ? ' me' : ''}"><i style="--c:${TEAMS[L.po.seeds[c][0]].c1}"></i>Bye · 1 ${TEAMS[L.po.seeds[c][0]].ab}</p></div><div><small>Divisional</small>${q(c).map(g => game(g, true)).join('')}</div><div><small>Conf. final</small>${game(gm.c[c], true)}</div><div><small>To the final</small>${champ(gm.c[c][2])}</div></div>`).join('')}
      <div class="brk brf"><div><small>Championship</small>${game(gm.f)}</div><div></div><div><small>Champion</small>${champ(gm.f[2])}</div></div>`;
    }
    if (L.po.fmt === 2) return `<h2>Playoffs</h2>${[0, 1].map(c => `<h3 class="brh">${CONF[c]} Conference</h3><div class="brk"><div><small>Divisional</small>${game(gm.q[c * 2])}${game(gm.q[c * 2 + 1])}</div><div><small>Conference final</small>${game(gm.c[c], true)}</div><div><small>To the final</small>${champ(gm.c[c][2])}</div></div>`).join('')}
      <div class="brk brf"><div><small>Championship</small>${game(gm.f)}</div><div></div><div><small>Champion</small>${champ(gm.f[2])}</div></div>`;
    return `<h2>Playoffs</h2><div class="brk"><div><small>Semifinals</small>${game(gm.s1)}${game(gm.s2)}</div><div><small>Final</small>${game(gm.f, true)}</div>
      <div><small>Champion</small>${champ(gm.f[2])}</div></div>`;
  }

  /* standings and last week's scores, shared by both hubs. In the full league: the eight divisions, yours first, then
     the rest of your conference, then the other one; a division's leader is marked. */
  function standingsHtml(L) {
    const wide = full2(L), strk = k => !k ? '-' : (k > 0 ? 'W' : 'L') + Math.abs(k);
    const full = i => wide ? TEAMS[i].name : `${TEAMS[i].city} ${TEAMS[i].name}`, row = (i, n, lead) => `<tr class="${i === L.team ? 'me' : ''}"><td>${n}. ${full(i)}${lead ? ' <span class="lead">leads</span>' : ''}</td><td>${recTxt(L, i)}</td>${wide ? `<td>${L.tab[i].dw || 0}-${L.tab[i].dl || 0}</td><td>${L.tab[i].cw || 0}-${L.tab[i].cl || 0}</td>` : ''}<td>${L.tab[i].pf}</td><td>${L.tab[i].pa}</td>${wide ? `<td>${strk(L.tab[i].sk)}</td>` : ''}</tr>`;
    /* last week's other scores, folded: a chip a game, the winner's side marked */
    const sc = (t, s, w) => `<span class="${w ? 'w' : ''}"><i style="--c:${TEAMS[t].c1}"></i>${TEAMS[t].ab}<b>${s}</b></span>`;
    const around = L.around.length ? `<h2>Around the league</h2><div class="arl">${L.around.map(([a, sa, b, sb]) =>
      `<div title="${TEAMS[a].name} ${sa}, ${TEAMS[b].name} ${sb}">${sc(a, sa, sa > sb)}${sc(b, sb, sb > sa)}</div>`).join('')}</div>` : '';
    if (!full2(L)) return `${bracketHtml(L)}${L.po && L.po.games ? '<h2>Final standings</h2>' : ''}<table class="lg"><tr><th>Team</th><th>W-L</th><th>PF</th><th>PA</th></tr>${seeds(L).map((i, n) => row(i, n + 1)).join('')}</table>
      <p class="note">Top four make the playoffs.</p>${around}`;
    const mine = divOf(L.team), order = [mine, ...[0, 1, 2, 3].map(d => TEAMS[L.team].conf * 4 + d), ...[0, 1, 2, 3].map(d => (1 - TEAMS[L.team].conf) * 4 + d)].filter((d, i, a) => a.indexOf(d) === i);
    const played = ids(L).some(i => L.tab[i].w + L.tab[i].l + L.tab[i].t > 0);
    const table = d => {
      const ts = divTeams(d >> 2, d & 3).sort(better(L));
      return `<h3 class="dvh">${CONF[d >> 2]} ${DIV[d & 3]}</h3><table class="lg wd"><tr><th>Team</th><th>W-L</th><th>Div</th><th>Conf</th><th>PF</th><th>PA</th><th>Strk</th></tr>${ts.map((i, n) => row(i, n + 1, played && n === 0)).join('')}</table>`;
    };
    /* your division as a full table; the other seven as small cards, two across, a conference at a time: every team's
       record and points for and against are on the page, in a fraction of the room eight full tables took */
    const mc = TEAMS[L.team].conf, card = d => {
      const ts = divTeams(d >> 2, d & 3).sort(better(L));
      return `<div class="dvc"><small>${DIV[d & 3]}<em>W-L · PF-PA</em></small>${ts.map((i, n) => `<p class="${played && n === 0 ? 'ld' : ''}"><i style="--c:${TEAMS[i].c1}"></i><b>${TEAMS[i].ab}</b><span>${recTxt(L, i)}</span><u>${L.tab[i].pf}\u2013${L.tab[i].pa}</u></p>`).join('')}</div>`;
    }, conf = (label, ds) => `<h3 class="dvh">${label}</h3><div class="dvg">${ds.map(card).join('')}</div>`;
    return `${bracketHtml(L)}<h2>${L.po && L.po.games ? 'Final standings' : 'Standings'}</h2>${table(mine)}
      ${conf(`Rest of the ${CONF[mc]}`, order.filter(d => d !== mine && d >> 2 === mc))}${conf(`${CONF[1 - mc]} Conference`, order.filter(d => d >> 2 !== mc))}
      <p class="note">Record, then head-to-head, division record and point difference. ${nfl(L) ? 'Seven teams of each conference make the playoffs: the four division winners, then three wild cards. The first seed has a bye.' : 'The four division winners of each conference make the playoffs.'} A division's leader is marked.</p>${around}`;
  }

  PG.league = { schedule3, late, nfl, home, prime, preWeek, start, fix, record, simScore, simWinner, seeds, confSeeds, recTxt, label, short, weekNo, stage, nextOpp, advance, standingsHtml, bracketHtml, divTeams, divName, divOf, full: full2, schedule };
})();
