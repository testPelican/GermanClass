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

  // little pictures (css: .gl-ico in css/app.css)
  const ICON = {
    // an open book whose page turns (the dialog title, the Rule book)
    book: '<svg viewBox="0 0 80 64" aria-hidden="true"><path d="M40 14c-8-6-20-8-34-6v46c14-2 26 0 34 6z" fill="#1cb0f6"/><path d="M40 14c8-6 20-8 34-6v46c-14-2-26 0-34 6z" fill="#1899d6"/><path d="M40 16c-7-5-17-7-29-5v40c12-1.5 22 .5 29 5z" fill="#fff"/><path d="M40 16c7-5 17-7 29-5v40c-12-1.5-22 .5-29 5z" fill="#eef6fb"/><path d="M16 21c6-.6 12 0 18 2M16 28c6-.6 12 0 18 2M16 35c6-.6 12 0 18 2M16 42c4-.4 8 0 12 1M46 23c6-2 12-2.6 18-2M46 30c6-2 12-2.6 18-2M46 37c6-2 12-2.6 18-2" stroke="#c4d9e6" stroke-width="2.2" stroke-linecap="round" fill="none"/><path d="M58 8v15l3.2-3 3.2 3V8" fill="#ff4b4b"/><path class="bk-flip" d="M40 16c7-5 17-7 29-5v40c-12-1.5-22 .5-29 5z" fill="#fff" stroke="#d3e4ee" stroke-width="1.2"/><g class="bk-spark"><path d="M8 4l1.2 2.6L12 8l-2.8 1.4L8 12l-1.2-2.6L4 8l2.8-1.4z" fill="#ffc800"/><path d="M72 52l.9 1.9 2.1 1-2.1 1-.9 2.1-.9-2.1-2.1-1 2.1-1z" fill="#ffc800"/></g></svg>',
    // a speech bubble with "Aa": the words of the question
    words: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 5h20a4 4 0 0 1 4 4v11a4 4 0 0 1-4 4H15l-6.5 5v-5H6a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4z" fill="#1cb0f6"/><text x="16" y="19.5" font-size="11.5" font-weight="900" text-anchor="middle" fill="#fff" font-family="system-ui, sans-serif">Aa</text></svg>',
    // a ruler and a pencil: the rule
    rule: '<svg viewBox="0 0 32 32" aria-hidden="true"><g transform="rotate(-24 16 16)"><rect x="2" y="12" width="28" height="9" rx="2" fill="#ffc800"/><path d="M6 12v4M10 12v3M14 12v4M18 12v3M22 12v4M26 12v3" stroke="#a37600" stroke-width="1.6" stroke-linecap="round"/></g><g class="gl-pencil"><path d="M21 3l4 4-11 11-5 1 1-5z" fill="#ff9600"/><path d="M21 3l4 4 2-2-4-4z" fill="#ff86d0"/><path d="M10 14l-1 5 5-1z" fill="#ffe2b8"/></g></svg>',
    // closed eyes with a finger: "it's a secret" (a hidden translation)
    secret: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="#ffc800"/><path d="M8.5 13.5q2.5 2 5 0M18.5 13.5q2.5 2 5 0" fill="none" stroke="#5c3d00" stroke-width="1.8" stroke-linecap="round"/><path d="M12 22q4 2 8 0" fill="none" stroke="#5c3d00" stroke-width="1.8" stroke-linecap="round"/><rect class="gl-finger" x="14.6" y="15" width="2.8" height="11" rx="1.4" fill="#ffb3a0"/></svg>',
    // a sealed letter: the rule would give the answer away
    sealed: '<svg viewBox="0 0 48 36" aria-hidden="true"><rect x="3" y="7" width="42" height="26" rx="3" fill="#fff4d6" stroke="#e2b85c" stroke-width="1.6"/><path d="M3.8 33l15-12M44.2 33l-15-12" stroke="#e2b85c" stroke-width="1.6"/><path class="gl-flap" d="M3.8 8L24 23 44.2 8" fill="#fde7b0" stroke="#e2b85c" stroke-width="1.6" stroke-linejoin="round"/><circle class="gl-seal" cx="24" cy="22" r="5.5" fill="#ff4b4b"/><path d="M21.6 22h4.8M24 19.6v4.8" stroke="#ffd0d0" stroke-width="1.4" stroke-linecap="round"/></svg>',
  };
  const icon = (name, cls) => h('span', { class: 'gl-ico ' + (cls || ''), 'aria-hidden': 'true', html: ICON[name] });

  /** Unfold a rule like a piece of paper; its points and table rows follow one by one. */
  function unfold(el) {
    if (!el) return;
    el.classList.remove('unfolding');
    void el.offsetWidth;
    el.classList.add('unfolding');
    clearTimeout(el._unfoldT);
    el._unfoldT = setTimeout(() => el.classList.remove('unfolding'), 1200);
  }

  function words(card, texts) {
    if (card.gloss === false) {
      return h('p', { class: 'gl-note' }, icon('secret'), h('span', {}, 'This card asks what the words mean, so their translations stay hidden.'));
    }
    const rows = B.gloss.entries(card, texts);
    if (!rows.length) {
      return h('p', { class: 'gl-note' }, 'Nothing to translate here: the answer choices aren’t translated, so they can’t give the answer away.');
    }
    const say = (word) => {
      if (!B.audio.canSpeak) return null;
      const b = h('button', { type: 'button', class: 'gl-say', 'aria-label': 'Listen to ' + word, title: 'Listen' }, '🔊');
      b.addEventListener('click', () => B.audio.speak(word));
      return b;
    };
    // the rows slide in one after another (--i)
    return h('dl', { class: 'gl-words' },
      rows.map((r, i) => h('div', { class: 'gl-row', style: { animationDelay: Math.min(i, 12) * 45 + 'ms' } },
        h('dt', { lang: 'de' }, say(r.de.replace(/ … /g, ' ')), h('span', {}, r.de)),
        h('dd', {},
          r.hidden ? h('span', { class: 'gl-hidden' }, icon('secret', 'mini'), 'that’s what this card asks') : r.en,
          r.base ? h('span', { class: 'gl-base', lang: 'de', title: 'Dictionary form' }, r.base) : null))));
  }

  /** A rule's table (the articles of a case): the first column is a row label. */
  function table({ head, rows }) {
    return h('div', { class: 'table-scroll gl-table-wrap' },
      h('table', { class: 'data-table gl-table', lang: 'de' },
        head ? h('thead', {}, h('tr', {}, head.map((c) => h('th', { scope: 'col', html: md(c) })))) : null,
        h('tbody', {}, rows.map((r) => h('tr', {}, r.map((c, i) => h(i ? 'td' : 'th', { scope: i ? null : 'row', html: md(c) })))))));
  }

  /** One rule: title, text, table, points. The Rule book shows its title itself ({ title: false }). */
  function rule(r, { title = true } = {}) {
    const el = h('div', { class: 'gl-rule' },
      title ? h('h4', { class: 'gl-rule-title', html: md(r.title) }) : null,
      r.text ? h('p', { class: 'gl-rule-text', html: md(r.text) }) : null,
      r.table ? table(r.table) : null,
      r.points ? h('ul', { class: 'gl-points' }, r.points.map((p) => h('li', { html: md(p) }))) : null);
    // the order in which points and table rows appear when the rule unfolds
    el.querySelectorAll('.gl-points li, .gl-table tbody tr').forEach((x, i) => x.style.setProperty('--i', String(Math.min(i, 14))));
    return el;
  }

  function rules(card) {
    const list = B.deck.rulesFor(card);
    if (!list.length) return null;
    const body = h('div', { class: 'gl-rules', tabindex: '-1' }, list.map((r) => rule(r)));
    const parts = [h('h3', { class: 'gl-h' }, icon('rule', 'gl-h-ico'), list.length > 1 ? 'The rules' : 'The rule'), body];
    if (card.asksRule) {
      body.hidden = true;
      const show = h('button', { type: 'button', class: 'btn btn-outline gl-reveal' }, 'Show the rule anyway');
      const letter = icon('sealed', 'gl-letter');
      const fold = h('div', { class: 'gl-fold' },
        letter,
        h('p', {}, 'This card asks about the rule itself, so reading it now gives the answer away.'),
        show);
      show.addEventListener('click', () => {
        // the seal breaks, the letter opens, then the rule unfolds
        fold.classList.add('opening');
        setTimeout(() => {
          fold.remove();
          body.hidden = false;
          body.querySelectorAll('.gl-rule').forEach(unfold);
          body.focus({ preventScroll: true });
        }, B.util.reducedMotion() ? 0 : 520);
      });
      parts.splice(1, 0, fold);
    } else body.querySelectorAll('.gl-rule').forEach(unfold);
    return h('section', { class: 'gl-section' }, parts);
  }

  /** texts: [{text, loose?}] — the question text on screen (Brezel.ex.questionTexts or the card's glossTexts()). */
  function open(card, texts) {
    B.gloss.hideTip();
    return B.app.sheet((close) => {
      const done = h('button', { type: 'button', class: 'btn btn-primary btn-big', 'data-autofocus': '', onClick: () => close() }, 'Got it');
      return h('div', { class: 'modal sheet glossary', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'gl-title' },
        h('header', { class: 'sheet-head' },
          h('h2', { id: 'gl-title', class: 'sheet-title' }, icon('book', 'gl-title-ico'), 'Glossary'),
          h('button', { type: 'button', class: 'icon-btn sheet-x', 'aria-label': 'Close', onClick: () => close() }, '✕')),
        h('div', { class: 'sheet-body', tabindex: '0' },
          h('section', { class: 'gl-section' }, h('h3', { class: 'gl-h' }, icon('words', 'gl-h-ico'), 'Words in this question'), words(card, texts)),
          rules(card)),
        h('footer', { class: 'sheet-foot' }, done));
    });
  }

  B.glossary = { open, rule, unfold, icon, ICON };
})();
