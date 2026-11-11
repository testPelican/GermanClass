/*
 * Multiple choice.
 *   { type: 'mc', prompt, q?, correct: 'gearbeitet', wrong: ['arbeitet', 'arbeite'] }
 * Options are shuffled every time the card is shown. Keys 1–4 pick an option.
 * A German option is read aloud the moment it is picked. 💡 Help me removes wrong options until two are left.
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const { h, md, show, shuffle } = B.util;

  B.ex.register('mc', {
    label: 'Multiple choice',

    validate(c) {
      const e = [];
      B.ex.need(e, typeof c.correct === 'string' && c.correct.length, 'mc needs "correct"');
      if (B.ex.need(e, Array.isArray(c.wrong) && c.wrong.length >= 1, 'mc needs a "wrong" list')) {
        B.ex.need(e, !c.wrong.includes(c.correct), 'the correct answer is also listed in "wrong"');
        B.ex.need(e, new Set(c.wrong).size === c.wrong.length, 'duplicate wrong options');
        B.ex.need(e, c.wrong.length <= 5, 'at most 6 options');
      }
      return e;
    },

    describe: (c) => ({ q: c.q ? c.q : c.prompt, a: show(c.correct) }),

    render(card, root, api) {
      const opts = shuffle([card.correct, ...card.wrong]);
      const long = opts.some((o) => show(o).length > 16);
      const german = B.ex.germanChoices(card, opts);
      const gone = new Set(); // options removed by Help me
      let sel = -1;
      let locked = false;

      const list = h('div', { class: 'choices ' + (long ? 'choices-col' : 'choices-grid'), role: 'radiogroup' });
      const btns = opts.map((o, i) => {
        const b = h('button', {
          class: 'choice',
          type: 'button',
          role: 'radio',
          'aria-checked': 'false',
          onClick: () => choose(i),
        },
          h('span', { class: 'key', 'aria-hidden': 'true' }, String(i + 1)),
          h('span', { class: 'choice-text', html: md(show(o)) })
        );
        list.append(b);
        return b;
      });

      function choose(i) {
        if (locked || gone.has(i)) return;
        const again = sel === i;
        sel = i;
        btns.forEach((b, j) => {
          b.classList.toggle('sel', j === i);
          b.setAttribute('aria-checked', String(j === i));
        });
        api.sfx('tap');
        if (german && api.say && !again) api.say(opts[i]);
        api.changed(true);
      }

      root.append(B.ex.header(card, 'Choose the correct answer'), list);

      return {
        check: () => ({ ok: opts[sel] === card.correct, given: show(opts[sel]) }),
        solution: () => ({ html: md(show(card.correct)), say: B.ex.filled(card, card.correct) }),
        hints: opts.length > 2 ? 1 : 0,
        hint() {
          if (gone.size || opts.length <= 2) return null;
          // leave the right answer and one wrong one
          const wrong = shuffle(opts.map((_, i) => i).filter((i) => opts[i] !== card.correct));
          wrong.slice(0, opts.length - 2).forEach((i) => {
            gone.add(i);
            btns[i].disabled = true;
            btns[i].classList.add('gone');
            btns[i].classList.remove('sel');
          });
          if (gone.has(sel)) {
            sel = -1;
            api.changed(false);
          }
          const n = gone.size;
          return { note: n === 1 ? 'One wrong answer is gone.' : `${n === 2 ? 'Two' : n} wrong answers are gone — it’s one of these two.` };
        },
        lock(res) {
          locked = true;
          btns.forEach((b, j) => {
            b.disabled = true;
            if (opts[j] === card.correct) b.classList.add('good');
            else if (j === sel) b.classList.add('bad');
            else b.classList.add('dim');
          });
          B.ex.fillBlank(root, card.correct, res.ok ? 'good' : 'bad');
        },
        key(e) {
          const n = parseInt(e.key, 10);
          if (n >= 1 && n <= opts.length) {
            choose(n - 1);
            return true;
          }
          return false;
        },
      };
    },
  });
})();
