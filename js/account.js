/* PocketFootball: accounts. Exposes PG.account.
   An account is an email address and a password on the game's Firebase project (the same one the chat uses), and it
   keeps a copy of your save, so a cleared browser does not lose a career and a new phone picks up where the old one
   left off. Everything else still works without one.
   
   - Signing up while the chat has you signed in anonymously links the two: your chat name, mutes and reports stay yours.
   - The copy is the whole save (careers, seasons, milestones, settings), gzipped when the browser can, at football/<your id>
     (the owner's other Pocket games share the project and keep theirs elsewhere; the account itself is one for all). It goes
   up a few seconds after the game saves and when the app goes to the background. The database's rules let only you
   read or write it, and only signed in with a password, Google or GitHub (docs/ACCOUNTS.md, docs/firebase-rules.json).
   - Coming down, it is checked the way an imported file is (PG.saves.check): it is data, not code.
   - Two phones that both played since they last agreed: you choose which save to keep, and are told what each holds.
   Nothing touches the network until you open the Account page or an account is already signed in on this phone. */
(function () {
  const PG = window.PG, $ = s => document.querySelector(s);
  const load = (k, d) => {
    try {
      const v = localStorage.getItem(k);
      return v == null ? d : JSON.parse(v);
    } catch (e) {
      return d;
    }
  };
  const save = (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {
      /* storage full or off */
    }
  };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const KEY = 'pg.acct', DEV = 'pg.acct.dev';  // { uid, email, name, synced: the cloud copy's time this phone last agreed with }
  const dev = () => {
    let d = load(DEV, null);
    if (!d) {
      d = Date.now().toString(36) + Math.floor(Math.random() * 1e9).toString(36);
      save(DEV, d);
    }
    return d;
  };
  const plain = (s, n) => (PG.online && PG.online.plain ? PG.online.plain(s, n) : String(s || '').replace(/[<>]/g, '').trim().slice(0, n));
  const when = t => {
    if (!t) return 'never';
    const d = new Date(t), now = new Date(), same = d.toDateString() === now.toDateString();
    return same ? 'today, ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  /* ---------- the service: Firebase ----------
     A backend: { init() -> Promise<user|null>, signUp(name, email, pw), signIn(email, pw), signOut(), reset(email),
     oauth('google' | 'github'), verify(), refresh(), rename(name), del(pw), pull(uid) -> {at, dev, z, data}|null, push(uid, rec), onUser(fn) }; a user is { uid, email,
     name, verified, created, via (sign-in methods) }. Errors carry a code (auth/..., or 'denied'). Tests swap in their own (a page opened with ?test only). */
  function firebaseBackend() {
    let app = null, auth = null, db = null;
    const F = () => window.firebase, U = u => {
      if (!u || u.isAnonymous) return null;
      const via = (u.providerData || []).map(p => p.providerId), sso = via.includes('google.com') || via.includes('github.com');
      return { uid: u.uid, email: u.email || '', name: u.displayName || '', verified: !!u.emailVerified || sso, created: u.metadata && Date.parse(u.metadata.creationTime) || 0, via };
    };
    const provider = k => {
      const P = k === 'github' ? new (F().auth.GithubAuthProvider)() : new (F().auth.GoogleAuthProvider)();
      if (k === 'google') P.setCustomParameters({ prompt: 'select_account' });
      return P;
    };
    const denied = e => {
      const c = String((e && (e.code || e.message)) || '');
      if (/permission/i.test(c)) {
        const x = new Error('denied');
        x.code = 'denied';
        throw x;
      }
      throw e;
    };
    return {
      async init() {
        const cfg = PG.online && PG.online.config();
        if (!cfg) {
          const e = new Error('off');
          e.code = 'off';
          throw e;
        }
        await PG.online.libs('fb');
        app = F().apps.find(a => a.name === 'pg');
        const first = !app;
        if (first) app = F().initializeApp(cfg, 'pg');
        auth = app.auth();
        db = app.database();
        const em = PG.online.emu && PG.online.emu();
        if (first && em) {
          auth.useEmulator(em.auth, { disableWarnings: true });
          db.useEmulator(em.host, em.port);
        }
        const u = await new Promise(r => {
          const off = auth.onAuthStateChanged(x => {
            off();
            r(x);
          });
        });
        return U(u);
      },
      async signUp(name, email, pw) {
        const cur = auth.currentUser, cred = F().auth.EmailAuthProvider.credential(email, pw);
        const r = cur && cur.isAnonymous ? await cur.linkWithCredential(cred) : await auth.createUserWithEmailAndPassword(email, pw);
        await r.user.updateProfile({ displayName: name });
        r.user.sendEmailVerification().catch(() => {});
        return U(r.user);
      },
      /* Google or GitHub, in a pop-up window. A chat that has you signed in anonymously is linked, as signing up does */
      async oauth(k) {
        const P = provider(k), cur = auth.currentUser;
        let r;
        if (cur && cur.isAnonymous) {
          try {
            r = await cur.linkWithPopup(P);
          } catch (e) {
            if ((e.code === 'auth/credential-already-in-use' || e.code === 'auth/email-already-in-use') && e.credential) r = await auth.signInWithCredential(e.credential);
            else throw e;
          }
        } else r = await auth.signInWithPopup(P);
        const u = r.user, info = r.additionalUserInfo || {};
        if (!u.displayName && (info.username || (info.profile && info.profile.login))) await u.updateProfile({ displayName: String(info.username || info.profile.login) }).catch(() => {});
        return Object.assign(U(u), { isNew: !!info.isNewUser });
      },
      async signIn(email, pw) {
        return U((await auth.signInWithEmailAndPassword(email, pw)).user);
      },
      async rename(name) {
        const u = auth.currentUser;
        if (!u) return;
        await u.updateProfile({ displayName: name });
        db.goOnline();
        await db.ref('accounts/' + u.uid).set({ name, at: Date.now() }).catch(denied);
        await db.ref('football/' + u.uid + '/name').set(name).catch(() => {});  // no copy yet: nothing to rename
      },
      signOut: () => auth.signOut(),
      reset: email => auth.sendPasswordResetEmail(email),
      verify: () => auth.currentUser && auth.currentUser.sendEmailVerification(),
      async refresh() {
        if (auth.currentUser) {
          await auth.currentUser.reload();
          return U(auth.currentUser);
        }
        return null;
      },
      async del(pw) {
        const u = auth.currentUser;
        if (!u) return;
        if (pw) await u.reauthenticateWithCredential(F().auth.EmailAuthProvider.credential(u.email, pw));
        else {
          const v = (u.providerData || []).map(p => p.providerId);
          if (v.includes('google.com')) await u.reauthenticateWithPopup(provider('google'));
          else if (v.includes('github.com')) await u.reauthenticateWithPopup(provider('github'));
        }
        await db.ref().update({ ['football/' + u.uid]: null, ['saves/' + u.uid]: null, ['soccer/' + u.uid]: null, ['accounts/' + u.uid]: null }).catch(denied);  // the account is one for all the Pocket games on this project: deleting it takes each game's copy with it
        await u.delete();
      },
      async pull(uid) {
        db.goOnline();
        try {
          const s = await db.ref('football/' + uid).once('value');
          return s.val();
        } catch (e) {
          return denied(e);
        }
      },
      async push(uid, rec) {
        db.goOnline();
        try {
          await db.ref().update({ ['football/' + uid]: rec, ['accounts/' + uid]: { name: rec.name, at: rec.at } });
        } catch (e) {
          return denied(e);
        }
      },
      onUser(fn) {
        if (auth) auth.onAuthStateChanged(u => fn(U(u)));
      }
    };
  }

  /* ---------- packing a save ---------- */
  const b64 = buf => {
    let s = '';
    const a = new Uint8Array(buf);
    for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000));
    return btoa(s);
  };
  const unb64 = t => {
    const s = atob(t), a = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i);
    return a;
  };
  async function pack(text) {
    if (window.CompressionStream) {
      try {
        const buf = await new Response(new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();
        return { z: 1, data: b64(buf) };
      } catch (e) {
        /* plain below */
      }
    }
    return { z: 0, data: text };
  }

  async function unpack(rec) {
    if (!rec || typeof rec.data !== 'string' || rec.data.length > 9e6) return null;
    if (!rec.z) return rec.data;
    if (!window.DecompressionStream) return null;
    try {
      return await new Response(new Blob([unb64(rec.data)]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
    } catch (e) {
      return null;
    }
  }

  /* ---------- state ---------- */
  let be = null, ready = null, user = null, busy = false, pushT = 0, lastErr = '', conflict = null, offer = null;
  const A = () => load(KEY, {}) || {};
  const setA = o => save(KEY, Object.assign(A(), o));
  const backend = () => be || (be = firebaseBackend());

  function start() {
    if (!ready) ready = backend().init().then(u => {
      user = u;
      if (u) setA({ uid: u.uid, email: u.email, name: u.name, since: u.created || A().since });
      backend().onUser(x => {
        user = x;
        if (x) refreshTop();
      });
      return u;
    }).catch(e => {
      ready = null;
      throw e;
    });
    return ready;
  }

  /* what the cloud holds against what this phone holds: copy up, offer it down, or ask */
  async function sync(why) {
    if (!user || busy) return;
    busy = true;
    lastErr = '';
    try {
      const rec = await backend().pull(user.uid), a = A(), localAt = PG.saves.changed(), hasLocal = PG.saves.summary().players > 0;
      if (!rec || !rec.at) {
        await upload();
        return;
      }
      /* an account copy with no careers in it (made by signing in on a phone that had none) is nothing to keep:
         this phone's careers go up over it without asking */
      if (hasLocal && rec.players === 0) {
        await upload();
        return;
      }
      /* a phone that has never agreed with this account counts its careers as new: they are never overwritten without asking */
      const agreed = !!a.synced && a.uid === user.uid, cloudNewer = rec.at > (agreed ? a.synced : 0), localNewer = agreed ? localAt > a.synced : hasLocal;
      if (!cloudNewer) {
        if (localNewer || why === 'now') await upload();
        return;
      }
      /* the cloud has moved on since this phone last agreed with it */
      if (!hasLocal || (!localNewer && rec.dev !== dev())) {
        offer = rec;
        if (!hasLocal || why === 'signin') await take(rec);
        return;
      }  // nothing here to lose: it comes down; otherwise it is offered
      if (rec.dev === dev()) {
        await upload();
        return;
      }
      conflict = rec;
    } catch (e) {
      lastErr = msg(e);
    } finally {
      busy = false;
    }
  }

  async function upload() {
    const o = PG.saves.collect(), text = JSON.stringify({ pocketFootball: 1, at: new Date().toISOString(), data: o }), p = await pack(text), at = Date.now();
    const sum = PG.saves.summary();
    await backend().push(user.uid, { at, dev: dev(), z: p.z, data: p.data, name: plain(user.name || '', 24), players: sum.players, who: (sum.names || []).slice(0, 3).map(n => plain(n, 30)) });
    setA({ synced: at, up: at });
    conflict = null;
    offer = null;
    refreshTop();
  }

  /* the cloud copy onto this phone: checked like an imported file, then the page starts over on it */
  async function take(rec) {
    const text = await unpack(rec);
    let o = null;
    try {
      o = JSON.parse(text);
    } catch (e) {
      /* not a save */
    }
    const data = o && PG.saves.check(o);
    if (!data) {
      lastErr = 'The copy in your account could not be read.';
      return false;
    }
    if (!PG.saves.apply(data)) {
      lastErr = 'This phone ran out of room for your save.';
      return false;
    }
    try {
      localStorage.setItem('pg.acct.changed', String(rec.at));
    } catch (e) {
      /* fine */
    }
    setA({ synced: rec.at, up: rec.at });
    conflict = null;
    offer = null;
    save('pg.acct.loaded', 1);
    location.reload();
    return true;
  }

  function saved() {
    if (!user) return;
    clearTimeout(pushT);
    pushT = setTimeout(() => {
      if (!conflict) sync('save');
    }, 4000);
  }

  const MSG = {
    'auth/email-already-in-use': 'That email already has an account. Sign in instead.', 'auth/invalid-email': 'That does not look like an email address.',
    'auth/weak-password': 'Use at least 8 characters for the password.', 'auth/wrong-password': 'The email or password is not right.', 'auth/user-not-found': 'The email or password is not right.',
    'auth/invalid-credential': 'The email or password is not right.', 'auth/invalid-login-credentials': 'The email or password is not right.', 'auth/too-many-requests': 'Too many tries. Wait a few minutes and try again.',
    'auth/network-request-failed': 'No connection. Try again when you are online.', 'auth/requires-recent-login': 'For that, type your password again.',
    'auth/operation-not-allowed': 'Accounts are not switched on for this game yet.', 'auth/credential-already-in-use': 'That email already has an account. Sign in instead.',
    'auth/popup-blocked': 'Your browser blocked the sign-in window. Allow pop-ups for this site and try again.',
    'auth/account-exists-with-different-credential': 'That email already has an account here. Sign in with your email and password.',
    'auth/unauthorized-domain': 'Signing in is not allowed from this address.', 'auth/web-storage-unsupported': 'This browser is blocking what sign-in needs. Try it outside private browsing.',
    'auth/operation-not-supported-in-this-environment': 'This browser cannot open the sign-in window. Use your email and password.',
    denied: 'Saves in accounts are not switched on for this game yet. Your account works; your save stays on this phone for now.', off: 'Accounts are not set up for this game.'
  };
  const msg = e => MSG[(e && e.code) || ''] || (e && /network|offline|fetch/i.test(String(e.message)) ? MSG['auth/network-request-failed'] : 'Something went wrong. Try again.');

  /* ---------- the Account page ----------
     Signed out: what an account is for, a Create / Sign in switch, fields that say what is wrong with them as you type,
     a password strength bar, a caps lock warning, and a reset screen of its own. Signed in: who you are and since when,
     whether your save is in your account right now, and the account's settings (name, password, sign out, delete). */
  let back = null, mode = 'up', sent = '';
  const LAST = 'pg.acct.last';  // the email last used on this phone, typed in for you next time
  const I = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const IC = {
    cloud: I('<path d="M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.1 9.2 4.5 4.5 0 0 0 7 18z"/>'),
    phone: I('<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>'),
    chat: I('<path d="M4 5h16v11H9l-5 4z"/>'),
    lock: I('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
    mail: I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>'),
    user: I('<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/>'),
    check: I('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
    key: I('<circle cx="8" cy="15" r="4"/><path d="m11 12 8-8M16 7l2 2"/>'),
    out: I('<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-4-4 4-4M6 12h10"/>'),
    bin: I('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
    pen: I('<path d="M4 20h4L19 9l-4-4L4 16z"/>'),
    sync: I('<path d="M20 11a8 8 0 0 0-14.5-4.5M4 4v3h3M4 13a8 8 0 0 0 14.5 4.5M20 20v-3h-3"/>'),
    wifi: I('<path d="M2 8.5a15 15 0 0 1 20 0M5.5 12a10 10 0 0 1 13 0M9 15.5a5 5 0 0 1 6 0M12 19h.01"/><path d="M3 3l18 18"/>'),
    shield: I('<path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6z"/>'),
    google: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3zM12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22zM6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2zM12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10c.8-2.3 3-4.1 5.6-4.1z"/></svg>',
    github: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 2.9.8.1-.7.4-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0 0 12 2z"/></svg>'
  };
  const viaName = u => {
    const v = (u && u.via) || [];
    return v.includes('google.com') ? 'Google' : v.includes('github.com') ? 'GitHub' : '';
  };
  const hasPw = u => !u || !Array.isArray(u.via) || !u.via.length || u.via.includes('password');

  function page(html, cls) {
    const s = $('#screen');
    s.innerHTML = `<div class="menu read"><div class="acct${cls ? ' ' + cls : ''}"><button class="back" id="bk">‹ Menu</button>${html}</div></div>`;
    s.firstChild.scrollTop = 0;
    $('#bk').onclick = () => (back ? back() : PG.showMenu());
  }

  const note = (t, ok) => {
    const n = $('#anote');
    if (n) {
      n.textContent = t || '';
      n.className = 'anote' + (ok ? ' ok' : '');
    }
  };
  const lock = on => {
    for (const b of document.querySelectorAll('.acct button, .acct input')) if (b.id !== 'bk') b.disabled = !!on;
    const g = $('#ago');
    if (g) g.classList.toggle('busy', !!on && !document.querySelector('.asoc.busy'));
    if (!on) document.querySelectorAll('.asoc.busy').forEach(b => b.classList.remove('busy'));
  };
  const offline = () => typeof navigator !== 'undefined' && navigator.onLine === false;
  const offBar = () => offline() ? `<div class="aoff">${IC.wifi}<span>You are offline. Signing in needs a connection; your careers are safe on this phone.</span></div>` : '';
  const okEmail = em => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em);

  /* how strong a new password is: 0 to 4, and a word for it */
  function strength(pw) {
    if (!pw) return [0, ''];
    let s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
    if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
    else if (/\d|[^A-Za-z0-9]/.test(pw)) s += .5;
    if (pw.length < 8) s = Math.min(s, 1);
    if (/^(.)\1+$/.test(pw) || /^(password|12345678|qwerty)/i.test(pw)) s = 0.5;
    s = Math.max(1, Math.min(4, Math.round(s)));
    return [s, pw.length < 8 ? 'Too short' : ['', 'Weak', 'Okay', 'Good', 'Strong'][s]];
  }

  const status = () => {
    // the save against the account: 'ok', 'wait', 'conflict', 'off'
    if (!user) return '';
    if (conflict) return 'conflict';
    if (offline()) return 'off';
    const a = A();
    return (a.synced || 0) >= PG.saves.changed() && a.synced ? 'ok' : 'wait';
  };
  const initials = s => {
    const w = String(s || '?').replace(/@.*/, '').trim().split(/[\s._-]+/).filter(Boolean);
    return ((w[0] || '?')[0] + (w[1] ? w[1][0] : (w[0] || '').slice(1, 2))).toUpperCase();
  };

  async function open(from) {
    if (from) back = from;
    page(`<div class="ahero load"><span class="aic">${IC.cloud}</span><h2>Account</h2><p class="amute">Connecting…</p></div><div class="acard askel"><i></i><i></i><i></i></div>`);
    try {
      await start();
    } catch (e) {
      page(`<div class="ahero"><span class="aic warn">${offline() ? IC.wifi : IC.cloud}</span><h2>Can't reach accounts</h2><p class="amute">${esc(offline() ? 'You are offline right now.' : msg(e))}</p></div>
        <button class="abig" id="aretry">Try again</button><p class="afine acenter">Everything else in the game works without an account. Your careers are kept on this phone.</p>`);
      $('#aretry').onclick = () => open();
      return;
    }
    if (user) {
      draw();
      sync('open').then(() => {
        if ($('.acct.ain') && user) draw();
      });
    } else draw();
  }

  function draw() {
    if (!user && mode === 'reset') return drawReset();
    if (!user) return drawForm();
    if (mode === 'welcome') return drawWelcome();
    return drawSignedIn();
  }

  function drawForm() {
    const up = mode === 'up', last = load(LAST, '') || '';
    page(`${offBar()}<div class="ahero"><span class="aic">${up ? IC.cloud : IC.user}</span><h2>${up ? 'Keep your career safe' : 'Welcome back'}</h2>
        <p class="amute">${up ? 'A free account keeps a copy of your save.' : 'Sign in and your save comes with you.'}</p></div>
      ${up ? `<ul class="aperks"><li>${IC.shield}<span><b>Never lose a career</b>clearing the browser no longer erases it</span></li><li>${IC.phone}<span><b>Play on any phone</b>sign in and pick up where you left off</span></li><li>${IC.chat}<span><b>One name everywhere</b>your chat name, mutes and reports stay yours</span></li></ul>` : ''}
      <div class="aseg${up ? '' : ' r'}" role="tablist"><i></i><button data-m="up" role="tab" aria-selected="${up}" class="${up ? 'on' : ''}">Create account</button><button data-m="in" role="tab" aria-selected="${!up}" class="${up ? '' : 'on'}">Sign in</button></div>
      <div class="acard aform"><div class="asso"><button type="button" class="asoc g" data-sso="google">${IC.google}<span>Continue with Google</span><u></u></button><button type="button" class="asoc gh" data-sso="github">${IC.github}<span>Continue with GitHub</span><u></u></button></div>
        <p class="aor"><span>or with your email</span></p><form id="aform" autocomplete="on" novalidate>
        ${up ? `<div class="afield" data-f="name"><label for="aname">Name <small>what the chat and your friends see</small></label><div class="abox">${IC.user}<input id="aname" maxlength="16" autocomplete="nickname" placeholder="Your name" value="${esc((PG.online && PG.online.profile().name) || '')}"><em class="acount">0/16</em></div><p class="aerr"></p></div>` : ''}
        <div class="afield" data-f="email"><label for="aemail">Email</label><div class="abox">${IC.mail}<input id="aemail" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" placeholder="you@example.com" value="${esc(up ? '' : last)}"><span class="aok">${IC.check}</span></div><p class="aerr"></p></div>
        <div class="afield" data-f="pw"><label for="apw">Password ${up ? '<small>8 characters or more</small>' : ''}</label><div class="abox">${IC.lock}<input id="apw" type="password" autocomplete="${up ? 'new-password' : 'current-password'}" placeholder="${up ? 'Make one up' : 'Your password'}"><button type="button" class="apeek" id="apeek" aria-label="Show the password">Show</button></div>
          ${up ? '<div class="astr" data-s="0"><i></i><i></i><i></i><i></i><span></span></div>' : ''}<p class="acaps" hidden>Caps Lock is on</p><p class="aerr"></p></div>
        <button class="abig ago" id="ago" type="submit"><span>${up ? 'Create account' : 'Sign in'}</span><u></u></button>
        ${up ? '' : '<button type="button" class="alink" id="aforgot">Forgot your password?</button>'}
      </form><p id="anote" class="anote" role="status"></p></div>
      <p class="afine acenter">${up ? `Already have one? <button type="button" class="alink in" data-m="in">Sign in</button>` : `New here? <button type="button" class="alink in" data-m="up">Create an account</button>`}</p>
      <p class="afine aprv">${IC.lock}<span>${up ? 'It holds your email address, your name and your save, nothing else. Nothing is sold and there are no ads. You can delete it whenever you like.' : 'If this phone has careers of its own that are not in your account, you choose which to keep. Nothing is overwritten without asking.'}</span></p>`, up ? 'aup' : 'ain0');
    document.querySelectorAll('[data-m]').forEach(b => b.onclick = () => {
      mode = b.dataset.m;
      draw();
    });
    const field = (f, err) => {
      const el = document.querySelector(`.afield[data-f="${f}"]`);
      if (!el) return;
      el.classList.toggle('bad', !!err);
      el.querySelector('.aerr').textContent = err || '';
    };
    const em = $('#aemail'), pw = $('#apw'), nm = $('#aname');
    if (nm) {
      const cnt = () => {
        $('.acount').textContent = nm.value.length + '/16';
      };
      cnt();
      nm.oninput = () => {
        cnt();
        field('name', '');
      };
    }
    em.oninput = () => {
      field('email', '');
      em.closest('.afield').classList.toggle('good', okEmail(em.value.trim()));
    };
    em.onblur = () => {
      const v = em.value.trim();
      if (v && !okEmail(v)) field('email', MSG['auth/invalid-email']);
    };
    em.oninput();
    pw.oninput = () => {
      field('pw', '');
      const s = $('.astr');
      if (s) {
        const [n, w] = strength(pw.value);
        s.dataset.s = n;
        s.querySelector('span').textContent = w;
      }
    };
    const caps = ev => {
      const c = ev.getModifierState && ev.getModifierState('CapsLock');
      const p = $('.acaps');
      if (p) p.hidden = !c;
    };
    pw.addEventListener('keydown', caps);
    pw.addEventListener('keyup', caps);
    $('#apeek').onclick = () => {
      pw.type = pw.type === 'password' ? 'text' : 'password';
      $('#apeek').textContent = pw.type === 'password' ? 'Show' : 'Hide';
      pw.focus();
    };
    document.querySelectorAll('[data-sso]').forEach(b => b.onclick = () => sso(b.dataset.sso, b));
    if ($('#aforgot')) $('#aforgot').onclick = () => {
      sent = '';
      mode = 'reset';
      save(LAST, em.value.trim() || last);
      draw();
    };
    $('#aform').onsubmit = async ev => {
      ev.preventDefault();
      const e = em.value.trim(), p = pw.value, n = up ? plain(nm.value, 16) : '';
      let bad = false;
      if (up && !n) {
        field('name', 'Pick a name.');
        bad = true;
      } else if (up && PG.online && PG.online.dirty && PG.online.dirty(n)) {
        field('name', 'Pick another name.');
        bad = true;
      }
      if (!okEmail(e)) {
        field('email', e ? MSG['auth/invalid-email'] : 'Type your email.');
        bad = true;
      }
      if (up && p.length < 8) {
        field('pw', p ? MSG['auth/weak-password'] : 'Make up a password.');
        bad = true;
      } else if (!p) {
        field('pw', 'Type your password.');
        bad = true;
      }
      if (bad) {
        const f = document.querySelector('.afield.bad input');
        if (f) f.focus();
        return;
      }
      if (offline()) {
        note('You are offline. Try again when you have a connection.');
        return;
      }
      lock(1);
      note(up ? 'Creating your account…' : 'Signing in…', 1);
      try {
        user = up ? await backend().signUp(n, e, p) : await backend().signIn(e, p);
        save(LAST, e);
        setA({ uid: user.uid, email: user.email, name: user.name, synced: up ? 0 : A().uid === user.uid ? A().synced : 0, since: user.created || A().since || Date.now() });
        if (up && PG.online && PG.online.setName) PG.online.setName(n);
        if (!up && user.name && PG.online && PG.online.setName && !PG.online.profile().name) PG.online.setName(user.name);
        await sync(up ? 'signup' : 'signin');
        if (up) mode = 'welcome';
        else toast('Signed in as ' + (user.name || user.email));
        draw();
      } catch (x) {
        lock(0);
        note('');
        const c = x && x.code || '';
        if (/wrong-password|invalid-credential|invalid-login|user-not-found/.test(c)) {
          field('pw', MSG[c]);
          pw.select();
        } else if (/email-already-in-use|credential-already-in-use/.test(c)) {
          field('email', '');
          note('');
          const el = document.querySelector('.afield[data-f="email"] .aerr');
          el.innerHTML = `${esc(MSG[c].replace(' Sign in instead.', ''))} <button type="button" class="alink" id="ato-in">Sign in instead</button>`;
          el.parentNode.classList.add('bad');
          $('#ato-in').onclick = () => {
            save(LAST, e);
            mode = 'in';
            draw();
          };
        } else if (/invalid-email/.test(c)) field('email', MSG[c]);
        else if (/weak-password/.test(c)) field('pw', MSG[c]);
        else note(msg(x));
      }
    };
    if (!up && last) setTimeout(() => {
      if (document.activeElement === document.body && !matchMedia('(pointer:coarse)').matches) pw.focus();
    }, 50);
  }

  /* Continue with Google / GitHub: a pop-up, then the same as signing in (or up, for a new account) */
  async function sso(k, btn) {
    const name = k === 'github' ? 'GitHub' : 'Google';
    if (offline()) {
      note('You are offline. Try again when you have a connection.');
      return;
    }
    if (btn) btn.classList.add('busy');
    lock(1);
    note('Finish signing in with ' + name + ' in the window that opened.', 1);
    try {
      user = await backend().oauth(k);
      if (user.email) save(LAST, user.email);
      setA({ uid: user.uid, email: user.email, name: user.name, synced: A().uid === user.uid ? A().synced : 0, since: user.created || A().since || Date.now() });
      /* the chat shows names to everyone: only the first name goes there, and only if you have none yet */
      const first = plain(String(user.name || '').split(/\s+/)[0], 16);
      if (first && PG.online && PG.online.setName && !PG.online.profile().name && !(PG.online.dirty && PG.online.dirty(first))) PG.online.setName(first);
      await sync(user.isNew ? 'signup' : 'signin');
      if (user.isNew) mode = 'welcome';
      else {
        mode = 'in';
        toast('Signed in with ' + name);
      }
      draw();
    } catch (x) {
      lock(0);
      if (btn) btn.classList.remove('busy');
      const c = (x && x.code) || '';
      if (/popup-closed-by-user|cancelled-popup-request|user-cancelled/.test(c)) note('');
      else if (c === 'auth/operation-not-allowed') note(name + ' sign-in is not switched on yet. Use ' + (k === 'github' ? 'Google' : 'GitHub') + ' or your email for now.');
      else note(msg(x));
    }
  }

  /* forgot your password: a screen of its own, and what to do once the email is sent */
  function drawReset() {
    const last = load(LAST, '') || '';
    if (sent) {
      page(`<div class="ahero"><span class="aic ok">${IC.mail}</span><h2>Check your inbox</h2><p class="amute">If <b>${esc(sent)}</b> has an account, a link to make a new password is on its way.</p></div>
        <ol class="asteps"><li>Open the email from PocketFootball's sign-in service</li><li>Tap the link and make a new password</li><li>Come back here and sign in with it</li></ol>
        <button class="abig" id="aback">Back to sign in</button><button class="aghost asm" id="aagain">Send it again</button><p id="anote" class="anote" role="status"></p>
        <p class="afine acenter">Nothing there after a few minutes? Look in spam or junk.</p>`);
      $('#aback').onclick = () => {
        mode = 'in';
        draw();
      };
      $('#aagain').onclick = async() => {
        lock(1);
        try {
          await backend().reset(sent);
          note('Sent again.', 1);
        } catch (e) {
          note(msg(e));
        }
        lock(0);
      };
      return;
    }
    page(`${offBar()}<div class="ahero"><span class="aic">${IC.key}</span><h2>Reset your password</h2><p class="amute">Type the email you signed up with and we will send you a link to make a new one.</p></div>
      <div class="acard aform"><form id="rform" novalidate><div class="afield" data-f="email"><label for="aemail">Email</label><div class="abox">${IC.mail}<input id="aemail" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" placeholder="you@example.com" value="${esc(last)}"></div><p class="aerr"></p></div>
      <button class="abig ago" id="ago" type="submit"><span>Send the link</span><u></u></button></form><p id="anote" class="anote" role="status"></p></div>
      <p class="afine acenter"><button type="button" class="alink in" id="aback">‹ Back to sign in</button></p>`);
    $('#aback').onclick = () => {
      mode = 'in';
      draw();
    };
    $('#rform').onsubmit = async ev => {
      ev.preventDefault();
      const em = $('#aemail').value.trim(), f = document.querySelector('.afield');
      if (!okEmail(em)) {
        f.classList.add('bad');
        f.querySelector('.aerr').textContent = em ? MSG['auth/invalid-email'] : 'Type your email.';
        return;
      }
      lock(1);
      note('Sending…', 1);
      try {
        await backend().reset(em);
        save(LAST, em);
        sent = em;
        draw();
      } catch (e) {
        lock(0);
        if (e && e.code === 'auth/user-not-found') {
          save(LAST, em);
          sent = em;
          draw();
        } else note(msg(e));
      }  // never say whether an email has an account
    };
  }

  /* just signed up */
  function drawWelcome() {
    const sum = PG.saves.summary();
    page(`<div class="ahero"><span class="aic ok pop">${IC.check}</span><h2>You're in, ${esc(String(user.name || 'player').split(/\s+/)[0])}</h2><p class="amute">Your account is ready.</p></div>
      <div class="acard alist">
        <div class="arow">${IC.cloud}<span><b>${sum.players ? 'Your save is in your account' : 'Your account will keep your save'}</b>${sum.players ? `${sum.players} player${sum.players === 1 ? '' : 's'}, copied ${esc(when(A().up || A().synced))}` : 'from your first career on'}</span>${status() === 'ok' || !sum.players ? `<em class="adot ok"></em>` : '<em class="adot"></em>'}</div>
        ${user.verified ? (viaName(user) ? `<div class="arow">${IC[viaName(user).toLowerCase()]}<span><b>Signed in with ${viaName(user)}</b>${esc(user.email)}</span></div>` : '') : `<div class="arow">${IC.mail}<span><b>Confirm your email</b>we sent a link to ${esc(user.email)}</span></div>`}
        <div class="arow">${IC.phone}<span><b>On another phone</b>open the game there and sign in ${viaName(user) ? 'with ' + viaName(user) : 'with this email'}</span></div>
      </div>
      <button class="abig" id="adone">Let's play</button><button class="aghost asm" id="amine">See my account</button>`);
    $('#adone').onclick = () => {
      mode = 'in';
      back ? back() : drawSignedIn();
    };
    $('#amine').onclick = () => {
      mode = 'in';
      draw();
    };
  }

  function drawSignedIn() {
    const a = A(), sum = PG.saves.summary(), st = status(), since = user.created || a.since;
    const stTxt = { ok: ['Saved to your account', 'Everything on this phone is in your account.'], wait: ['Waiting to copy', 'It goes up a few seconds after the game saves.'], conflict: ['Two different saves', 'Choose which one to keep, below.'], off: ['Offline', 'It copies up when you are back online.'] }[st] || ['', ''];
    page(`${offBar()}<div class="acard aprof">
        <span class="aav">${esc(initials(user.name || user.email))}</span>
        <div><b>${esc(user.name || 'Player')}</b><span>${esc(user.email)}</span>
          <p class="achips">${viaName(user) ? `<em class="via">${IC[viaName(user).toLowerCase()]}${viaName(user)}</em>` : user.verified ? `<em class="ok">${IC.check}Email confirmed</em>` : `<em class="warn">Email not confirmed</em>`}${since ? `<em>Since ${esc(new Date(since).toLocaleDateString([], { month: 'short', year: 'numeric' }))}</em>` : ''}</p></div></div>
      ${user.verified ? '' : `<div class="acard avfy"><p><b>Confirm your email</b>so you can always get back in if you forget your password. The link went to ${esc(user.email)}.</p><div class="arow2"><button class="aghost asm" id="avfy">Send it again</button><button class="aghost asm" id="achk">I've confirmed it</button></div></div>`}
      ${conflictHtml()}
      <div class="acard async st-${st}"><div class="asynch"><span class="aic asm">${IC.sync}</span><div><b>${stTxt[0]}</b><span>${stTxt[1]}</span></div><em class="adot ${st === 'ok' ? 'ok' : st === 'conflict' ? 'bad' : ''}"></em></div>
        <div class="astats"><div><b>${sum.players}</b><span>player${sum.players === 1 ? '' : 's'} on this phone</span></div><div><b>${esc(when(a.up || a.synced).replace(/^today, /, ''))}</b><span>${(a.up || a.synced) && new Date(a.up || a.synced).toDateString() === new Date().toDateString() ? 'last copied, today' : 'last copied'}</span></div></div>
        ${sum.names.length ? `<p class="amute anames">${sum.names.map(esc).join(' · ')}${sum.players > sum.names.length ? ` and ${sum.players - sum.names.length} more` : ''}</p>` : ''}
        <button class="aghost asm" id="async">${IC.sync}Copy it now</button><p id="anote" class="anote${lastErr ? '' : ' ok'}" role="status">${esc(lastErr)}</p></div>
      <p class="akick">Account</p>
      <div class="acard alist">
        <button class="arow" id="aname2">${IC.pen}<span><b>Name</b>${esc(user.name || 'Player')}</span><i>›</i></button><div id="anamebox"></div>
        ${hasPw(user) ? `<button class="arow" id="apw2">${IC.key}<span><b>Password</b>send a link to make a new one</span><i>›</i></button>` : `<div class="arow">${IC[viaName(user).toLowerCase()] || IC.key}<span><b>Signed in with ${viaName(user)}</b>no password to remember here</span></div>`}
        <button class="arow" id="aout">${IC.out}<span><b>Sign out</b>your careers stay on this phone, and in your account</span><i>›</i></button>
      </div>
      <button class="arow adel" id="adel">${IC.bin}<span><b>Delete my account</b>it is one account for all your Pocket games: this deletes it and every copy in it; careers on this phone stay</span></button>
      <div id="adelbox"></div>
      <p class="afine aprv">${IC.lock}<span>Your account holds your email address, your name and your save. Only you can read it: the game's database lets nobody else in.</span></p>`, 'ain');
    if ($('#avfy')) $('#avfy').onclick = async() => {
      const b = $('#avfy');
      b.disabled = true;
      try {
        await backend().verify();
        b.textContent = 'Sent: check your inbox';
      } catch (e) {
        b.disabled = false;
        note(msg(e));
      }
    };
    if ($('#achk')) $('#achk').onclick = async() => {
      const b = $('#achk');
      b.disabled = true;
      b.textContent = 'Checking…';
      try {
        const u = backend().refresh && await backend().refresh();
        if (u) user = u;
      } catch (e) {
        /* stays */
      }
      if (user.verified) {
        toast('Email confirmed');
        draw();
      } else {
        b.disabled = false;
        b.textContent = 'Not yet: try again';
      }
    };
    $('#async').onclick = async() => {
      lock(1);
      $('#async').classList.add('spin');
      note('Copying…', 1);
      await sync('now');
      lock(0);
      if (conflict) {
        draw();
        return;
      }
      draw();
      note(lastErr || 'Copied just now.', !lastErr);
    };
    $('#aname2').onclick = () => {
      const box = $('#anamebox');
      if (box.innerHTML) {
        box.innerHTML = '';
        return;
      }
      box.innerHTML = `<form class="aedit" id="anform"><div class="abox">${IC.user}<input id="annew" maxlength="16" autocomplete="nickname" value="${esc(user.name || '')}"></div><button class="abig" type="submit">Save</button><p class="aerr"></p></form>`;
      const inp = $('#annew');
      inp.focus();
      inp.select();
      $('#anform').onsubmit = async ev => {
        ev.preventDefault();
        const n = plain(inp.value, 16), er = box.querySelector('.aerr');
        if (!n) {
          er.textContent = 'Pick a name.';
          return;
        }
        if (PG.online && PG.online.dirty && PG.online.dirty(n)) {
          er.textContent = 'Pick another name.';
          return;
        }
        if (n === user.name) {
          box.innerHTML = '';
          return;
        }
        lock(1);
        try {
          await backend().rename(n);
          user = Object.assign({}, user, { name: n });
          setA({ name: n });
          if (PG.online && PG.online.setName) PG.online.setName(n);
          toast('Name changed to ' + n);
          draw();
        } catch (e) {
          lock(0);
          er.textContent = msg(e);
        }
      };
    };
    if ($('#apw2')) $('#apw2').onclick = async() => {
      const b = $('#apw2');
      if (b.dataset.sent) return;
      b.disabled = true;
      try {
        await backend().reset(user.email);
        b.dataset.sent = 1;
        b.querySelector('span').innerHTML = `<b>Password</b>link sent to ${esc(user.email)}`;
        b.querySelector('i').innerHTML = IC.check;
      } catch (e) {
        note(msg(e));
      }
      b.disabled = false;
    };
    $('#aout').onclick = async() => {
      const b = $('#aout');
      if (!b.dataset.sure) {
        b.dataset.sure = 1;
        b.classList.add('sure');
        b.querySelector('span').innerHTML = '<b>Tap again to sign out</b>anything not yet copied stays on this phone only';
        return;
      }
      lock(1);
      clearTimeout(pushT);
      if (!conflict) {
        try {
          await sync('now');
        } catch (e) {
          /* signed out anyway */
        }
      }
      await backend().signOut();
      user = null;
      setA({ uid: null, email: null, name: null, synced: 0, up: 0 });
      mode = 'in';
      toast('Signed out');
      draw();
    };
    $('#adel').onclick = () => {
      if ($('#adelbox').innerHTML) {
        $('#adelbox').innerHTML = '';
        return;
      }
      $('#adelbox').innerHTML = `<div class="acard awarnc"><h3>Delete your account?</h3><p>The account, your email address and the copies of your saves in it (this game’s and your other Pocket games’) are deleted for good. The careers on this phone stay here.</p>
        ${hasPw(user) ? `<div class="afield"><label for="adpw">Type your password to confirm</label><div class="abox">${IC.lock}<input id="adpw" type="password" autocomplete="current-password"></div></div>` : `<p class="amute">${viaName(user)} will ask you to confirm it is you.</p>`}<button class="abig adanger" id="adgo">${hasPw(user) ? 'Delete my account' : 'Confirm with ' + viaName(user) + ' and delete'}</button><button class="aghost asm" id="adno">Keep it</button><p id="anote2" class="anote"></p></div>`;
      $('#adno').onclick = () => {
        $('#adelbox').innerHTML = '';
      };
      $('#adgo').onclick = async() => {
        const pw = $('#adpw') ? $('#adpw').value : '';
        if ($('#adpw') && !pw) {
          $('#anote2').textContent = 'Type your password.';
          return;
        }
        lock(1);
        try {
          await backend().del(pw);
          user = null;
          save(KEY, {});
          mode = 'up';
          draw();
          note('Your account is deleted.', 1);
        } catch (e) {
          lock(0);
          $('#anote2').textContent = msg(e);
        }
      };
      if ($('#adpw')) $('#adpw').focus();
      $('#adelbox').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    };
    wire(draw);
  }

  function toast(t) {
    const o = document.querySelector('.acctoast');
    if (o) o.remove();
    const d = document.createElement('div');
    d.className = 'acctoast';
    d.innerHTML = IC.check + '<span></span>';
    d.querySelector('span').textContent = t;
    document.body.appendChild(d);
    setTimeout(() => d.classList.add('go'), 2600);
    setTimeout(() => d.remove(), 3100);
  }

  /* two phones that both played: what each holds, and a choice */
  function conflictHtml() {
    if (!conflict) return '';
    const sum = PG.saves.summary();
    return `<div class="anext aconf"><p class="akick">Two saves</p><p class="aq">This phone and your account both have games the other has not seen.</p>
      <div class="aconfg"><div>${IC.phone}<b>On this phone</b><span>${sum.players} player${sum.players === 1 ? '' : 's'}${sum.names.length ? ': ' + sum.names.map(esc).join(', ') : ''}</span><small>last saved ${esc(when(PG.saves.changed()))}</small></div>
      <div>${IC.cloud}<b>In your account</b><span>${+conflict.players || 0} player${+conflict.players === 1 ? '' : 's'}${Array.isArray(conflict.who) && conflict.who.length ? ': ' + conflict.who.slice(0, 3).map(x => esc(plain(x, 30))).join(', ') : ''}</span><small>saved ${esc(when(conflict.at))}${conflict.dev === dev() ? '' : ', on another phone'}</small></div></div>
      <button class="aghost" id="akeep">Keep this phone's<small>and copy it over the one in your account</small></button><button class="aghost" id="atake">Use the account's<small>and replace what is on this phone</small></button></div>`;
  }

  /* the hub shows a choice that is waiting, or a save from another phone */
  function card() {
    if (conflict) return conflictHtml();
    if (offer && user) return `<div class="anext"><p class="akick">Your account</p><p class="aq">There is a newer save in your account, from ${esc(when(offer.at))}.</p><button class="aghost" id="atake">Load it onto this phone</button></div>`;
    return '';
  }

  function wire(redraw) {
    if ($('#akeep')) $('#akeep').onclick = async() => {
      const c = conflict;
      conflict = null;
      try {
        busy = true;
        await upload();
      } catch (e) {
        conflict = c;
        lastErr = msg(e);
      } finally {
        busy = false;
      }
      redraw && redraw();
    };
    if ($('#atake')) $('#atake').onclick = async() => {
      const rec = conflict || offer;
      if (!rec) return;
      if (!confirm('Replace the careers on this phone with the save in your account?')) return;
      if (!(await take(rec)) && redraw) redraw();
    };
  }

  /* an account already signed in on this phone: connect quietly at start, and copy up when the app goes to the background */
  if (load('pg.acct.loaded', 0)) {
    save('pg.acct.loaded', 0);
    setTimeout(() => {
      toast('Your save from your account is on this phone');
    }, 1800);
  }

  if (A().uid) setTimeout(() => {
    start().then(u => {
      if (u) sync('start');
    }).catch(() => {});
  }, 2500);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && user && !conflict && PG.saves.changed() > (A().synced || 0)) {
      clearTimeout(pushT);
      sync('hide');
    }
  });

  /* the title's account button carries a dot: white when your save is in the account, grey while it waits */
  function refreshTop() {
    const b = document.querySelector('#tacct i');
    if (b && PG.account) b.dataset.st = PG.account.status();
  }

  PG.account = {
    open, card, wire, saved, initials,
    user: () => user || (A().uid ? { uid: A().uid, email: A().email, name: A().name } : null),
    status: () => user ? status() : (A().uid ? ((A().synced || 0) >= PG.saves.changed() && A().synced ? 'ok' : 'wait') : ''),
    get conflict() {
      return conflict;
    }
  };
  if (/[?&]test\b/.test(location.search)) PG.account.test = { backend(b) {
    be = b;
    ready = null;
    user = null;
    conflict = null;
    offer = null;
  }, sync, state: () => ({ user, conflict: !!conflict, offer: !!offer, lastErr, acct: A() }) };
})();
