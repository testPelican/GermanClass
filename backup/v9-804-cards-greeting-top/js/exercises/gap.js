/*
 * Fill the gaps with word chips.
 *   { type: 'gap', q: 'Ich {bin} 1990 in Polen {geboren}.', options: ['habe', 'gebären'] }
 * {…} marks a gap; "{ins|in das}" accepts either. options = extra wrong chips.
 * Tap a chip to drop it into the highlighted gap; tap a filled gap to empty it.
 * A chip is read aloud when it goes into a gap. 💡 Help me: half of the wrong chips disappear, then the
 * gaps are filled one by one (never the last one).
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
        if (locked || c.gone) return;
        api.sfx('tap');
        if (c.gap) return tapGap(c.gap);
        if (api.say) api.say(c.w);
        let g = gaps[active] && !gaps[active].chip ? gaps[active] : gaps.find((x) => !x.chip);
        if (!g) {
          // every gap is full: swap with the active gap's chip (not one placed by Help me)
          g = gaps[active] && !gaps[active].fixed ? gaps[active] : gaps.find((x) => !x.fixed);
          if (!g) return;
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
        if (locked || g.fixed) return;
        if (g.chip) {
          api.sfx('tap');
          flip(allEls(), () => unplace(g));
        }
        active = gaps.indexOf(g);
        paint();
      }

      B.gloss.decorate(sentence, card);
      const speak = B.ex.speakButton(B.ex.questionSay(card));
      root.append(B.ex.header(card, 'Fill in the gaps', { noBubble: true }), h('div', { class: 'gap-card' }, h('span', { class: 'mascot mini', 'aria-hidden': 'true' }, '🥨'), sentence, speak), bank);
      paint();

      const filledWith = () => fill(card, (p, i) => {
        const g = gaps[parts.slice(0, i).filter((x) => x.gap).length];
        return g.chip ? g.chip.w : '___';
      });

      const wrongChips = chips.filter((c) => !gaps.some((g) => g.answers.some((a) => norm(a) === norm(c.w))));
      let trimmed = false;
      const fits = (g, c) => g.answers.some((a) => norm(a) === norm(c.w));
      return {
        hints: (wrongChips.length ? 1 : 0) + Math.max(0, gaps.length - 1),
        hint() {
          if (wrongChips.length && !trimmed) {
            trimmed = true;
            const out = shuffle(wrongChips).slice(0, Math.max(1, Math.ceil(wrongChips.length / 2)));
            flip(allEls(), () => out.forEach((c) => {
              if (c.gap) unplace(c.gap);
              c.gone = true;
              c.el.disabled = true;
              c.slot.classList.add('gone');
            }));
            paint();
            return { note: out.length === 1 ? 'One wrong chip is gone.' : `${out.length} wrong chips are gone.` };
          }
          const open = gaps.filter((g) => !g.fixed);
          if (open.length <= 1) return null;
          const g = open[0];
          const c = chips.find((x) => !x.gone && !(x.gap && x.gap.fixed) && fits(g, x));
          if (!c) return null;
          flip(allEls(), () => {
            if (g.chip && g.chip !== c) unplace(g);
            if (c.gap && c.gap !== g) unplace(c.gap);
            g.el.append(c.el);
            g.chip = c;
            c.gap = g;
          });
          g.fixed = true;
          g.el.classList.add('hinted');
          active = Math.max(0, gaps.findIndex((x) => !x.chip));
          paint();
          return { note: `Gap ${gaps.indexOf(g) + 1}: **${show(c.w)}**.` };
        },
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
          const free = chips.filter((c) => !c.gap && !c.gone);
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
