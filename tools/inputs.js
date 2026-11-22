/* Input tests: a controller, the keyboard and the mouse, each on its own.
     I.reachAll()            every screen the audit walks: can the ring get to every button? (run after loading audit.js)
     I.reach()               the same for the screen showing now
     I.game('pad'|'kb'|'mouse')   a whole exhibition played with that device alone
   The controller is a made-up one handed to the game through navigator.getGamepads. I.bad lists what went wrong. */
(() => {
  const d = () => PG.dbg, q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)];
  const BN = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, VIEW: 8, START: 9, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 };
  const gp = { id: 'test pad', connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
  let padOn = false;
  Object.defineProperty(navigator, 'getGamepads', { value: () => (padOn ? [gp] : []), configurable: true });
  const set = (b, v) => (gp.buttons[BN[b]] = { pressed: !!v, value: v ? 1 : 0 });
  const poll = () => d().pad(1 / 60);
  const tap = b => {
    set(b, 1);
    poll();
    set(b, 0);
    poll();
  };
  const key = (code, k, type) => dispatchEvent(new KeyboardEvent(type || 'keydown', { code, key: k === undefined ? code : k, bubbles: true, cancelable: true }));
  const press = (code, k) => {
    key(code, k);
    key(code, k, 'keyup');
  };
  const ring = () => q('.gpf');
  const shown = el => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
  };
  const name = el => (el.id ? '#' + el.id : el.className.split(' ')[0] + ' "' + el.textContent.trim().slice(0, 18) + '"');
  const bad = [], seen = {};
  const hit = k => (seen[k] = (seen[k] || 0) + 1);
  const fail = (k, v) => {
    if (bad.filter(b => b[0] === k).length < 6) bad.push([k, v]);
  };

  /* can the ring reach every button on this screen from where it starts? */
  function reach(label) {
    const ui = d().ui();
    if (!ui) return null;
    padOn = true;
    poll();
    tap('UP');  // the first press only shows the ring
    const els = [...ui.querySelectorAll('button, input, select, a[href], summary')].filter(el => !el.disabled && el.getAttribute('aria-disabled') !== 'true' && shown(el));
    const start = ring();
    if (!start || !els.includes(start)) {
      if (els.length) fail('no ring', label);
      return { n: els.length, lost: els.length };
    }
    const got = new Set([start]), todo = [start];
    while (todo.length) {
      const el = todo.pop();
      for (const dir of ['UP', 'DOWN', 'LEFT', 'RIGHT']) {
        if (el.tagName === 'INPUT' && (dir === 'LEFT' || dir === 'RIGHT')) continue;  // left and right change a slider or a number
        d().foc(el);
        tap(dir);
        const r = ring();
        if (r && !got.has(r) && els.includes(r)) {
          got.add(r);
          todo.push(r);
        }
      }
    }
    const lost = els.filter(el => !got.has(el));
    if (lost.length) fail('cannot reach', [label, lost.length + ' of ' + els.length, lost.slice(0, 4).map(name).join(', ')]);
    hit('screens checked');
    return { n: els.length, lost: lost.length };
  }

  async function reachAll() {
    const done = new Set();
    window.A_HOOK = w => {
      if (/\((middle|bottom)\)$/.test(w) || done.has(w)) return;
      done.add(w);
      reach(w);
    };
    try {
      A.clear();
      await A.menus();
      A.play('exh');
    } finally {
      window.A_HOOK = null;
      padOn = false;
      poll();
    }
    return { screens: done.size, bad: bad.slice() };
  }

  /* what the test player wants pressed on a screen: the same choices the ordinary test player makes */
  const target = G => q('#tsH') || q('#tsR') || q('#fpA') || q('#g4K') || (G.state === 'call' ? q('.card.sug') || q('.card') || q('#h2') || q('#p1') || q('#k1') : null);

  /* walk the ring to an element with direction presses, then press it */
  function walkTo(el, dev) {
    const move = dir => (dev === 'pad' ? tap(dir) : press({ UP: 'ArrowUp', DOWN: 'ArrowDown', LEFT: 'ArrowLeft', RIGHT: 'ArrowRight' }[dir]));
    const ok = () => (dev === 'pad' ? tap('A') : press('Enter'));
    if (!ring() || !shown(ring())) move('UP');
    for (let i = 0; i < 60; i++) {
      const cur = ring();
      if (cur === el) {
        ok();
        return true;
      }
      if (!cur) break;
      const a = cur.getBoundingClientRect(), b = el.getBoundingClientRect(), dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
      const first = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'RIGHT' : 'LEFT') : dy > 0 ? 'DOWN' : 'UP', second = Math.abs(dx) > Math.abs(dy) ? (dy > 0 ? 'DOWN' : 'UP') : dx > 0 ? 'RIGHT' : 'LEFT';
      move(first);
      if (ring() === cur) move(second);
      if (ring() === cur) break;
    }
    return false;
  }

  let hold = null;  // a throw button being held
  function fieldPad(G, ps) {
    const kind = G.pad;
    hit('pad ' + kind);
    gp.axes[1] = kind === 'carry' || kind === 'carryq' ? -1 : 0;
    set('RT', kind === 'carry');
    if (hold) {
      if (!G.chg || G.chg.t > 0.3 || G.state !== 'live') {
        set(hold, 0);
        hold = null;
      }
      return;
    }
    if (kind === 'snap' || kind === 'ready' || kind === 'kick') tap('A');
    else if (/^watch/.test(kind)) tap('B');
    else if (kind === 'pass' && !ps.air && ps.t > 1.6 + Math.random()) {
      hold = ['A', 'B', 'X', 'Y', 'RB'][Math.floor(Math.random() * ps.recs.length)];
      set(hold, 1);
      poll();
      G.chg ? hit('pad throws') : fail('a throw button did not start a throw', [hold, G.state, G.pad, d().padKind(), +ps.t.toFixed(2), !!ps.air, ps.recs.map(r => (r.down ? 'x' : 'o')).join(''), d().input.mode, !!d().ui()]);
    } else if ((kind === 'carry' || kind === 'carryq') && Math.random() < 0.02) tap(['A', 'B', 'X', 'Y'][Math.floor(Math.random() * 4)]);
    else if ((kind === 'def' || kind === 'deflock') && Math.random() < 0.02) tap(['A', 'B', 'X', 'Y'][Math.floor(Math.random() * 4)]);
    else if (kind === 'route' && Math.random() < 0.05) tap('A');
  }

  let kheld = null;
  function fieldKb(G, ps) {
    const kind = G.pad;
    hit('kb ' + kind);
    const run = kind === 'carry' || kind === 'carryq';
    if (run !== !!fieldKb.up) {
      key('ArrowUp', 'ArrowUp', run ? 'keydown' : 'keyup');
      key('ShiftLeft', 'Shift', run ? 'keydown' : 'keyup');
      fieldKb.up = run;
    }
    if (kheld) {
      if (!G.chg || G.chg.t > 0.3 || G.state !== 'live') {
        key('Digit' + kheld, kheld, 'keyup');
        kheld = null;
      }
      return;
    }
    if (kind === 'snap' || kind === 'ready' || kind === 'kick') press('Space', ' ');
    else if (/^watch/.test(kind)) press('KeyK', 'k');
    else if (kind === 'pass' && !ps.air && ps.t > 1.6 + Math.random()) {
      kheld = String(1 + Math.floor(Math.random() * ps.recs.length));
      key('Digit' + kheld, kheld);
      G.chg ? hit('kb throws') : fail('a number key did not start a throw', kheld);
    } else if (run && Math.random() < 0.02) press(...[['KeyJ', 'j'], ['KeyK', 'k'], ['KeyL', 'l'], ['KeyH', 'h']][Math.floor(Math.random() * 4)]);
    else if ((kind === 'def' || kind === 'deflock') && Math.random() < 0.02) press(...[['KeyQ', 'q'], ['KeyE', 'e'], ['KeyF', 'f'], ['KeyR', 'r']][Math.floor(Math.random() * 4)]);
    else if (kind === 'route' && Math.random() < 0.05) press('KeyC', 'c');
  }

  /* the mouse: buttons beside the field take a press, a receiver's letter is pressed and let go on the field */
  const ptr = (el, type, x, y) => el.dispatchEvent(new PointerEvent(type, { pointerId: 1, pointerType: 'mouse', isPrimary: true, clientX: x, clientY: y, button: 0, buttons: type === 'pointerup' ? 0 : 1, bubbles: true, cancelable: true }));
  const padBtn = t => qa('#pad button').find(b => b.firstChild && b.firstChild.textContent.trim().toLowerCase() === t);
  const down = b => {
    const r = b.getBoundingClientRect();
    ptr(b, 'pointerdown', r.left + r.width / 2, r.top + r.height / 2);
    ptr(b, 'pointerup', r.left + r.width / 2, r.top + r.height / 2);
  };
  let mheld = false;
  function fieldMouse(G, ps) {
    const kind = G.pad, cv = q('#c');
    hit('mouse ' + kind);
    if (kind === 'pass' && d().render) d().render();  // the letters are placed when the field is drawn
    if (mheld) {
      if (!G.chg || G.chg.t > 0.3 || G.state !== 'live') {
        ptr(cv, 'pointerup', 0, 0);
        mheld = false;
      }
      return;
    }
    const b = padBtn(kind === 'snap' ? 'snap' : kind === 'ready' ? 'ready' : kind === 'kick' ? 'kick' : /^watch/.test(kind) ? (/K/.test(kind) ? 'skip' : 'skip drive') : '');
    if (b) return down(b);
    if (kind === 'snap' || kind === 'ready' || kind === 'kick' || /^watch/.test(kind)) return fail('no button for the mouse', [kind, qa('#pad button').map(x => x.textContent).join('|')]);
    if (kind === 'pass' && !ps.air && ps.t > 1.6 + Math.random()) {
      const rs = ps.recs.filter(r => r.hx !== undefined), r = rs[Math.floor(Math.random() * rs.length)], c = cv.getBoundingClientRect();
      if (!r) return;
      ptr(cv, 'pointerdown', c.left + r.hx, c.top + r.hy);
      if (G.chg) {
        mheld = true;
        hit('mouse throws');
      }
      else fail('a click on a receiver did not start a throw', [r.role, Math.round(r.hx), Math.round(r.hy)]);
    }
  }

  function game(dev, max) {
    padOn = dev === 'pad';
    PG.showMenu();
    if (dev === 'mouse') {
      q('#mE').click();
      q('#go').click();
    } else if (!walkTo(q('#mE'), dev) || !q('#go') || !walkTo(q('#go'), dev)) {
      fail('could not start a game', dev);
      return null;
    }
    let n = 0, lastT = null, stuckT = 0;
    const going = () => d().G.state !== 'over' && d().G.state !== 'menu';
    while (going() && n++ < (max || 90000)) {
      const G = d().G, ps = d().ps, ui = d().ui();
      if (dev === 'pad') poll();
      if (G.paused) dev === 'pad' ? tap('START') : dev === 'kb' ? press('KeyP', 'p') : q('#pr') && q('#pr').click();
      else if (ui) {
        const t = target(G);
        if (t && shown(t)) {
          if (dev === 'mouse') t.click();
          else if (!walkTo(t, dev)) {
            fail('ring could not get to', [dev, G.state, name(t)]);
            t.click();
          } else hit(dev + ' picked on a screen');
        }
      } else if (ps) (dev === 'pad' ? fieldPad : dev === 'kb' ? fieldKb : fieldMouse)(G, ps);
      if (dev !== 'touch' && !ui && d().input.mode !== (dev === 'mouse' ? d().input.mode : dev)) fail('wrong labels', [dev, d().input.mode]);
      /* every button beside the field should say which key or button does the same */
      if (dev !== 'mouse' && !ui) for (const b of qa('#pad button')) if (!b.querySelector('.hk') && !b.disabled && G.pad !== 'pass') fail('no ' + dev + ' label', [G.pad, b.textContent]);
      d().step(1 / 60);
    }
    if (hold) set(hold, 0);
    hold = null;
    if (fieldKb.up) {
      key('ArrowUp', 'ArrowUp', 'keyup');
      key('ShiftLeft', 'Shift', 'keyup');
      fieldKb.up = false;
    }
    gp.axes[1] = 0;
    set('RT', 0);
    if (going()) fail('game did not finish', [dev, d().G.state, d().G.q, d().G.pad]);
    const out = d().G.score.join('-');
    padOn = false;
    poll();
    return out;
  }

  window.I = { reach, reachAll, game, bad, seen, tap, press, gp, pad: on => (padOn = on) };
})();
