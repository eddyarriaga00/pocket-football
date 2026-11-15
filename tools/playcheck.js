/* Checks the playbook in js/data.js against the rules a real offense lines up by. Run: node tools/playcheck.js
   - seven men on the line of scrimmage in every formation (the five linemen and two ends), four behind it;
   - only the two ends of the line and the men behind it are eligible: a man on the line with somebody outside him
     on the line is covered, and no play may send him on a route or hand him the ball as a receiver;
   - every route and formation a play names exists, and every role it uses is in its formation. */
const fs = require('fs'), path = require('path');
const window = {};
new Function('window', fs.readFileSync(path.join(__dirname, '..', 'js', 'data.js'), 'utf8'))(window);
const { FORM, OFF, ROUTES, OLX, FNAME } = window.PG.data;
const ON = d => d > -1;  // on the line: within a yard of the ball
const bad = [];
const info = {};
for (const f in FORM) {
  const men = Object.entries(FORM[f]).map(([r, [x, d]]) => ({ r, x, d })).concat(Object.entries(OLX).map(([r, x]) => ({ r, x, d: 0, ol: true })));
  const line = men.filter(m => ON(m.d)).sort((a, b) => a.x - b.x), back = men.filter(m => !ON(m.d));
  if (men.length !== 11) bad.push(`${FNAME[f] || f}: ${men.length} men`);
  if (line.length !== 7) bad.push(`${FNAME[f] || f}: ${line.length} on the line (must be 7): ${line.map(m => m.r).join(' ')}`);
  const ends = [line[0].r, line[line.length - 1].r], covered = line.filter(m => !m.ol && !ends.includes(m.r)).map(m => m.r);
  if (line[0].ol || line[line.length - 1].ol) bad.push(`${FNAME[f] || f}: a lineman is the end of the line`);
  info[f] = { ends, covered, back: back.map(m => m.r) };
  for (const p of OFF.filter(p => p.f === f)) {
    for (const r in p.r || {}) {
      if (!FORM[f][r]) bad.push(`${p.n}: ${r} has a route but is not in ${FNAME[f]}`);
      if (!ROUTES[p.r[r]]) bad.push(`${p.n}: no route called ${p.r[r]}`);
      if (covered.includes(r)) bad.push(`${p.n}: ${r} is covered on the line in ${FNAME[f]} and is not eligible`);
    }
    if (p.run && !FORM[f][p.run.who]) bad.push(`${p.n}: ${p.run.who} carries but is not in ${FNAME[f]}`);
  }
}
for (const p of OFF) if (!FORM[p.f]) bad.push(`${p.n}: no formation ${p.f}`);
console.log(Object.entries(info).map(([f, i]) => `${(FNAME[f] || f).padEnd(11)} ends ${i.ends.join(', ').padEnd(8)} backfield ${i.back.join(' ')}${i.covered.length ? '  COVERED ' + i.covered.join(' ') : ''}`).join('\n'));
console.log(bad.length ? '\n' + bad.join('\n') : '\nPlaybook legal: ' + OFF.length + ' plays, ' + Object.keys(FORM).length + ' formations.');
process.exit(bad.length ? 1 : 0);
