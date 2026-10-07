/*
 * Fill the gaps with word chips.
 *   { type: 'gap', q: 'Ich {bin} 1990 in Polen {geboren}.', options: ['habe', 'gebären'] }
 * {…} marks a gap; "{ins|in das}" accepts either. options = extra wrong chips.
 * Tap a chip to drop it into the highlighted gap; tap a filled gap to empty it.
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const { h, md, show, norm, flip, shuffle } = B.util;
  const GAP = /\{([^}]+)\}/g;

  function parse(q) {
    const parts = [];
    let last = 0;
    let m;
    GAP.lastIndex = 0;
    while ((m = GAP.exec(q))) {
      if (m.index > last) parts.push({ text: q.slice(last, m.index) });
      parts.push({ gap: m[1].split('|').map((s) => s.trim()) });
      last = m.index + m[0].length;
    }
    if (last < q.length) parts.push({ text: q.slice(last) });
    return parts;
  }

  const fill = (card, get) => parse(card.q).map((p, i) => (p.gap ? get(p, i) : p.text)).join('');

  B.ex.register('gap', {
    label: 'Fill the gaps',

    validate(c) {
      const e = [];
      if (!B.ex.need(e, typeof c.q === 'string', 'gap needs "q" with {gaps}')) return e;
      B.ex.need(e, parse(c.q).some((p) => p.gap), 'gap needs at least one {gap} in "q"');
      return e;
    },

    describe: (c) => ({ q: show(c.q.replace(GAP, '___')), a: show(fill(c, (p) => p.gap[0])) }),

    render(card, root, api) {
      const parts = parse(card.q);
      const gaps = [];
      let locked = false;
      let active = 0;

      const sentence = h('div', { class: 'gap-sentence' });
      parts.forEach((p) => {
        if (!p.gap) {
          sentence.append(h('span', { html: md(show(p.text)) }));
          return;
        }
        const g = { answers: p.gap, chip: null };
        g.el = h('button', { type: 'button', class: 'gap-slot', 'aria-label': 'Empty gap', onClick: () => tapGap(g) });
        gaps.push(g);
        sentence.append(g.el);
      });

      const chipWords = shuffle(gaps.map((g) => g.answers[0]).concat(card.options || []));
      const bank = h('div', { class: 'chip-bank' });
      const chips = chipWords.map((w) => {
        const el = h('button', { type: 'button', class: 'chip', onClick: () => tapChip(c) }, show(w));
        const slot = h('div', { class: 'slot' }, h('span', { class: 'tile-shadow chip-shadow', 'aria-hidden': 'true' }, show(w)), el);
        const c = { w, el, slot, gap: null };
        bank.append(slot);
        return c;
      });
      const allEls = () => chips.map((c) => c.el);

      function paint() {
        const firstEmpty = gaps.findIndex((g) => !g.chip);
        if (gaps[active] && gaps[active].chip && firstEmpty >= 0) active = firstEmpty;
        gaps.forEach((g, i) => {
          g.el.classList.toggle('active', !locked && i === active && !g.chip);
          g.el.classList.toggle('has-chip', !!g.chip);
          g.el.setAttribute('aria-label', g.chip ? `Gap: ${show(g.chip.w)} (tap to remove)` : 'Empty gap');
        });
        api.changed(gaps.every((g) => g.chip));
      }

      function tapChip(c) {
        if (locked) return;
        api.sfx('tap');
        if (c.gap) return tapGap(c.gap);
        let g = gaps[active] && !gaps[active].chip ? gaps[active] : gaps.find((x) => !x.chip);
        if (!g) {
          // every gap is full: swap with the active gap's chip
          g = gaps[active] || gaps[0];
          unplace(g);
        }
        flip(allEls(), () => {
          g.el.append(c.el);
          g.chip = c;
          c.gap = g;
        });
        active = gaps.indexOf(g) + 1;
        if (active >= gaps.length || gaps[active].chip) active = Math.max(0, gaps.findIndex((x) => !x.chip));
        paint();
      }

      function unplace(g) {
        const c = g.chip;
        if (!c) return;
        c.slot.append(c.el);
        c.gap = null;
        g.chip = null;
      }

      function tapGap(g) {
        if (locked) return;
        if (g.chip) {
          api.sfx('tap');
          flip(allEls(), () => unplace(g));
        }
        active = gaps.indexOf(g);
        paint();
      }

      root.append(B.ex.header(card, 'Fill in the gaps', { noBubble: true }), h('div', { class: 'gap-card' }, h('span', { class: 'mascot mini', 'aria-hidden': 'true' }, '🥨'), sentence), bank);
      paint();

      const filledWith = () => fill(card, (p, i) => {
        const g = gaps[parts.slice(0, i).filter((x) => x.gap).length];
        return g.chip ? g.chip.w : '___';
      });

      return {
        check() {
          const ok = gaps.every((g) => g.chip && g.answers.some((a) => norm(a) === norm(g.chip.w)));
          return { ok, given: show(filledWith()) };
        },
        solution() {
          const html = parts.map((p) => (p.gap ? `<strong class="sol-mark">${md(show(p.gap[0]))}</strong>` : md(show(p.text)))).join('');
          return { html, say: show(fill(card, (p) => p.gap[0])) };
        },
        lock() {
          locked = true;
          gaps.forEach((g) => {
            const ok = g.chip && g.answers.some((a) => norm(a) === norm(g.chip.w));
            g.el.classList.add(ok ? 'good' : 'bad');
            g.el.disabled = true;
          });
          chips.forEach((c) => (c.el.disabled = true));
          paint();
        },
        key(e) {
          const n = parseInt(e.key, 10);
          const free = chips.filter((c) => !c.gap);
          if (n >= 1 && n <= free.length) {
            tapChip(free[n - 1]);
            return true;
          }
          return false;
        },
      };
    },
  });
})();
