/*
 * True / false.
 *   { type: 'tf', prompt?, q?: 'German sentence', statement?: 'English claim',
 *     answer: true|false, fix?: 'the corrected sentence', labels?: ['Correct', 'Wrong'] }
 * Keys: 1 / T = first button, 2 / F = second.
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const { h, md, show } = B.util;

  B.ex.register('tf', {
    label: 'True / false',

    validate(c) {
      const e = [];
      B.ex.need(e, typeof c.answer === 'boolean', 'tf needs "answer": true or false');
      B.ex.need(e, c.q || c.statement, 'tf needs "q" or "statement"');
      return e;
    },

    describe: (c) => ({
      q: [c.statement, c.q].filter(Boolean).join(' — ') || c.prompt,
      a: (c.answer ? (c.labels ? c.labels[0] : 'True') : c.labels ? c.labels[1] : 'False') + (c.fix ? ` → ${show(c.fix)}` : ''),
    }),

    render(card, root, api) {
      const labels = card.labels || ['True', 'False'];
      let sel = null;
      let locked = false;

      const head = B.ex.header(card, card.q ? 'Is this sentence correct?' : 'True or false?');
      if (card.statement) head.append(h('div', { class: 'tf-statement', html: md(show(card.statement)) }));

      const mk = (val, icon, label) =>
        h('button', {
          type: 'button',
          class: 'tf-btn ' + (val ? 'tf-yes' : 'tf-no'),
          'aria-pressed': 'false',
          onClick: () => choose(val),
        },
          h('span', { class: 'tf-icon', 'aria-hidden': 'true' }, icon),
          h('span', {}, label)
        );
      const yes = mk(true, '✓', labels[0]);
      const no = mk(false, '✗', labels[1]);

      function choose(val) {
        if (locked) return;
        sel = val;
        yes.classList.toggle('sel', val === true);
        no.classList.toggle('sel', val === false);
        yes.setAttribute('aria-pressed', String(val === true));
        no.setAttribute('aria-pressed', String(val === false));
        api.sfx('tap');
        api.changed(true);
      }

      root.append(head, h('div', { class: 'tf-row' }, yes, no));

      const answerLabel = card.answer ? labels[0] : labels[1];
      return {
        check: () => ({ ok: sel === card.answer, given: sel ? labels[0] : labels[1] }),
        solution: () => ({
          html: md(answerLabel) + (card.fix ? `<div class="sol-fix">✔ ${md(show(card.fix))}</div>` : ''),
          say: card.fix || (card.answer ? card.say || card.q : null),
        }),
        lock() {
          locked = true;
          for (const [btn, val] of [[yes, true], [no, false]]) {
            btn.disabled = true;
            if (val === card.answer) btn.classList.add('good');
            else if (val === sel) btn.classList.add('bad');
            else btn.classList.add('dim');
          }
        },
        key(e) {
          const k = e.key.toLowerCase();
          if (k === '1' || k === 't' || k === 'r' || k === 'y') return choose(true), true;
          if (k === '2' || k === 'f' || k === 'w' || k === 'n') return choose(false), true;
          return false;
        },
      };
    },
  });
})();
