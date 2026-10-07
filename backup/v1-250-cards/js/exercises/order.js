/*
 * Sentence builder: tap or drag word tiles into the right order.
 *   { type: 'order', en: 'I live in Vienna.', answer: 'Ich wohne in Wien.',
 *     start?: 'In meiner Freizeit',   // fixed beginning (practise the inversion)
 *     extra?: ['wohnt'],              // distractor tiles that don't belong
 *     answers?: ['…'],                // other correct orders
 *     keepCase?: true }               // keep the first word capitalised (nouns)
 * Words joined with "_" stay together on one tile: "St._Pölten".
 * The first tile is shown in lower case so capitals don't give the start away.
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const { h, md, show, norm, flip, shuffleAway, splitSentence } = B.util;

  function lowerFirst(word, card) {
    const bare = word.replace(/[,;:]+$/, '');
    if (card.keepCase || B.deck.properNouns.has(bare) || B.deck.properNouns.has(show(bare))) return show(word);
    return show(word.charAt(0).toLowerCase() + word.slice(1));
  }

  function sentenceCase(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  B.ex.register('order', {
    label: 'Sentence builder',

    validate(c) {
      const e = [];
      if (!B.ex.need(e, typeof c.answer === 'string' && c.answer.trim(), 'order needs "answer"')) return e;
      const { words } = splitSentence(c.answer);
      B.ex.need(e, words.length >= 2, 'order needs at least 2 words');
      if (c.start) {
        const sw = splitSentence(c.start).words;
        B.ex.need(e, sw.length < words.length && sw.every((w, i) => norm(w) === norm(words[i])), '"start" must be the beginning of "answer"');
      }
      return e;
    },

    describe: (c) => ({ q: c.en ? `“${c.en}”` : c.prompt || 'Build the sentence', a: show(c.answer) }),

    render(card, root, api) {
      const { words, punct } = splitSentence(card.answer);
      const startWords = card.start ? splitSentence(card.start).words : [];
      const body = words.slice(startWords.length);
      const tiles = body
        .map((w, i) => ({ w, label: i === 0 && !startWords.length ? lowerFirst(w, card) : show(w) }))
        .concat((card.extra || []).map((w) => ({ w, label: show(w), extra: true })));
      const bankOrder = shuffleAway(tiles.map((_, i) => i));

      let locked = false;
      const answerEl = h('div', { class: 'order-answer', 'aria-label': 'Your sentence', role: 'list' });
      if (startWords.length) answerEl.append(h('span', { class: 'tile locked', title: 'Fixed start' }, show(card.start)));
      const bankEl = h('div', { class: 'order-bank', 'aria-label': 'Word bank' });
      const all = [];

      const placed = () => Array.from(answerEl.querySelectorAll('.tile:not(.locked)'));
      const moveAll = (mutate) => flip(all, mutate);
      const update = () => api.changed(placed().length > 0);

      function toAnswer(el) {
        moveAll(() => answerEl.append(el));
        el.setAttribute('aria-label', `${el.textContent} (tap to remove)`);
      }
      function toBank(el) {
        moveAll(() => el._slot.append(el));
        el.setAttribute('aria-label', el.textContent);
      }

      for (const i of bankOrder) {
        const t = tiles[i];
        const el = h('button', { class: 'tile', type: 'button', role: 'listitem' }, t.label);
        el._t = t;
        const slot = h('div', { class: 'slot' }, h('span', { class: 'tile-shadow', 'aria-hidden': 'true' }, t.label), el);
        el._slot = slot;
        all.push(el);
        bankEl.append(slot);

        el.addEventListener('click', () => {
          if (locked) return;
          if (el.parentNode === answerEl) toBank(el);
          else toAnswer(el);
          api.sfx('tap');
          update();
        });

        let lastMove = 0;
        B.drag.attach(el, {
          enabled: () => !locked,
          onMove(ctx) {
            const now = performance.now();
            if (now - lastMove < 60) return; // don't thrash while tiles are still gliding
            const r = answerEl.getBoundingClientRect();
            const inside = ctx.x > r.left - 16 && ctx.x < r.right + 16 && ctx.y > r.top - 20 && ctx.y < r.bottom + 20;
            if (inside) {
              const others = placed().filter((k) => k !== el);
              const idx = B.drag.insertIndex(answerEl, ctx.x, ctx.y, el, '.tile:not(.locked)');
              const cur = el.parentNode === answerEl ? others.filter((k) => k.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING).length : -1;
              if (cur !== idx) {
                lastMove = now;
                moveAll(() => answerEl.insertBefore(el, others[idx] || null));
              }
            } else if (el.parentNode === answerEl) {
              lastMove = now;
              moveAll(() => el._slot.append(el));
            }
          },
          onEnd() {
            api.sfx('drop');
            update();
            return el;
          },
        });
      }

      root.append(
        B.ex.header(card, 'Put the words in the right order', { noEn: true }),
        card.en ? h('div', { class: 'order-en' }, h('span', { class: 'order-en-label' }, 'Translate'), ' “' + card.en + '”') : null,
        h('div', { class: 'order-stage' }, answerEl),
        bankEl
      );

      function built() {
        return startWords.concat(placed().map((el) => el._t.w));
      }
      function display(list) {
        return list.length ? sentenceCase(show(list.join(' '))) + punct : '—';
      }

      return {
        check() {
          const got = norm(built().join(' '));
          const ok = [card.answer, ...(card.answers || [])].some((a) => norm(a) === got);
          return { ok, given: display(built()) };
        },
        solution: () => ({ html: md(show(card.answer)), say: show(card.answer) }),
        lock(res) {
          locked = true;
          all.forEach((el) => (el.disabled = true));
          answerEl.classList.add(res.ok ? 'good' : 'bad');
        },
        key(e) {
          if (e.key === 'Backspace' && !locked) {
            const last = placed().pop();
            if (last) {
              toBank(last);
              update();
            }
            return true;
          }
          return false;
        },
      };
    },
  });
})();
