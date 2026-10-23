/*
 * Progress persistence (localStorage). Everything is keyed by card id, so
 * adding new cards later keeps all existing progress.
 *
 * cards[id] = { a: attempts, w: wrong attempts, done: bool, first: 1|0 (first attempt right?),
 *               lw: last wrong answer given, d: time it was mastered }
 * log      = every answer: { id, ok, t, ms, s: session id, p: practice?1:0 }
 * sessions = { id, start, end, answered, correct, wrong, mastered, xp, practice }
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const KEY = 'brezel.progress.v1';

  const fresh = () => ({
    v: 1,
    createdAt: Date.now(),
    cards: {},
    log: [],
    sessions: [],
    xp: 0,
    streak: { count: 0, last: null, best: 0 },
    bestCombo: 0,
    settings: { sound: true, size: 20, topic: 'all', theme: 'auto' },
  });

  let state = fresh();
  let storageOk = true;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const base = fresh();
        state = Object.assign(base, parsed, {
          settings: Object.assign(base.settings, parsed.settings || {}),
          streak: Object.assign(base.streak, parsed.streak || {}),
        });
      }
    } catch (e) {
      storageOk = false;
      console.warn('[Brezel] Could not load progress', e);
    }
    return state;
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      storageOk = false;
      console.warn('[Brezel] Could not save progress', e);
    }
  }

  const cardState = (id) => state.cards[id] || null;
  const isDone = (id) => !!(state.cards[id] && state.cards[id].done);

  function touchStreak() {
    const today = B.util.dayKey();
    const s = state.streak;
    if (s.last === today) return;
    const y = new Date();
    y.setDate(y.getDate() - 1);
    s.count = s.last === B.util.dayKey(y) ? s.count + 1 : 1;
    s.last = today;
    s.best = Math.max(s.best || 0, s.count);
  }

  function beginSession(practice) {
    const rec = {
      id: (state.sessions.length ? state.sessions[state.sessions.length - 1].id : 0) + 1,
      start: Date.now(),
      end: null,
      answered: 0,
      correct: 0,
      wrong: 0,
      mastered: 0,
      xp: 0,
      practice: !!practice,
    };
    state.sessions.push(rec);
    save();
    return rec;
  }

  function currentSession() {
    return state.sessions[state.sessions.length - 1];
  }

  /** Record one answer. Returns {newlyDone} */
  function record(card, ok, given, ms, { practice = false, xp = 0 } = {}) {
    const sess = currentSession();
    state.log.push({ id: card.id, ok: ok ? 1 : 0, t: Date.now(), ms: Math.round(ms || 0), s: sess ? sess.id : 0, p: practice ? 1 : 0 });
    touchStreak();
    state.xp += xp;
    if (sess) {
      sess.answered++;
      sess[ok ? 'correct' : 'wrong']++;
      sess.xp += xp;
      sess.end = Date.now();
    }
    let newlyDone = false;
    if (!practice) {
      const c = (state.cards[card.id] = state.cards[card.id] || { a: 0, w: 0, done: false, first: null });
      c.a++;
      if (c.first === null) c.first = ok ? 1 : 0;
      if (ok) {
        if (!c.done) {
          newlyDone = true;
          if (sess) sess.mastered++;
        }
        c.done = true;
        c.d = Date.now();
      } else {
        c.w++;
        c.lw = String(given == null ? '' : given).slice(0, 200);
      }
    }
    save();
    return { newlyDone };
  }

  function endSession(extra) {
    const sess = currentSession();
    if (sess) {
      sess.end = Date.now();
      Object.assign(sess, extra || {});
      // Drop sessions where nothing was answered — they add noise to the history.
      if (!sess.answered) state.sessions.pop();
    }
    save();
  }

  function setBestCombo(n) {
    if (n > (state.bestCombo || 0)) {
      state.bestCombo = n;
      save();
    }
  }

  function setting(key, value) {
    if (value === undefined) return state.settings[key];
    state.settings[key] = value;
    save();
    return value;
  }

  function reset() {
    const settings = state.settings;
    state = fresh();
    state.settings = settings;
    save();
  }

  B.store = {
    load, save, reset, cardState, isDone, beginSession, record, endSession, setBestCombo, setting,
    get state() { return state; },
    get storageOk() { return storageOk; },
  };
})();
