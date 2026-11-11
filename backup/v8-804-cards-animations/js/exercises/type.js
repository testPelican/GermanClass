/*
 * Typed answer. One wrong letter is forgiven as a typo (see core/check.js).
 *   { type: 'type', prompt, q?: 'Julia ___ in Salzburg.', hint?: 'wohnen',
 *     answer: 'wohnt' | ['alt 1', 'alt 2'], reject?: [...], strict?: true, noun?: true }
 * If q has a ___ the typed text appears live inside the sentence.
 * 💡 Help me: 1. the first letter of each word and how many letters ("l _ _ _ _"), 2. half of each word.
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const { h, md, show } = B.util;

  B.ex.register('type', {
    label: 'Typed answer',

    validate(c) {
      const e = [];
      const answers = B.ex.asList(c.answer);
      B.ex.need(e, answers.length && answers.every((a) => typeof a === 'string' && a.trim()), 'type needs "answer"');
      if (c.reject) B.ex.need(e, !answers.some((a) => c.reject.includes(a)), 'an answer is also in "reject"');
      return e;
    },

    describe: (c) => ({ q: c.q || c.prompt, a: show(B.ex.asList(c.answer)[0]) }),

    render(card, root, api) {
      const answers = B.ex.asList(card.answer);
      const head = B.ex.header(card, 'Type the answer');
      const blank = head.querySelector('.blank-inline');
      const input = h('input', {
        class: 'type-input',
        type: 'text',
        autocomplete: 'off',
        autocorrect: 'off',
        autocapitalize: 'off',
        spellcheck: 'false',
        enterkeyhint: 'done',
        'aria-label': 'Your answer',
        placeholder: card.placeholder || (blank ? 'Type the missing word(s)' : 'Type your answer in German'),
      });
      input.addEventListener('input', () => {
        const v = input.value;
        if (blank) {
          blank.textContent = v || ' ';
          blank.classList.toggle('typing', !!v);
        }
        api.changed(v.trim().length > 0);
      });

      root.append(head, h('div', { class: 'type-box' }, input), B.ex.umlautBar(() => input));

      let res = null;
      const first = show(answers[0]);
      return {
        focus: () => input.focus({ preventScroll: true }),
        hints: first.replace(/\s/g, '').length > 3 ? 2 : 1,
        hint(step) {
          const pattern = B.ex.letterHint(first, step);
          return { html: (step === 1 ? 'It starts like this: ' : 'Half of it: ') + `<span class="hint-letters">${B.util.esc(pattern)}</span>` };
        },
        check() {
          const given = input.value.trim();
          res = B.check.typed(given, answers, { reject: card.reject, strict: card.strict, nounHint: card.noun });
          return { ok: res.ok, given, typo: !!res.typo, note: B.ex.typedNote(res, given) };
        },
        solution() {
          const a = (res && res.matched) || answers[0];
          const say = card.sayAnswer || (card.q && B.ex.BLANK.test(card.q) ? B.ex.filled(card, a) : a);
          const alts = answers.filter((x) => x !== a);
          return {
            html: md(show(a)) + (alts.length ? `<div class="sol-alt">Also accepted: ${alts.map((x) => md(show(x))).join(', ')}</div>` : ''),
            say,
          };
        },
        lock(r) {
          input.disabled = true;
          input.classList.add(r.ok ? 'good' : 'bad');
          if (blank) blank.classList.add('filled', r.ok ? 'good' : 'bad');
        },
      };
    },
  });
})();
