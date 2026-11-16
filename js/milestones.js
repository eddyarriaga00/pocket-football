/* Pocket Gridiron: milestones. A short list of things worth doing once, earned in any mode and kept on this device.
   game.js reports every finished game here; Season, Career and the training camp report their own. */
(() => {
  'use strict';
  const PG = window.PG, { load, save, scr, $ } = PG, KEY = 'pg.milestones.v1';
  const S = Object.assign({ got: {}, games: 0 }, load(KEY, {}));

  /* [id, name, how to earn it, test on a finished game (left out when another screen reports it)] */
  const LIST = [
    ['win', 'First win', 'Win a game in any mode', g => g.won],
    ['shut', 'Shutout', 'Win without giving up a point', g => g.won && g.them === 0],
    ['pts', 'Light it up', 'Score 30 or more in a game', g => g.us >= 30],
    ['air', 'Air show', 'Throw for 200 yards in a game', g => g.stats[0].pass >= 200],
    ['gnd', 'Ground and pound', 'Run for 80 yards in a game', g => g.stats[0].rush >= 80],
    ['take', 'Ball hawks', 'Take the ball away twice in a game', g => g.stats[1].to >= 2],
    ['ot', 'Overtime', 'Win a game in overtime', g => g.won && g.ot],
    ['wx', 'Mudder', 'Win a game in rain or snow', g => g.won && (g.weather === 'rain' || g.weather === 'snow')],
    ['pro', 'Giant killer', 'Win on All-Pro difficulty', g => g.won && g.diff === 2],
    ['ten', 'Season ticket', 'Finish ten games', () => S.games >= 10],
    ['camp', 'Camp graduate', 'Earn a star in all three training drills'],
    ['title', 'Champion', 'Win a title in Season or Career']
  ];

  /* a small line drawing for each */
  const ICON = {
    win: 'M6 21V4M6 4h11l-2.5 4L17 12H6',
    shut: 'M12 3l7 3v5c0 4.6-2.9 7.9-7 10-4.1-2.1-7-5.4-7-10V6z',
    pts: 'M12 3c.6 3.6 5 5.6 5 10.5a5 5 0 01-10 0c0-2.6 1.4-3.7 2.2-5.8C10.5 9 11.4 10.2 12 11.5 12.3 8.6 12 5.6 12 3z',
    air: 'M3 19c3.5-7 9.5-12 18-14M14.5 6.5l3-1.5-.5 3.5',
    gnd: 'M5 6l6 6-6 6M12 6l6 6-6 6',
    take: 'M4 8h13l-3-3M20 16H7l3 3',
    ot: 'M12 4a8 8 0 100 16 8 8 0 000-16zM12 8v4l3 2',
    wx: 'M7 14.5a3.8 3.8 0 01-.3-7.6A5 5 0 0116.5 6 3.6 3.6 0 0117 14.5zM8.5 17.5l-1 2.5M12.5 17.5l-1 2.5M16.5 17.5l-1 2.5',
    pro: 'M3 20l6-11 4 6 3-4 5 9z',
    ten: 'M4 7h16v3a2 2 0 000 4v3H4v-3a2 2 0 000-4zM14.5 7v10',
    camp: 'M12 3l5 16H7zM5 19h14M9.6 11h4.8',
    title: 'M4 17l2-9 4 4 2-6 2 6 4-4 2 9zM4 20h16'
  };

  function earn(ids) {
    const fresh = ids.filter(id => !S.got[id]);
    if (!fresh.length) return;
    for (const id of fresh) S.got[id] = Date.now();
    save(KEY, S);
    PG.snd('chime');
    PG.banner(fresh.length > 1 ? 'Milestones' : 'Milestone', fresh.map(id => LIST.find(m => m[0] === id)[1]).join(' · '), 3200);
  }

  const count = () => LIST.filter(m => S.got[m[0]]).length;

  PG.milestones = {
    /* a finished game, from any mode: { us, them, stats, ot, diff, weather } */
    game(g) {
      S.games++;
      save(KEY, S);
      g.won = g.us > g.them;
      earn(LIST.filter(m => m[3] && m[3](g)).map(m => m[0]));
    },
    earn: id => earn([id]),
    summary: () => `Milestones ${count()}/${LIST.length}`,
    open() {
      PG.toMenu();
      scr.innerHTML = `<div class="menu solid fill"><button class="back" id="bk">‹ Menu</button><h1 class="sm">Milestones</h1>
  <p class="tag">${count()} of ${LIST.length} earned. They count in every mode and are kept on this device.</p>
  <div class="trp" style="margin-top:12px"><i style="width:${count() / LIST.length * 100}%"></i></div>
  <div class="tro ms">${LIST.map(([id,name,how])=>`<div class="${S.got[id]?'on':''}"><i class="msi"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICON[id]}"/></svg></i><b>${name}</b><span>${how}</span><small>${S.got[id] ? (typeof S.got[id] === 'number' ? 'Earned ' + new Date(S.got[id]).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Earned') : 'Not yet'}</small></div>`).join('')}</div>
  <p class="note">${S.games} game${S.games===1?'':'s'} finished.</p></div>`;
      $('#bk').onclick = PG.showMenu;
    },
    /* test hook */
    get data() {
      return S;
    }
  };
})();
