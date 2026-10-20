/*
 * Match pairs: tap an item on the left, then its partner on the right.
 *   { type: 'match', prompt, pairs: [['wohnen', 'to live'], ['kommen', 'to come'], …] }
 * Pairs are only marked right/wrong after pressing Check. Tap a paired item to undo it.
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const { h, md, show, shuffle, shuffleAway } = B.util;
  const MAX = 6;

  B.ex.register('match', {
    label: 'Match pairs',

    validate(c) {
      const e = [];
      if (!B.ex.need(e, Array.isArray(c.pairs) && c.pairs.length >= 2, 'match needs at least 2 "pairs"')) return e;
      B.ex.need(e, c.pairs.length <= MAX, `at most ${MAX} pairs`);
      B.ex.need(e, c.pairs.every((p) => Array.isArray(p) && p.length === 2), 'each pair is [left, right]');
      B.ex.need(e, new Set(c.pairs.map((p) => p[0])).size === c.pairs.length, 'duplicate left items');
      B.ex.need(e, new Set(c.pairs.map((p) => p[1])).size === c.pairs.length, 'duplicate right items');
      return e;
    },

    describe: (c) => ({ q: c.prompt || 'Match the pairs', a: c.pairs.map((p) => `${show(p[0])} = ${show(p[1])}`).join(' · ') }),

    render(card, root, api) {
      const n = card.pairs.length;
      const leftOrder = shuffle(card.pairs.map((_, i) => i));
      const rightOrder = shuffleAway(leftOrder.slice());
      const link = new Map(); // left index -> right index
      const colorOf = new Map(); // left index -> colour slot
      let sel = null; // {side, i}
      let locked = false;

      const mk = (side, i) => {
        const text = card.pairs[i][side === 'L' ? 0 : 1];
        return h('button', { type: 'button', class: 'm-item', dataset: { side, i }, onClick: () => tap(side, i) },
          h('span', { class: 'm-badge', 'aria-hidden': 'true' }),
          h('span', { class: 'm-text', html: md(show(text)) }));
      };
      const L = leftOrder.map((i) => mk('L', i));
      const R = rightOrder.map((i) => mk('R', i));
      const elOf = (side, i) => (side === 'L' ? L[leftOrder.indexOf(i)] : R[rightOrder.indexOf(i)]);
      const partnerOf = (side, i) => {
        if (side === 'L') return link.has(i) ? link.get(i) : null;
        for (const [l, r] of link) if (r === i) return l;
        return null;
      };

      function freeColor() {
        const used = new Set(colorOf.values());
        for (let c = 0; c < MAX; c++) if (!used.has(c)) return c;
        return 0;
      }

      function unpair(l) {
        link.delete(l);
        colorOf.delete(l);
      }

      function tap(side, i) {
        if (locked) return;
        api.sfx('tap');
        const p = partnerOf(side, i);
        if (p !== null) {
          unpair(side === 'L' ? i : p);
          sel = { side, i };
        } else if (sel && sel.side !== side) {
          const l = side === 'L' ? i : sel.i;
          const r = side === 'R' ? i : sel.i;
          link.set(l, r);
          colorOf.set(l, freeColor());
          sel = null;
          paint();
          B.util.pulse(elOf('L', l), 'pop');
          B.util.pulse(elOf('R', r), 'pop');
          api.changed(link.size === n);
          return;
        } else if (sel && sel.side === side && sel.i === i) {
          sel = null;
        } else {
          sel = { side, i };
        }
        paint();
        api.changed(link.size === n);
      }

      function paint() {
        const order = [...link.keys()];
        for (const side of ['L', 'R']) {
          for (let i = 0; i < n; i++) {
            const el = elOf(side, i);
            const l = side === 'L' ? i : partnerOf('R', i);
            const paired = l !== null && link.has(l);
            el.classList.remove('paired', 'sel', ...Array.from({ length: MAX }, (_, c) => 'pc' + c));
            if (paired) el.classList.add('paired', 'pc' + colorOf.get(l));
            if (sel && sel.side === side && sel.i === i) el.classList.add('sel');
            el.querySelector('.m-badge').textContent = paired ? String(order.indexOf(l) + 1) : '';
            el.setAttribute('aria-pressed', String(!!(sel && sel.side === side && sel.i === i)));
          }
        }
      }

      root.append(
        B.ex.header(card, 'Match the pairs'),
        h('div', { class: 'match-grid', lang: 'de' }, h('div', { class: 'm-col' }, L), h('div', { class: 'm-col' }, R))
      );

      return {
        check() {
          const wrong = [...link].filter(([l, r]) => l !== r);
          return {
            ok: wrong.length === 0,
            given: wrong.length ? wrong.map(([l, r]) => `${show(card.pairs[l][0])} → ${show(card.pairs[r][1])}`).join(', ') : 'all pairs',
          };
        },
        solution: () => ({
          html: `<div class="sol-pairs">${card.pairs.map((p) => `<div><strong>${md(show(p[0]))}</strong> = ${md(show(p[1]))}</div>`).join('')}</div>`,
        }),
        lock() {
          locked = true;
          for (const [l, r] of link) {
            const cls = l === r ? 'good' : 'bad';
            elOf('L', l).classList.add(cls);
            elOf('R', r).classList.add(cls);
          }
          [...L, ...R].forEach((el) => (el.disabled = true));
        },
      };
    },
  });
})();
