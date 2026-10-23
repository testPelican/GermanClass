/*
 * The 📖 Glossary of the card on screen: every German word in the question with its English
 * meaning (data/glossary.js), and the rule the card practises (data/rules.js).
 * Answer choices are never translated (see Brezel.ex.questionTexts). A card whose rule would
 * give the answer away (card.asksRule) keeps the rule folded until the learner opens it.
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const { h, md } = B.util;

  function words(card, texts) {
    if (card.gloss === false) {
      return h('p', { class: 'gl-note' }, '🤫 This card asks what the words mean, so their translations stay hidden.');
    }
    const rows = B.gloss.entries(card, texts);
    if (!rows.length) {
      return h('p', { class: 'gl-note' }, 'Nothing to translate here: the answer choices aren’t translated, so they can’t give the answer away.');
    }
    return h('dl', { class: 'gl-words' },
      rows.map((r) => h('div', { class: 'gl-row' },
        h('dt', { lang: 'de' }, r.de),
        h('dd', {},
          r.hidden ? h('span', { class: 'gl-hidden' }, '🤫 that’s what this card asks') : r.en,
          r.base ? h('span', { class: 'gl-base', lang: 'de', title: 'Dictionary form' }, r.base) : null))));
  }

  /** A rule's table (the articles of a case): the first column is a row label. */
  function table({ head, rows }) {
    return h('div', { class: 'table-scroll gl-table-wrap' },
      h('table', { class: 'data-table gl-table', lang: 'de' },
        head ? h('thead', {}, h('tr', {}, head.map((c) => h('th', { scope: 'col', html: md(c) })))) : null,
        h('tbody', {}, rows.map((r) => h('tr', {}, r.map((c, i) => h(i ? 'td' : 'th', { scope: i ? null : 'row', html: md(c) })))))));
  }

  function rule(r) {
    return h('div', { class: 'gl-rule' },
      h('h4', { class: 'gl-rule-title', html: md(r.title) }),
      r.text ? h('p', { class: 'gl-rule-text', html: md(r.text) }) : null,
      r.table ? table(r.table) : null,
      r.points ? h('ul', { class: 'gl-points' }, r.points.map((p) => h('li', { html: md(p) }))) : null);
  }

  function rules(card) {
    const list = B.deck.rulesFor(card);
    if (!list.length) return null;
    const body = h('div', { class: 'gl-rules', tabindex: '-1' }, list.map(rule));
    const parts = [h('h3', { class: 'gl-h' }, list.length > 1 ? 'The rules' : 'The rule'), body];
    if (card.asksRule) {
      body.hidden = true;
      const show = h('button', { type: 'button', class: 'btn btn-outline gl-reveal' }, 'Show the rule anyway');
      const fold = h('div', { class: 'gl-fold' },
        h('p', {}, '🤫 This card asks about the rule itself, so reading it now gives the answer away.'),
        show);
      show.addEventListener('click', () => {
        fold.remove();
        body.hidden = false;
        body.focus({ preventScroll: true });
      });
      parts.splice(1, 0, fold);
    }
    return h('section', { class: 'gl-section' }, parts);
  }

  /** texts: [{text, loose?}] — the question text on screen (Brezel.ex.questionTexts or the card's glossTexts()). */
  function open(card, texts) {
    B.gloss.hideTip();
    return B.app.sheet((close) => {
      const done = h('button', { type: 'button', class: 'btn btn-primary btn-big', 'data-autofocus': '', onClick: () => close() }, 'Got it');
      return h('div', { class: 'modal sheet glossary', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'gl-title' },
        h('header', { class: 'sheet-head' },
          h('h2', { id: 'gl-title', class: 'sheet-title' }, h('span', { 'aria-hidden': 'true' }, '📖 '), 'Glossary'),
          h('button', { type: 'button', class: 'icon-btn sheet-x', 'aria-label': 'Close', onClick: () => close() }, '✕')),
        h('div', { class: 'sheet-body', tabindex: '0' },
          h('section', { class: 'gl-section' }, h('h3', { class: 'gl-h' }, 'Words in this question'), words(card, texts)),
          rules(card)),
        h('footer', { class: 'sheet-foot' }, done));
    });
  }

  B.glossary = { open };
})();
