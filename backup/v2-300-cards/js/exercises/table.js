/*
 * Fill-in table (conjugation, participles …). Typed cells use the same typo rule.
 *   { type: 'table', verb: 'sein', blanks?: 4 }                  // rows from the verb list
 *   { type: 'table', head: ['Infinitiv', 'Perfekt'], rows: [['gehen', 'ist gegangen'], ...], blanks?: [0, 2] }
 * blanks: a number = that many random rows (default: up to 4), or explicit row indices.
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const { h, md, show, shuffle } = B.util;

  function rowsOf(card) {
    if (card.verb) return B.deck.verbRows(card.verb);
    return card.rows;
  }

  B.ex.register('table', {
    label: 'Fill-in table',

    validate(c, deck) {
      const e = [];
      if (c.verb) B.ex.need(e, deck.verbs[c.verb], `unknown verb "${c.verb}" (add it to data/lexicon.js)`);
      else B.ex.need(e, Array.isArray(c.rows) && c.rows.length >= 2 && c.rows.every((r) => r.length === 2), 'table needs "verb" or "rows" [[left, right], …]');
      if (Array.isArray(c.blanks)) {
        const n = c.verb ? 6 : (c.rows || []).length;
        B.ex.need(e, c.blanks.every((i) => i >= 0 && i < n), 'blank index out of range');
      }
      return e;
    },

    describe(c) {
      const rows = rowsOf(c) || [];
      return { q: c.prompt || (c.verb ? `Conjugate “${c.verb}”` : 'Fill in the table'), a: rows.map((r) => `${show(r[0])} ${show(r[1])}`).join(', ') };
    },

    render(card, root, api) {
      const rows = rowsOf(card);
      let blankIdx;
      if (Array.isArray(card.blanks)) blankIdx = card.blanks;
      else {
        const n = Math.min(rows.length, card.blanks || 4);
        blankIdx = shuffle(rows.map((_, i) => i)).slice(0, n);
      }
      const blanks = new Set(blankIdx);
      const head = card.head || ['', card.verb];
      const verb = card.verb && B.deck.verbs[card.verb];

      const inputs = [];
      let active = null;
      const tbody = h('tbody');
      rows.forEach((r, i) => {
        let cell;
        if (blanks.has(i)) {
          const input = h('input', {
            class: 'cell-input',
            type: 'text',
            autocomplete: 'off',
            autocorrect: 'off',
            autocapitalize: 'off',
            spellcheck: 'false',
            enterkeyhint: 'next',
            'aria-label': `${show(r[0])}`,
          });
          input.addEventListener('focus', () => (active = input));
          input.addEventListener('input', () => api.changed(inputs.every((x) => x.el.value.trim())));
          inputs.push({ el: input, row: i, answer: r[1] });
          cell = h('td', { class: 'cell-in' }, input, h('div', { class: 'cell-fix' }));
        } else {
          cell = h('td', { class: 'cell-given' }, show(r[1]));
        }
        tbody.append(h('tr', {}, h('th', { scope: 'row' }, show(r[0])), cell));
      });

      const title = card.prompt || (verb ? `Conjugate **${card.verb}**${verb.en ? ` (${verb.en})` : ''} in the present tense` : 'Fill in the table');
      const table = h('table', { class: 'fill-table' },
        head.some(Boolean) ? h('thead', {}, h('tr', {}, head.map((x) => h('th', { scope: 'col' }, show(x || ''))))) : null,
        tbody);

      root.append(B.ex.header(Object.assign({}, card, { prompt: title }), ''), h('div', { class: 'table-wrap' }, table), B.ex.umlautBar(() => active || inputs[0].el));

      let results = [];
      return {
        focus: () => inputs[0] && inputs[0].el.focus({ preventScroll: true }),
        check() {
          results = inputs.map((x) => {
            const given = x.el.value.trim();
            const res = B.check.typed(given, [x.answer], { strict: card.strict });
            return Object.assign({ given }, x, { res });
          });
          const ok = results.every((r) => r.res.ok);
          const wrong = results.filter((r) => !r.res.ok);
          const typos = results.filter((r) => r.res.typo);
          const formErr = wrong.find((r) => r.res.reason === 'form');
          let note = null;
          if (ok && typos.length) note = `Small typo — accepted! Exact spelling: ${typos.map((t) => `**${show(t.answer)}**`).join(', ')}.`;
          else if (formErr) note = `“${formErr.given}” is a different form of the verb — the ending decides who is doing it, so it counts as wrong.`;
          const given = (wrong.length ? wrong : results).map((r) => `${show(rows[r.row][0])} → ${r.given || '—'}`).join(', ');
          return { ok, given, typo: typos.length > 0, note };
        },
        solution() {
          const list = rows.map((r, i) =>
            `<div class="sol-row${blanks.has(i) ? ' is-blank' : ''}"><span>${md(show(r[0]))}</span> <strong>${md(show(r[1]))}</strong></div>`
          ).join('');
          const say = verb ? rows.map((r) => `${r[0].split('/')[0]} ${r[1]}`).join(', ') : rows.map((r) => r[1]).join(', ');
          return { html: `<div class="sol-table">${list}</div>`, say };
        },
        lock() {
          for (const r of results) {
            r.el.disabled = true;
            r.el.classList.add(r.res.ok ? 'good' : 'bad');
            if (!r.res.ok || r.res.typo) r.el.parentNode.querySelector('.cell-fix').textContent = show(r.answer);
          }
        },
        key(e) {
          if (e.key !== 'Enter' || !e.target || !e.target.classList.contains('cell-input')) return false;
          // Enter jumps to the next empty cell; on the last one it falls through to "Check".
          const idx = inputs.findIndex((x) => x.el === e.target);
          const next = inputs.slice(idx + 1).concat(inputs.slice(0, idx)).find((x) => !x.el.value.trim());
          if (next) {
            next.el.focus();
            return true;
          }
          return false;
        },
      };
    },
  });
})();
