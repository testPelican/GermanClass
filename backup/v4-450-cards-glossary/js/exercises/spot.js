/*
 * Spot the mistake: tap the one wrong word in the sentence.
 *   { type: 'spot', q: 'Ich habe nach München umgezogen.', wrong: 'habe', correct: 'bin' }
 * Optional: at (word index, if the wrong word appears twice), fixed (full corrected sentence).
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const { h, md, show, norm } = B.util;

  const bare = (t) => t.replace(/[.,!?;:…]+$/, '');
  const tokens = (q) => q.trim().split(/\s+/);
  const wrongIndex = (c) => (Number.isInteger(c.at) ? c.at : tokens(c.q).findIndex((t) => norm(bare(t)) === norm(c.wrong)));

  function corrected(c) {
    if (c.fixed) return c.fixed;
    const t = tokens(c.q);
    const i = wrongIndex(c);
    t[i] = c.correct + t[i].slice(bare(t[i]).length);
    return t.join(' ');
  }

  B.ex.register('spot', {
    label: 'Spot the mistake',

    validate(c) {
      const e = [];
      if (!B.ex.need(e, typeof c.q === 'string' && c.wrong && c.correct, 'spot needs "q", "wrong" and "correct"')) return e;
      B.ex.need(e, wrongIndex(c) >= 0, `"${c.wrong}" is not a word in the sentence`);
      return e;
    },

    describe: (c) => ({ q: c.q, a: `${show(c.wrong)} → ${show(c.correct)}: ${show(corrected(c))}` }),

    render(card, root, api) {
      const words = tokens(card.q);
      const wi = wrongIndex(card);
      let sel = -1;
      let locked = false;

      const line = h('div', { class: 'spot-line' });
      const btns = words.map((w, i) => {
        const b = h('button', { type: 'button', class: 'spot-word', 'aria-pressed': 'false', onClick: () => choose(i) }, show(w));
        line.append(b);
        return b;
      });

      function choose(i) {
        if (locked) return;
        sel = sel === i ? -1 : i;
        btns.forEach((b, j) => {
          b.classList.toggle('sel', j === sel);
          b.setAttribute('aria-pressed', String(j === sel));
        });
        api.sfx('tap');
        api.changed(sel >= 0);
      }

      root.append(
        B.ex.header(card, 'Tap the word that is **wrong**', { noBubble: true }),
        h('div', { class: 'spot-card' }, h('span', { class: 'mascot mini', 'aria-hidden': 'true' }, '🥨'), line)
      );

      const fix = corrected(card);
      return {
        check: () => ({ ok: sel === wi, given: sel >= 0 ? `“${show(bare(words[sel]))}”` : '—' }),
        solution: () => ({
          html: `<span class="sol-strike">${md(show(bare(words[wi])))}</span> → <strong>${md(show(card.correct))}</strong><div class="sol-fix">✔ ${md(show(fix))}</div>`,
          say: show(fix),
        }),
        lock(res) {
          locked = true;
          btns.forEach((b, j) => {
            b.disabled = true;
            if (j === wi) {
              b.classList.add(res.ok ? 'good' : 'was-wrong');
              b.after(h('span', { class: 'spot-fix' }, show(card.correct) + words[wi].slice(bare(words[wi]).length)));
              b.classList.add('struck');
            } else if (j === sel) b.classList.add('bad');
          });
        },
      };
    },
  });
})();
