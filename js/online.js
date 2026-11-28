/* PocketFootball: online. The owner's choices (2026-11-16), all on free plans:
   - a global chat on Firebase's Realtime Database (the free Spark plan: no card, 100 phones connected at once);
   - head to head phone to phone through PeerJS, one phone showing a code the other types in;
   - a name only: what a player types, and a hidden id Firebase gives this device (anonymous sign-in), so a mute,
     a report or a ban sticks to a device;
   - a word filter and one line every two and a half seconds (checked here and again by the database's rules),
     mute and report on every line, and the owner deletes lines or bans ids from the Firebase console.
   Nothing touches the network until the Online screen is opened, and the chat's connection is closed again when
   the screen is left or the app goes to the background, so a phone holds one of the hundred places only while
   someone is reading. The libraries come from cdnjs, pinned, with their integrity hashes. */
(function () {
  const PG = window.PG, { load, save, scr, $ } = PG;

  /* The Firebase project's public web configuration, as its console shows it for a web app (docs/ONLINE.md says
     how to get it). It is meant to sit in a web page: what protects the data is docs/firebase-rules.json. Never put
     a secret or admin key here. null: the chat is not set up yet. Pasted by the owner on 2026-11-16. */
  const FIREBASE = {
    apiKey: 'AIzaSyC1TuSiIplRT4FeNyIZ3EoHzAJ4PM1dFxY',
    authDomain: 'blockfootball-a13c9.firebaseapp.com',
    databaseURL: 'https://blockfootball-a13c9-default-rtdb.firebaseio.com',
    projectId: 'blockfootball-a13c9',
    storageBucket: 'blockfootball-a13c9.firebasestorage.app',
    messagingSenderId: '884284719107',
    appId: '1:884284719107:web:ebc6b62de8d3392f974e36'
  };

  const NAME_MAX = 16, TEXT_MAX = 140, EVERY = 2500, KEEP = 50;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  /* ---------- libraries, loaded on first use ---------- */
  const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/';
  const LIBS = {
    fb: [
      ['firebase/13.3.0/firebase-app-compat.min.js', 'sha512-oHf9Mxpj4w5nAfX1hYuR7S/0Lej2ss39sFE1Xf24qW3sv8S7/4zEM+OyHehoTi1WgvRFNiDcsAyw6RUVHAksVw=='],
      ['firebase/13.3.0/firebase-auth-compat.min.js', 'sha512-8vw8IBHALgT6QTxD2B51SnqO3SvxZHyhkBQjFlJno/anAWikb6/9qHg3OvuIXbSPNLFT/r0FunXFllMMYlUfSA=='],
      ['firebase/13.3.0/firebase-database-compat.min.js', 'sha512-SC1sn3CB7/UoeTW2YolbaA3c1yW739R1jbHLsiLIrvSadZKgUa8ZaOKU3Qqczs4ctuKXVr3zozZ/k1Hi5MhfZg==']
    ],
    peer: [['peerjs/1.5.5/peerjs.min.js', 'sha512-XEKeWX+mI3Ov+tg2evDlVQFzVOIp4T8J3cNcCEPaEUGpxJV3eZaN8rHuvnFPvQpGJBHPmrozJDMpm2xcDvtmyQ==']]
  };
  const loaded = {};
  const script = ([path, sri]) => new Promise((ok, no) => {
    const s = document.createElement('script');
    s.src = CDN + path;
    s.integrity = sri;
    s.crossOrigin = 'anonymous';
    s.referrerPolicy = 'no-referrer';
    s.onload = ok;
    s.onerror = () => no(new Error('could not load ' + path));
    document.head.appendChild(s);
  });
  const libs = k => (loaded[k] = loaded[k] || LIBS[k].reduce((p, f) => p.then(() => script(f)), Promise.resolve()).catch(e => {
    loaded[k] = null;  // try again next time
    throw e;
  }));

  /* ---------- who the player is ---------- */
  const KEY = 'pg.profile', MUTE = 'pg.mute';
  const newId = () => Date.now().toString(36) + Math.floor(Math.random() * 1679616).toString(36);
  /* names and lines are plain text: no markup, no control characters, no links, runs of spaces closed up */
  const plain = (s, max) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\b(?:https?:\/\/|www\.)\S+/gi, '').replace(/\s+/g, ' ').trim().slice(0, max);

  function profile() {
    let p = load(KEY, null);
    if (!p || !p.id) {
      p = { id: newId(), name: '' };
      save(KEY, p);
    }
    return p;
  }

  /* '' when the name was taken, or why not */
  function setName(name) {
    const n = plain(name, NAME_MAX);
    if (n && dirty(n)) return 'Pick another name';
    const p = profile();
    p.name = n;
    save(KEY, p);
    return '';
  }

  /* ---------- the word filter ----------
     Words are matched whole after undoing the usual disguises (a 3 for an e, a $ for an s, letters held down);
     a short list is also looked for inside the line with the spaces taken out ("f u c k"), only words that do not
     turn up inside ordinary ones. The list is kept encoded so the file does not read as a wall of slurs. */
  const [BAD, JOINED] = JSON.parse(atob('W1siZnVjayIsICJmdWNrZXIiLCAiZnVja2VycyIsICJmdWNraW5nIiwgImZ1Y2tlZCIsICJtb3RoZXJmdWNrZXIiLCAic2hpdCIsICJzaGl0cyIsICJzaGl0dHkiLCAiYnVsbHNoaXQiLCAiYml0Y2giLCAiYml0Y2hlcyIsICJiYXN0YXJkIiwgImFzc2hvbGUiLCAiYXNzaG9sZXMiLCAiYXNzIiwgImRpY2siLCAiZGlja3MiLCAiZGlja2hlYWQiLCAiY29jayIsICJjb2NrcyIsICJwdXNzeSIsICJjdW50IiwgImN1bnRzIiwgInR3YXQiLCAid2Fua2VyIiwgInNsdXQiLCAic2x1dHMiLCAid2hvcmUiLCAid2hvcmVzIiwgInBpc3MiLCAicHJpY2siLCAiZG91Y2hlIiwgImRvdWNoZWJhZyIsICJuaWdnZXIiLCAibmlnZ2VycyIsICJuaWdnYSIsICJuaWdnYXMiLCAiZmFnZ290IiwgImZhZ2dvdHMiLCAiZmFnIiwgImZhZ3MiLCAicmV0YXJkIiwgInJldGFyZHMiLCAicmV0YXJkZWQiLCAic3BpYyIsICJzcGljcyIsICJjaGluayIsICJjaGlua3MiLCAia2lrZSIsICJraWtlcyIsICJ3ZXRiYWNrIiwgIndldGJhY2tzIiwgInRyYW5ueSIsICJ0cmFubmllcyIsICJkeWtlIiwgImR5a2VzIiwgImdvb2siLCAiZ29va3MiLCAiY29vbiIsICJjb29ucyIsICJiZWFuZXIiLCAiYmVhbmVycyIsICJyYWdoZWFkIiwgInRvd2VsaGVhZCIsICJwYWtpIiwgInJhcGUiLCAicmFwZWQiLCAicmFwaXN0IiwgInBvcm4iLCAicG9ybm8iLCAiY3VtIiwgImppenoiLCAiZGlsZG8iLCAiYmxvd2pvYiIsICJoYW5kam9iIiwgImt5cyIsICJuYXppIl0sIFsiZnVjayIsICJjdW50IiwgIm5pZ2ciLCAiZmFnZ290IiwgImtpbGx5b3Vyc2VsZiIsICJraWxsdXJzZWxmIiwgIm1vdGhlcmYiLCAicmFwaXN0Il1d'));
  const BADSET = new Set(BAD);
  const unmask = s => s.toLowerCase().replace(/[@4]/g, 'a').replace(/3/g, 'e').replace(/[1!|]/g, 'i').replace(/0/g, 'o').replace(/[$5]/g, 's').replace(/7/g, 't');
  const squeeze = w => w.replace(/(.)\1+/g, '$1');  // "shiiit" and "fuuuck"
  const badWord = w => {
    if (!w) return false;
    for (const v of [w, squeeze(w)]) if (BADSET.has(v) || BADSET.has(v.replace(/(?:es|s|ed|ing|er|ers)$/, ''))) return true;
    return false;
  };
  /* one word as typed, its punctuation dropped ("sh!t", "f.u.c.k"); a hyphenated word is one word ("ass-istant" is fine) */
  const badTok = w => {
    const t = unmask(w).replace(/[^a-z]/g, '');
    return badWord(t) || JOINED.some(j => t.includes(j) || squeeze(t).includes(squeeze(j)));
  };
  const SPACED = /\b([a-z])[\s._*-]+(?=[a-z]\b)/g;  // letters typed apart, "f u c k", are put back together first
  const PHRASE = /k+i+l+\s*(?:y+o+u+r+|u+r+)\s*s+e+l+f/;
  const dirty = s => {
    const t = unmask(s).replace(SPACED, '$1');
    return PHRASE.test(t) || t.split(/\s+/).some(badTok);
  };
  /* a line that got past another phone's filter: its bad words drawn as dots */
  const clean = s => (dirty(s) ? s.replace(/\S+/g, w => (badTok(w) ? '•'.repeat(Math.min(6, w.length)) : w)) : s);

  /* ---------- mutes, kept on this phone ---------- */
  const mutes = () => load(MUTE, {}) || {};
  const muted = uid => !!mutes()[uid];
  function mute(uid, name) {
    const m = mutes();
    m[uid] = name || '';
    save(MUTE, m);
  }
  const unmuteAll = () => save(MUTE, {});

  /* ---------- the chat's service: Firebase ----------
     A backend is { start(handlers) -> Promise<uid>, send(msg) -> Promise, report(msg) -> Promise, stop() };
     handlers: msg(m), gone(key), count(n), state('live' | 'connecting' | 'off'). Tests may swap in their own. */
  const EMU = () => window.PG_FB_EMU || null;  // a test hook: { auth: 'http://127.0.0.1:9099', host: '127.0.0.1', port: 9000, config }
  const config = () => (EMU() && EMU().config) || FIREBASE;

  function firebaseBackend() {
    let db = null, uid = null, q = null, conn = null, pres = null;
    const fb = () => window.firebase;
    return {
      async start(h) {
        await libs('fb');
        const F = fb(), e = EMU();
        let app = F.apps.find(a => a.name === 'pg');
        const first = !app;
        if (first) app = F.initializeApp(config(), 'pg');
        const auth = app.auth();
        db = app.database();
        if (first && e) {
          auth.useEmulator(e.auth, { disableWarnings: true });
          db.useEmulator(e.host, e.port);
        }
        db.goOnline();
        let user = await new Promise(r => {
          const off = auth.onAuthStateChanged(u => {
            off();
            r(u);
          });
        });
        if (!user) user = (await auth.signInAnonymously()).user;
        uid = user.uid;
        q = db.ref('chat/global').orderByChild('at').limitToLast(KEEP);
        q.on('child_added', s => h.msg(Object.assign({ key: s.key }, s.val())));
        q.on('child_removed', s => h.gone(s.key));  // taken down in the console, or past the last fifty
        pres = db.ref('presence/' + uid);
        conn = db.ref('.info/connected');
        conn.on('value', s => {
          if (s.val()) {
            pres.onDisconnect().remove();
            pres.set(true);
            h.state('live');
          } else h.state('connecting');
        });
        db.ref('presence').on('value', s => h.count(s.numChildren()));
        return uid;
      },
      send(m) {
        const TS = fb().database.ServerValue.TIMESTAMP, key = db.ref('chat/global').push().key;
        return db.ref().update({ ['chat/global/' + key]: { uid, name: m.name, text: m.text, at: TS }, ['last/' + uid]: TS });
      },
      report(m) {
        return db.ref('reports').push({ by: uid, uid: String(m.uid).slice(0, 64), msg: String(m.key).slice(0, 64), text: String(m.text).slice(0, TEXT_MAX), at: fb().database.ServerValue.TIMESTAMP });
      },
      stop() {
        if (!db) return;
        if (q) q.off();
        if (conn) conn.off();
        db.ref('presence').off();
        if (pres) pres.remove().catch(() => {});
        db.goOffline();
        q = conn = pres = null;
      },
      pause: () => db && db.goOffline(),
      resume: () => db && db.goOnline()
    };
  }

  let backend = null, live = null, lastSent = 0;
  const CH = { list: [], uid: null, state: 'off', count: 0 };

  /* ---------- the Online screen ---------- */
  const COLORS = ['#4c9aff', '#ff5a6b', '#2fd6c1', '#a58bff', '#ff8437', '#5fd38d', '#ef6ad0', '#7fb2ff'];
  const colorOf = id => COLORS[[...String(id)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % COLORS.length];
  const initials = n => (n.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('') || '?').toUpperCase();
  const clock = at => new Date(at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  function stateHtml() {
    if (!config()) return '<i class="off"></i><b>Not set up</b>';
    if (CH.state === 'live') return `<i class="on"></i><b>${CH.count || 1} online</b>`;
    if (CH.state === 'connecting') return '<i></i><b>Connecting</b>';
    return '<i class="off"></i><b>Offline</b>';
  }

  function msgHtml(m) {
    const me = m.uid === CH.uid, name = plain(m.name, NAME_MAX) || 'Player', text = clean(plain(m.text, TEXT_MAX));
    return `<div class="msg${me ? ' me' : ''}" data-k="${esc(m.key)}"><span class="av" style="--c:${colorOf(m.uid)};color:${PG.inkOn(colorOf(m.uid))}">${esc(initials(name))}</span><div><b>${esc(name)}<small>${m.at ? clock(m.at) : ''}</small></b><p>${esc(text)}</p></div>${me ? '' : `<button class="mact" data-k="${esc(m.key)}" aria-label="Mute or report">⋯</button>`}</div>`;
  }

  function drawLog(stick) {
    const log = $('#clog');
    if (!log) return;
    const near = stick || log.scrollHeight - log.scrollTop - log.clientHeight < 60;
    const shown = CH.list.filter(m => !muted(m.uid));
    log.innerHTML = shown.length ? shown.map(msgHtml).join('') : `<p class="cempty">${config() ? (CH.state === 'live' ? 'No messages yet. Say hello.' : '') : 'The chat opens once its service is connected.'}</p>`;
    if (near) log.scrollTop = log.scrollHeight;
  }

  const drawState = () => {
    const s = $('#ost');
    if (s) s.innerHTML = stateHtml();
  };
  const note = t => {
    const n = $('#cnote');
    if (n) n.textContent = t || '';
  };

  function stop() {
    if (live) live.stop();
    live = null;
    CH.state = 'off';
    CH.list = [];
  }

  async function startChat() {
    if (!config() || live) return;
    live = backend || firebaseBackend();
    CH.state = 'connecting';
    drawState();
    const mine = live;
    try {
      CH.uid = await live.start({
        msg: m => {
          if (live !== mine || !m || typeof m.text !== 'string') return;
          CH.list.push(m);
          CH.list.sort((a, b) => (a.at || 0) - (b.at || 0));
          if (CH.list.length > KEEP) CH.list.splice(0, CH.list.length - KEEP);
          drawLog();
        },
        gone: key => {
          if (live !== mine) return;
          CH.list = CH.list.filter(m => m.key !== key);
          drawLog();
        },
        count: n => {
          CH.count = n;
          drawState();
        },
        state: s => {
          if (live !== mine) return;
          CH.state = s;
          drawState();
          drawLog();
        }
      });
      drawLog(true);
    } catch (e) {
      if (live === mine) {
        live = null;
        CH.state = 'off';
        drawState();
        note('Could not reach the chat. Check the connection.');
      }
    }
  }

  function send() {
    const box = $('#ctext'), p = profile(), t = plain(box.value, TEXT_MAX), now = Date.now();
    if (!live || CH.state !== 'live') return note('Not connected');
    if (!p.name) {
      $('#onName').focus();
      return note('Pick a name first');
    }
    if (!t) return;
    if (dirty(t)) return note('Keep it clean');
    if (now - lastSent < EVERY) return note('One at a time');
    lastSent = now;
    note('');
    box.value = '';
    live.send({ name: p.name, text: t }).catch(() => note('Not sent'));
  }

  function actions(key) {
    const m = CH.list.find(x => x.key === key), row = document.querySelector(`.msg[data-k="${CSS.escape(key)}"]`);
    if (!m || !row) return;
    const open = row.nextElementSibling && row.nextElementSibling.classList.contains('mrow2');
    document.querySelectorAll('.mrow2').forEach(r => r.remove());
    if (open) return;
    row.insertAdjacentHTML('afterend', `<div class="mrow2"><button class="btn2" id="mMute">Mute ${esc(plain(m.name, NAME_MAX) || 'player')}</button><button class="btn2" id="mRep">Report</button></div>`);
    $('#mMute').onclick = () => {
      mute(m.uid, m.name);
      PG.toast('Muted on this phone');
      drawLog();
      drawMuted();
    };
    $('#mRep').onclick = () => {
      document.querySelectorAll('.mrow2').forEach(r => r.remove());
      if (live && live.report) live.report(m).then(() => PG.toast('Reported. Thanks.'), () => PG.toast('Report not sent'));
    };
  }

  function drawMuted() {
    const n = Object.keys(mutes()).length, el = $('#cmuted');
    if (!el) return;
    el.innerHTML = n ? `<button class="chip" id="cunm">${n} muted · Unmute all</button>` : '';
    if (n) $('#cunm').onclick = () => {
      unmuteAll();
      drawLog();
      drawMuted();
    };
  }

  function open() {
    PG.toMenu();
    const p = profile();
    scr.innerHTML = `<div class="menu solid fill onl"><button class="back" id="bk">‹ Menu</button>
  <div class="onh"><h1 class="sm">Online</h1><span class="ost" id="ost">${stateHtml()}</span></div>
  <div class="onn"><span class="av" style="--c:${colorOf(p.id)};color:${PG.inkOn(colorOf(p.id))}" id="onAv">${esc(initials(p.name || '?'))}</span><input id="onName" maxlength="${NAME_MAX}" placeholder="Your name" value="${esc(p.name)}" autocomplete="off" autocapitalize="words" spellcheck="false" aria-label="Your name"></div>
  <h2>Global chat</h2>
  <div class="clog" id="clog"></div>
  <div id="cmuted"></div>
  ${config() ? `<form class="csend" id="csend"><input id="ctext" maxlength="${TEXT_MAX}" placeholder="Message" autocomplete="off" enterkeyhint="send" aria-label="Message"><button class="go sm" id="cgo">Send</button></form>` : ''}
  <p class="note" id="cnote"></p></div>`;
    $('#bk').onclick = () => {
      stop();
      PG.showMenu();
    };
    const nm = $('#onName');
    nm.onchange = () => {
      const why = setName(nm.value);
      note(why);
      if (why) nm.value = profile().name;
      $('#onAv').textContent = initials(profile().name || '?');
    };
    if ($('#csend')) $('#csend').onsubmit = e => {
      e.preventDefault();
      send();
    };
    $('#clog').onclick = e => {
      const b = e.target.closest('.mact');
      if (b) actions(b.dataset.k);
    };
    drawLog(true);
    drawMuted();
    startChat();
  }

  /* the newest lines stay in sight when the screen changes size (the keyboard coming up, a phone turned) */
  addEventListener('resize', () => {
    const l = $('#clog');
    if (l) l.scrollTop = l.scrollHeight;
  });

  /* the chat lets its place go while the phone is in the background, and leaves when its screen is gone */
  document.addEventListener('visibilitychange', () => {
    if (!live) return;
    if (!$('#clog')) return stop();
    if (document.hidden) live.pause && live.pause();
    else live.resume && live.resume();
  });

  PG.online = {
    profile, setName, plain, dirty, clean, open, libs, config,
    emu: () => EMU(),
    ready: () => !!config(),
    get chat() {
      return CH;
    },
    /* test hooks */
    test: {
      backend(b) {
        stop();
        backend = b || null;
      },
      stop,
      send(t) {
        const box = $('#ctext');
        if (box) box.value = t;
        lastSent = 0;
        send();
      }
    }
  };
})();
