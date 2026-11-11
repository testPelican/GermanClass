/*
 * Memory: turn over two cards at a time and find the pairs that belong together
 * (kommen ↔ kam, der Lehrer ↔ die Lehrerin, sich beeilen ↔ hurry …).
 * Decks come from Brezel.games.data.play._gen.memoryPairs: generated from the lexicon for the
 * topic and level (Verb list: Low = Präsens, Medium = Präteritum, High = Perfekt) plus the
 * pairs of the topic's match cards.
 *   Low: 6 pairs, everything shown for 3 s at the start · Medium: 8 pairs, a 1.5 s peek ·
 *   High: 10 pairs, no peek, 90 seconds.
 * A wrong pair only counts as a mistake when both cards had been seen before — a real memory slip.
 * The German side is spoken when it is turned over (if sound is on).
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const { h, shuffle } = B.util;

  const PAIRS = { 1: 6, 2: 8, 3: 10 };
  const PEEK = { 1: 3000, 2: 1500, 3: 0 };
  const ASPECT = 0.8; // card width : height
  const gen = () => B.games.data.play._gen;

  const ART =
    '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">' +
    '<g transform="rotate(-14 44 64)"><rect x="18" y="28" width="52" height="70" rx="11" fill="#7b3fd0"/>' +
    '<rect x="24.5" y="34.5" width="39" height="57" rx="7" fill="none" stroke="#c9a6ff" stroke-width="3" stroke-dasharray="5 5"/>' +
    '<circle cx="44" cy="63" r="10" fill="#c9a6ff"/><circle cx="44" cy="63" r="4" fill="#7b3fd0"/></g>' +
    '<g transform="rotate(11 80 60)"><rect x="54" y="24" width="52" height="70" rx="11" fill="#ffffff" stroke="#e3d3fb" stroke-width="3"/>' +
    '<text x="80" y="69" text-anchor="middle" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-weight="900" font-size="28" fill="#a560e8">kam</text></g>' +
    '<path d="M98 8l3.2 7.3 7.3 3.2-7.3 3.2L98 29l-3.2-7.3-7.3-3.2 7.3-3.2z" fill="#ffc800"/>' +
    '<path d="M16 96l2 4.6 4.6 2-4.6 2-2 4.6-2-4.6-4.6-2 4.6-2z" fill="#ff86d0"/>' +
    '<circle cx="104" cy="100" r="4" fill="#58cc02"/></svg>';

  B.games.register('memory', {
    name: 'Memory',
    icon: '🃏',
    art: ART,
    color: '#a560e8',
    blurb: 'Turn over two cards at a time and find the pairs that belong together.',
    how: ['Tap a card to turn it over, then find its partner', 'Wrong pair? Remember where the words were', 'Keys: arrows move, Enter turns a card'],
    topics: '*',
    ready: (topic, level) => !!gen().memoryPairs(topic, level, PAIRS[level] || 8),
    time: (level) => (level === 3 ? 90 : 0),

    play(stage, api) {
      const level = api.level;
      const pairs = gen().memoryPairs(api.topic, level, PAIRS[level] || 8);
      if (!pairs) {
        api.after(0, () => api.end({ note: 'Not enough pairs for this topic.' }));
        return {};
      }
      const total = pairs.length;
      const soundOn = () => B.store.setting('sound') !== false;
      const cards = shuffle(pairs.flatMap((p, i) => [
        { pair: i, text: p.a, partner: p.b, say: p.sayA },
        { pair: i, text: p.b, partner: p.a, say: p.sayB },
      ]));

      let open = []; // indices turned up, not yet matched
      let found = 0;
      let locked = true; // until the peek is over
      let turn = 0; // ignores stale "turn back" timers
      const seen = new Set();

      const grid = h('div', { class: 'mem-grid', role: 'grid', 'aria-label': `Memory: ${total} pairs` });
      cards.forEach((c, i) => {
        c.el = h('button', { type: 'button', class: 'mem-card', 'aria-label': `Card ${i + 1}, face down`, onClick: () => tap(i) },
          h('span', { class: 'mem-inner' },
            h('span', { class: 'mem-face mem-back', 'aria-hidden': 'true' }, h('span', { class: 'mem-logo' }, '🥨')),
            h('span', { class: 'mem-face mem-front', lang: c.say ? 'de' : null }, h('span', { class: 'mem-text' + (c.text.length > 13 ? ' long' : '') }, c.text))));
        grid.append(c.el);
      });
      const wrap = h('div', { class: 'mem-wrap' }, grid);
      stage.append(wrap);

      // --- layout: the grid fills the stage, cards keep their shape --------------------------
      let cols = 4;
      function fit() {
        const W = wrap.clientWidth;
        const H = wrap.clientHeight;
        if (!W || !H) return;
        const n = cards.length;
        const gap = W < 420 ? 7 : 10;
        let best = null;
        for (let c = 3; c <= 7; c++) {
          const r = Math.ceil(n / c);
          const cw = (W - gap * (c - 1)) / c;
          const ch = Math.min(cw / ASPECT, (H - gap * (r - 1)) / r);
          const w = ch * ASPECT;
          const area = w * ch * (n / (r * c)); // empty cells in the last row count against a layout
          if (!best || area > best.area) best = { c, w, ch, area };
        }
        cols = best.c;
        grid.style.setProperty('--mem-cols', String(best.c));
        grid.style.setProperty('--mem-w', Math.floor(best.w) + 'px');
        grid.style.setProperty('--mem-h', Math.floor(best.ch) + 'px');
        grid.style.setProperty('--mem-gap', gap + 'px');
        grid.style.setProperty('--mem-fs', Math.max(11, Math.min(19, best.w / 6.2)).toFixed(1) + 'px');
      }
      const onResize = () => fit();
      window.addEventListener('resize', onResize);
      requestAnimationFrame(fit);
      fit();
      api.progress(0, total); // before play() returns, or the frame hides the progress bar

      function faceUp(c, up) {
        c.el.classList.toggle('up', up);
        c.el.setAttribute('aria-label', up || c.done ? `${c.text}${c.done ? ' (pair found)' : ''}` : `Card ${cards.indexOf(c) + 1}, face down`);
      }

      function closeOpen() {
        for (const i of open) {
          faceUp(cards[i], false);
          cards[i].el.classList.remove('slip');
        }
        open = [];
      }

      function tap(i) {
        const c = cards[i];
        if (api.ended || locked || c.done || open.includes(i)) return;
        if (open.length === 2) closeOpen(); // a third card: turn the wrong pair back at once
        c.seenBefore = seen.has(i);
        seen.add(i);
        faceUp(c, true);
        api.sfx('flip');
        if (c.say && soundOn()) api.speak(c.text);
        open.push(i);
        if (open.length < 2) return;

        const [a, b] = open.map((k) => cards[k]);
        const myTurn = ++turn;
        if (a.pair === b.pair) {
          a.done = b.done = true;
          open = [];
          for (const x of [a, b]) {
            x.el.classList.add('matched');
            x.el.disabled = true;
            faceUp(x, true);
          }
          found++;
          api.hit({ el: b.el });
          api.progress(found, total); // ignored by the frame while a timer runs (High)
          if (found === total) {
            locked = true;
            api.after(700, () => api.end({ won: true, note: `All ${total} pairs found!` }));
          }
          return;
        }
        // not a pair
        if (a.seenBefore && b.seenBefore) {
          a.el.classList.add('slip');
          b.el.classList.add('slip');
          api.miss({ q: a.text, a: a.partner, given: b.text, el: b.el });
        } else api.sfx('drop');
        api.after(1000, () => {
          if (myTurn === turn && open.length === 2) closeOpen();
        });
      }

      // --- keyboard: arrows move between cards; Enter / Space turn the focused card (it is a button)
      function key(e) {
        const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -cols, ArrowDown: cols };
        if (!(e.key in moves)) return false;
        const at = cards.findIndex((c) => c.el === document.activeElement);
        let next = at < 0 ? 0 : at + moves[e.key];
        next = Math.max(0, Math.min(cards.length - 1, next));
        cards[next].el.focus({ preventScroll: true });
        return true;
      }

      return {
        begin() {
          const peek = PEEK[level];
          if (!peek) {
            locked = false;
            return;
          }
          grid.classList.add('peek');
          api.after(peek, () => {
            grid.classList.remove('peek');
            locked = false;
            api.progress(0, total);
          });
        },
        key,
        timeUp() {
          api.end({ won: false, note: `Time’s up! ${found} of ${total} pairs found.` });
        },
        destroy() {
          window.removeEventListener('resize', onResize);
        },
      };
    },
  });
})();
