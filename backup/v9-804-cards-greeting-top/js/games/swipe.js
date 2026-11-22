/*
 * Swipe games: one card at a time. Swipe or drag it left or right, tap one of the two big
 * buttons, or press ← / → (or 1 / 2). Four games share the engine below:
 *   haben-sein   Haben oder sein?   the Perfekt helper of a verb
 *   tuersteher   Der Türsteher      is the word order of the sentence right? (verb in position 2 …)
 *   nicht-kein   Nicht oder kein?   negate a noun with kein, everything else with nicht
 *   im-ins       Im oder ins?       Wo? → im, Wohin? → ins
 * Each definition has gen(topic, level) → next(), which makes the cards without a DOM, so tools
 * can test the content in Node. The helpers in Brezel.games.quick are shared with rush.js and automat.js.
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const { h, md, show, norm, pick, pulse, reducedMotion, splitSentence } = B.util;
  const L = B.games.lib;
  const data = () => B.games.data.quick || {};

  // --- helpers shared by the quick-fire games ----------------------------------------------------
  const Q = (B.games.quick = B.games.quick || {});

  Q.soundOn = () => !B.store || B.store.setting('sound') !== false;
  /** Speak German, but only while sound is on. */
  Q.say = (api, text, opts) => {
    if (text && Q.soundOn()) api.speak(text, opts);
  };
  /** Markdown-lite with a "___" gap: an empty box, or `word` filled in. */
  Q.gapHtml = (s, word, cls) =>
    String(s).split('___').map((p) => md(show(p))).join(word ? `<b class="q-fill ${cls || ''}">${md(show(word))}</b>` : '<span class="q-gap" aria-label="gap">&nbsp;</span>');
  /** Fill the "___" of a sentence. */
  Q.fill = (s, word) => String(s).replace('___', word);
  /**
   * A bar that shrinks on game time (so it pauses with the game). bar = an element with one
   * child; calls onTimeout once when it runs out. Returns stop().
   */
  Q.itemTimer = function (api, bar, ms, onTimeout) {
    let t = 0;
    let stopped = false;
    const fill = bar.firstElementChild;
    bar.hidden = false;
    const off = api.frame((dt) => {
      if (stopped) return false;
      t += dt;
      const k = Math.max(0, 1 - t / ms);
      fill.style.transform = `scaleX(${k})`;
      bar.classList.toggle('low', k < 0.3);
      if (t >= ms) {
        stopped = true;
        onTimeout();
        return false;
      }
      return true;
    });
    return () => {
      stopped = true;
      off();
    };
  };
  /** Points for an answer given in `ms`: 10, plus up to 10 for speed. */
  Q.speedPoints = (ms, fast = 2500, slow = 9000) => 10 + Math.round(10 * Math.max(0, Math.min(1, (slow - ms) / (slow - fast))));

  // --- the swipe engine --------------------------------------------------------------------------
  /**
   * cfg = {
   *   theme: css class, decor?: () → Node drawn behind the cards,
   *   labels(level) → [{ label, sub? }, { label, sub? }]   left and right,
   *   perCard?(level) → ms per card (0 = no limit),
   *   gen(topic, level) → next() → item { side: 0 | 1, q, a },
   *   face(item, level) → Node, explain(item, ok) → { html, say? }
   * }
   */
  function swipeGame(cfg) {
    return function play(stage, api) {
      const level = api.level;
      const [left, right] = cfg.labels(level);
      const next = cfg.gen(api.topic, level);
      const perCard = cfg.perCard ? cfg.perCard(level) : 0;

      const zone = (side, l) => h('div', { class: 'sw-zone sw-zone-' + side },
        h('span', { class: 'sw-zone-arrow' }, side === 'l' ? '◄' : '►'),
        h('b', {}, l.label));
      const zl = zone('l', left);
      const zr = zone('r', right);
      const button = (side, l) => h('button', { type: 'button', class: 'btn g-btn sw-btn sw-btn-' + side, 'aria-label': l.label + (l.sub ? ` (${l.sub})` : '') + (side === 'l' ? ', left arrow' : ', right arrow') },
        side === 'l' ? h('span', { class: 'sw-btn-arrow', 'aria-hidden': 'true' }, '◄') : null,
        h('span', { class: 'sw-btn-text' }, h('span', {}, l.label), l.sub ? h('small', { class: 'sw-btn-sub' }, l.sub) : null),
        side === 'r' ? h('span', { class: 'sw-btn-arrow', 'aria-hidden': 'true' }, '►') : null);
      const bl = button('l', left);
      const br = button('r', right);
      bl.addEventListener('click', () => answer(0));
      br.addEventListener('click', () => answer(1));
      const deck = h('div', { class: 'sw-deck' });
      const flash = h('div', { class: 'sw-flash', 'aria-live': 'polite' });
      stage.append(h('div', { class: 'swipe ' + (cfg.theme || '') },
        cfg.decor ? cfg.decor() : null,
        h('div', { class: 'sw-zones', 'aria-hidden': 'true' }, zl, zr),
        deck,
        flash,
        h('div', { class: 'sw-btns' }, bl, br)));

      // a waiting card behind the countdown
      deck.append(h('div', { class: 'sw-card is-ready' }, h('div', { class: 'sw-face' }, h('div', { class: 'sw-word' }, 'Bereit?'), h('div', { class: 'sw-en' }, 'Get ready…'))));

      let item = null;
      let card = null;
      let busy = true;
      let stopTimer = null;
      let drag = null;
      const threshold = () => Math.max(70, deck.clientWidth * 0.22);
      const hot = (side) => {
        zl.classList.toggle('hot', side === 0);
        zr.classList.toggle('hot', side === 1);
      };

      function showCard() {
        if (api.ended) return;
        item = next();
        flash.className = 'sw-flash';
        flash.replaceChildren();
        const timer = h('div', { class: 'g-itimer sw-ctimer', hidden: true }, h('span'));
        card = h('div', { class: 'sw-card', role: 'group', 'aria-label': item.q || 'card' }, cfg.face(item, level), timer);
        deck.querySelectorAll('.sw-card.is-ready').forEach((x) => x.remove());
        deck.append(card);
        attachDrag(card);
        if (!reducedMotion()) pulse(card, 'sw-in');
        busy = false;
        if (perCard) stopTimer = Q.itemTimer(api, timer, perCard, () => answer(null));
      }

      function answer(side) {
        if (busy || !item || api.ended) return;
        busy = true;
        if (stopTimer) stopTimer();
        stopTimer = null;
        const it = item;
        const ok = side === it.side;
        card.classList.add(ok ? 'is-good' : 'is-bad');
        fly(card, side === 0 ? -1 : side === 1 ? 1 : 0);
        hot(side);
        const ex = cfg.explain(it, ok);
        flash.className = 'sw-flash show ' + (ok ? 'good' : 'bad');
        flash.innerHTML = `<span class="sw-flash-icon">${ok ? '✓' : side == null ? '⏱' : '✗'}</span> <span>${side == null && !ok ? 'Too slow! ' : ''}${ex.html}</span>`;
        if (ok) api.hit({ el: side === 0 ? bl : br });
        else {
          api.miss({ q: it.q, a: it.a, given: side == null ? 'too slow' : (side === 0 ? left : right).label, el: deck });
          Q.say(api, ex.say);
        }
        api.wait(ok ? 560 : 1900).then((go) => {
          hot(null);
          if (go) showCard();
        });
      }

      function fly(el, dir) {
        el.classList.add('gone');
        if (reducedMotion()) return el.remove();
        el.style.transition = 'transform .36s cubic-bezier(.45,.05,.8,.45), opacity .36s ease';
        el.style.transform = dir ? `translate(${dir * (deck.clientWidth * 0.8 + 180)}px, -24px) rotate(${dir * 30}deg)` : 'translateY(70px) scale(.85)';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 400); // cosmetic only
      }

      function attachDrag(el) {
        el.addEventListener('pointerdown', (e) => {
          if (busy || (e.button !== undefined && e.button !== 0)) return;
          drag = { id: e.pointerId, x0: e.clientX, dx: 0 };
          if (el.setPointerCapture) el.setPointerCapture(e.pointerId);
          el.style.transition = 'none';
          el.classList.add('dragging');
        });
        el.addEventListener('pointermove', (e) => {
          if (!drag || e.pointerId !== drag.id || busy) return;
          drag.dx = e.clientX - drag.x0;
          el.style.transform = `translateX(${drag.dx}px) rotate(${drag.dx / 16}deg)`;
          const lean = Math.abs(drag.dx) > threshold() * 0.45 ? (drag.dx < 0 ? 0 : 1) : null;
          hot(lean);
          el.classList.toggle('lean-l', lean === 0);
          el.classList.toggle('lean-r', lean === 1);
        });
        const up = (e) => {
          if (!drag || e.pointerId !== drag.id) return;
          const dx = drag.dx;
          drag = null;
          el.classList.remove('dragging', 'lean-l', 'lean-r');
          hot(null);
          if (!busy && Math.abs(dx) >= threshold()) return answer(dx < 0 ? 0 : 1);
          el.style.transition = 'transform .28s cubic-bezier(.3,1.5,.5,1)';
          el.style.transform = '';
        };
        el.addEventListener('pointerup', up);
        el.addEventListener('pointercancel', up);
      }

      return {
        begin: showCard,
        key(e) {
          if (e.key === 'ArrowLeft' || e.key === '1') return answer(0), true;
          if (e.key === 'ArrowRight' || e.key === '2') return answer(1), true;
          return false;
        },
        destroy() {
          if (stopTimer) stopTimer();
        },
      };
    };
  }

  Q.swipeGame = swipeGame;

  const face = (main, sub, extra) => h('div', { class: 'sw-face' }, extra || null, h('div', { class: 'sw-word', lang: 'de', html: main }), sub ? h('div', { class: 'sw-en' }, sub) : null);

  // --- 1. Haben oder sein? ---------------------------------------------------------------------------
  const TRAP_TOPICS = ['reflexive', 'verblist', 'past', 'pastq', 'tenses', 'prefix', 'all'];

  /** [{ v, reflexive, aux }] for the topic; borrows sein verbs from the whole lexicon when there are few. */
  function habenItems(topic, level) {
    const items = [];
    const seen = new Set();
    const add = (v, reflexive) => {
      const key = v.inf + (reflexive ? '+sich' : '');
      if (!v.pp || seen.has(key)) return;
      seen.add(key);
      items.push({ v, reflexive, aux: reflexive ? 'haben' : v.aux || 'haben' });
    };
    for (const { v, reflexive } of L.verbsFor(topic, { need: ['pp'] })) {
      if (level === 1 && reflexive && topic !== 'reflexive' && topic !== 'verblist') continue;
      add(v, reflexive);
    }
    // the trap: sich umziehen (clothes) takes haben, umziehen (house) takes sein
    const um = L.verb('umziehen');
    if (um && level >= 2 && TRAP_TOPICS.includes(topic)) {
      add(um, true);
      add(um, false);
    }
    if (items.filter((x) => x.aux === 'sein').length < 3) {
      for (const { v } of L.verbsFor('all', { need: ['pp'] })) if (v.aux === 'sein') add(v, false);
    }
    return items;
  }

  const reflMeaning = (v) => (data().reflMeaning || {})[v.inf] || L.meaning(v);

  function habenCard(x) {
    const word = (x.reflexive ? 'sich ' : '') + x.v.inf;
    const perfekt = 'er ' + L.form(x.v, 'perfekt', 2, { reflexive: x.reflexive });
    const why = x.reflexive
      ? 'reflexive verbs always take *haben*'
      : x.aux === 'sein'
        ? (['sein', 'bleiben'].includes(x.v.inf) ? `*${x.v.inf}* takes *sein*` : 'a change of place or state → *sein*')
        : 'no change of place or state → *haben*';
    return { side: x.aux === 'sein' ? 1 : 0, word, en: x.reflexive && !L.isReflexive(x.v) ? reflMeaning(x.v) : L.meaning(x.v), q: word, a: perfekt, why, trap: x.reflexive && x.v.aux === 'sein' };
  }

  function habenGen(topic, level) {
    const items = habenItems(topic, level);
    const haben = L.deal(items.filter((x) => x.aux === 'haben'));
    const sein = L.deal(items.filter((x) => x.aux === 'sein'));
    const traps = L.deal(items.filter((x) => x.reflexive && x.v.aux === 'sein'));
    return () => {
      const r = Math.random();
      const x = (level === 3 && r < 0.15 && traps()) || (r < 0.5 ? sein() : haben()) || haben() || sein();
      return habenCard(x);
    };
  }

  B.games.register('haben-sein', {
    name: 'Haben oder sein?',
    icon: '⚖️',
    color: '#1cb0f6',
    blurb: 'Which helper does the verb take in the **Perfekt**? Swipe it to the right side.',
    how: ['◄ **haben** · **sein** ►', 'Swipe or drag the card, tap a button, or press ← / →', 'Watch out for reflexive verbs!'],
    topics: ['past', 'pastq', 'tenses', 'verblist', 'reflexive', 'prefix'],
    time: (level) => [75, 60, 45][level - 1],
    art: '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif" font-weight="900"><circle cx="60" cy="60" r="56" fill="#dff3ff"/><path d="M38 100h44l-7-12H45z" fill="#7a4b1e"/><rect x="56" y="30" width="8" height="62" rx="4" fill="#8f5a26"/><g transform="rotate(-9 60 34)"><rect x="14" y="30" width="92" height="8" rx="4" fill="#a8692c"/><path d="M24 38 14 62M24 38l10 24M96 38 86 62M96 38l10 24" stroke="#a8692c" stroke-width="2.5"/><path d="M8 62h32a16 8 0 0 1-32 0z" fill="#1cb0f6"/><path d="M80 62h32a16 8 0 0 1-32 0z" fill="#ff9600"/><text x="24" y="58" text-anchor="middle" font-size="13" fill="#0b6699">hat</text><text x="96" y="58" text-anchor="middle" font-size="13" fill="#a35a00">ist</text></g><circle cx="60" cy="33" r="7" fill="#ffc800" stroke="#e0a800" stroke-width="2"/></svg>',
    ready: (topic, level) => {
      const items = habenItems(topic, level);
      return items.length >= 6 && items.some((x) => x.aux === 'sein') && items.some((x) => x.aux === 'haben');
    },
    gen: habenGen,
    play: swipeGame({
      theme: 'sw-haben',
      labels: () => [{ label: 'haben', sub: 'hat …' }, { label: 'sein', sub: 'ist …' }],
      perCard: (level) => (level === 3 ? 3200 : 0),
      gen: habenGen,
      face: (it, level) => face(md(it.word), it.en, it.trap && level < 3 ? h('span', { class: 'sw-tag' }, 'careful!') : null),
      explain: (it) => ({ html: `<b>${md(it.a)}</b> <small>— ${md(it.why)}</small>`, say: it.a }),
    }),
  });

  // --- 2. Der Türsteher (word order) ------------------------------------------------------------------
  const ADVERBS = new Set(['gern', 'heute', 'oft', 'gestern', 'schon', 'nicht', 'morgen', 'jetzt', 'immer', 'auch', 'sehr', 'noch', 'manchmal', 'abends', 'morgens', 'gleich', 'bald', 'wieder', 'lieber', 'nie']);
  const JOINERS = new Set(['weil', 'dass', 'ob', 'wenn', 'als', 'denn', 'aber', 'oder', 'sondern', 'damit', 'bevor', 'nachdem']);

  let setsCache = null;
  let setsKey = 0;
  /** Finite verb forms, infinitives/participles and separable "verb prefix" pairs from the lexicon. */
  function verbSets() {
    const n = Object.keys(B.deck.verbs).length;
    if (setsCache && setsKey === n) return setsCache;
    const finite = new Set();
    const nonfinite = new Set();
    const sep = new Set();
    for (const v of Object.values(B.deck.verbs)) {
      for (const f of [...(v.forms || []), ...(v.prt || [])]) {
        const [hd, pre] = f.split(' ');
        finite.add(norm(hd));
        if (pre) sep.add(norm(hd) + ' ' + norm(pre));
      }
      nonfinite.add(norm(v.inf));
      if (v.pp) nonfinite.add(norm(v.pp));
    }
    setsKey = n;
    setsCache = { finite, nonfinite, sep };
    return setsCache;
  }

  /**
   * A statement we can safely rearrange: { words, punct, vi } with vi = index of the one
   * conjugated verb (position 2). null for questions, commands, clauses with commas or joiners.
   */
  function analyse(sentence) {
    const { words, punct } = splitSentence(sentence);
    if (punct !== '.' && punct !== '!') return null;
    if (words.length < 3 || words.length > 12) return null;
    if (words.some((w) => /[,;:„“"()/…]/.test(w) || /_/.test(w))) return null;
    const low = words.map((w) => norm(w));
    if (low.some((w) => JOINERS.has(w))) return null;
    const { finite, nonfinite } = verbSets();
    const last = words.length - 1;
    const cands = [];
    low.forEach((w, i) => {
      if (!finite.has(w)) return;
      if (i > 0 && /^[A-ZÄÖÜ]/.test(words[i])) return; // a noun (Essen, Leben …), not a verb
      if (i === last && nonfinite.has(w)) return; // infinitive or participle at the end
      cands.push(i);
    });
    if (cands.length !== 1 || cands[0] === 0) return null;
    return { words, punct, vi: cands[0], low };
  }

  /** Does the sentence end with the second part of the verb bracket (participle, infinitive, prefix)? */
  function bracketEnd(an) {
    const { nonfinite, sep } = verbSets();
    const lastW = an.low[an.low.length - 1];
    return nonfinite.has(lastW) || sep.has(an.low[an.vi] + ' ' + lastW);
  }

  /** Wrong word orders made from a right one; never equal to the original. */
  function wrongVariants(an) {
    const W = an.words;
    const n = W.length;
    const vi = an.vi;
    const join = (arr) => arr.join(' ') + an.punct;
    const out = [];
    // after a fronted phrase the subject jumps in front of the verb: "Am Sonntag ich fahre …"
    if (vi >= 2 && vi + 1 < n) out.push({ kind: 'swap', text: join([...W.slice(0, vi), W[vi + 1], W[vi], ...W.slice(vi + 2)]) });
    // the verb at the very end (that's the order of a weil/dass clause) — not with a split-off prefix
    const { sep } = verbSets();
    if (vi + 1 < n && !sep.has(an.low[vi] + ' ' + an.low[n - 1])) out.push({ kind: 'end', text: join([...W.slice(0, vi), ...W.slice(vi + 1), W[vi]]) });
    // an adverb squeezed in before the verb: "Ich gern spiele Fußball."
    if (vi === 1 && n - vi > 2 && ADVERBS.has(an.low[2])) out.push({ kind: 'third', text: join([W[0], W[2], W[1], ...W.slice(3)]) });
    // the participle / infinitive / prefix pulled forward: "Ich habe gemacht meine Hausaufgaben."
    if (n - 1 - vi >= 2 && bracketEnd(an)) out.push({ kind: 'bracket', text: join([...W.slice(0, vi + 1), W[n - 1], ...W.slice(vi + 1, n - 1)]) });
    const seen = new Set([norm(join(W))]);
    return out.filter((x) => !seen.has(norm(x.text)) && seen.add(norm(x.text)));
  }

  function spotFixed(c) {
    if (c.fixed) return c.fixed;
    const t = c.q.trim().split(/\s+/);
    const bare = (x) => x.replace(/[.,!?;:…]+$/, '');
    const i = Number.isInteger(c.at) ? c.at : t.findIndex((x) => norm(bare(x)) === norm(c.wrong));
    if (i < 0) return null;
    t[i] = c.correct + t[i].slice(bare(t[i]).length);
    return t.join(' ');
  }

  /** The right sentences of a topic's cards that we can rearrange: [{ s, an, wrongs, accepted }]. */
  function sentencesFor(topic, level, { allLevels = false } = {}) {
    const cards = L.cardsFor(topic, level, { types: ['order', 'gap', 'type', 'mc', 'spot'], min: allLevels ? Infinity : 12 });
    const out = [];
    const seen = new Set();
    for (const c of cards) {
      let list = [];
      if (c.type === 'order') list = [c.answer, ...(c.answers || [])];
      else if (c.type === 'gap' && c.q) list = [c.q.replace(/\{([^}]+)\}/g, (_, m) => m.split('|')[0])];
      else if ((c.type === 'type' || c.type === 'mc') && c.q && B.ex.BLANK.test(c.q)) list = [c.q.replace(B.ex.BLANK, c.type === 'mc' ? c.correct : B.ex.asList(c.answer)[0])];
      else if (c.type === 'spot' && c.q) list = [spotFixed(c)];
      list = list.filter((s) => typeof s === 'string' && s.trim()).map((s) => show(s).replace(/\*+/g, '').replace(/\s+/g, ' ').trim());
      if (!list.length || seen.has(norm(list[0]))) continue;
      const an = analyse(list[0]);
      if (!an) continue;
      const accepted = new Set(list.map(norm));
      const wrongs = wrongVariants(an).filter((w) => !accepted.has(norm(w.text)));
      if (!wrongs.length) continue;
      seen.add(norm(list[0]));
      out.push({ s: list[0], an, wrongs, accepted });
    }
    return out;
  }

  function usableSentences(topic, level) {
    const at = sentencesFor(topic, level);
    return at.length >= 8 ? at : sentencesFor(topic, level, { allLevels: true });
  }

  const boldVerb = (an) => an.words.map((w, i) => (i === an.vi ? `**${w}**` : w)).join(' ') + an.punct;
  const WHY = {
    swap: 'the conjugated verb comes right after the first part (position 2), then the subject',
    end: 'in a main clause the conjugated verb is in position 2, not at the end',
    third: 'the conjugated verb is in position 2',
    bracket: 'the participle, infinitive or prefix goes to the very end',
  };

  function doorGen(topic, level) {
    const pool = usableSentences(topic, level);
    const nextS = L.deal(pool);
    const easy = (w) => w.kind === 'swap' || w.kind === 'end';
    return () => {
      const s = nextS();
      if (Math.random() < 0.5) return { side: 1, text: s.s, q: s.s, a: s.s + ' ✓', why: null, fix: boldVerb(s.an), say: s.s };
      const ws = level === 1 && s.wrongs.some(easy) ? s.wrongs.filter(easy) : s.wrongs;
      const w = pick(ws);
      return { side: 0, text: w.text, q: w.text, a: s.s, why: WHY[w.kind], fix: boldVerb(s.an), say: s.s };
    };
  }

  B.games.register('tuersteher', {
    name: 'Der Türsteher',
    icon: '🚪',
    color: '#8a63d2',
    blurb: 'You’re the bouncer at Club Satzbau. Only sentences with the **right word order** get in.',
    how: ['◄ **Raus!** wrong order · **Rein!** correct ►', 'Swipe, tap or press ← / →', 'Three wrong calls and the club closes'],
    topics: '*',
    time: 60,
    lives: 3,
    art: '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif" font-weight="900"><rect width="120" height="120" rx="28" fill="#2b1d4e"/><circle cx="98" cy="20" r="7" fill="#ffd84d"/><circle cx="18" cy="16" r="1.8" fill="#fff"/><circle cx="30" cy="30" r="1.4" fill="#fff"/><circle cx="84" cy="36" r="1.4" fill="#fff"/><rect y="98" width="120" height="22" fill="#1c1236"/><text x="60" y="22" text-anchor="middle" font-size="12" fill="#ff86d0" letter-spacing="2">CLUB</text><rect x="36" y="28" width="48" height="72" rx="24" fill="#5b3fa0"/><rect x="43" y="36" width="34" height="64" rx="17" fill="#8a63d2"/><circle cx="70" cy="70" r="3.5" fill="#ffc800"/><rect x="10" y="70" width="7" height="30" rx="3.5" fill="#ffc800"/><rect x="103" y="70" width="7" height="30" rx="3.5" fill="#ffc800"/><path d="M14 74q16 18 30 4M106 74q-16 18-30 4" stroke="#ff4b4b" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M52 52l5 5 10-11" stroke="#58cc02" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    ready: (topic, level) => usableSentences(topic, level).length >= 8,
    gen: doorGen,
    play: swipeGame({
      theme: 'sw-door',
      decor: () => h('div', { class: 'sw-door-art', 'aria-hidden': 'true', html: '<svg viewBox="0 0 200 160" preserveAspectRatio="xMidYMax meet"><rect x="56" y="10" width="88" height="150" rx="44" fill="currentColor" opacity=".18"/><rect x="68" y="24" width="64" height="136" rx="32" fill="currentColor" opacity=".14"/><rect x="14" y="104" width="9" height="56" rx="4.5" fill="#ffc800"/><rect x="177" y="104" width="9" height="56" rx="4.5" fill="#ffc800"/><path d="M19 110q34 30 62 8M181 110q-34 30-62 8" stroke="#ff4b4b" stroke-width="7" fill="none" stroke-linecap="round"/></svg>' }),
      labels: () => [{ label: 'Raus!', sub: 'wrong order' }, { label: 'Rein!', sub: 'correct' }],
      perCard: (level) => (level === 3 ? 6500 : 0),
      gen: doorGen,
      face: (it) => h('div', { class: 'sw-face sw-ticket' }, h('div', { class: 'sw-sentence', lang: 'de' }, show(it.text))),
      explain: (it, ok) =>
        it.side === 1
          ? { html: ok ? 'Correct order — come in!' : `That one was right: <b>${md(it.fix)}</b>`, say: ok ? null : it.say }
          : { html: ok ? `Raus! It’s <b>${md(it.fix)}</b>` : `Wrong order: <b>${md(it.fix)}</b> <small>— ${md(it.why)}</small>`, say: ok ? null : it.say },
    }),
  });

  // --- 3. Nicht oder kein? ------------------------------------------------------------------------------
  function negGen() {
    const next = L.deal(data().nichtKein || []);
    return () => {
      const x = next();
      const isNicht = x.a === 'nicht';
      return { side: isNicht ? 0 : 1, s: x.s, word: x.a, q: x.s.replace('___', '…'), a: Q.fill(x.s, x.a), why: isNicht ? '*nicht* for verbs, adjectives, adverbs and nouns with an article like *mein*' : '*kein* replaces *ein* or no article before a noun' };
    };
  }

  B.games.register('nicht-kein', {
    name: 'Nicht oder kein?',
    icon: '🚫',
    color: '#ff4b4b',
    blurb: '**kein** for a noun, **nicht** for everything else. Swipe each sentence to the right word.',
    how: ['◄ **nicht** · **kein…** ►', 'Swipe, tap or press ← / →'],
    topics: ['questions'],
    time: (level) => [75, 60, 45][level - 1],
    art: '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif" font-weight="900"><circle cx="60" cy="60" r="56" fill="#ffe8e8"/><path d="M16 22h54a10 10 0 0 1 10 10v20a10 10 0 0 1-10 10H38l-14 12V62h-8A10 10 0 0 1 6 52V32a10 10 0 0 1 10-10z" fill="#ff4b4b"/><text x="43" y="48" text-anchor="middle" font-size="17" fill="#fff">nicht</text><path d="M50 56h54a10 10 0 0 1 10 10v20a10 10 0 0 1-10 10h-8v12L82 96H50a10 10 0 0 1-10-10V66a10 10 0 0 1 10-10z" fill="#1cb0f6"/><text x="77" y="82" text-anchor="middle" font-size="17" fill="#fff">kein</text></svg>',
    ready: () => (data().nichtKein || []).length >= 8,
    gen: negGen,
    play: swipeGame({
      theme: 'sw-neg',
      labels: (level) => [{ label: 'nicht', sub: level === 1 ? 'not a noun' : '' }, { label: 'kein…', sub: level === 1 ? '+ noun' : '' }],
      perCard: (level) => (level === 3 ? 4000 : 0),
      gen: negGen,
      face: (it) => h('div', { class: 'sw-face' }, h('div', { class: 'sw-sentence', lang: 'de', html: Q.gapHtml(it.s) })),
      explain: (it) => ({ html: `${Q.gapHtml(it.s, it.word)} <small>— ${md(it.why)}</small>`, say: it.a }),
    }),
  });

  // --- 4. Im oder ins? -------------------------------------------------------------------------------------
  function placeGen() {
    const im = L.deal((data().imIns || []).filter((x) => x.a === 'im'));
    const ins = L.deal((data().imIns || []).filter((x) => x.a === 'ins'));
    return () => {
      const x = (Math.random() < 0.5 ? im() : ins()) || im() || ins();
      return { side: x.a === 'im' ? 0 : 1, s: x.s, word: x.a, cue: x.cue, q: x.s.replace('___', '…'), a: Q.fill(x.s, x.a), why: x.a === 'im' ? 'Wo? → *im* (in dem)' : 'Wohin? → *ins* (in das)' };
    };
  }

  B.games.register('im-ins', {
    name: 'Im oder ins?',
    icon: '🏠',
    color: '#58cc02',
    blurb: '**Wo?** you are somewhere → **im**. **Wohin?** you go somewhere → **ins**.',
    how: ['◄ **im** (in dem) · **ins** (in das) ►', 'Swipe, tap or press ← / →'],
    topics: ['prepositions'],
    time: (level) => [75, 60, 45][level - 1],
    art: '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif" font-weight="900"><circle cx="60" cy="60" r="56" fill="#e7fbe0"/><path d="M20 58 58 26l38 32v40H20z" fill="#58cc02"/><path d="M14 60 58 22l44 38" stroke="#2b7a00" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/><text x="58" y="56" text-anchor="middle" font-size="12" fill="#fff" letter-spacing="1">KINO</text><rect x="28" y="64" width="16" height="14" rx="3" fill="#fff"/><circle cx="36" cy="71" r="4" fill="#ff9600"/><rect x="52" y="68" width="18" height="30" rx="3" fill="#2b7a00"/><path d="M112 84H84" stroke="#ff9600" stroke-width="7" stroke-linecap="round"/><path d="M92 74l-10 10 10 10" stroke="#ff9600" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    ready: () => (data().imIns || []).length >= 8,
    gen: placeGen,
    play: swipeGame({
      theme: 'sw-place',
      labels: (level) => [{ label: 'im', sub: level === 1 ? 'Wo?' : '' }, { label: 'ins', sub: level === 1 ? 'Wohin?' : '' }],
      perCard: (level) => (level === 3 ? 3500 : 0),
      gen: placeGen,
      face: (it, level) => h('div', { class: 'sw-face' },
        level === 1 ? h('span', { class: 'sw-tag sw-cue' }, it.cue) : null,
        h('div', { class: 'sw-sentence', lang: 'de', html: Q.gapHtml(it.s) })),
      explain: (it) => ({ html: `${Q.gapHtml(it.s, it.word)} <small>— ${md(it.why)}</small>`, say: it.a }),
    }),
  });

  // for tests and other games
  Q.analyse = analyse;
  Q.wrongVariants = wrongVariants;
  Q.sentencesFor = usableSentences;
  Q.habenItems = habenItems;
})();
