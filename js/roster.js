/* PocketFootball: every team's roster (2026-11-17). Fifty-three men, as an NFL team carries: three quarterbacks, three
   running backs and a fullback, six receivers, three tight ends, nine offensive linemen, nine defensive linemen, six
   linebackers, six corners, four safeties, a kicker, a punter and a long snapper. Each has a first and a last name, a
   jersey number inside the NFL's ranges for his position (no two alike on a team), an age, and a place on the depth
   chart. The same men every game and every season: a roster is made from the team's own seed, never from the game's
   generator, so nothing is saved and no seeded game changes because a roster was looked at. A man's rating is his own
   difference from the team's rating that season (L.ovrs), so a team that gets better lifts its whole roster.
   game.js takes its starters from here (mkRoster), render3d.js its reserves, Season and Career show the list. */
(() => {
  'use strict';
  const { TEAMS, SUR } = PG.data;

  const FIRST = ['Aaron', 'Abe', 'Adrian', 'Ahmad', 'Alec', 'Alonzo', 'Amari', 'Andre', 'Andrew', 'Antoine', 'Austin', 'Avery', 'Beau', 'Ben',
    'Blake', 'Brady', 'Brandon', 'Brent', 'Brian', 'Brock', 'Bryce', 'Byron', 'Caleb', 'Calvin', 'Cam', 'Carlos', 'Carson', 'Casey', 'Cedric',
    'Chase', 'Chris', 'Clay', 'Clint', 'Cody', 'Cole', 'Colin', 'Connor', 'Corey', 'Craig', 'Curtis', 'Dakota', 'Dalton', 'Damon', 'Dante',
    'Darius', 'Darnell', 'Darren', 'Dave', 'Dawson', 'Dean', 'DeAndre', 'Demarco', 'Deon', 'Derek', 'Desmond', 'Devin', 'Dion', 'Dominic',
    'Donte', 'Drew', 'Dylan', 'Eddie', 'Eli', 'Elijah', 'Emeka', 'Eric', 'Ethan', 'Evan', 'Felix', 'Gabe', 'Garrett', 'Gavin', 'Grant', 'Greg',
    'Hakeem', 'Hunter', 'Ian', 'Isaac', 'Isaiah', 'Ivan', 'Jabari', 'Jace', 'Jacob', 'Jaden', 'Jake', 'Jalen', 'Jamal', 'Jamar', 'Jared',
    'Jarvis', 'Jason', 'Javon', 'Jay', 'Jaylen', 'Jeff', 'Jermaine', 'Jerome', 'Jesse', 'Joel', 'Jonah', 'Jordan', 'Josh', 'Julian', 'Justin',
    'Kade', 'Kai', 'Kareem', 'Keenan', 'Keith', 'Kendall', 'Kenny', 'Kevin', 'Khalil', 'Kobe', 'Kyle', 'Lamar', 'Lance', 'Landon', 'Leo',
    'Levi', 'Logan', 'Lorenzo', 'Lucas', 'Luis', 'Luke', 'Malcolm', 'Malik', 'Marcus', 'Mario', 'Mark', 'Marquise', 'Mason', 'Matt', 'Max',
    'Micah', 'Miles', 'Mitch', 'Nate', 'Nick', 'Nico', 'Noah', 'Omar', 'Oscar', 'Owen', 'Parker', 'Pat', 'Quentin', 'Quinton', 'Rashad',
    'Ray', 'Reggie', 'Rico', 'Riley', 'Rob', 'Roman', 'Ross', 'Ryan', 'Sam', 'Sean', 'Seth', 'Shane', 'Shawn', 'Sione', 'Spencer', 'Terrell',
    'Terrence', 'Theo', 'Tim', 'Tony', 'Travis', 'Trent', 'Trey', 'Tristan', 'Troy', 'Ty', 'Tyler', 'Tyrone', 'Victor', 'Vince', 'Wade', 'Warren',
    'Wes', 'Will', 'Xavier', 'Zach', 'Zeke'];
  const MORE = ['Acosta', 'Adair', 'Akers', 'Albright', 'Amos', 'Ashby', 'Ashford', 'Bader', 'Baird', 'Baldwin', 'Barker', 'Barnett', 'Bassett',
    'Baxter', 'Beasley', 'Becker', 'Benton', 'Berry', 'Blaine', 'Bledsoe', 'Bond', 'Booker', 'Bradley', 'Bragg', 'Brandt', 'Bristow', 'Brody',
    'Buckner', 'Burgess', 'Burrell', 'Byers', 'Cahill', 'Calhoun', 'Cannon', 'Carlisle', 'Cassidy', 'Chandler', 'Childs', 'Clancy', 'Cobb',
    'Colby', 'Conley', 'Corbin', 'Cormier', 'Crawford', 'Croft', 'Cullen', 'Dawkins', 'Deane', 'Dorsey', 'Doyle', 'Draper', 'Duffy', 'Dyson',
    'Eaton', 'Eckert', 'Edmonds', 'Ellis', 'Ennis', 'Ewing', 'Fairley', 'Falcone', 'Fennell', 'Finch', 'Flagg', 'Flores', 'Ford', 'Fortune',
    'Fowler', 'Frost', 'Gaines', 'Galloway', 'Gantt', 'Garner', 'Gentry', 'Gillespie', 'Glover', 'Gordon', 'Grayson', 'Greer', 'Griffin',
    'Gunn', 'Hagan', 'Hampton', 'Hardin', 'Harmon', 'Hartley', 'Hatcher', 'Hawkins', 'Haynes', 'Hendrix', 'Hinton', 'Hobbs', 'Hogan',
    'Horne', 'Houston', 'Huff', 'Hurst', 'Irving', 'Jarrett', 'Jennings', 'Joyner', 'Kaiser', 'Keller', 'Kendrick', 'Kidd', 'Kirby', 'Knox',
    'Lamb', 'Lane', 'Lawson', 'Ledford', 'Lennox', 'Lockhart', 'Logan', 'Lott', 'Lucero', 'Lundy', 'Madden', 'Manning', 'Marlow', 'Mathis',
    'McBride', 'McCray', 'McGee', 'Meade', 'Mendoza', 'Merritt', 'Miles', 'Mims', 'Moody', 'Morrow', 'Moss', 'Munroe', 'Nance', 'Neal',
    'Newell', 'Noble', 'Norwood', 'Oakes', 'Ogden', 'Oliver', 'Orr', 'Owens', 'Padilla', 'Palmer', 'Parrish', 'Payne', 'Perkins', 'Pickett',
    'Pollard', 'Porter', 'Prescott', 'Pryor', 'Radford', 'Randle', 'Redd', 'Rennie', 'Riggs', 'Roberson', 'Rollins', 'Rooney', 'Ruffin',
    'Rutledge', 'Sampson', 'Sanders', 'Scales', 'Seward', 'Sharpe', 'Shelby', 'Sherwood', 'Simms', 'Skinner', 'Sloan', 'Spears', 'Stafford',
    'Stanton', 'Steele', 'Stroud', 'Sutton', 'Swann', 'Talley', 'Teague', 'Terrell', 'Thornton', 'Tillman', 'Toliver', 'Townsend', 'Trask',
    'Tyson', 'Upshaw', 'Vaughn', 'Vickers', 'Waddell', 'Walton', 'Warner', 'Weathers', 'Weldon', 'Whitfield', 'Wiggins', 'Winslow', 'Wolfe',
    'Womack', 'Worley', 'Wright', 'Yancey', 'Yoder', 'Youngblood', 'Zeller'];
  const LAST = [...new Set(SUR.concat(MORE))];

  /* [position, how many, the engine's slots its starters fill (in depth order), the jersey number ranges it may wear
     (the NFL's rule since 2024, the usual ones first), the body type the reserves on the sideline get] */
  const COMP = [
    ['QB', 3, ['QB'], [[1, 19]], 'qb'], ['RB', 3, ['RB'], [[20, 39], [2, 9]], 'back'], ['FB', 1, ['FB'], [[40, 49]], 'big'],
    ['WR', 6, ['X', 'Z', 'S', 'S2'], [[10, 19], [80, 89], [1, 9]], 'slim'], ['TE', 3, ['TE'], [[80, 89], [40, 49]], 'big'],
    ['OT', 4, ['LT', 'RT'], [[70, 79], [60, 69]], 'line'], ['OG', 3, ['LG', 'RG'], [[60, 79]], 'line'], ['C', 2, ['C'], [[50, 79]], 'line'],
    ['DE', 4, ['DE1', 'DE2'], [[90, 99], [50, 59]], 'end'], ['DT', 5, ['DT1', 'DT2'], [[90, 99], [70, 79]], 'line'],
    ['OLB', 4, ['OLB1', 'OLB2'], [[50, 59], [40, 49], [90, 99]], 'big'], ['MLB', 2, ['MLB'], [[50, 59], [40, 49]], 'big'],
    ['CB', 6, ['CB1', 'CB2'], [[20, 39], [1, 9]], 'db'], ['FS', 2, ['FS'], [[20, 49]], 'db'], ['SS', 2, ['SS'], [[20, 49]], 'db'],
    ['K', 1, [], [[1, 19]], 'slim'], ['P', 1, [], [[1, 19]], 'slim'], ['LS', 1, [], [[40, 49]], 'big']];
  const POS_NAME = { QB: 'Quarterback', RB: 'Running back', FB: 'Fullback', WR: 'Wide receiver', TE: 'Tight end', OT: 'Tackle', OG: 'Guard',
    C: 'Center', DE: 'Defensive end', DT: 'Defensive tackle', OLB: 'Outside linebacker', MLB: 'Middle linebacker', CB: 'Cornerback',
    FS: 'Free safety', SS: 'Strong safety', K: 'Kicker', P: 'Punter', LS: 'Long snapper' };
  const GROUPS = [['Offense', ['QB', 'RB', 'FB', 'WR', 'TE', 'OT', 'OG', 'C']], ['Defense', ['DE', 'DT', 'OLB', 'MLB', 'CB', 'FS', 'SS']], ['Special teams', ['K', 'P', 'LS']]];

  /* a small generator of its own (mulberry32), seeded by the team */
  const gen = seed => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const cache = new Map();
  /* one team's 53, in depth-chart order within each position: [{ first, last, name, pos, num, age, d, slot, depth }]
     (d: his rating against the team's; slot: the engine slot he starts in, or null) */
  const fulls = new Set();  // every full name in the league, so none is used twice
  function team(ti) {
    if (cache.has(ti)) return cache.get(ti);
    if (!cache.size) for (let t = 0; t < TEAMS.length; t++) build(t);  // all built in one order, so the names are the same whichever team is asked for first
    return cache.get(ti) || build(ti);
  }
  function build(ti) {
    if (cache.has(ti)) return cache.get(ti);
    const r = gen(ti * 7919 + 1013), pick = a => a[Math.floor(r() * a.length)], worn = new Set(), lasts = new Set(), out = [];
    for (const [pos, n, slots, ranges] of COMP) for (let k = 0; k < n; k++) {
      let num = 0;
      for (let tries = 0; tries < 60 && (!num || worn.has(num)); tries++) {
        const rg = tries < 30 ? ranges[0] : pick(ranges);  // the usual range first
        num = rg[0] + Math.floor(r() * (rg[1] - rg[0] + 1));
      }
      worn.add(num);
      let last = pick(LAST);
      for (let tries = 0; lasts.has(last) && tries < 40; tries++) last = pick(LAST);  // no two of a team's men share a surname
      lasts.add(last);
      let first = pick(FIRST);
      for (let tries = 0; fulls.has(first + ' ' + last) && tries < 40; tries++) first = pick(FIRST);
      fulls.add(first + ' ' + last);
      const slot = slots[k] || null, starter = !!slot || (pos === 'K' || pos === 'P' || pos === 'LS');
      /* a starter is near the team's rating (as the generated starters were: -9 to +7), a backup some way under it */
      const d = starter ? Math.round(-9 + r() * 16) : Math.round(-6 - r() * 9);
      const age = Math.round(starter ? 24 + r() * 9 : 22 + r() * 7);
      out.push({ first, last, name: last, full: first + ' ' + last, pos, num, age, d, slot, depth: k + 1 });
    }
    cache.set(ti, out);
    return out;
  }

  /* the man in an engine slot (QB, X, LT, CB2...) */
  const starter = (ti, slot) => team(ti).find(p => p.slot === slot) || null;
  /* the men not starting, for the sideline: [{ num, name, build }] */
  /* the first man behind the starter in an engine slot: the one who comes on when the starter is hurt. skip: jersey
     numbers already on the field (a second injury at the position takes the next man). A team carries one fullback,
     so a running back fills in for him. */
  const backup = (ti, slot, skip = []) => {
    const st = starter(ti, slot);
    if (!st) return null;
    const at = pos => team(ti).filter(p => p.pos === pos && !p.slot && !skip.includes(p.num)).sort((a, b) => a.depth - b.depth);
    return at(st.pos)[0] || (st.pos === 'FB' ? at('RB').pop() : null) || null;
  };
  const spec = (ti, pos) => team(ti).find(p => p.pos === pos) || null;
  const reserves = ti => team(ti).filter(p => !p.slot).map(p => ({ num: p.num, name: p.last, build: COMP.find(c => c[0] === p.pos)[4] }));
  const rating = (ti, p, ovr) => Math.max(45, Math.min(99, Math.round((ovr ?? TEAMS[ti].ovr) + p.d)));

  /* The roster as a page: grouped Offense, Defense, Special teams; a row a man: number, name, position, age, rating,
     starters in bold. o: { me: a career's own player ({ full, last, pos, num, rt, age }), put in as the starter at
     his position; names: { slot: { first, last, num } } for named teammates (a career's feed) who take those slots;
     rt: { slot: rating } where a mode keeps its own (Season's starters age); stat: slot => a short stat line } */
  function html(ti, ovr, o = {}) {
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    let list = team(ti).map(p => {
      const nm = p.slot && o.names && o.names[p.slot];
      return nm ? { ...p, first: nm.first || p.first, last: nm.last, full: `${nm.first || p.first} ${nm.last}`, num: nm.num ?? p.num } : { ...p };
    });
    const me = o.me;
    if (me) {
      const at = list.findIndex(p => p.pos === me.pos && p.slot);
      if (at >= 0) {
        const was = list[at];
        list[at] = { ...was, first: '', last: me.last, full: me.full, num: me.num, age: me.age || was.age, me: true, rt: me.rt };
        /* the man who started there becomes the first backup, and the last backup at the position makes room: 53 */
        const cut = list.filter(p => p.pos === me.pos && !p.slot && !p.me).sort((a, b) => b.depth - a.depth)[0];
        if (cut) list[list.indexOf(cut)] = { ...was, slot: null, depth: 1.5 };
        const clash = list.find(p => !p.me && p.num === me.num);
        if (clash) {
          let n = clash.num;
          while (list.some(p => p.num === n)) n = (n % 98) + 1;
          clash.num = n;  // whoever wore his number takes another
        }
      }
    }
    const rtOf = p => p.rt ?? (p.slot && o.rt && o.rt[p.slot]) ?? rating(ti, p, ovr);
    const isStarter = p => !!p.slot || p.pos === 'K' || p.pos === 'P' || p.pos === 'LS';
    return `<p class="note" style="margin-top:0">${list.length} players · starters in bold</p>` + GROUPS.map(([g, ps]) => `<h3 class="rsh">${g}</h3><div class="rst">${list.filter(p => ps.includes(p.pos)).sort((a, b) => ps.indexOf(a.pos) - ps.indexOf(b.pos) || (isStarter(b) - isStarter(a)) || a.depth - b.depth).map(p => {
      const st = p.slot && o.stat ? o.stat(p.slot) : '';
      return `<div class="${isStarter(p) ? 'st' : ''}${p.me ? ' me' : ''}"><i>${p.num}</i><b>${esc(p.full)}${st ? `<small>${esc(st)}</small>` : ''}</b><span>${p.pos}</span><em>${p.age}</em><u>${rtOf(p)}</u></div>`;
    }).join('')}</div>`).join('');
  }

  PG.roster = { team, starter, backup, spec, reserves, rating, html, COMP, POS_NAME, FIRST, LAST };
})();
